import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAdminFromRequest } from "@/lib/auth";

/* ─── POST /api/analytics — public event ingestion ───────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.event || typeof body.event !== "string") {
      return NextResponse.json({ success: false, error: "Missing event" }, { status: 400 });
    }

    const doc = {
      event: body.event.slice(0, 64),
      meta: body.meta && typeof body.meta === "object" ? body.meta : undefined,
      timestamp: new Date(),
    };

    const db = await getDb();
    await db.collection("analytics_events").insertOne(doc);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Analytics POST error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/* ─── GET /api/analytics — owner-only summary ────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload)       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "owner") return NextResponse.json({ success: false, error: "Owner only" }, { status: 403 });

    const db   = await getDb();
    const col  = db.collection("analytics_events");
    const now  = new Date();
    const d30  = new Date(now.getTime() - 30 * 86_400_000);
    const d7   = new Date(now.getTime() -  7 * 86_400_000);

    // Run all aggregations in parallel
    const [
      totalAll,
      totalMonth,
      totalWeek,
      byEvent,
      topCases,
      topCategories,
      topAmounts,
      dailyActivity,
      recent,
    ] = await Promise.all([
      col.countDocuments({}),
      col.countDocuments({ timestamp: { $gte: d30 } }),
      col.countDocuments({ timestamp: { $gte: d7  } }),

      // Count per event type (all time)
      col.aggregate([
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]).toArray(),

      // Top cases selected
      col.aggregate([
        { $match: { event: "case_select", "meta.caseNumber": { $exists: true } } },
        { $group: { _id: "$meta.caseNumber", name: { $last: "$meta.caseName" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),

      // Top categories clicked
      col.aggregate([
        { $match: { event: "category_click", "meta.categoryId": { $exists: true } } },
        { $group: { _id: "$meta.categoryId", label: { $last: "$meta.categoryLabel" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      // Donation amount distribution
      col.aggregate([
        { $match: { event: "donate_intent", "meta.amount": { $exists: true } } },
        { $group: { _id: "$meta.amount", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      // Daily counts — last 30 days
      col.aggregate([
        { $match: { timestamp: { $gte: d30 } } },
        {
          $group: {
            _id: {
              y: { $year: "$timestamp" },
              m: { $month: "$timestamp" },
              d: { $dayOfMonth: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      ]).toArray(),

      // 20 most recent events
      col.find({}).sort({ timestamp: -1 }).limit(20).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totals:         { all: totalAll, month: totalMonth, week: totalWeek },
        byEvent,
        topCases,
        topCategories,
        topAmounts,
        dailyActivity,
        recent,
      },
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

/* ─── DELETE /api/analytics — owner only, clears all events ─────────── */
export async function DELETE(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "owner") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const db = await getDb();
    const result = await db.collection("analytics_events").deleteMany({});

    const { logAction } = await import("@/lib/auditLog");
    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "delete",
      collection: "analytics_events",
      details: `Cleared all analytics events (${result.deletedCount} records)`,
    });

    return NextResponse.json({ success: true, deleted: result.deletedCount }, { status: 200 });
  } catch (err) {
    console.error("Analytics DELETE error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
