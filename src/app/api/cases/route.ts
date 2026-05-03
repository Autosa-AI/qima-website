import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { DonateCase } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    const isAdmin = !!payload;

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const db = await getDb();

    const filter: Record<string, unknown> = isAdmin ? {} : { isActive: true };
    if (categoryId && ObjectId.isValid(categoryId)) {
      filter.categoryId = new ObjectId(categoryId);
    }

    const cases = await db
      .collection<DonateCase>("donate_cases")
      .find(filter)
      .sort({ order: 1, number: 1 })
      .toArray();

    return NextResponse.json({ success: true, data: cases }, { status: 200 });
  } catch (err) {
    console.error("GET cases error:", err);
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

    const { categoryId, ar, en, isUrgent, targetAmount } = body as {
      categoryId?: string;
      ar?: { name: string; brief: string; story: string; need: string };
      en?: { name: string; brief: string; story: string; need: string };
      isUrgent?: boolean;
      targetAmount?: number;
    };

    if (
      !categoryId ||
      !ObjectId.isValid(categoryId) ||
      !ar?.name?.trim() ||
      !ar?.brief?.trim() ||
      !ar?.story?.trim() ||
      !ar?.need?.trim() ||
      !en?.name?.trim() ||
      !en?.brief?.trim() ||
      !en?.story?.trim() ||
      !en?.need?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "categoryId and all ar/en fields (name, brief, story, need) are required",
        },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Auto-generate case number
    const lastCase = await db
      .collection<DonateCase>("donate_cases")
      .find()
      .sort({ number: -1 })
      .limit(1)
      .toArray();

    let nextNum = 1;
    if (lastCase.length > 0) {
      const parsed = parseInt(lastCase[0].number, 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
    const number = String(nextNum).padStart(3, "0");

    // Auto-assign order
    const maxOrderDoc = await db
      .collection<DonateCase>("donate_cases")
      .find({ categoryId: new ObjectId(categoryId) })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = maxOrderDoc.length > 0 ? maxOrderDoc[0].order + 1 : 1;

    // Auto-assign responsible admin to the creator
    const now = new Date();
    const newCase: Omit<DonateCase, "_id"> = {
      number,
      categoryId: new ObjectId(categoryId),
      ar: {
        name: ar.name.trim(),
        brief: ar.brief.trim(),
        story: ar.story.trim(),
        need: ar.need.trim(),
      },
      en: {
        name: en.name.trim(),
        brief: en.brief.trim(),
        story: en.story.trim(),
        need: en.need.trim(),
      },
      isActive: true,
      isUrgent: isUrgent === true,
      order,
      responsibleAdminId:   new ObjectId(payload.sub),
      responsibleAdminName: payload.name,
      ...(typeof targetAmount === "number" && targetAmount >= 0 && { targetAmount, raisedAmount: 0 }),
      createdBy: new ObjectId(payload.sub),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<Omit<DonateCase, "_id">>("donate_cases")
      .insertOne(newCase);

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "create",
      collection: "donate_cases",
      documentId: result.insertedId,
      details: `Created case #${number}: ${ar.name.trim()}`,
    });

    return NextResponse.json(
      { success: true, data: { _id: result.insertedId, ...newCase } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST cases error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
