import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { logAction } from "@/lib/auditLog";
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
    if (payload.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Forbidden: owner only" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const admins = await db
      .collection<Admin>("admins")
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ success: true, data: admins }, { status: 200 });
  } catch (err) {
    console.error("GET admins error:", err);
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
    if (payload.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "Forbidden: owner only" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const existing = await db
      .collection<Admin>("admins")
      .findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const newAdmin: Omit<Admin, "_id"> = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "admin", // cannot create another owner via API
      isActive: true,
      createdBy: new ObjectId(payload.sub),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<Omit<Admin, "_id">>("admins")
      .insertOne(newAdmin);

    await logAction({
      adminId: payload.sub,
      adminName: payload.name,
      action: "create",
      collection: "admins",
      documentId: result.insertedId,
      details: `Created admin: ${name.trim()} (${email.toLowerCase().trim()})`,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: result.insertedId,
          ...newAdmin,
          passwordHash: undefined,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST admins error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
