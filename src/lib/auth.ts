/**
 * src/lib/auth.ts
 *
 * BNLV Studio — Zero-Trust Authentication & Session Management (Server-Only)
 * TD-001-B: verifyDbSession now calls SECURITY DEFINER function
 *           get_session_by_token_hash() instead of a direct table query.
 *           This unblocks after sessions_select policy is tightened from
 *           USING (true) to USING (tenant_id = ...).
 */
import { cookies } from "next/headers";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { encrypt, decrypt, SessionPayload } from "./jwt";
import { getDb } from "@/db/index";
import { sessions } from "@/db/schema";

export type { SessionPayload };
export { encrypt, decrypt };

type Session = typeof sessions.$inferSelect;

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

/**
 * Verifies a session by its raw sessionId.
 *
 * Calls the SECURITY DEFINER function get_session_by_token_hash(), which:
 *   - runs as neondb_owner (BYPASSRLS)
 *   - only returns rows matching SHA-256(sessionId) with expires_at > now()
 *   - is safe to call before app.current_tenant_id is set (auth bootstrap)
 *
 * DO NOT revert to a direct .from(sessions).where(...) query:
 * sessions_select policy is now tenant-scoped (ADR-001 / TD-001-B).
 * That query would return null for every unauthenticated request and
 * break the login flow.
 */
export async function verifyDbSession(sessionId: string): Promise<Session | null> {
  const db = await getDb();
  const tokenHash = crypto.createHash("sha256").update(sessionId).digest("hex");

  const result = await db.execute(
    sql`SELECT * FROM get_session_by_token_hash(${tokenHash})`
  );

  if (!result.rows || result.rows.length === 0) return null;
  return result.rows[0] as Session;
}
