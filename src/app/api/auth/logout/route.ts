import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt, deleteSessionCookie } from "@/lib/auth";
import { getDb } from "@/db/index";
import { sessions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Read the JWT cookie securely
    const cookieStore = cookies();
    const token = cookieStore.get("bms_session")?.value;

    if (token) {
      // 2. Decrypt the token to get the exact database session ID
      const sessionPayload = await decrypt(token);

      if (sessionPayload && sessionPayload.sessionId) {
        const db = await getDb();

        // 3. Hard-delete the session from the database to prevent replay attacks
        const deleted = await db
          .delete(sessions)
          .where(eq(sessions.id, sessionPayload.sessionId))
          .returning({
            tenantId: sessions.tenantId,
            userId: sessions.userId,
          });

        // 4. Write an enterprise audit log for compliance tracking
        if (deleted.length > 0) {
          const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            req.headers.get("x-real-ip") ??
            "";

          await db.insert(auditLogs).values({
            tenantId: deleted[0].tenantId,
            actor: deleted[0].userId.toString(),
            action: "auth.logout",
            target: "",
            severity: "info",
            ipAddress: ip,
          });
        }
      }
    }

    // 5. Destroy the client-side Edge cookie using our auth utility
    await deleteSessionCookie();

    return NextResponse.json({ ok: true, message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    
    // Fallback: Even if the DB fails, strictly destroy the cookie so the user isn't stuck
    await deleteSessionCookie();
    return NextResponse.json({ error: "Failed to process logout completely" }, { status: 500 });
  }
}