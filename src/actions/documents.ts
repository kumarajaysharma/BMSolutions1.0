/**
 * src/actions/documents.ts  (or src/app/actions/documents.ts)
 *
 * BMS Documentation Engine — Next.js Server Actions
 * ==================================================
 * ADAPTED from src_actions_documents.ts.ts provided by user.
 *
 * CRITICAL ADAPTATIONS vs original:
 *
 *  1. withTenantContext(tenantId, ...) → withTenant(tenantId, ...)
 *     The existing BNLV platform uses withTenant() from @/db, which implements
 *     SET LOCAL app.current_tenant_id (ADR-001). The provided withTenantContext
 *     uses set_config() via SELECT — identical outcome inside a transaction but
 *     withTenant() is already battle-tested in production. No new wrapper needed.
 *
 *  2. tenantId: string (UUID) → tenantId: number (INTEGER)
 *     BNLV tenants.id is a SERIAL integer, not UUID. The bms_documents table
 *     FK references INTEGER. Passing a UUID would cause a Drizzle type error.
 *
 *  3. authorId: UUID → authorId: number (INTEGER)
 *     users.id is SERIAL integer.
 *
 *  4. docData.blocks (any) → typed BmsDocumentInsert
 *     Removed `as any` — strict typing throughout.
 *
 *  5. modelRouting hardcoded → read from env (BMS_DOC_MODEL)
 *     Allows model override without code changes.
 *
 *  6. Added auditLogs.insert() — ADR-001 mandate for all mutations.
 *
 *  7. 'use server' directive added — required for Next.js Server Actions.
 *
 * USAGE in a Server Component or Server Action:
 *
 *   const doc = await saveGeneratedDocument(tenantId, {
 *     authorId:    currentUserId,
 *     title:       'Q3 Enterprise Architecture DPR',
 *     docType:     'DPR',
 *     phase:       2,
 *     artifactKey: 'lld',
 *     rawMarkdown: generatedContent,
 *     content:     parsedBlocks,
 *     scopeSnapshot: { CLIENT: 'ACME Corp', MRC: '₹35,000' },
 *     metadata:    { financialRatios: { ROI: 18.5, EBITDA_Margin: 22.4 } },
 *   });
 */

'use server';

import { withTenant } from '@/db';
import { bmsDocuments, auditLogs, type BmsDocumentInsert } from '@/db/schema';

// ── Environment ───────────────────────────────────────────────────────────────
const MODEL_ROUTING = process.env.BMS_DOC_MODEL ?? 'claude-sonnet-5';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocumentInput {
  authorId:      number;                          // users.id (INTEGER)
  title:         string;
  docType:       BmsDocumentInsert['documentType']; // bms_document_type enum value
  phase:         1 | 2 | 3 | 4;
  artifactKey:   string;                          // matches ARTIFACTS[].key
  rawMarkdown?:  string;
  content?:      BmsDocumentInsert['content'];
  scopeSnapshot?: Record<string, string>;
  metadata?:     BmsDocumentInsert['metadata'];
}

// ── Primary Action — adapted from src_actions_documents.ts.ts ─────────────────

/**
 * saveGeneratedDocument
 * ---------------------
 * Saves a generated document to bms_documents within the Zero Trust tenant context.
 *
 * The RLS policy on bms_documents enforces that tenant_id must match
 * current_setting('app.current_tenant_id', TRUE)::integer.
 * withTenant() sets this session variable before the INSERT executes.
 * If tenantId does not match, the INSERT is rejected by the RLS WITH CHECK clause.
 *
 * @param tenantId - INTEGER tenant ID from tenants.id (NOT uuid)
 * @param docData  - Document content and metadata
 * @returns        Inserted bms_documents row
 */
export async function saveGeneratedDocument(
  tenantId: number,       // INTEGER — NOT string UUID
  docData:  DocumentInput,
  requestIp = '127.0.0.1',
) {
  return withTenant(tenantId, async (tx) => {
    // ── INSERT ────────────────────────────────────────────────────────────────
    const [newDoc] = await tx
      .insert(bmsDocuments)
      .values({
        tenantId,                            // Must match the session context
        authorId:     docData.authorId,      // INTEGER — consistent with users.id
        title:        docData.title,
        documentType: docData.docType,
        status:       'DRAFT',
        phase:        docData.phase,
        artifactKey:  docData.artifactKey,
        rawMarkdown:  docData.rawMarkdown ?? null,
        content:      docData.content ?? {},
        scopeSnapshot: docData.scopeSnapshot ?? {},
        metadata: {
          ...docData.metadata,
          modelRouting: MODEL_ROUTING,       // e.g. 'claude-sonnet-5'
          phase:        docData.phase,
          artifactKey:  docData.artifactKey,
        },
        version: 1,
      })
      .returning();

    // ── AUDIT LOG (ADR-001 mandate) ────────────────────────────────────────
    await tx.insert(auditLogs).values({
      tenantId,
      actor:     `user:${docData.authorId}`,
      action:    `bms.document.create:${docData.docType}:phase${docData.phase}`,
      target:    `doc:${newDoc.id}:${docData.artifactKey}`,
      severity:  'info',
      ipAddress: requestIp,
    });

    return newDoc;
  });
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/** Update document status (DRAFT → REVIEW_PENDING → PUBLISHED | ARCHIVED) */
export async function updateDocumentStatus(
  tenantId:   number,
  documentId: number,
  status:     BmsDocumentInsert['status'],
  userId:     number,
  requestIp = '127.0.0.1',
) {
  return withTenant(tenantId, async (tx) => {
    const { eq, and } = await import('drizzle-orm');

    const [updated] = await tx
      .update(bmsDocuments)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(bmsDocuments.id, documentId), eq(bmsDocuments.tenantId, tenantId)))
      .returning();

    if (updated) {
      await tx.insert(auditLogs).values({
        tenantId,
        actor:     `user:${userId}`,
        action:    `bms.document.status:${status}`,
        target:    `doc:${documentId}`,
        severity:  status === 'PUBLISHED' ? 'info' : 'info',
        ipAddress: requestIp,
      });
    }

    return updated ?? null;
  });
}

/** Retrieve a single document by ID, scoped to tenant */
export async function getDocument(tenantId: number, documentId: number) {
  const { eq, and } = await import('drizzle-orm');
  const [doc] = await withTenant(tenantId, async (tx) =>
    tx.select()
      .from(bmsDocuments)
      .where(and(eq(bmsDocuments.id, documentId), eq(bmsDocuments.tenantId, tenantId)))
      .limit(1)
  );
  return doc ?? null;
}

/** List documents for a tenant, optionally filtered by phase */
export async function listDocuments(tenantId: number, phase?: number, limit = 100) {
  const { eq, and, desc } = await import('drizzle-orm');
  return withTenant(tenantId, async (tx) => {
    const base = tx
      .select({
        id:           bmsDocuments.id,
        title:        bmsDocuments.title,
        documentType: bmsDocuments.documentType,
        status:       bmsDocuments.status,
        phase:        bmsDocuments.phase,
        artifactKey:  bmsDocuments.artifactKey,
        version:      bmsDocuments.version,
        updatedAt:    bmsDocuments.updatedAt,
      })
      .from(bmsDocuments)
      .orderBy(desc(bmsDocuments.updatedAt))
      .limit(limit);

    if (phase !== undefined) {
      return base.where(and(eq(bmsDocuments.tenantId, tenantId), eq(bmsDocuments.phase, phase)));
    }
    return base.where(eq(bmsDocuments.tenantId, tenantId));
  });
}
