import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { nidhivanBoqItems } from '@/db/schema';
import { withTenant } from '@/lib/db/with-tenant';
import { eq, asc } from 'drizzle-orm';

type RouteContext = {
  params: Promise<{
    boqId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const { boqId: rawBoqId } = await context.params;
    const boqId = parseInt(rawBoqId, 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Tenant Context' },
        { status: 401 }
      );
    }

    if (isNaN(boqId)) {
      return NextResponse.json(
        { error: 'Invalid BOQ ID format' },
        { status: 400 }
      );
    }

    const items = await withTenant(tenantId, async (tx) => {
      return await tx
        .select()
        .from(nidhivanBoqItems)
        .where(eq(nidhivanBoqItems.boqId, boqId))
        .orderBy(asc(nidhivanBoqItems.itemNumber));
    });

    // Group flat items by sectionCode or headers if needed by UI
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    console.error('[NIDHIVAN] Hierarchy Fetch Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching BOQ hierarchy.' },
      { status: 500 }
    );
  }
}