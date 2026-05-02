import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
import { ObjectId } from "mongodb";
import type { Admin } from "@/lib/models";

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
    if (payload.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Forbidden: owner only" },
        { status: 403 }
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

    // Cannot deactivate self
    if (payload.sub === id && body.isActive === false) {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const targetId = new ObjectId(id);

    const existing = await db
      .collection<Admin>("admins")
      .findOne({ _id: targetId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    const updates: Partial<Admin> = { updatedAt: new Date() };
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.email === "string" && body.email.trim()) {
      updates.email = body.email.toLowerCase().trim();
    }
    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
    }
    if (typeof body.password === "string" && body.password.length >= 8) {
      updates.passwordHash = await hashPassword(body.password);
    }

    await db
      .collection<Admin>("admins")
      .updateOne({ _id: targetId }, { $set: updates });

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "update",
      collection: "admins",
      documentId: targetId,
      details: `Updated admin ${existing.email}: ${JSON.stringify(updates)}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PATCH admin error:", err);
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
    if (payload.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Forbidden: owner only" },
        { status: 403 }
      );
    }

    if (payload.sub === id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const targetId = new ObjectId(id);

    const existing = await db
      .collection<Admin>("admins")
      .findOne({ _id: targetId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    // Hard delete
    await db.collection<Admin>("admins").deleteOne({ _id: targetId });

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "delete",
      collection: "admins",
      documentId: targetId,
      details: `Permanently deleted admin: ${existing.email}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE admin error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
