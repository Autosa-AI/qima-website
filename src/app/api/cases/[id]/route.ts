import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { DonateCase } from "@/lib/models";

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

    const { categoryId, ar, en, isActive, isUrgent, responsibleAdminId } = body as {
      categoryId?: string;
      ar?: { name: string; brief: string; story: string; need: string };
      en?: { name: string; brief: string; story: string; need: string };
      isActive?: boolean;
      isUrgent?: boolean;
      responsibleAdminId?: string | null;
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
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const caseId = new ObjectId(id);

    const existing = await db
      .collection<DonateCase>("donate_cases")
      .findOne({ _id: caseId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    // Resolve responsible admin
    let resolvedResponsibleId: ObjectId | undefined;
    let responsibleAdminName: string | undefined;
    if (responsibleAdminId && ObjectId.isValid(responsibleAdminId)) {
      const responsible = await db.collection("admins").findOne(
        { _id: new ObjectId(responsibleAdminId) },
        { projection: { name: 1 } }
      );
      if (responsible) {
        resolvedResponsibleId = new ObjectId(responsibleAdminId);
        responsibleAdminName  = responsible.name as string;
      }
    }

    const updates: Partial<DonateCase> = {
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
      updatedAt: new Date(),
    };

    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (typeof isUrgent === "boolean") updates.isUrgent = isUrgent;
    // null = explicitly clear, undefined = leave unchanged
    if (responsibleAdminId === null) {
      updates.responsibleAdminId   = undefined;
      updates.responsibleAdminName = undefined;
    } else if (resolvedResponsibleId) {
      updates.responsibleAdminId   = resolvedResponsibleId;
      updates.responsibleAdminName = responsibleAdminName;
    }

    await db
      .collection<DonateCase>("donate_cases")
      .updateOne({ _id: caseId }, { $set: updates });

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "update",
      collection: "donate_cases",
      documentId: caseId,
      details: `Updated case #${existing.number}: ${ar.name.trim()}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PUT case error:", err);
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
    const caseId = new ObjectId(id);

    const existing = await db
      .collection<DonateCase>("donate_cases")
      .findOne({ _id: caseId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    await db
      .collection<DonateCase>("donate_cases")
      .updateOne(
        { _id: caseId },
        { $set: { isActive: false, updatedAt: new Date() } }
      );

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "delete",
      collection: "donate_cases",
      documentId: caseId,
      details: `Soft-deleted case #${existing.number}: ${existing.ar.name}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE case error:", err);
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
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const caseId = new ObjectId(id);

    const updates: Partial<DonateCase> = { updatedAt: new Date() };
    if (typeof body.isUrgent === "boolean") updates.isUrgent = body.isUrgent;
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    await db
      .collection<DonateCase>("donate_cases")
      .updateOne({ _id: caseId }, { $set: updates });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PATCH case error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
