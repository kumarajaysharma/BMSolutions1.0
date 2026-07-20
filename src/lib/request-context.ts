/**
 * src/lib/request-context.ts
 *
 * Helpers for reading the verified session context that middleware injects
 * into every authenticated request via headers.
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

export interface RequestContext {
  tenantId: string;
  userId: string;
  role: AppRole;
  sessionId: string;
}

/**
 * Extracts the verified session context from middleware-injected headers.
 * Throws an Error if headers are absent — indicates middleware misconfiguration,
 * not a user error. Let this propagate as a 500.
 */
export function getRequestContext(req: NextRequest): RequestContext {
  const tenantId = req.headers.get("x-tenant-id");
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role") as AppRole | null;
  const sessionId = req.headers.get("x-session-id");

  if (!tenantId || !userId || !role || !sessionId) {
    throw new Error(
      "[request-context] Session headers missing. " +
        "Verify that src/middleware.ts is running for this route path."
    );
  }

  return {
    tenantId,
    userId,
    role,
    sessionId,
  };
}

/**
 * Returns a 403 NextResponse if the session role does not satisfy
 * the minimum required role. Returns null on success.
 *
 * Pattern: const denied = requireRole(ctx, "admin"); if (denied) return denied;
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