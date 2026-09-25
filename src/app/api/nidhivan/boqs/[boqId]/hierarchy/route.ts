/**
 * src/app/api/nidhivan/boqs/[boqId]/hierarchy/route.ts
 *
 * Nidhivan Consulting — CPWD DSR Hierarchy Feed
 * ============================================================
 * PRODUCTION FIXES (Phase C launch):
 *   - REMOVED unused `db` import — was triggering `noUnusedLocals` TypeScript
 *     error under strict mode. `withTenant` is the only authorised query path
 *     (ADR-001); direct `db` access outside it is an architectural violation.
 *   - ADDED `Cache-Control: no-store` on 200 response. RLS-enforced data MUST
 *     NOT be cached by Vercel Edge, CDN, or any intermediate proxy. Caching a
 *     tenant's BOQ items and serving them to a different tenant is a data
 *     sovereignty breach regardless of the database-level RLS guarantee.
 *   - Scoped `error` type in catch block to `unknown` with explicit narrowing,
 *     satisfying `useUnknownInCatchVariables: true` in tsconfig.
 *
 * SECURITY NOTE:
 *   Defense-in-depth: explicit `eq(nidhivanBoqItems.tenantId, tenantId)` in the
 *   WHERE clause is intentional and non-redundant alongside RLS. It prevents
 *   accidental data exposure if the SET LOCAL session variable leaks across a
 *   pooled connection boundary (ADR-002 negative consequence).
 *
 * RBAC: viewer+ (read-only DPR data accessible to all authenticated roles)
 */

import { NextResponse, NextRequest } from 'next/server';
import { withTenant } from '@/db';
import { nidhivanBoqItems } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getRequestContext, requireRole } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ boqId: string }>;
};

// Responses headers applied to every 200 response on this route
const SECURE_HEADERS = {
  'Cache-Control': 'no-store',           // Never cache RLS-scoped tenant data
  'X-Content-Type-Options': 'nosniff',
} as const;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const ctx = getRequestContext(request);
    const denied = requireRole(ctx, 'viewer');
    if (denied) return denied;

    const tenantId = ctx.tenantId; // Already a number from getRequestContext

    // Next.js 15 requirement: params is a Promise
    const { boqId: rawBoqId } = await context.params;
    const boqId = parseInt(rawBoqId, 10);

    if (isNaN(boqId) || boqId <= 0) {
      return NextResponse.json(
        { error: 'Invalid BOQ ID — must be a positive integer.' },
        { status: 400 }
      );
    }

    const items = await withTenant(tenantId, async (tx) => {
      return tx
        .select()
        .from(nidhivanBoqItems)
        .where(
          and(
            eq(nidhivanBoqItems.tenantId, tenantId), // Defense-in-depth alongside RLS
            eq(nidhivanBoqItems.boqId, boqId)
          )
        )
        .orderBy(asc(nidhivanBoqItems.itemNumber));
    });

    // Return flat array — BoqDataGrid performs client-side section grouping
    return NextResponse.json(items, {
      status: 200,
      headers: SECURE_HEADERS,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NIDHIVAN] BOQ Hierarchy Fetch Error:', message);
    return NextResponse.json(
      { error: 'Internal server error fetching BOQ hierarchy.' },
      { status: 500 }
    );
  }
}
