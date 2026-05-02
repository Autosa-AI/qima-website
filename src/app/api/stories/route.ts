import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { ImpactStory } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    const isAdmin = !!payload;

    const db = await getDb();
    const filter = isAdmin ? {} : { isActive: true };

    const stories = await db
      .collection<ImpactStory>("impact_stories")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({ success: true, data: stories }, { status: 200 });
  } catch (err) {
    console.error("GET stories error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { imageUrl, accent, ar, en, order } = body as {
      imageUrl?: string;
      accent?: string;
      ar?: { title: string; location: string; tag: string; story: string };
      en?: { title: string; location: string; tag: string; story: string };
      order?: number;
    };

    if (
      !imageUrl?.trim() ||
      !accent?.trim() ||
      !ar?.title?.trim() ||
      !ar?.location?.trim() ||
      !ar?.tag?.trim() ||
      !ar?.story?.trim() ||
      !en?.title?.trim() ||
      !en?.location?.trim() ||
      !en?.tag?.trim() ||
      !en?.story?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "imageUrl, accent, and all ar/en fields are required",
        },
        { status: 400 }
      );
    }

    const db = await getDb();

    let storyOrder = order;
    if (typeof storyOrder !== "number") {
      const maxOrderDoc = await db
        .collection<ImpactStory>("impact_stories")
        .find()
        .sort({ order: -1 })
        .limit(1)
        .toArray();
      storyOrder = maxOrderDoc.length > 0 ? maxOrderDoc[0].order + 1 : 1;
    }

    const now = new Date();
    const newStory: Omit<ImpactStory, "_id"> = {
      imageUrl: imageUrl.trim(),
      accent: accent.trim(),
      order: storyOrder,
      isActive: true,
      ar: {
        title: ar.title.trim(),
        location: ar.location.trim(),
        tag: ar.tag.trim(),
        story: ar.story.trim(),
      },
      en: {
        title: en.title.trim(),
        location: en.location.trim(),
        tag: en.tag.trim(),
        story: en.story.trim(),
      },
      createdBy: new ObjectId(payload.sub),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<Omit<ImpactStory, "_id">>("impact_stories")
      .insertOne(newStory);

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "create",
      collection: "impact_stories",
      documentId: result.insertedId,
      details: `Created story: ${ar.title.trim()}`,
    });

    return NextResponse.json(
      { success: true, data: { _id: result.insertedId, ...newStory } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST stories error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
