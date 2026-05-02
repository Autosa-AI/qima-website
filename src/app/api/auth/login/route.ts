import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyPassword, signToken } from "@/lib/auth";
import { logAction } from "@/lib/auditLog";
import type { Admin } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { email, password } = body as { email: string; password: string };

    if (!email.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const admin = await db
      .collection<Admin>("admins")
      .findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is deactivated" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const payload = {
      sub: admin._id.toHexString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    const token = await signToken(payload);

    // Update lastLoginAt
    await db
      .collection<Admin>("admins")
      .updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });

    await logAction({
      adminId: admin._id,
      adminName: admin.name,
      action: "login",
      collection: "admins",
      documentId: admin._id,
      details: `Admin logged in from ${req.headers.get("x-forwarded-for") || "unknown"}`,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          token,
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
      },
      { status: 200 }
    );

    response.cookies.set("qima_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
