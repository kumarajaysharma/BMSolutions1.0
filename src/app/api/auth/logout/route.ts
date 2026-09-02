/**
 * src/app/api/auth/logout/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import crypto from "node:crypto";
import { db } from "@/db";
import { sessions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteSessionCookie } from "@/lib/auth";

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
        const { payload } = await jwtVerify(
          sessionToken,
          new TextEncoder().encode(process.env.JWT_SECRET!)
        ).catch(() => ({ payload: null }));

        if (payload) {
          userIdForLog = Number(payload.userId) || 0;
          tenantIdForLog = Number(payload.tenantId) || 1;

          if (payload.sessionId) {
            const hash = crypto
              .createHash("sha256")
              .update(String(payload.sessionId))
              .digest("hex");
            
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
      } catch {
        // Session deletion failure is non-fatal — logout proceeds
      }
    }

    // Write an enterprise audit log for compliance tracking
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "";

    try {
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

    return NextResponse.json({ ok: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    await deleteSessionCookie();
    return NextResponse.json({ error: "Failed to process logout completely" }, { status: 500 });
  }
}