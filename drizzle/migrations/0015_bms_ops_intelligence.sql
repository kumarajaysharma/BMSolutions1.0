-- ============================================================
-- Migration: 0015_bms_ops_intelligence.sql  (FIXED v2)
-- Bug fixed: CREATE POLICY IF NOT EXISTS is invalid PostgreSQL.
--            Replaced with DROP POLICY IF EXISTS + CREATE POLICY.
-- Execute:   DATABASE_URL_UNPOOLED only (ADR-002)
-- ============================================================

-- ── 1. bms_code_red_cases ───────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_code_red_cases (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code           TEXT NOT NULL,
  title          TEXT NOT NULL,
  vertical       TEXT NOT NULL,
  business_unit  TEXT NOT NULL DEFAULT 'BMSolutions',
  problem        TEXT NOT NULL,
  solution       TEXT NOT NULL,
  agents         JSONB NOT NULL DEFAULT '[]',
  impact         TEXT NOT NULL,
  metric         TEXT NOT NULL DEFAULT '',
  roi_multiple   NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  payback_months INTEGER NOT NULL DEFAULT 9,
  complexity     TEXT NOT NULL DEFAULT 'Medium',
  effort_weeks   INTEGER NOT NULL DEFAULT 10,
  priority       TEXT NOT NULL DEFAULT 'P1',
  status         TEXT NOT NULL DEFAULT 'proposed',
  architecture   TEXT NOT NULL DEFAULT 'hub-spoke',
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, code)
);

ALTER TABLE bms_code_red_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_code_red_cases FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_code_red_cases_tenant_isolation ON bms_code_red_cases;
CREATE POLICY bms_code_red_cases_tenant_isolation ON bms_code_red_cases
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 2. bms_assignments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_assignments (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  title        TEXT NOT NULL,
  course       TEXT NOT NULL,
  vertical     TEXT NOT NULL DEFAULT 'Agentic AI',
  description  TEXT NOT NULL,
  prompt       TEXT NOT NULL,
  deliverables JSONB NOT NULL DEFAULT '[]',
  rubric       TEXT,
  max_score    INTEGER NOT NULL DEFAULT 100,
  due_in_days  INTEGER NOT NULL DEFAULT 7,
  status       TEXT NOT NULL DEFAULT 'open',
  score        NUMERIC(6,2),
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, code)
);

ALTER TABLE bms_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_assignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_assignments_tenant_isolation ON bms_assignments;
CREATE POLICY bms_assignments_tenant_isolation ON bms_assignments
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 3. bms_documents ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_documents (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'Playbook',
  description  TEXT NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  version      TEXT NOT NULL DEFAULT 'v1.0',
  owner        TEXT NOT NULL DEFAULT 'BNLV R&D',
  pages        INTEGER NOT NULL DEFAULT 12,
  shared_with  JSONB NOT NULL DEFAULT '[]',
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, code)
);

ALTER TABLE bms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_documents_tenant_isolation ON bms_documents;
CREATE POLICY bms_documents_tenant_isolation ON bms_documents
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 4. bms_gates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_gates (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  label      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  owner      TEXT NOT NULL DEFAULT 'Super Admin',
  note       TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, key)
);

ALTER TABLE bms_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_gates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_gates_tenant_isolation ON bms_gates;
CREATE POLICY bms_gates_tenant_isolation ON bms_gates
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 5. Nidhivan RLS remediation (boqs, boq_items, metrics) ──
-- Valid pattern: DROP IF EXISTS + CREATE (no IF NOT EXISTS on CREATE POLICY)
DROP POLICY IF EXISTS nidhivan_boqs_tenant_isolation              ON nidhivan_boqs;
DROP POLICY IF EXISTS nidhivan_boq_items_tenant_isolation         ON nidhivan_boq_items;
DROP POLICY IF EXISTS nidhivan_financial_metrics_tenant_isolation ON nidhivan_financial_metrics;
DROP POLICY IF EXISTS nidhivan_projects_tenant_isolation          ON nidhivan_projects;

CREATE POLICY nidhivan_boqs_tenant_isolation ON nidhivan_boqs
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

CREATE POLICY nidhivan_boq_items_tenant_isolation ON nidhivan_boq_items
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

CREATE POLICY nidhivan_financial_metrics_tenant_isolation ON nidhivan_financial_metrics
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

CREATE POLICY nidhivan_projects_tenant_isolation ON nidhivan_projects
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);
