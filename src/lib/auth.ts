import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// In production, this MUST be a 32-character random string stored in .env
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-fallback-key-do-not-use-in-prod"
);

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

  // Added 'await' here for Next.js 16+ compatibility
  const cookieStore = await cookies();
  cookieStore.set("bms_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function deleteSessionCookie() {
  // Added 'await' here for Next.js 16+ compatibility
  const cookieStore = await cookies();
  cookieStore.delete("bms_session");
}