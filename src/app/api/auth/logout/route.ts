import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { logAction } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);

    if (admin) {
      await logAction({
        adminId: admin.sub,
        adminName: admin.name,
        action: "logout",
        collection: "admins",
        documentId: admin.sub,
        details: "Admin logged out",
      });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("qima_admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
