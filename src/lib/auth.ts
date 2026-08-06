/**
 * src/lib/auth.ts
 *
 * BNLV Studio — Zero-Trust Authentication & Session Management
 * REMEDIATION (2026-07-27):
 *   - Removed silent fallback key to prevent silent insecure deployments.
 *   - Enforced strict minimum length check (>= 32 characters) for JWT_SECRET.
 *   - Hardened session cookies with secure: true and sameSite: "strict".
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim().length < 32) {
  throw new Error(
    "[auth] CRITICAL: JWT_SECRET is missing or less than 32 characters. " +
    "Set a cryptographically random 64-byte hex string in your environment."
  );
}

const SECRET_KEY = new TextEncoder().encode(jwtSecret);

export type SessionPayload = {
  userId: string;
  tenantId: string;
  role: string;
  sessionId: string;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const sessionToken = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set("bms_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("bms_session");
}