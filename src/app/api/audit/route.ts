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
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db/index";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRequestContext } from "@/lib/request-context";
import { cached } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  const rows = await cached(`audit:${ctx.tenantId}`, 4_000, () =>
    withTenant(ctx.tenantId, (tx) =>
      tx
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.id))
        .limit(60)
    )
  );

  return NextResponse.json(rows);
}