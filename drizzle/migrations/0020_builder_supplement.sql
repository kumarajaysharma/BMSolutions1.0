-- ============================================================
-- Migration: 0020_builder_supplement
-- Purpose: Restore 15 tables from 0018_builder_consolidation
--          that were applied via Neon console only and were
--          NOT tracked in drizzle/migrations/.
--          Required after DROP SCHEMA public CASCADE rebuild.
-- Apply: Neon console (neondb_owner) OR npx drizzle-kit migrate
--        after adding this file to drizzle/migrations/ and
--        journal entry to meta/_journal.json
-- ADR: ADR-001 (Zero Trust RLS), ADR-004 (BIGINT paise)
-- ============================================================

-- ─── BMS OPERATIONS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bms_pendencies (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL,
  title       VARCHAR(255) NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'open',
  priority    VARCHAR(20) DEFAULT 'medium',
  assigned_to INTEGER,
  due_date    TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bms_release_evidence (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  release_tag   VARCHAR(100) NOT NULL,
  evidence_type VARCHAR(50) NOT NULL,
  content       JSONB NOT NULL DEFAULT '{}',
  submitted_by  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NIDHIVAN FINANCE ────────────────────────────────────────
-- ADR-004: All monetary columns stored as BIGINT paise

CREATE TABLE IF NOT EXISTS nidhivan_entities (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL,
  name            VARCHAR(255) NOT NULL,
  entity_type     VARCHAR(50) NOT NULL,
  aum_paise       BIGINT NOT NULL DEFAULT 0,
  revenue_paise   BIGINT NOT NULL DEFAULT 0,
  status          VARCHAR(50) DEFAULT 'active',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nidhivan_accounts (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  entity_id     INTEGER REFERENCES nidhivan_entities(id),
  account_code  VARCHAR(50) NOT NULL,
  account_name  VARCHAR(255) NOT NULL,
  account_type  VARCHAR(50) NOT NULL,  -- asset|liability|equity|revenue|expense
  balance_paise BIGINT NOT NULL DEFAULT 0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable ledger: DELETE revoked from studio_app (ADR-001)
CREATE TABLE IF NOT EXISTS nidhivan_journals (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  entity_id     INTEGER REFERENCES nidhivan_entities(id),
  journal_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description   VARCHAR(500),
  debit_paise   BIGINT NOT NULL,
  credit_paise  BIGINT NOT NULL,
  account_code  VARCHAR(50),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nidhivan_research (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  entity_id     INTEGER REFERENCES nidhivan_entities(id),
  title         VARCHAR(255) NOT NULL,
  research_type VARCHAR(50),
  status        VARCHAR(50) DEFAULT 'draft',
  content       JSONB NOT NULL DEFAULT '{}',
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nidhivan_lab (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL,
  entity_id   INTEGER REFERENCES nidhivan_entities(id),
  lab_name    VARCHAR(255) NOT NULL,
  hypothesis  TEXT,
  status      VARCHAR(50) DEFAULT 'active',
  spend_paise BIGINT NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nidhivan_counsel (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL,
  entity_id      INTEGER REFERENCES nidhivan_entities(id),
  counsel_type   VARCHAR(50) NOT NULL,
  brief_summary  VARCHAR(1000),
  -- ADR-006: Anthropic-only routing for financial AI
  ai_model_used  VARCHAR(100) DEFAULT 'claude-sonnet-5',
  output         JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nidhivan_closes (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  entity_id     INTEGER REFERENCES nidhivan_entities(id),
  close_period  VARCHAR(20) NOT NULL,  -- e.g. '2026-Q1'
  status        VARCHAR(50) DEFAULT 'open',
  checklist     JSONB NOT NULL DEFAULT '{}',
  closed_by     INTEGER,
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LIMSY LEGAL ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_parties (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL,
  case_id          INTEGER,
  name             VARCHAR(255) NOT NULL,
  role             VARCHAR(50) NOT NULL,  -- petitioner|respondent|intervenor
  represented_by   VARCHAR(255),
  contact_details  JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable: DELETE revoked from studio_app (ADR-001)
CREATE TABLE IF NOT EXISTS limsy_documents (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  case_id       INTEGER,
  document_type VARCHAR(100) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  content       JSONB NOT NULL DEFAULT '{}',
  filed_by      INTEGER,
  filed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS limsy_authorities (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL,
  citation        VARCHAR(500) NOT NULL,
  authority_type  VARCHAR(50) NOT NULL,  -- case|statute|regulation
  jurisdiction    VARCHAR(100),
  summary         VARCHAR(2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS limsy_frameworks (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL,
  framework_name  VARCHAR(255) NOT NULL,
  jurisdiction    VARCHAR(100),
  version         VARCHAR(50),
  sections        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable: DELETE revoked from studio_app (ADR-001)
CREATE TABLE IF NOT EXISTS limsy_trials (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  case_id       INTEGER,
  hearing_date  TIMESTAMPTZ NOT NULL,
  court         VARCHAR(255),
  judge         VARCHAR(255),
  status        VARCHAR(50) DEFAULT 'scheduled',
  notes         JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable + DPDP Act 2023 — Anthropic-only AI (ADR-006)
-- DELETE and TRUNCATE revoked from studio_app
CREATE TABLE IF NOT EXISTS limsy_counsel_sessions (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  case_id       INTEGER,
  session_type  VARCHAR(50) NOT NULL,
  ai_model_used VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-5',
  prompt        TEXT,
  response      TEXT,
  tokens_used   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FORCE RLS ───────────────────────────────────────────────

ALTER TABLE bms_pendencies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_pendencies        FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_release_evidence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_release_evidence  FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_entities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_entities     FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_accounts     FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_journals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_journals     FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_research     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_research     FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_lab          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_lab          FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_counsel      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_counsel      FORCE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_closes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_closes       FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_parties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_parties         FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_documents       FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_authorities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_authorities     FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_frameworks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_frameworks      FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_trials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_trials          FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_counsel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_counsel_sessions FORCE ROW LEVEL SECURITY;

-- ─── RLS POLICIES (tenant isolation via app.current_tenant_id) ──

CREATE POLICY tenant_isolation ON bms_pendencies
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON bms_release_evidence
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_entities
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_accounts
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_journals
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_research
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_lab
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_counsel
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON nidhivan_closes
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON limsy_parties
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON limsy_documents
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON limsy_authorities
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON limsy_frameworks
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON limsy_trials
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

CREATE POLICY tenant_isolation ON limsy_counsel_sessions
  AS PERMISSIVE FOR ALL TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);

-- ─── IMMUTABLE TABLE REVOKES (ADR-001) ──────────────────────

-- nidhivan_journals: financial ledger — immutable
REVOKE DELETE ON nidhivan_journals FROM studio_app;
REVOKE TRUNCATE ON nidhivan_journals FROM studio_app;

-- bms_release_evidence: audit trail — immutable
REVOKE DELETE ON bms_release_evidence FROM studio_app;
REVOKE TRUNCATE ON bms_release_evidence FROM studio_app;

-- limsy_documents: court filings — immutable
REVOKE DELETE ON limsy_documents FROM studio_app;
REVOKE TRUNCATE ON limsy_documents FROM studio_app;

-- limsy_trials: court hearing records — immutable
REVOKE DELETE ON limsy_trials FROM studio_app;
REVOKE TRUNCATE ON limsy_trials FROM studio_app;

-- limsy_counsel_sessions: DPDP Act 2023 compliance — immutable
REVOKE DELETE ON limsy_counsel_sessions FROM studio_app;
REVOKE TRUNCATE ON limsy_counsel_sessions FROM studio_app;

-- ─── GRANT DML to studio_app ────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON bms_pendencies TO studio_app;
GRANT SELECT, INSERT, UPDATE ON bms_release_evidence TO studio_app;
GRANT SELECT, INSERT, UPDATE ON nidhivan_entities TO studio_app;
GRANT SELECT, INSERT, UPDATE ON nidhivan_accounts TO studio_app;
GRANT SELECT, INSERT ON nidhivan_journals TO studio_app;
GRANT SELECT, INSERT, UPDATE ON nidhivan_research TO studio_app;
GRANT SELECT, INSERT, UPDATE ON nidhivan_lab TO studio_app;
GRANT SELECT, INSERT ON nidhivan_counsel TO studio_app;
GRANT SELECT, INSERT, UPDATE ON nidhivan_closes TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_parties TO studio_app;
GRANT SELECT, INSERT ON limsy_documents TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_authorities TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_frameworks TO studio_app;
GRANT SELECT, INSERT ON limsy_trials TO studio_app;
GRANT SELECT, INSERT ON limsy_counsel_sessions TO studio_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO studio_app;

-- Verify: run after applying
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
-- Expected count: previous + 15 = (prior total + 15)
