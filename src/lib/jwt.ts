/**
 * src/lib/jwt.ts
 *
 * BNLV Studio — Edge-Safe JWT Cryptographic Operations
 */
import { SignJWT, jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim().length < 32) {
  throw new Error(
    "[jwt] CRITICAL: JWT_SECRET is missing or less than 32 characters. " +
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