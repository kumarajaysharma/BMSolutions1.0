import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { nidhivanBoqItems } from '@/db/schema';
import { withTenant } from '@/lib/db/with-tenant';

type RouteContext = {
  params: Promise<{
    boqId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
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

    const body = await request.json();
    const {
      itemNumber,
      sectionCode,
      isSectionHeader,
      description,
      unit,
      quantity,
      unitRatePaise,
      rateRef,
      remarks,
    } = body;

    // Basic validation
    if (!description || itemNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: itemNumber and description are mandatory.' },
        { status: 400 }
      );
    }

    // Server-side authoritative calculation (Quantity * Unit Rate in paise)
    const qty = isSectionHeader ? 0 : Number(quantity || 0);
    const rate = isSectionHeader ? 0 : Number(unitRatePaise || 0);
    const amountPaise = Math.round(qty * rate);

    // Execute within the Zero-Trust transaction context
    const newItem = await withTenant(tenantId, async (tx) => {
      const [inserted] = await tx.insert(nidhivanBoqItems).values({
        tenantId: parseInt(tenantId, 10),
        boqId,
        itemNumber: Number(itemNumber),
        sectionCode: sectionCode || null,
        isSectionHeader: Boolean(isSectionHeader),
        description,
        unit: unit || null,
        quantity: qty,
        unitRatePaise: rate,
        amountPaise,
        rateRef: rateRef || null,
        remarks: remarks || null,
      }).returning();

      return inserted;
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });

  } catch (error) {
    console.error('[NIDHIVAN] BOQ Item Creation Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while creating BOQ item.' },
      { status: 500 }
    );
  }
}