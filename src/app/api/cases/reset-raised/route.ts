import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { DonateCase } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const caseIds: string[] = body?.caseIds ?? [];

    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ success: false, error: "caseIds array required" }, { status: 400 });
    }

    const validIds = caseIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: "No valid IDs" }, { status: 400 });
    }

    const db = await getDb();

    // Non-owners can only reset cases assigned to them
    const filter: Record<string, unknown> = { _id: { $in: validIds } };
    if (payload.role !== "owner") {
      filter.responsibleAdminId = new ObjectId(payload.sub);
    }

    const result = await db.collection<DonateCase>("donate_cases").updateMany(
      filter,
      { $set: { raisedAmount: 0, updatedAt: new Date() } }
    );

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "update",
      collection: "donate_cases",
      details: `Reset raisedAmount to 0 for ${result.modifiedCount} case(s)`,
    });

    return NextResponse.json({ success: true, modified: result.modifiedCount }, { status: 200 });
  } catch (err) {
    console.error("Reset raised error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
