import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { TokenPayload } from "./models";

const BCRYPT_ROUNDS = 12;
const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "qima-dev-secret-change-in-production-2025";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET_STRING);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(
  req: Request
): Promise<TokenPayload | null> {
  // Try Authorization header first
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  // Try cookie
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k.trim(), decodeURIComponent(v.join("="))];
      })
    );
    const token = cookies["qima_admin_token"];
    if (token) {
      return verifyToken(token);
    }
  }

  return null;
}
