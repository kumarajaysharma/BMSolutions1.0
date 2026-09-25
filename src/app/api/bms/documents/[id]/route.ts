/**
 * src/app/api/bms/documents/[id]/route.ts
 *
 * BMS Documentation Engine — Single Document Operations
 * ======================================================
 * GET    → fetch document with full content (viewer+)
 * PATCH  → update title / content / status (developer+)
 * POST   → trigger AI generation / re-generation (architect+)
 *          Calls Claude Sonnet 5 to enhance the template with client context
 *
 * DATA SOVEREIGNTY NOTE:
 *   Documents of type LEGAL_FRAMEWORK route exclusively to Claude Sonnet 5
 *   on Anthropic-compliant infrastructure per ADR-006 (DPDP Act 2023).
 *   All other types also use Claude Sonnet 5 as the default; override via
 *   LIMSY_SYNOPSIS_MODEL env var pattern if needed.
 *
 * RBAC:
 *   GET    → viewer+
 *   PATCH  → developer+
 *   POST   → architect+  (AI generation is write-amplifying — elevated gate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { withTenant } from '@/db';
import { bmsDocuments, auditLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRequestContext, requireRole } from '@/lib/request-context';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { injectScope, ARTIFACTS, type ScopeVar } from '@/lib/bms-artifacts';

export const dynamic = 'force-dynamic';

const SECURE_HEADERS  = { 'Cache-Control': 'no-store' } as const;
const DOC_MODEL       = process.env.BMS_DOC_MODEL ?? 'claude-sonnet-5';
const MAX_PROMPT_CHARS = 12_000;

type RouteContext = { params: Promise<{ id: string }> };

function extractIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function fetchDoc(tx: any, id: number, tenantId: number) {
  const [doc] = await tx
    .select()
    .from(bmsDocuments)
    .where(and(eq(bmsDocuments.id, id), eq(bmsDocuments.tenantId, tenantId)))
    .limit(1);
  return doc ?? null;
}

// ── GET ───────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest, context: RouteContext) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, 'viewer');
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });

  const doc = await withTenant(ctx.tenantId, async (tx) => fetchDoc(tx, id, ctx.tenantId));
  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  return NextResponse.json(
    {
      document: {
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    },
    { status: 200, headers: SECURE_HEADERS }
  );
}

// ── PATCH — Update document ───────────────────────────────────────────────────

async function _PATCH(req: NextRequest, context: RouteContext) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, 'developer');
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const ip   = extractIp(req);

  const updated = await withTenant(ctx.tenantId, async (tx) => {
    const existing = await fetchDoc(tx, id, ctx.tenantId);
    if (!existing) return null;

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
    if (typeof body.rawMarkdown === 'string') patch.rawMarkdown = body.rawMarkdown;
    if (typeof body.content === 'object')    patch.content = body.content;
    if (typeof body.scopeSnapshot === 'object') patch.scopeSnapshot = body.scopeSnapshot;
    if (typeof body.metadata === 'object')   patch.metadata = { ...existing.metadata, ...(body.metadata as object) };

    if (typeof body.status === 'string') {
      patch.status = body.status;
    }

    // Bump version on content change
    const contentChanged = typeof body.rawMarkdown === 'string' && body.rawMarkdown !== existing.rawMarkdown;
    if (contentChanged) patch.version = existing.version + 1;

    const [doc] = await tx
      .update(bmsDocuments)
      .set(patch)
      .where(and(eq(bmsDocuments.id, id), eq(bmsDocuments.tenantId, ctx.tenantId)))
      .returning();

    await tx.insert(auditLogs).values({
      tenantId:  ctx.tenantId,
      actor:     `user:${ctx.userId}`,
      action:    `bms.document.update:${doc.documentType}:v${doc.version}`,
      target:    `doc:${id}`,
      severity:  'info',
      ipAddress: ip,
    });

    return doc;
  });

  if (!updated) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  return NextResponse.json(
    {
      document: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    },
    { status: 200, headers: SECURE_HEADERS }
  );
}

// ── POST — AI generation / re-generation ─────────────────────────────────────

async function _POST(req: NextRequest, context: RouteContext) {
  const ctx = getRequestContext(req);
  // AI generation is write-amplifying — architect+ gate
  const denied = requireRole(ctx, 'architect');
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });

  const body   = await req.json().catch(() => ({})) as Record<string, unknown>;
  const scope  = Array.isArray(body.scope) ? (body.scope as ScopeVar[]) : [];
  const instruction = typeof body.instruction === 'string'
    ? body.instruction.slice(0, 500)
    : '';
  const ip = extractIp(req);

  // Set status to GENERATING immediately (fire-and-forget on status update)
  await withTenant(ctx.tenantId, async (tx) => {
    await tx
      .update(bmsDocuments)
      .set({ status: 'GENERATING', updatedAt: new Date() })
      .where(and(eq(bmsDocuments.id, id), eq(bmsDocuments.tenantId, ctx.tenantId)));
  });

  // Fetch document and resolve artifact template
  const doc = await withTenant(ctx.tenantId, async (tx) => fetchDoc(tx, id, ctx.tenantId));
  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  const artifact = ARTIFACTS.find(a => a.key === doc.artifactKey);
  if (!artifact) return NextResponse.json({ error: `Unknown artifact key: ${doc.artifactKey}` }, { status: 400 });

  // Build the base template with scope injection
  const baseTemplate = injectScope(artifact.content, scope);

  // Build the AI prompt
  const systemPrompt = `You are an Elite Enterprise Solutions Architect, Senior Technical Project Manager, and Corporate Legal Drafter working for BNLV Group of Companies (BMSolutions subsidiary, Raipur, Chhattisgarh, India).

Your task: Generate a complete, production-ready ${artifact.title} document for the client engagement described in the template below. The document must be:
1. Professionally structured with clear markdown headings
2. Specific to the scope variables provided (not generic placeholders)
3. Legally sound and commercially precise
4. Ready for immediate client presentation
5. Compliant with Indian law where applicable (DPDP Act 2023, Indian Contract Act 1872, Arbitration & Conciliation Act 1996)

OUTPUT FORMAT: Return ONLY the complete markdown document. No preamble, no meta-commentary.`;

  const userPrompt = `BASE TEMPLATE (enhance and complete this document):

${baseTemplate.slice(0, MAX_PROMPT_CHARS)}

${instruction ? `SPECIFIC INSTRUCTION: ${instruction}\n` : ''}PHASE: ${artifact.phase} — ${artifact.tag} document
DOCUMENT TYPE: ${doc.documentType}`;

  let generatedMarkdown: string;
  try {
    const { text } = await generateText({
      model:       anthropic(DOC_MODEL),
      system:      systemPrompt,
      prompt:      userPrompt,
      temperature: 0.15,   // Low temperature for formal commercial documents
      maxTokens:   4_000,
    });
    generatedMarkdown = text;
  } catch (aiErr) {
    // On AI failure, fall back to base template + mark as DRAFT
    await withTenant(ctx.tenantId, async (tx) => {
      await tx.update(bmsDocuments)
        .set({ status: 'DRAFT', updatedAt: new Date() })
        .where(and(eq(bmsDocuments.id, id), eq(bmsDocuments.tenantId, ctx.tenantId)));
    });
    console.error('[BMS-DOCS] AI generation failed:', aiErr instanceof Error ? aiErr.message : aiErr);
    return NextResponse.json({ error: 'AI generation failed. Document reverted to DRAFT.' }, { status: 502 });
  }

  // Persist generated content + bump version
  const saved = await withTenant(ctx.tenantId, async (tx) => {
    const [updatedDoc] = await tx
      .update(bmsDocuments)
      .set({
        rawMarkdown:   generatedMarkdown,
        status:        'REVIEW_PENDING',
        scopeSnapshot: Object.fromEntries(scope.map(s => [s.key, s.value])),
        metadata: {
          ...(doc.metadata as object),
          modelRouting:     DOC_MODEL,
          phase:            artifact.phase,
          artifactKey:      artifact.key,
          generationPrompt: userPrompt.slice(0, 200) + '…',
        } as any,
        version:   doc.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(bmsDocuments.id, id), eq(bmsDocuments.tenantId, ctx.tenantId)))
      .returning();

    // ADR-001: audit log for AI document generation
    await tx.insert(auditLogs).values({
      tenantId:  ctx.tenantId,
      actor:     `user:${ctx.userId}`,
      action:    `bms.document.ai_generate:${doc.documentType}:phase${artifact.phase}`,
      target:    `doc:${id}:${artifact.key}`,
      severity:  'info',
      ipAddress: ip,
    });

    return updatedDoc;
  });

  return NextResponse.json(
    {
      document: {
        ...saved,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
      generated: true,
      model: DOC_MODEL,
    },
    { status: 200, headers: SECURE_HEADERS }
  );
}

export const GET   = withErrorHandler(_GET);
export const PATCH = withErrorHandler(_PATCH);
export const POST  = withErrorHandler(_POST);   // AI generation
