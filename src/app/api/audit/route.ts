import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { AuditLog } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const action = searchParams.get("action");

    const db = await getDb();

    const filter: Record<string, unknown> = {};
    if (action && ["create", "update", "delete", "login", "logout"].includes(action)) {
      filter.action = action;
    }

    const [logs, total] = await Promise.all([
      db
        .collection<AuditLog>("audit_logs")
        .find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection<AuditLog>("audit_logs").countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: logs,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET audit error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
