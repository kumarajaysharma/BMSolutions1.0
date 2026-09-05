/**
 * src/app/api/nidhivan/projects/route.ts
 * GET /api/nidhivan/projects
 *
 * Returns all infrastructure projects for the authenticated tenant.
 * RLS enforced via withTenant() — cross-tenant leakage structurally impossible.
 * RBAC: developer minimum (read-only financial data).
 */

import { NextRequest, NextResponse } from "next/server";
import { asc }                       from "drizzle-orm";
import { withErrorHandler }          from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                from "@/db";
import { nidhivanProjects }          from "@/db/schema";

export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const data = await withTenant(ctx.tenantId, async (tx) =>
    tx.select().from(nidhivanProjects).orderBy(asc(nidhivanProjects.id))
  );

  return NextResponse.json({ success: true, data });
}

export const GET = withErrorHandler(_GET);
