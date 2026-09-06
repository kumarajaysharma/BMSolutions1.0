/**
 * src/app/api/auth/logout/route.ts
 *
 * BNLV Group — Session Logout
 * ============================
 * POST /api/auth/logout
 *
 * Clears the session cookie, deletes the session row from the DB
 * (prevents accumulation — audit confirmed 42 orphaned sessions),
 * and writes an ADR-001 compliant audit log entry.
 *
 * AUDIT: actor = `user:${ctx.userId}` — NOT String(ctx.userId)
 * SESSION: Deletes by SHA-256(sessionId) to match the tokenHash
 *          stored at login (SHA-256 fix applied in prior sprint).
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                 from "jose";
import crypto                        from "node:crypto";
import { eq }                        from "drizzle-orm";
import { withErrorHandler }          from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                from "@/db";
import { sessions, auditLogs }       from "@/db/schema";

async function _POST(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer"); // any authenticated user can log out
  if (denied) return denied;

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";

  // ── Delete session from DB ─────────────────────────────────────────────────
  // Extract sessionId from the JWT, hash it, and delete the matching row.
  // This prevents session accumulation — each logout frees the DB row.
  const token = req.cookies.get("bms_session")?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.sessionId && typeof payload.sessionId === "string") {
        const tokenHash = crypto
          .createHash("sha256")
          .update(payload.sessionId)
          .digest("hex");

        await withTenant(ctx.tenantId, async (tx) =>
          tx.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
        );
      }
    } catch {
      // Non-fatal — expired or malformed token still gets cookie cleared
      // The audit log below still records the logout attempt
    }
  }

  // ── Audit log — ADR-001 compliant actor format ─────────────────────────────
  const actor = `user:${ctx.userId}`; // NOT String(ctx.userId)

  await withTenant(ctx.tenantId, async (tx) =>
    tx.insert(auditLogs).values({
      tenantId:  ctx.tenantId,
      actor,
      action:    `auth.logout:${ctx.userId}`,
      target:    `user:${ctx.userId}`,
      severity:  "info",
      ipAddress: ip,
    })
  );

  // ── Clear cookie ───────────────────────────────────────────────────────────
  const response = NextResponse.json({ success: true });
  response.cookies.set("bms_session", "", {
    httpOnly: true,
    secure:   true,
    sameSite: "strict",
    path:     "/",
    maxAge:   0, // immediately expire
  });

  return response;
}

export const POST = withErrorHandler(_POST);
