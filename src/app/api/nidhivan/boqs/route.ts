import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { nidhivanBoqs as boqs } from '@/db/schema';
import { withTenant } from '@/lib/auth/tenant';

export async function POST(req: NextRequest) {
  try {
    const tenantCtx = await withTenant(req);
    if (!tenantCtx?.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { projectId, dsrItemCode, quantity, unitRatePaise } = body;

    if (!projectId || !dsrItemCode || typeof unitRatePaise !== 'number') {
      return NextResponse.json({ error: 'Invalid CPWD DSR hierarchy mapping or pricing payload' }, { status: 400 });
    }

    const totalAmountPaise = quantity * unitRatePaise;

    const [newBoq] = await db
      .insert(boqs)
      .values({
        tenantId: Number(tenantCtx.tenantId),
        projectId: Number(projectId),
        title: body.title || `BOQ Item - ${dsrItemCode}`,
        boqNumber: body.boqNumber || `BOQ-${Date.now()}`,
        dprId: body.dprId ? Number(body.dprId) : 1,
        createdBy: body.createdBy || tenantCtx.role || 'system',
        totalAmountPaise,
      })
      .returning();

    return NextResponse.json({ success: true, data: newBoq }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}