/**
 * src/app/api/auth/logout/route.ts
 *
 * BNLV Studio — Zero-Trust Logout & Session Revocation
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb } from "@/db/index";
import { sessions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt, deleteSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("bms_session")?.value;

    let tenantIdForLog = 1;
    let userIdForLog = 0;

    // Delete session from DB on logout — prevents session accumulation
    if (sessionToken) {
      try {
        const payload = await decrypt(sessionToken);

        if (payload) {
          userIdForLog = Number(payload.userId) || 0;
          tenantIdForLog = Number(payload.tenantId) || 1;

          if (payload.sessionId) {
            const hash = crypto
              .createHash("sha256")
              .update(String(payload.sessionId))
              .digest("hex");
            
            const db = await getDb();
            const deleted = await db
              .delete(sessions)
              .where(eq(sessions.tokenHash, hash))
              .returning({ tenantId: sessions.tenantId, userId: sessions.userId });

            if (deleted.length > 0) {
              tenantIdForLog = deleted[0].tenantId;
              userIdForLog = deleted[0].userId;
            }
          }
        }
      } catch (err) {
        // Session decryption or deletion failure is non-fatal — logout proceeds
        console.error("Logout session cleanup warning:", err);
      }
    }

    // Write an enterprise audit log for compliance tracking
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "";

    try {
      const db = await getDb();
      await db.insert(auditLogs).values({
        tenantId: tenantIdForLog,
        actor: `user:${userIdForLog}`,
        action: "auth.logout",
        target: "",
        severity: "info",
        ipAddress: ip,
      });
    } catch (auditErr) {
      console.error("Audit log error on logout:", auditErr);
    }

    // Destroy the client-side Edge cookie
    await deleteSessionCookie();

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error Exception:", error);
    await deleteSessionCookie();
    return NextResponse.json({ error: "Failed to process logout completely" }, { status: 500 });
  }
}