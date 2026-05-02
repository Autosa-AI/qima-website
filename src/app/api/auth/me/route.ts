import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Admin } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const admin = await db
      .collection<Admin>("admins")
      .findOne(
        { _id: new ObjectId(payload.sub) },
        { projection: { passwordHash: 0 } }
      );

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { success: false, error: "Admin not found or inactive" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: admin }, { status: 200 });
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
