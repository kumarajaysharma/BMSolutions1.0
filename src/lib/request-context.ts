/**
 * src/lib/request-context.ts
 *
 * Helpers for reading the verified session context that the proxy injects
 * into every authenticated request via headers, with a direct JWT cookie fallback.
 *
 * USAGE IN AN API ROUTE:
 *
 *   import { getRequestContext, requireRole } from "@/lib/request-context";
 *
 *   export async function GET(req: NextRequest) {
 *     const ctx = getRequestContext(req);
 *     const denied = requireRole(ctx, "developer");
 *     if (denied) return denied;
 *
 *     // ctx.tenantId is now safe to use in DB queries
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole, type AppRole } from "@/lib/roles";
import jwt from "jsonwebtoken";

export interface RequestContext {
  tenantId: number;
  userId: number;
  role: AppRole;
  sessionId?: string;
  tenantSlug: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "bnlv-enterprise-secret-key-2026";

/**
 * Extracts the verified session context from proxy-injected headers or falls back
 * to decoding the bms_session JWT cookie directly for direct API calls.
 */
export function getRequestContext(req: NextRequest): RequestContext {
  const tenantIdHeader = req.headers.get("x-tenant-id");
  const userIdHeader = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role") as AppRole | null;
  const sessionId = req.headers.get("x-session-id") ?? undefined;
  const tenantSlug = req.headers.get("x-tenant-slug");

  if (tenantIdHeader && userIdHeader && role && tenantSlug) {
    return {
      tenantId: Number(tenantIdHeader),
      userId: Number(userIdHeader),
      role,
      sessionId,
      tenantSlug,
    };
  }

  // Fallback: Parse bms_session cookie directly for direct client-side API fetches
  const sessionCookie = req.cookies.get("bms_session")?.value;
  if (sessionCookie) {
    try {
      const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
      return {
        tenantId: Number(decoded.tenantId ?? 4),
        userId: Number(decoded.userId ?? 17),
        role: (decoded.role as AppRole) ?? "developer",
        sessionId: decoded.sessionId ?? "cookie-session",
        tenantSlug: decoded.tenantSlug ?? "limsy",
      };
    } catch (err) {
      // Invalid token fallback
    }
  }

  throw new Error(
    "[request-context] Session headers and valid session cookie missing. " +
      "Verify authentication state."
  );
}

/**
 * Returns a 403 NextResponse if the session role does not satisfy
 * the minimum required role. Returns null on success.
 */
export function requireRole(
  ctx: RequestContext,
  minimumRole: AppRole
): NextResponse | null {
  if (!hasMinimumRole(ctx.role, minimumRole)) {
    return NextResponse.json({ error: "Forbidden - Insufficient privileges" }, { status: 403 });
  }
  return null;
}