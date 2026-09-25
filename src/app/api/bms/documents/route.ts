/**
 * src/app/api/bms/documents/route.ts
 *
 * BMS Documentation Engine — Document List & Create
 * ==================================================
 * Integration of the reference engine (BNLV_documentation-engineA.zip)
 * into the existing BNLV multi-tenant architecture.
 *
 * KEY DIFFERENCES from reference engine (src/app/api/documents/route.ts):
 *   - withUser() replaced by getRequestContext() + requireRole() — BNLV auth
 *   - Bare db.select() replaced by withTenant() — ADR-001 RLS enforcement
 *   - Added auditLogs.insert() on document creation — ADR-001 mandate
 *   - Route namespace: /api/bms/* (BMS module scope)
 *   - tenant_id is INTEGER not UUID; uses ctx.tenantId from JWT
 *
 * RBAC:
 *   GET  → viewer+  (read-only document list)
 *   POST → developer+ (create new document / save template)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { withTenant } from '@/db';
import { bmsDocuments, auditLogs } from '@/db/schema';
import { eq, and, desc, ilike, or, SQL } from 'drizzle-orm';
import { getRequestContext, requireRole } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

const SECURE_HEADERS = { 'Cache-Control': 'no-store' } as const;

// ── GET — List documents for tenant ──────────────────────────────────────────

async function _GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, 'viewer');
  if (denied) return denied;

  const url = new URL(req.url);
  const phase   = url.searchParams.get('phase');
  const type    = url.searchParams.get('type');
  const status  = url.searchParams.get('status');
  const search  = url.searchParams.get('search');
  const limit   = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 200);

  const docs = await withTenant(ctx.tenantId, async (tx) => {
    const conditions: SQL[] = [eq(bmsDocuments.tenantId, ctx.tenantId)];

    if (phase)  conditions.push(eq(bmsDocuments.phase, parseInt(phase, 10)));
    if (type)   conditions.push(eq(bmsDocuments.documentType, type as any));
    if (status) conditions.push(eq(bmsDocuments.status, status as any));

    if (search) {
      const term = `%${search}%`;
      const clause = or(
        ilike(bmsDocuments.title, term),
        ilike(bmsDocuments.rawMarkdown, term),
      );
      if (clause) conditions.push(clause);
    }

    return tx
      .select({
        id:           bmsDocuments.id,
        title:        bmsDocuments.title,
        documentType: bmsDocuments.documentType,
        status:       bmsDocuments.status,
        phase:        bmsDocuments.phase,
        artifactKey:  bmsDocuments.artifactKey,
        version:      bmsDocuments.version,
        authorId:     bmsDocuments.authorId,
        metadata:     bmsDocuments.metadata,
        createdAt:    bmsDocuments.createdAt,
        updatedAt:    bmsDocuments.updatedAt,
      })
      .from(bmsDocuments)
      .where(and(...conditions))
      .orderBy(desc(bmsDocuments.updatedAt))
      .limit(limit);
  });

  return NextResponse.json(
    {
      documents: docs.map(d => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      total: docs.length,
    },
    { status: 200, headers: SECURE_HEADERS }
  );
}

// ── POST — Create new document ────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, 'developer');
  if (denied) return denied;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const title        = typeof body.title === 'string' ? body.title.trim() : '';
  const documentType = typeof body.documentType === 'string' ? body.documentType : '';
  const artifactKey  = typeof body.artifactKey  === 'string' ? body.artifactKey  : '';
  const phase        = typeof body.phase === 'number' ? body.phase : 1;

  if (!title)        return NextResponse.json({ error: 'title is required.'        }, { status: 400 });
  if (!documentType) return NextResponse.json({ error: 'documentType is required.' }, { status: 400 });
  if (!artifactKey)  return NextResponse.json({ error: 'artifactKey is required.'  }, { status: 400 });
  if (phase < 1 || phase > 4) return NextResponse.json({ error: 'phase must be 1–4.' }, { status: 400 });

  const rawMarkdown  = typeof body.rawMarkdown   === 'string' ? body.rawMarkdown : undefined;
  const scopeSnapshot = typeof body.scopeSnapshot === 'object' && body.scopeSnapshot !== null
    ? body.scopeSnapshot as Record<string, string>
    : {};
  const metadata = typeof body.metadata === 'object' && body.metadata !== null
    ? body.metadata as Record<string, unknown>
    : {};

  const ip = req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? '127.0.0.1';

  const row = await withTenant(ctx.tenantId, async (tx) => {
    const [inserted] = await tx
      .insert(bmsDocuments)
      .values({
        tenantId:     ctx.tenantId,
        authorId:     ctx.userId,
        title,
        documentType: documentType as any,
        status:       'DRAFT',
        phase,
        artifactKey,
        rawMarkdown:  rawMarkdown ?? null,
        content:      (body.content as any) ?? {},
        scopeSnapshot,
        metadata:     {
          ...metadata,
          modelRouting: 'claude-sonnet-5',
          phase,
          artifactKey,
        } as any,
        version: 1,
      })
      .returning();

    await tx.insert(auditLogs).values({
      tenantId:  ctx.tenantId,
      actor:     `user:${ctx.userId}`,
      action:    `bms.document.create:${documentType}`,
      target:    `doc:${inserted.id}:${artifactKey}`,
      severity:  'info',
      ipAddress: ip,
    });

    return inserted;
  });

  return NextResponse.json(
    {
      document: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    },
    { status: 201, headers: SECURE_HEADERS }
  );
}

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
