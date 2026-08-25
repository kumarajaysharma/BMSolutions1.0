/**
 * src/lib/auth.ts
 *
 * BNLV Studio — Zero-Trust Authentication & Session Management (Server-Only)
 */
import { cookies } from "next/headers";
import crypto from "crypto";
import { encrypt, decrypt, SessionPayload } from "./jwt";
import { getDb } from "@/db/index";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type { SessionPayload };
export { encrypt, decrypt };

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

// Added validation helper incorporating the SHA-256 tokenHash fix
export async function verifyDbSession(sessionId: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(sessions)
    .where(
      eq(
        sessions.tokenHash,
        crypto.createHash('sha256').update(sessionId).digest('hex')
      )
    )
    .limit(1);

  return result[0] || null;
}