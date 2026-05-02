import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { ImpactStory } from "@/lib/models";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getAdminFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { imageUrl, accent, ar, en, order, isActive } = body as {
      imageUrl?: string;
      accent?: string;
      ar?: { title: string; location: string; tag: string; story: string };
      en?: { title: string; location: string; tag: string; story: string };
      order?: number;
      isActive?: boolean;
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
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const storyId = new ObjectId(id);

    const existing = await db
      .collection<ImpactStory>("impact_stories")
      .findOne({ _id: storyId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    const updates: Partial<ImpactStory> = {
      imageUrl: imageUrl.trim(),
      accent: accent.trim(),
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
      updatedAt: new Date(),
    };

    if (typeof order === "number") updates.order = order;
    if (typeof isActive === "boolean") updates.isActive = isActive;

    await db
      .collection<ImpactStory>("impact_stories")
      .updateOne({ _id: storyId }, { $set: updates });

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "update",
      collection: "impact_stories",
      documentId: storyId,
      details: `Updated story: ${ar.title.trim()}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PUT story error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getAdminFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const storyId = new ObjectId(id);

    const existing = await db
      .collection<ImpactStory>("impact_stories")
      .findOne({ _id: storyId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    await db
      .collection<ImpactStory>("impact_stories")
      .updateOne(
        { _id: storyId },
        { $set: { isActive: false, updatedAt: new Date() } }
      );

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "delete",
      collection: "impact_stories",
      documentId: storyId,
      details: `Soft-deleted story: ${existing.ar.title}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE story error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getAdminFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.order !== "number") {
      return NextResponse.json(
        { success: false, error: "order (number) is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const storyId = new ObjectId(id);

    await db
      .collection<ImpactStory>("impact_stories")
      .updateOne(
        { _id: storyId },
        { $set: { order: body.order, updatedAt: new Date() } }
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PATCH story error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
