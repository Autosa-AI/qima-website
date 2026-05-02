import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { DonateCategory, DonateCase } from "@/lib/models";

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

    const { slug, icon, ar, en, isActive } = body as {
      slug?: string;
      icon?: string;
      ar?: { label: string };
      en?: { label: string };
      isActive?: boolean;
    };

    if (!slug?.trim() || !icon?.trim() || !ar?.label?.trim() || !en?.label?.trim()) {
      return NextResponse.json(
        { success: false, error: "slug, icon, ar.label, and en.label are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const catId = new ObjectId(id);

    const existing = await db
      .collection<DonateCategory>("donate_categories")
      .findOne({ _id: catId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    const updates: Partial<DonateCategory> = {
      slug: slug.trim(),
      icon: icon.trim(),
      ar: { label: ar.label.trim() },
      en: { label: en.label.trim() },
      updatedAt: new Date(),
    };
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    await db
      .collection<DonateCategory>("donate_categories")
      .updateOne({ _id: catId }, { $set: updates });

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "update",
      collection: "donate_categories",
      documentId: catId,
      details: `Updated category: ${slug.trim()}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PUT category error:", err);
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
    const catId = new ObjectId(id);

    const existing = await db
      .collection<DonateCategory>("donate_categories")
      .findOne({ _id: catId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Soft delete category
    await db
      .collection<DonateCategory>("donate_categories")
      .updateOne({ _id: catId }, { $set: { isActive: false, updatedAt: now } });

    // Cascade: deactivate all cases in this category
    await db
      .collection<DonateCase>("donate_cases")
      .updateMany(
        { categoryId: catId },
        { $set: { isActive: false, updatedAt: now } }
      );

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "delete",
      collection: "donate_categories",
      documentId: catId,
      details: `Soft-deleted category: ${existing.slug} (cascaded to cases)`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE category error:", err);
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
    const catId = new ObjectId(id);

    await db
      .collection<DonateCategory>("donate_categories")
      .updateOne(
        { _id: catId },
        { $set: { order: body.order, updatedAt: new Date() } }
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PATCH category error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
