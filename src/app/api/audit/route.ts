/**
 * src/app/api/audit/route.ts — Hardened with withTenant RLS
 *
 * GET — returns audit log entries scoped to the requesting tenant.
 *
 * SECURITY CHANGES:
 *   - withTenant scopes the query; RLS policy on audit_logs enforces it at DB level.
 *   - Cache key is tenant-scoped to prevent cross-tenant cache poisoning.
 *   - Requires minimum role: viewer (all authenticated users can read their own audit log).
 *   - admin/owner can see all audit log entries for their tenant; viewer sees the same
 *     (RLS does not sub-scope by user — that would require a second session variable).
 *
 * FIXES applied:
 *   1. ADR-002 Enforcement: Added fetchCache = "force-no-store" and runtime = "nodejs" to prevent driver crashes.
 *   2. Added explicit role validation for 'viewer'.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db/index";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { cached } from "@/lib/server-cache";

// --- NEXT.JS FETCH CACHE BYPASS FOR NEON HTTP TRANSACTIONS (ADR-002) ---
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; // CRITICAL: Prevents Next.js from hijacking BEGIN commands
export const runtime = "nodejs";            // CRITICAL: Required for Neon HTTP driver stability

export async function GET(req: NextRequest) {
  try {
    // Zero Trust Middleware provides trusted headers
    const ctx = getRequestContext(req);

    // Enforce minimum role as specified in the security changes
    const denied = requireRole(ctx, "viewer");
    if (denied) return denied;

    const tenantId = ctx.tenantId || 1;

    // Execute cached fetch with ADR-001 Row-Level Security
    const rows = await cached(`audit:${tenantId}`, 4_000, async () => {
      return await withTenant(tenantId, async (tx) => {
        return await tx
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.id))
          .limit(60);
      });
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[AUDIT_LOGS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}