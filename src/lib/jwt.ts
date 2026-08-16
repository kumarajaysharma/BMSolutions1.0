/**
 * src/lib/jwt.ts
 *
 * BNLV Studio — Edge-Safe JWT Cryptographic Operations
 */
import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  tenantId: string;
  role: string;
  sessionId: string;
};

// Lazy-load the secret to prevent Vercel Edge worker crashes on initialization
function getSecretKey(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 32) {
    throw new Error(
      "[jwt] CRITICAL: JWT_SECRET is missing or less than 32 characters. " +
      "Verify the Vercel Environment Variables."
    );
  }
  return new TextEncoder().encode(jwtSecret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}