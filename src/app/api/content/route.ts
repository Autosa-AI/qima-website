import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { ContentItem } from "@/lib/models";

export async function GET() {
  try {
    const db = await getDb();
    const items = await db
      .collection<ContentItem>("content")
      .find()
      .toArray();

    // Build nested structure: { [lang]: { [section]: { [key]: value } } }
    const result: Record<string, Record<string, Record<string, string>>> = {};

    for (const item of items) {
      if (!result[item.lang]) result[item.lang] = {};
      if (!result[item.lang][item.section]) result[item.lang][item.section] = {};
      result[item.lang][item.section][item.key] = item.value;
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    console.error("GET content error:", err);
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

    const { lang, section, key, value } = body as {
      lang?: string;
      section?: string;
      key?: string;
      value?: string;
    };

    if (
      !lang ||
      !["ar", "en"].includes(lang) ||
      !section?.trim() ||
      !key?.trim() ||
      typeof value !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "lang (ar|en), section, key, and value are required",
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();

    // Upsert
    await db.collection<ContentItem>("content").updateOne(
      { lang: lang as "ar" | "en", section: section.trim(), key: key.trim() },
      {
        $set: {
          value,
          updatedBy: new ObjectId(payload.sub),
          updatedAt: now,
        },
        $setOnInsert: {
          lang: lang as "ar" | "en",
          section: section.trim(),
          key: key.trim(),
        },
      },
      { upsert: true }
    );

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "update",
      collection: "content",
      details: `Upserted content: [${lang}] ${section}.${key}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("POST content error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
