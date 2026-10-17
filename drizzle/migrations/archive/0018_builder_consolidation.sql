-- =============================================================================
-- Migration 0018: Full-Stack Visual Builder IDE — Consolidation
-- File: drizzle/migrations/0018_builder_consolidation.sql
-- Executed via: npm run db:migrate (DATABASE_URL_UNPOOLED — ADR-002)
-- Source: full-stack-visual-builder-ide.zip → merged into saas-studio
-- =============================================================================
--
-- CONSOLIDATION STRATEGY:
--
--   The builder IDE is a standalone prototype (hasRBAC=false, hasRLS=false,
--   brand-based separation only — acknowledged as PND-001 / "Not met" in its
--   own release runbook). This migration imports all NEW builder tables into
--   the BNLV primary architecture with the following mandatory hardening:
--
--   1.  tenant_id INTEGER NOT NULL added to EVERY table (builder had none).
--       brand TEXT is preserved as a display/filtering convenience column.
--
--   2.  RLS enabled on all tables — FORCE ROW LEVEL SECURITY + permissive
--       policy using ::integer cast (consistent with all prior migrations).
--
--   3.  Table prefix convention:
--         builder_*     Visual builder, block library, marketplace, release
--         bms_*         Pendencies, release evidence (BMS-scoped governance)
--         nidhivan_*    Financial entities, accounts, journals, research, lab,
--                       period-close management, financial co-counsel
--         limsy_*       Legal parties, documents, authorities, argumentation
--                       frameworks, trial room state, AI co-counsel sessions
--
--   4.  Financial precision (ADR-004):
--         fin_entities.aum / revenue       → bigint in paise (_paise suffix)
--         fin_lab.spend                     → bigint in paise
--         legal_matters.claim_value         → bigint in paise
--         fin_journals.lines JSONB amounts  → must be paise at application layer
--         (Documented in column comments — application enforces precision.)
--
--   5.  Tables already in BNLV (no conflict — builder versions EXCLUDED):
--         users, sessions, agents (bms_ai_agents), workflows (bms_workflows),
--         tasks (bms_assignments + bms_code_red_cases), deployments,
--         activity (audit_logs), limsy_cases (extends legal_matters).
--
--   6.  limsy_parties/documents/authorities reference limsy_cases.id as FK,
--       NOT a separate legalMatters table.
--
-- TABLES ADDED (17 total):
--   builder_pages, builder_blocks, bms_pendencies, bms_release_evidence,
--   nidhivan_entities, nidhivan_accounts, nidhivan_journals, nidhivan_research,
--   nidhivan_lab, nidhivan_counsel, nidhivan_closes,
--   limsy_parties, limsy_documents, limsy_authorities,
--   limsy_frameworks, limsy_trials, limsy_counsel_sessions
-- =============================================================================

-- ── RLS policy macro (reused per table) ─────────────────────────────────────
-- Pattern: tenant_id = current_setting('app.current_tenant_id', TRUE)::integer
-- Consistent with ADR-001; uses SET LOCAL from withTenant() wrapper.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION A: BUILDER / STUDIO
-- ─────────────────────────────────────────────────────────────────────────────

-- A1. builder_pages — Visual page composer compositions
-- Source: builder/pages (pages.blocks JSONB + theme + artifactKind)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_pages (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id     INTEGER REFERENCES bms_studio_projects(id) ON DELETE SET NULL,
  parent_id      INTEGER, -- self-referential; FK added after table creation
  name           TEXT NOT NULL,
  path           TEXT NOT NULL DEFAULT '/',
  status         TEXT NOT NULL DEFAULT 'draft',  -- draft | review | published
  blocks         JSONB NOT NULL DEFAULT '[]',    -- Block[] composition
  theme          TEXT NOT NULL DEFAULT 'aurora', -- theme key from studio.ts
  artifact_kind  TEXT NOT NULL DEFAULT 'website',-- website | document | dashboard | productivity | creative | survey | scratch
  sort_index     INTEGER NOT NULL DEFAULT 0,
  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE builder_pages
  ADD CONSTRAINT builder_pages_parent_fk
  FOREIGN KEY (parent_id) REFERENCES builder_pages(id) ON DELETE SET NULL;

ALTER TABLE builder_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_pages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS builder_pages_tenant_isolation ON builder_pages;
CREATE POLICY builder_pages_tenant_isolation ON builder_pages
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS builder_pages_tenant_idx ON builder_pages (tenant_id);
CREATE INDEX IF NOT EXISTS builder_pages_project_idx ON builder_pages (tenant_id, project_id);

-- A2. builder_blocks — Block design system / component library
-- Source: builder/blocks_library
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_blocks (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Section',
  brand       TEXT NOT NULL DEFAULT 'Shared',   -- 'Shared' | subsidiary name
  description TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL DEFAULT 'hero',     -- hero | stats | features | testimonial | cta | image | form | code | divider | heading | text | button | embed | gallery | pricing | faq
  tags        TEXT NOT NULL DEFAULT '',
  usage       INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'stable',   -- draft | beta | stable | deprecated
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE builder_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_blocks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS builder_blocks_tenant_isolation ON builder_blocks;
CREATE POLICY builder_blocks_tenant_isolation ON builder_blocks
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS builder_blocks_tenant_idx ON builder_blocks (tenant_id);

-- A3. bms_pendencies — Tech debt and risk tracker
-- Source: builder/pendencies (PND-001 system used in Super Admin)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bms_pendencies (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  detail            TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'security', -- security | platform | compliance | ux | data | ops
  severity          TEXT NOT NULL DEFAULT 'medium',   -- low | medium | high | critical
  status            TEXT NOT NULL DEFAULT 'open',     -- open | in_review | accepted_risk | resolved
  owner             TEXT NOT NULL DEFAULT '',
  environment       TEXT NOT NULL DEFAULT 'development',
  remediation       TEXT NOT NULL DEFAULT '',
  target_release    TEXT NOT NULL DEFAULT '',
  blocks_production BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_pendencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_pendencies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_pendencies_tenant_isolation ON bms_pendencies;
CREATE POLICY bms_pendencies_tenant_isolation ON bms_pendencies
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_pendencies_tenant_idx ON bms_pendencies (tenant_id);
CREATE INDEX IF NOT EXISTS bms_pendencies_severity_idx ON bms_pendencies (tenant_id, severity, status);

-- A4. bms_release_evidence — Release QA and go/no-go snapshots
-- Source: builder/release_evidence
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bms_release_evidence (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  version     TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'evaluation',  -- evaluation | staging | production
  decision    TEXT NOT NULL DEFAULT 'blocked',     -- approved | conditional | blocked
  actor       TEXT NOT NULL,
  notes       TEXT NOT NULL DEFAULT '',
  passed      INTEGER NOT NULL DEFAULT 0,
  warnings    INTEGER NOT NULL DEFAULT 0,
  failures    INTEGER NOT NULL DEFAULT 0,
  blockers    INTEGER NOT NULL DEFAULT 0,
  snapshot    JSONB NOT NULL DEFAULT '{}',         -- full QA snapshot at release time
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_release_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_release_evidence FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_release_evidence_tenant_isolation ON bms_release_evidence;
CREATE POLICY bms_release_evidence_tenant_isolation ON bms_release_evidence
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
-- Hard delete revoked — release evidence is an immutable audit record
REVOKE DELETE ON bms_release_evidence FROM studio_app;
CREATE INDEX IF NOT EXISTS bms_release_evidence_tenant_idx ON bms_release_evidence (tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION B: NIDHIVAN FINANCIAL INTELLIGENCE
-- ─────────────────────────────────────────────────────────────────────────────

-- B1. nidhivan_entities — Financial entities under advisory/audit
-- Source: builder/fin_entities
-- ADR-004: aum_paise + revenue_paise replace integer aum/revenue
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_entities (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  ticker       TEXT NOT NULL DEFAULT '',
  sector       TEXT NOT NULL DEFAULT 'Financials',
  country      TEXT NOT NULL DEFAULT 'India',
  status       TEXT NOT NULL DEFAULT 'active',    -- prospect | active | monitor | exited
  relationship TEXT NOT NULL DEFAULT 'advisory',  -- advisory | audit | treasury | research | rd
  fy_end       TEXT NOT NULL DEFAULT '31 March',
  currency     TEXT NOT NULL DEFAULT 'INR',
  -- ADR-004: bigint in paise — application divides by 100 for display
  aum_paise     BIGINT NOT NULL DEFAULT 0,
  revenue_paise BIGINT NOT NULL DEFAULT 0,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE nidhivan_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_entities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_entities_tenant_isolation ON nidhivan_entities;
CREATE POLICY nidhivan_entities_tenant_isolation ON nidhivan_entities
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS nidhivan_entities_tenant_idx ON nidhivan_entities (tenant_id);

-- B2. nidhivan_accounts — Chart of accounts per entity
-- Source: builder/fin_accounts (no financial amounts — type definitions)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_accounts (
  id        SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_id INTEGER NOT NULL REFERENCES nidhivan_entities(id) ON DELETE CASCADE,
  code      TEXT NOT NULL,
  name      TEXT NOT NULL,
  type      TEXT NOT NULL DEFAULT 'asset',     -- asset | liability | equity | income | expense
  subtype   TEXT NOT NULL DEFAULT '',
  currency  TEXT NOT NULL DEFAULT 'INR',
  active    BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE nidhivan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_accounts_tenant_isolation ON nidhivan_accounts;
CREATE POLICY nidhivan_accounts_tenant_isolation ON nidhivan_accounts
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS nidhivan_accounts_tenant_idx ON nidhivan_accounts (tenant_id);

-- B3. nidhivan_journals — General ledger (double-entry)
-- Source: builder/fin_journals
-- ADR-004: lines JSONB must contain debit/credit in paise at application layer
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_journals (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_id   INTEGER NOT NULL REFERENCES nidhivan_entities(id) ON DELETE CASCADE,
  ref         TEXT NOT NULL,
  date        TEXT NOT NULL DEFAULT '',
  memo        TEXT NOT NULL DEFAULT '',
  source      TEXT NOT NULL DEFAULT 'manual',  -- manual | bank | payroll | stripe | close
  status      TEXT NOT NULL DEFAULT 'draft',   -- draft | posted | reversed
  -- lines: Array<{ accountId: number; debit: number; credit: number; memo: string }>
  -- debit/credit MUST be in paise (ADR-004) — enforced at application layer
  lines       JSONB NOT NULL DEFAULT '[]',
  reversal_of INTEGER UNIQUE REFERENCES nidhivan_journals(id) ON DELETE SET NULL,
  created_by  TEXT NOT NULL DEFAULT 'studio',
  posted_by   TEXT NOT NULL DEFAULT '',
  posted_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT nidhivan_journals_entity_ref_uniq UNIQUE (tenant_id, entity_id, ref)
);

ALTER TABLE nidhivan_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_journals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_journals_tenant_isolation ON nidhivan_journals;
CREATE POLICY nidhivan_journals_tenant_isolation ON nidhivan_journals
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
-- Hard delete revoked — journal entries are immutable financial records
REVOKE DELETE ON nidhivan_journals FROM studio_app;
CREATE INDEX IF NOT EXISTS nidhivan_journals_tenant_idx ON nidhivan_journals (tenant_id, entity_id);
CREATE INDEX IF NOT EXISTS nidhivan_journals_status_idx ON nidhivan_journals (tenant_id, status);

-- B4. nidhivan_research — Equity, credit, and fintech research
-- Source: builder/fin_research
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_research (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  title        TEXT NOT NULL,
  desk         TEXT NOT NULL DEFAULT 'equity',  -- equity | credit | macro | quant | policy | fintech
  entity_id    INTEGER REFERENCES nidhivan_entities(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'draft',   -- draft | review | published | archived
  thesis       TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '',
  rating       TEXT NOT NULL DEFAULT 'hold',    -- buy | hold | sell | overweight | underweight
  author       TEXT NOT NULL DEFAULT 'Nidhivan Desk',
  published_on TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE nidhivan_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_research FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_research_tenant_isolation ON nidhivan_research;
CREATE POLICY nidhivan_research_tenant_isolation ON nidhivan_research
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS nidhivan_research_tenant_idx ON nidhivan_research (tenant_id, desk);

-- B5. nidhivan_lab — Fintech R&D sandbox pipeline
-- Source: builder/fin_lab
-- ADR-004: spend_paise replaces integer spend
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_lab (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  stage        TEXT NOT NULL DEFAULT 'ideation', -- ideation | prototype | sandbox | pilot | production | retired
  domain       TEXT NOT NULL DEFAULT 'payments', -- payments | ledger | risk | kyc | treasury | market-data | close
  hypothesis   TEXT NOT NULL DEFAULT '',
  outcome      TEXT NOT NULL DEFAULT '',
  owner        TEXT NOT NULL DEFAULT '',
  spend_paise  BIGINT NOT NULL DEFAULT 0,         -- ADR-004: bigint paise
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE nidhivan_lab ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_lab FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_lab_tenant_isolation ON nidhivan_lab;
CREATE POLICY nidhivan_lab_tenant_isolation ON nidhivan_lab
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS nidhivan_lab_tenant_idx ON nidhivan_lab (tenant_id, stage);

-- B6. nidhivan_counsel — AI Financial Co-Counsel sessions (Nidhivan desk)
-- Source: builder/fin_counsel
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_counsel (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_id  INTEGER REFERENCES nidhivan_entities(id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'Financial Co-Counsel',
  messages   JSONB NOT NULL DEFAULT '[]',   -- Array<{role, content, timestamp}>
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE nidhivan_counsel ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_counsel FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_counsel_tenant_isolation ON nidhivan_counsel;
CREATE POLICY nidhivan_counsel_tenant_isolation ON nidhivan_counsel
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS nidhivan_counsel_tenant_idx ON nidhivan_counsel (tenant_id);

-- B7. nidhivan_closes — Period-end close management
-- Source: builder/fin_closes
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nidhivan_closes (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_id  INTEGER NOT NULL REFERENCES nidhivan_entities(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,                   -- e.g. '2026-Q2', '2026-03'
  status     TEXT NOT NULL DEFAULT 'open',    -- open | in_review | locked
  checklist  JSONB NOT NULL DEFAULT '[]',     -- Array<{task, done, owner}>
  owner      TEXT NOT NULL DEFAULT '',
  notes      TEXT NOT NULL DEFAULT '',
  locked_by  TEXT NOT NULL DEFAULT '',
  locked_at  TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT nidhivan_closes_entity_period_uniq UNIQUE (tenant_id, entity_id, period)
);

ALTER TABLE nidhivan_closes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_closes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nidhivan_closes_tenant_isolation ON nidhivan_closes;
CREATE POLICY nidhivan_closes_tenant_isolation ON nidhivan_closes
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS nidhivan_closes_tenant_idx ON nidhivan_closes (tenant_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION C: LIMSY LEGAL INTELLIGENCE (Extended)
-- ─────────────────────────────────────────────────────────────────────────────

-- C1. limsy_parties — Parties per case (extends limsy_cases)
-- Source: builder/legal_parties
-- FK: case_id → limsy_cases(id) (NOT a separate legal_matters table)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS limsy_parties (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id     INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'claimant', -- claimant | respondent | intervenor | amicus | witness | expert | bench
  name        TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT '',
  counsel     TEXT NOT NULL DEFAULT '',
  standing    TEXT NOT NULL DEFAULT ''
);

ALTER TABLE limsy_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_parties FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_parties_tenant_isolation ON limsy_parties;
CREATE POLICY limsy_parties_tenant_isolation ON limsy_parties
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_parties_tenant_idx ON limsy_parties (tenant_id, case_id);

-- C2. limsy_documents — Pleadings, affidavits, exhibits per case
-- Source: builder/legal_documents
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS limsy_documents (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id    INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'pleading', -- pleading | affidavit | exhibit | order | brief | research | transcript | treaty
  title      TEXT NOT NULL,
  citation   TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'draft',    -- draft | filed | admitted | rejected | sealed
  body       TEXT NOT NULL DEFAULT '',
  filed_on   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE limsy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_documents_tenant_isolation ON limsy_documents;
CREATE POLICY limsy_documents_tenant_isolation ON limsy_documents
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
-- Sealed legal documents cannot be hard-deleted
REVOKE DELETE ON limsy_documents FROM studio_app;
CREATE INDEX IF NOT EXISTS limsy_documents_tenant_idx ON limsy_documents (tenant_id, case_id);

-- C3. limsy_authorities — Case law, statutes, treaties cited
-- Source: builder/legal_authorities
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS limsy_authorities (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id    INTEGER REFERENCES limsy_cases(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'case',  -- case | statute | treaty | restatement | article
  citation   TEXT NOT NULL,
  court      TEXT NOT NULL DEFAULT '',
  year       TEXT NOT NULL DEFAULT '',
  holding    TEXT NOT NULL DEFAULT '',
  pin_cite   TEXT NOT NULL DEFAULT '',
  relevance  TEXT NOT NULL DEFAULT ''
);

ALTER TABLE limsy_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_authorities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_authorities_tenant_isolation ON limsy_authorities;
CREATE POLICY limsy_authorities_tenant_isolation ON limsy_authorities
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_authorities_tenant_idx ON limsy_authorities (tenant_id, case_id);

-- C4. limsy_frameworks — IRAC/CREAC reasoning argumentation maps
-- Source: builder/legal_frameworks
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS limsy_frameworks (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id     INTEGER REFERENCES limsy_cases(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  method      TEXT NOT NULL DEFAULT 'IRAC',  -- IRAC | CREAC | syllogism | proportionality | policy
  description TEXT NOT NULL DEFAULT '',
  nodes       JSONB NOT NULL DEFAULT '[]',   -- WfNode-style: {id, kind, label, x, y, config}
  edges       JSONB NOT NULL DEFAULT '[]',   -- WfEdge-style: {id, from, to, label}
  status      TEXT NOT NULL DEFAULT 'draft',
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE limsy_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_frameworks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_frameworks_tenant_isolation ON limsy_frameworks;
CREATE POLICY limsy_frameworks_tenant_isolation ON limsy_frameworks
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_frameworks_tenant_idx ON limsy_frameworks (tenant_id, case_id);

-- C5. limsy_trials — Trial room state machine
-- Source: builder/legal_trials
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS limsy_trials (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id    INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  phase      TEXT NOT NULL DEFAULT 'pretrial', -- pretrial | opening | evidence | cross | closing | verdict
  in_session BOOLEAN NOT NULL DEFAULT FALSE,
  bench      TEXT NOT NULL DEFAULT '',
  -- transcript: Array<{seat, speaker, text, at: ISO timestamp}>
  transcript JSONB NOT NULL DEFAULT '[]',
  -- exhibits: Array<{id, title, admitted, kind}>
  exhibits   JSONB NOT NULL DEFAULT '[]',
  -- roster: Array<{seat, name, counsel, role}>
  roster     JSONB NOT NULL DEFAULT '[]',
  -- rulings: Array<{text, at, judge}>
  rulings    JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT limsy_trials_case_uniq UNIQUE (tenant_id, case_id)
);

ALTER TABLE limsy_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_trials FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_trials_tenant_isolation ON limsy_trials;
CREATE POLICY limsy_trials_tenant_isolation ON limsy_trials
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
-- Trial records are immutable judicial records — no hard delete
REVOKE DELETE ON limsy_trials FROM studio_app;
CREATE INDEX IF NOT EXISTS limsy_trials_tenant_idx ON limsy_trials (tenant_id, case_id);

-- C6. limsy_counsel_sessions — AI Legal Co-Counsel (Claude Sonnet 5)
-- Source: builder/legal_counsel
-- DATA SOVEREIGNTY: DPDP Act 2023 — Anthropic-only routing enforced at API layer
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS limsy_counsel_sessions (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id    INTEGER REFERENCES limsy_cases(id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'Co-Counsel Session',
  -- messages: Array<{role: 'user'|'assistant', content: string, at: ISO}>
  messages   JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE limsy_counsel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_counsel_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_counsel_sessions_tenant_isolation ON limsy_counsel_sessions;
CREATE POLICY limsy_counsel_sessions_tenant_isolation ON limsy_counsel_sessions
  AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
-- Co-counsel sessions are privileged legal communications — no hard delete
REVOKE DELETE ON limsy_counsel_sessions FROM studio_app;
CREATE INDEX IF NOT EXISTS limsy_counsel_sessions_tenant_idx ON limsy_counsel_sessions (tenant_id, case_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ─────────────────────────────────────────────────────────────────────────────
--
-- After migration, run:
--
-- 1. All 17 tables exist:
--    SELECT tablename FROM pg_tables
--    WHERE tablename IN (
--      'builder_pages','builder_blocks','bms_pendencies','bms_release_evidence',
--      'nidhivan_entities','nidhivan_accounts','nidhivan_journals','nidhivan_research',
--      'nidhivan_lab','nidhivan_counsel','nidhivan_closes',
--      'limsy_parties','limsy_documents','limsy_authorities',
--      'limsy_frameworks','limsy_trials','limsy_counsel_sessions'
--    ) ORDER BY tablename;
--    -- Expected: 17 rows
--
-- 2. RLS active on all 17:
--    SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class
--    WHERE relname IN (...above...) ORDER BY relname;
--    -- Expected: t, t for all
--
-- 3. Hard-delete revoke confirmed (4 tables):
--    -- bms_release_evidence, nidhivan_journals, limsy_documents,
--    -- limsy_trials, limsy_counsel_sessions
--    SELECT grantee, privilege_type FROM information_schema.role_table_grants
--    WHERE table_name = 'nidhivan_journals' AND grantee = 'studio_app';
--    -- Expected: INSERT, SELECT, UPDATE present; DELETE absent
