import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nidhivanFinancialMetrics as financialMetrics } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { withTenant } from '@/lib/auth/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenantCtx = await withTenant(req);
    if (!tenantCtx?.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'ProjectId query parameter is mandatory' }, { status: 400 });
    }

    // Defense-in-depth tenantId match predicate inside the WHERE clause
    const metrics = await db
      .select()
      .from(financialMetrics)
      .where(
        and(
          eq(financialMetrics.tenantId, Number(tenantCtx.tenantId)),
          eq(financialMetrics.projectId, Number(projectId))
        )
      );

    return NextResponse.json({ success: true, data: metrics[0] || null }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}