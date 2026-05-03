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

    const { categoryId, ar, en, isActive, isUrgent, responsibleAdminId, targetAmount, raisedAmount, beneficiary } = body as {
      categoryId?: string;
      ar?: { name: string; brief: string; story: string; need: string };
      en?: { name: string; brief: string; story: string; need: string };
      isActive?: boolean;
      isUrgent?: boolean;
      responsibleAdminId?: string | null;
      targetAmount?: number;
      raisedAmount?: number;
      beneficiary?: { name?: string; phone?: string; proofImageUrl?: string } | null;
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

    // Non-owner admins can only edit their own cases
    if (payload.role !== "owner" && existing.responsibleAdminId?.toString() !== payload.sub) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
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

    if (typeof isActive     === "boolean") updates.isActive     = isActive;
    if (typeof isUrgent     === "boolean") updates.isUrgent     = isUrgent;
    if (typeof targetAmount === "number" && targetAmount >= 0)  updates.targetAmount = targetAmount;
    if (typeof raisedAmount === "number" && raisedAmount >= 0)  updates.raisedAmount = raisedAmount;
    if (beneficiary === null) {
      updates.beneficiary = undefined;
    } else if (beneficiary) {
      updates.beneficiary = {
        ...(beneficiary.name?.trim()          && { name:          beneficiary.name.trim() }),
        ...(beneficiary.phone?.trim()         && { phone:         beneficiary.phone.trim() }),
        ...(beneficiary.proofImageUrl?.trim() && { proofImageUrl: beneficiary.proofImageUrl.trim() }),
      };
    }

    // Only owner can change the responsible admin
    if (payload.role === "owner" && responsibleAdminId !== undefined) {
      if (responsibleAdminId === null) {
        updates.responsibleAdminId   = undefined;
        updates.responsibleAdminName = undefined;
      } else if (ObjectId.isValid(responsibleAdminId)) {
        const responsible = await db.collection("admins").findOne(
          { _id: new ObjectId(responsibleAdminId) },
          { projection: { name: 1 } }
        );
        if (responsible) {
          updates.responsibleAdminId   = new ObjectId(responsibleAdminId);
          updates.responsibleAdminName = responsible.name as string;
        }
      }
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

    if (payload.role !== "owner" && existing.responsibleAdminId?.toString() !== payload.sub) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
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

    const existingForPatch = await db
      .collection<DonateCase>("donate_cases")
      .findOne({ _id: caseId }, { projection: { responsibleAdminId: 1 } });
    if (!existingForPatch) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }
    if (payload.role !== "owner" && existingForPatch.responsibleAdminId?.toString() !== payload.sub) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updates: Partial<DonateCase> = { updatedAt: new Date() };
    if (typeof body.isUrgent     === "boolean") updates.isUrgent     = body.isUrgent;
    if (typeof body.isActive     === "boolean") updates.isActive     = body.isActive;
    if (typeof body.raisedAmount === "number" && body.raisedAmount >= 0) updates.raisedAmount = body.raisedAmount;
    if (typeof body.targetAmount === "number" && body.targetAmount >= 0) updates.targetAmount = body.targetAmount;

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
