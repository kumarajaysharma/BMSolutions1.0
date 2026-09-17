-- ============================================================================
-- Migration: 0003_limsy_workflow.sql
-- LIMSY Supreme Court Standard Case Workflow Tables (Production Ready)
-- ============================================================================
-- Run AFTER: 0002_enable_rls.sql
-- Apply with: psql $DATABASE_URL_UNPOOLED -f drizzle/migrations/0003_limsy_workflow.sql
-- ============================================================================

-- ── ENUMS ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE court_level AS ENUM (
    'supreme_court','high_court','district_court','tribunal',
    'consumer_forum','arbitration','nclt','nclat','ncdrc'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_case_status AS ENUM (
    'intake','diarised','admitted','pending_hearing','under_hearing',
    'reserved','disposed','withdrawn','abated','transferred'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_case_type AS ENUM (
    'slp','writ_petition','civil_appeal','criminal_appeal','review_petition',
    'curative_petition','original_suit','execution_petition',
    'consumer_complaint','arbitration_petition','ibc_petition','nclt_petition','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_hearing_status AS ENUM (
    'scheduled','listed','adjourned','part_heard','concluded','cancelled','orders_passed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_order_type AS ENUM (
    'interim_stay','interim_injunction','direction','contempt_notice',
    'final_judgment','consent_order','dismissal','remand','cost_order','modification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_bench_type AS ENUM (
    'single_judge','division_bench','full_bench','constitutional_bench','larger_bench'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLE: limsy_cases ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_cases (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL,
  case_number         VARCHAR(120),
  internal_ref        VARCHAR(80) NOT NULL,
  court_level         court_level NOT NULL,
  court_name          VARCHAR(200) NOT NULL,
  court_location      VARCHAR(200),
  case_type           limsy_case_type NOT NULL,
  status              limsy_case_status NOT NULL DEFAULT 'intake',
  petitioner          VARCHAR(500) NOT NULL,
  respondent          VARCHAR(500) NOT NULL,
  petitioner_adv      VARCHAR(300),
  respondent_adv      VARCHAR(300),
  filing_date         TIMESTAMPTZ,
  admission_date      TIMESTAMPTZ,
  next_hearing_date   TIMESTAMPTZ,
  disposal_date       TIMESTAMPTZ,
  subject_matter      TEXT NOT NULL,
  relief_sought       TEXT,
  acts_sections       TEXT,
  tags                VARCHAR(500),
  urgency_flag        BOOLEAN NOT NULL DEFAULT false,
  priority_level      INTEGER NOT NULL DEFAULT 3,
  parent_case_id      INTEGER,
  related_cases       JSONB,
  document_links      JSONB,
  outcome_notes       TEXT,
  outcome_type        VARCHAR(80),
  estimated_fees      INTEGER,
  billed_amount       INTEGER,
  created_by          INTEGER NOT NULL,
  updated_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS limsy_cases_internal_ref_idx
  ON limsy_cases (tenant_id, internal_ref);
CREATE INDEX IF NOT EXISTS limsy_cases_tenant_idx       ON limsy_cases (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_cases_status_idx       ON limsy_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS limsy_cases_court_level_idx  ON limsy_cases (tenant_id, court_level);
CREATE INDEX IF NOT EXISTS limsy_cases_next_hearing_idx ON limsy_cases (tenant_id, next_hearing_date);
CREATE INDEX IF NOT EXISTS limsy_cases_urgency_idx      ON limsy_cases (tenant_id, urgency_flag);

-- ── TABLE: limsy_bench_assignments ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_bench_assignments (
  id                      SERIAL PRIMARY KEY,
  tenant_id               INTEGER NOT NULL,
  case_id                 INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  bench_type              limsy_bench_type NOT NULL,
  presiding               VARCHAR(300) NOT NULL,
  members                 JSONB,
  constituted_on          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconstituted_on        TIMESTAMPTZ,
  reconstitution_reason   TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  notes                   TEXT,
  created_by              INTEGER NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS limsy_bench_tenant_idx ON limsy_bench_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_bench_case_idx   ON limsy_bench_assignments (case_id);
CREATE INDEX IF NOT EXISTS limsy_bench_active_idx ON limsy_bench_assignments (case_id, is_active);

-- ── TABLE: limsy_hearings ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_hearings (
  id                      SERIAL PRIMARY KEY,
  tenant_id               INTEGER NOT NULL,
  case_id                 INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  hearing_number          INTEGER NOT NULL,
  scheduled_date          TIMESTAMPTZ NOT NULL,
  actual_date             TIMESTAMPTZ,
  status                  limsy_hearing_status NOT NULL DEFAULT 'scheduled',
  board_position          INTEGER,
  court_room              VARCHAR(60),
  session_type            VARCHAR(40) DEFAULT 'regular',
  adjourned_by            VARCHAR(120),
  adjournment_reason      TEXT,
  adjournment_count       INTEGER NOT NULL DEFAULT 0,
  proceedings_summary     TEXT,
  detailed_minutes        TEXT,
  appearances             JSONB,
  arguments_summary       TEXT,
  next_hearing_date       TIMESTAMPTZ,
  next_hearing_purpose    VARCHAR(200),
  document_links          JSONB,
  compliance_deadline     TIMESTAMPTZ,
  compliance_notes        TEXT,
  created_by              INTEGER NOT NULL,
  updated_by              INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, hearing_number)
);

CREATE INDEX IF NOT EXISTS limsy_hearings_tenant_idx     ON limsy_hearings (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_hearings_case_idx       ON limsy_hearings (case_id);
CREATE INDEX IF NOT EXISTS limsy_hearings_scheduled_idx  ON limsy_hearings (tenant_id, scheduled_date);
CREATE INDEX IF NOT EXISTS limsy_hearings_status_idx     ON limsy_hearings (tenant_id, status);
CREATE INDEX IF NOT EXISTS limsy_hearings_compliance_idx ON limsy_hearings (tenant_id, compliance_deadline);

-- ── TABLE: limsy_orders ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_orders (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INTEGER NOT NULL,
  case_id               INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  hearing_id            INTEGER REFERENCES limsy_hearings(id) ON DELETE SET NULL,
  order_type            limsy_order_type NOT NULL,
  order_date            TIMESTAMPTZ NOT NULL,
  order_number          VARCHAR(120),
  order_title           VARCHAR(500) NOT NULL,
  operative             TEXT NOT NULL,
  full_text             TEXT,
  translation_hindi     TEXT,
  crypto_hash           VARCHAR(255),
  has_stay              BOOLEAN NOT NULL DEFAULT false,
  stay_scope            TEXT,
  stay_expiry           TIMESTAMPTZ,
  stay_conditions       TEXT,
  compliance_required   BOOLEAN NOT NULL DEFAULT false,
  compliance_deadline   TIMESTAMPTZ,
  compliance_party      VARCHAR(300),
  compliance_status     VARCHAR(60) DEFAULT 'pending',
  compliance_notes      TEXT,
  cost_awarded          BOOLEAN NOT NULL DEFAULT false,
  cost_amount           INTEGER,
  cost_payable          VARCHAR(300),
  document_links        JSONB,
  external_link         VARCHAR(1000),
  appealed              BOOLEAN NOT NULL DEFAULT false,
  appeal_case_id        INTEGER,
  review_filed          BOOLEAN NOT NULL DEFAULT false,
  is_final              BOOLEAN NOT NULL DEFAULT false,
  reportable            BOOLEAN NOT NULL DEFAULT false,
  created_by            INTEGER NOT NULL,
  updated_by            INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS limsy_orders_tenant_idx     ON limsy_orders (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_orders_case_idx       ON limsy_orders (case_id);
CREATE INDEX IF NOT EXISTS limsy_orders_hearing_idx    ON limsy_orders (hearing_id);
CREATE INDEX IF NOT EXISTS limsy_orders_date_idx       ON limsy_orders (tenant_id, order_date);
CREATE INDEX IF NOT EXISTS limsy_orders_stay_idx       ON limsy_orders (tenant_id, has_stay);
CREATE INDEX IF NOT EXISTS limsy_orders_compliance_idx ON limsy_orders (tenant_id, compliance_deadline);
CREATE INDEX IF NOT EXISTS limsy_orders_final_idx      ON limsy_orders (case_id, is_final);
CREATE INDEX IF NOT EXISTS limsy_orders_hash_idx       ON limsy_orders (tenant_id, crypto_hash);

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE limsy_cases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_bench_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_hearings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_orders            ENABLE ROW LEVEL SECURITY;

-- Revoke default public access
REVOKE ALL ON limsy_cases            FROM PUBLIC;
REVOKE ALL ON limsy_bench_assignments FROM PUBLIC;
REVOKE ALL ON limsy_hearings          FROM PUBLIC;
REVOKE ALL ON limsy_orders            FROM PUBLIC;

-- Grant to application role (studio_app)
GRANT SELECT, INSERT, UPDATE ON limsy_cases            TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_bench_assignments TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_hearings          TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_orders            TO studio_app;
GRANT USAGE ON SEQUENCE limsy_cases_id_seq             TO studio_app;
GRANT USAGE ON SEQUENCE limsy_bench_assignments_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE limsy_hearings_id_seq          TO studio_app;
GRANT USAGE ON SEQUENCE limsy_orders_id_seq            TO studio_app;

-- studio_app may NOT delete legal records (immutability requirement)
-- Hard deletes are DBA-only. Soft-delete via status = 'withdrawn' / 'abated'.

-- ── RLS POLICIES ────────────────────────────────────────────────────────────
-- All policies reference app.current_tenant_id, set by withTenant() wrapper.

-- limsy_cases
DROP POLICY IF EXISTS "limsy_cases_tenant_isolation" ON limsy_cases;
CREATE POLICY "limsy_cases_tenant_isolation"
  ON limsy_cases
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- limsy_bench_assignments
DROP POLICY IF EXISTS "limsy_bench_tenant_isolation" ON limsy_bench_assignments;
CREATE POLICY "limsy_bench_tenant_isolation"
  ON limsy_bench_assignments
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- limsy_hearings
DROP POLICY IF EXISTS "limsy_hearings_tenant_isolation" ON limsy_hearings;
CREATE POLICY "limsy_hearings_tenant_isolation"
  ON limsy_hearings
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- limsy_orders
DROP POLICY IF EXISTS "limsy_orders_tenant_isolation" ON limsy_orders;
CREATE POLICY "limsy_orders_tenant_isolation"
  ON limsy_orders
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- studio_migrator bypass
DROP POLICY IF EXISTS "limsy_cases_migrator_bypass"            ON limsy_cases;
DROP POLICY IF EXISTS "limsy_bench_migrator_bypass"            ON limsy_bench_assignments;
DROP POLICY IF EXISTS "limsy_hearings_migrator_bypass"         ON limsy_hearings;
DROP POLICY IF EXISTS "limsy_orders_migrator_bypass"           ON limsy_orders;

CREATE POLICY "limsy_cases_migrator_bypass"
  ON limsy_cases FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "limsy_bench_migrator_bypass"
  ON limsy_bench_assignments FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "limsy_hearings_migrator_bypass"
  ON limsy_hearings FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "limsy_orders_migrator_bypass"
  ON limsy_orders FOR ALL TO studio_migrator USING (true) WITH CHECK (true);

-- ── AUDIT LOG ENTRY ──────────────────────────────────────────────────────────
INSERT INTO audit_logs (tenant_id, actor, action, target, severity, ip_address)
VALUES (
  11,
  '0',
  'schema.migration',
  '0003_limsy_workflow',
  'warn',
  '127.0.0.1'
) ON CONFLICT DO NOTHING;