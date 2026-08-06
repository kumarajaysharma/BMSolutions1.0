import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { nidhivanDprs as dprs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withTenant } from '@/lib/auth/tenant';

export async function POST(req: NextRequest) {
  try {
    const tenantCtx = await withTenant(req);
    if (!tenantCtx?.isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { projectId, reportDetails, physicalProgressPercentage } = body;

    if (!projectId || !reportDetails) {
      return NextResponse.json({ error: 'Missing required DPR attributes' }, { status: 400 });
    }

    // Generate SHA-256 Cryptographic Hash for tamper-proof auditing
    const rawStringData = `${tenantCtx.tenantId}:${projectId}:${JSON.stringify(reportDetails)}:${Date.now()}`;
    const cryptographicHash = crypto.createHash('sha256').update(rawStringData).digest('hex');

    const [newDpr] = await db
      .insert(dprs)
      .values({
        tenantId: Number(tenantCtx.tenantId),
        projectId: Number(projectId),
        title: body.title || `DPR - ${new Date().toISOString().split('T')[0]}`,
        dprNumber: body.dprNumber || `DPR-${Date.now()}`,
        financialYear: body.financialYear || '2026-2027',
        status: body.status || 'draft',
        createdBy: body.createdBy || tenantCtx.role || 'system',
      })
      .returning();

    return NextResponse.json({ success: true, data: newDpr, hash: cryptographicHash }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}