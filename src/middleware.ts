import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "qima-dev-secret-change-in-production-2025";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET_STRING);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin/* routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow the login page itself
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.next();
  }

  // Allow API routes under /admin (there are none, but be safe)
  if (pathname.startsWith("/admin/api/")) {
    return NextResponse.next();
  }

  // Read token from cookie
  const token = req.cookies.get("qima_admin_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/admin", req.url));
    response.cookies.set("qima_admin_token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
