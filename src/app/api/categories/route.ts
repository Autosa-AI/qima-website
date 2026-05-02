import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { DonateCategory, DonateCase } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    const isAdmin = !!payload;

    const db = await getDb();
    const filter = isAdmin ? {} : { isActive: true };

    const categories = await db
      .collection<DonateCategory>("donate_categories")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    // Join cases for each category
    const categoryIds = categories.map((c) => c._id);
    const caseFilter = isAdmin
      ? { categoryId: { $in: categoryIds } }
      : { categoryId: { $in: categoryIds }, isActive: true };

    const cases = await db
      .collection<DonateCase>("donate_cases")
      .find(caseFilter)
      .sort({ order: 1 })
      .toArray();

    const categoriesWithCases = categories.map((cat) => ({
      ...cat,
      cases: cases.filter(
        (c) => c.categoryId.toHexString() === cat._id.toHexString()
      ),
    }));

    return NextResponse.json(
      { success: true, data: categoriesWithCases },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET categories error:", err);
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

    const { slug, icon, ar, en } = body as {
      slug?: string;
      icon?: string;
      ar?: { label: string };
      en?: { label: string };
    };

    if (!slug?.trim() || !icon?.trim() || !ar?.label?.trim() || !en?.label?.trim()) {
      return NextResponse.json(
        { success: false, error: "slug, icon, ar.label, and en.label are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check slug uniqueness
    const existing = await db
      .collection<DonateCategory>("donate_categories")
      .findOne({ slug: slug.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug already in use" },
        { status: 400 }
      );
    }

    // Auto-assign order
    const maxOrderDoc = await db
      .collection<DonateCategory>("donate_categories")
      .find()
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = maxOrderDoc.length > 0 ? maxOrderDoc[0].order + 1 : 1;

    const now = new Date();
    const newCategory: Omit<DonateCategory, "_id"> = {
      slug: slug.trim(),
      icon: icon.trim(),
      ar: { label: ar.label.trim() },
      en: { label: en.label.trim() },
      order,
      isActive: true,
      createdBy: new ObjectId(payload.sub),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<Omit<DonateCategory, "_id">>("donate_categories")
      .insertOne(newCategory);

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "create",
      collection: "donate_categories",
      documentId: result.insertedId,
      details: `Created category: ${slug.trim()}`,
    });

    return NextResponse.json(
      { success: true, data: { _id: result.insertedId, ...newCategory } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST categories error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
