import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import type { DonationRecord } from "@/lib/models";

/* ─── GET /api/donations — owner only, aggregated history ────────────── */
export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload)               return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "owner") return NextResponse.json({ success: false, error: "Forbidden" },    { status: 403 });

    const db  = await getDb();
    const col = db.collection<DonationRecord>("donation_records");
    const now = new Date();

    const boundaries = {
      day:   new Date(now.getTime() -      86_400_000),
      week:  new Date(now.getTime() -  7 * 86_400_000),
      month: new Date(now.getTime() - 30 * 86_400_000),
    };

    const [totalAll, totalMonth, totalWeek, totalDay, byCategory, topCases, recent] = await Promise.all([
      // Lifetime total
      col.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),

      // Last 30 days
      col.aggregate([
        { $match: { timestamp: { $gte: boundaries.month } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),

      // Last 7 days
      col.aggregate([
        { $match: { timestamp: { $gte: boundaries.week } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),

      // Last 24 hours
      col.aggregate([
        { $match: { timestamp: { $gte: boundaries.day } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),

      // By category (all time)
      col.aggregate([
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]).toArray(),

      // Top cases by amount raised (all time)
      col.aggregate([
        { $group: { _id: "$caseId", caseNumber: { $last: "$caseNumber" }, caseName: { $last: "$caseName" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]).toArray(),

      // 30 most recent records
      col.find({}).sort({ timestamp: -1 }).limit(30).toArray(),
    ]);

    // Resolve category names
    const catIds = byCategory.map(r => r._id).filter(Boolean);
    const cats = catIds.length
      ? await db.collection("donate_categories").find({ _id: { $in: catIds } }, { projection: { slug: 1, "en.label": 1, "ar.label": 1 } }).toArray()
      : [];
    const catMap: Record<string, { en: string; ar: string }> = {};
    cats.forEach((c: { _id: { toString(): string }; en?: { label: string }; ar?: { label: string } }) => {
      catMap[c._id.toString()] = { en: c.en?.label ?? "—", ar: c.ar?.label ?? "—" };
    });

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          all:   totalAll[0]?.total   ?? 0,
          month: totalMonth[0]?.total ?? 0,
          week:  totalWeek[0]?.total  ?? 0,
          day:   totalDay[0]?.total   ?? 0,
        },
        byCategory: byCategory.map(r => ({
          categoryId: r._id?.toString(),
          label:      catMap[r._id?.toString()]?.en ?? "Unknown",
          total:      r.total,
          count:      r.count,
        })),
        topCases: topCases.map(r => ({
          caseId:     r._id?.toString(),
          caseNumber: r.caseNumber,
          caseName:   r.caseName,
          total:      r.total,
          count:      r.count,
        })),
        recent,
      },
    });
  } catch (err) {
    console.error("GET donations error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/* ─── DELETE /api/donations — owner only, clears history log ─────────── */
export async function DELETE(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload)               return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "owner") return NextResponse.json({ success: false, error: "Forbidden" },    { status: 403 });

    const db     = await getDb();
    const result = await db.collection("donation_records").deleteMany({});

    await logAction({
      adminId:    payload.sub,
      adminName:  payload.name,
      action:     "delete",
      collection: "donation_records",
      details:    `Cleared donation history log (${result.deletedCount} records)`,
    });

    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error("DELETE donations error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
