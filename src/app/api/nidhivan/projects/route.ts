/**
 * src/app/api/nidhivan/projects/route.ts
 * Nidhivan Workspace Projects API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nidhivanProjects as projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withTenant } from '@/lib/auth/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenantCtx = await withTenant(req);
    if (!tenantCtx || !tenantCtx.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['developer', 'architect', 'admin'].includes(tenantCtx.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 });
    }

    const tenantProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.tenantId, Number(tenantCtx.tenantId)));

    return NextResponse.json({ success: true, data: tenantProjects }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantCtx = await withTenant(req);
    if (!tenantCtx || !tenantCtx.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['architect', 'admin'].includes(tenantCtx.role)) {
      return NextResponse.json({ error: 'Forbidden: Architect role required for project creation' }, { status: 403 });
    }

    const body = await req.json();
    const { projectCode, title, types, estimatedCostPaise, sector, implementingAgency, projectState } = body;

    // Strict type and value validation
    if (!projectCode || !title || !types || typeof estimatedCostPaise !== 'number' || estimatedCostPaise < 0) {
      return NextResponse.json({ error: 'Invalid payload structure or negative financial value' }, { status: 400 });
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        tenantId: Number(tenantCtx.tenantId),
        projectCode,
        projectTitle: title,
        projectType: types as any,
        sector: sector || 'General',
        implementingAgency: implementingAgency || 'Nidhivan Consulting',
        projectState: projectState || 'General',
        totalCostPaise: estimatedCostPaise,
        createdBy: Number(body.createdBy || 1),
      })
      .returning();

    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}