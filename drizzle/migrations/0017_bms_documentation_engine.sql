-- =============================================================================
-- Migration 0017: BMS Documentation Engine
-- File: drizzle/migrations/0017_bms_documentation_engine.sql
-- Executed via: npm run db:migrate (DATABASE_URL_UNPOOLED — ADR-002)
-- =============================================================================
--
-- ADAPTATION NOTES vs src_db_schema_patch.ts provided:
--
--  1. UUID → INTEGER: All primary keys and foreign keys use INTEGER/SERIAL
--     consistent with BNLV Group's established schema convention. The UUID
--     pattern in the provided patch conflicts with tenants.id (INTEGER) and
--     users.id (INTEGER) which cannot be referenced as UUID.
--
--  2. RLS cast: Policy uses ::integer NOT ::uuid, matching the existing
--     SET LOCAL app.current_tenant_id (integer string) pattern from ADR-001.
--
--  3. withTenantContext alignment: The provided withTenantContext uses
--     set_config() via SELECT. BNLV uses SET LOCAL — identical effect in a
--     transaction, but SET LOCAL is already established in withTenant().
--     No new wrapper is required; use existing withTenant() from @/db.
--
--  4. pgPolicy in schema.ts: NOT used. Existing BNLV pattern defines RLS
--     entirely in SQL migrations. Schema.ts reflects the column structure
--     only. This migration is the authoritative RLS definition.
--
--  5. Expanded enum: documentTypeEnum expanded from 5 → 14 values covering
--     all four commercial lifecycle phases.
-- =============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE bms_document_type AS ENUM (
    -- Phase 1: Project Inception & Commercial Alignment
    'MOU',                        -- Memorandum of Understanding
    'BSD',                        -- Business Solution Document
    'SLA',                        -- Service Level Agreement
    'MANAGED_SERVICES_CONTRACT',  -- Long-term engagement contract

    -- Phase 2: Enterprise Architecture & System Design
    'ENTERPRISE_ARCHITECTURE',    -- Holistic system context & topology
    'HLD',                        -- High-Level Design
    'LLD',                        -- Low-Level Design
    'SPEC_GENERATIVE',            -- Technical specification details

    -- Phase 3: Security, Guardrails & Quality Assurance
    'SECURITY_ATP',               -- Security guardrails acceptance test procedures
    'TEST_PROCEDURES',            -- Unit, integration, E2E strategy
    'VALIDATION_PROCEDURES',      -- Data integrity, load, failover validation

    -- Phase 4: Production Build & Commercial Launch
    'BUILD_REPORT',               -- Final build metrics & CI/CD logs
    'LAUNCH_ATP',                 -- Commercial launch UAT sign-off
    'PROJECT_CLOSURE',            -- Formal handover & lessons learned

    -- Legacy / subsidiary-specific (backward compat)
    'DPR',                        -- Detailed Project Report (Nidhivan)
    'BOQ_CPWD',                   -- Bill of Quantities CPWD standard (Nidhivan)
    'LEGAL_FRAMEWORK',            -- Legal briefs (LIMSY)
    'FINANCIAL_MODEL',            -- Financial architecture (Nidhivan)
    'CORPORATE_CHARTER'           -- Enterprise blueprint (BMSolutions)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bms_document_status AS ENUM (
    'DRAFT',
    'GENERATING',
    'REVIEW_PENDING',
    'PUBLISHED',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bms_documents (
  id               SERIAL PRIMARY KEY,

  -- RLS isolation key — INTEGER FK to match tenants.id
  tenant_id        INTEGER NOT NULL
                     REFERENCES tenants(id) ON DELETE RESTRICT,

  -- Author reference — INTEGER FK to match users.id
  author_id        INTEGER
                     REFERENCES users(id) ON DELETE SET NULL,

  -- Document metadata
  title            TEXT NOT NULL,
  document_type    bms_document_type NOT NULL,
  status           bms_document_status NOT NULL DEFAULT 'DRAFT',

  -- Phase 1–4 of the commercial lifecycle
  phase            INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 4),

  -- Matches the artifact template key in src/lib/bms-artifacts.ts
  artifact_key     TEXT NOT NULL,

  -- Raw markdown output (from AI generation or template injection)
  raw_markdown     TEXT,

  -- Structured content (rich-text blocks for rendering)
  content          JSONB NOT NULL DEFAULT '{}',

  -- Scope variables used at generation time (for audit / re-generation)
  scope_snapshot   JSONB NOT NULL DEFAULT '{}',

  -- Metadata: modelRouting, generationPromptHash, financialRatios, etc.
  -- Mirrors the structure from src_db_schema_patch.ts metadata field
  metadata         JSONB NOT NULL DEFAULT '{}',

  -- Content version counter — increments on every save
  version          INTEGER NOT NULL DEFAULT 1,

  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS bms_documents_tenant_idx
  ON bms_documents (tenant_id);

CREATE INDEX IF NOT EXISTS bms_documents_type_phase_idx
  ON bms_documents (tenant_id, document_type, phase);

CREATE INDEX IF NOT EXISTS bms_documents_status_idx
  ON bms_documents (tenant_id, status);

CREATE INDEX IF NOT EXISTS bms_documents_updated_idx
  ON bms_documents (tenant_id, updated_at DESC);

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Consistent with ADR-001: studio_app operates under FORCE ROW LEVEL SECURITY.
-- Uses ::integer cast to match SET LOCAL app.current_tenant_id (integer string).

ALTER TABLE bms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_documents FORCE ROW LEVEL SECURITY;

-- Drop any existing policy before creating (idempotent pattern from migration 0015)
DROP POLICY IF EXISTS bms_documents_tenant_isolation ON bms_documents;

CREATE POLICY bms_documents_tenant_isolation ON bms_documents
  AS PERMISSIVE
  FOR ALL
  TO studio_app
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::integer
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::integer
  );

-- ── Revoke hard delete from studio_app (soft-archive only via status column) ──
-- Consistent with limsy_orders pattern: immutable legal/commercial documents
-- should not be hard-deleted by the application role.
REVOKE DELETE ON bms_documents FROM studio_app;

-- ── Verification queries (run after migration) ────────────────────────────────
--
-- 1. Confirm table exists:
--    SELECT COUNT(*) FROM information_schema.tables
--    WHERE table_name = 'bms_documents';
--
-- 2. Confirm RLS is active:
--    SELECT relrowsecurity, relforcerowsecurity
--    FROM pg_class WHERE relname = 'bms_documents';
--
-- 3. Confirm policy:
--    SELECT policyname, cmd, roles, qual
--    FROM pg_policies WHERE tablename = 'bms_documents';
--
-- 4. Confirm enums:
--    SELECT enumlabel FROM pg_enum
--    WHERE enumtypid = 'bms_document_type'::regtype
--    ORDER BY enumsortorder;
