-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0023: Aiyyo-Nidhi Financial Engine
-- BNLV-COUNCIL-002 Phase 2 | 2026-10-16
--
-- Q1  — Global Federated Classification & Rate Registry (7 tables)
-- Q2  — Tax Engine: Mixed GST Portfolio + RA Bills (3 tables)
-- Q3  — Maker-Checker-Approver 4-Eyes Approval Engine (3 tables)
-- Q4  — Milestone Gates + Project Advances (2 tables)
-- Q5  — ICAI CoA + Double-Entry Ledger + Tally Export (4 tables)
-- +   — ALTER TABLE on nidhivan_projects, nidhivan_boqs, nidhivan_boq_items
--
-- ⚠  ADR-001 PRE-CONDITION (Gary Sobers Red Team):
--    DATABASE_URL must be studio_app credentials (BYPASSRLS=FALSE).
--    Run tc-aiyyo-nidhi-fortress.mjs TC-AN-013 before any financial write.
--
-- Security policies:
--   ADR-004: All monetary columns BIGINT paise (₹1 = 100 paise). No DECIMAL/FLOAT.
--   ADR-006: Anthropic ONLY for all VANTAI AI routes. Gemini/GPT-4o PROHIBITED.
--   RLS:     ENABLE + FORCE on all 19 new tables. NULL-aware for registry tables.
--   REVOKE:  nidhivan_bill_approvals → no UPDATE/DELETE/TRUNCATE (immutable log)
--            nidhivan_ledger_entries → no DELETE/TRUNCATE (immutable ledger)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION A: ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE nidhivan_billing_type AS ENUM (
  'PERIODIC', 'MILESTONE', 'FINAL'
);
--> statement-breakpoint
CREATE TYPE nidhivan_ra_bill_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'UNDER_CHECK', 'CERTIFIED',
  'APPROVED_FOR_PAYMENT', 'PAID', 'REJECTED'
);
--> statement-breakpoint
CREATE TYPE nidhivan_approval_action AS ENUM (
  'SUBMITTED', 'L1_APPROVED', 'L2_APPROVED', 'L3_APPROVED',
  'L4_APPROVED', 'REJECTED', 'RECALLED'
);
--> statement-breakpoint
CREATE TYPE nidhivan_advance_type AS ENUM (
  'MOBILISATION', 'SECURED_MATERIAL'
);
--> statement-breakpoint
CREATE TYPE nidhivan_advance_status AS ENUM (
  'PENDING', 'SANCTIONED', 'DISBURSED',
  'PARTIALLY_RECOVERED', 'FULLY_RECOVERED', 'LAPSED'
);
--> statement-breakpoint
CREATE TYPE nidhivan_account_type AS ENUM (
  'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'
);
--> statement-breakpoint
CREATE TYPE nidhivan_voucher_type AS ENUM (
  'JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA',
  'DEBIT_NOTE', 'CREDIT_NOTE', 'RA_BILL_BOOKING'
);
--> statement-breakpoint
CREATE TYPE nidhivan_sync_status AS ENUM (
  'PENDING', 'EXPORTED', 'FAILED', 'ACKNOWLEDGED'
);
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION B: Q1 — CLASSIFICATION & RATE REGISTRY (7 tables)
-- tenant_id IS NULL = globally visible to all tenants (RLS NULL-aware policy)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE nidhivan_classification_systems (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  system_code        TEXT NOT NULL,
  display_name       TEXT NOT NULL,
  jurisdiction       TEXT NOT NULL DEFAULT 'GLOBAL',
  measurement_system TEXT NOT NULL DEFAULT 'METRIC',
  description        TEXT NOT NULL DEFAULT '',
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  is_global          BOOLEAN NOT NULL DEFAULT FALSE,
  version            TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_classification_codes (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  system_id   INTEGER NOT NULL REFERENCES nidhivan_classification_systems(id) ON DELETE RESTRICT,
  parent_id   INTEGER REFERENCES nidhivan_classification_codes(id) ON DELETE SET NULL,
  code_value  TEXT NOT NULL,
  full_code   TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  short_desc  TEXT NOT NULL DEFAULT '',
  unit        TEXT NOT NULL DEFAULT '',
  level       INTEGER NOT NULL DEFAULT 1,
  is_leaf     BOOLEAN NOT NULL DEFAULT TRUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_rate_authorities (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  system_id      INTEGER NOT NULL REFERENCES nidhivan_classification_systems(id) ON DELETE RESTRICT,
  authority_code TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  jurisdiction   TEXT NOT NULL DEFAULT 'IND',
  effective_from DATE NOT NULL,
  effective_to   DATE,
  description    TEXT NOT NULL DEFAULT '',
  source_url     TEXT NOT NULL DEFAULT '',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_uom_definitions (
  id                   SERIAL PRIMARY KEY,
  tenant_id            INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  uom_code             TEXT NOT NULL,
  display_name         TEXT NOT NULL,
  measurement_system   TEXT NOT NULL DEFAULT 'METRIC',
  unit_category        TEXT NOT NULL DEFAULT '',
  -- ADR-004 spirit: integer ratio — no float for conversion factors
  conversion_numerator INTEGER NOT NULL DEFAULT 10000,
  conversion_base      INTEGER NOT NULL DEFAULT 10000,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  is_global            BOOLEAN NOT NULL DEFAULT FALSE,
  notes                TEXT NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_rate_schedules (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  authority_id          INTEGER NOT NULL REFERENCES nidhivan_rate_authorities(id) ON DELETE RESTRICT,
  code_id               INTEGER NOT NULL REFERENCES nidhivan_classification_codes(id) ON DELETE RESTRICT,
  uom_id                INTEGER REFERENCES nidhivan_uom_definitions(id) ON DELETE SET NULL,
  -- ADR-004: monetary rate stored in minor units (paise/cents/pence per jurisdiction)
  rate_minor_units      BIGINT NOT NULL DEFAULT 0,
  currency_code         TEXT NOT NULL DEFAULT 'INR',
  -- Analysis percentages: real acceptable — NOT monetary values
  labour_component_pct  REAL NOT NULL DEFAULT 0,
  material_component_pct REAL NOT NULL DEFAULT 0,
  overhead_component_pct REAL NOT NULL DEFAULT 0,
  analysis_ref          TEXT NOT NULL DEFAULT '',
  valid_from            DATE NOT NULL,
  valid_to              DATE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_location_factors (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  authority_id     INTEGER REFERENCES nidhivan_rate_authorities(id) ON DELETE SET NULL,
  location_code    TEXT NOT NULL,
  location_name    TEXT NOT NULL,
  jurisdiction     TEXT NOT NULL DEFAULT 'IND',
  -- Integer ratio: e.g. Mumbai 1.18x → numerator=11800, base=10000
  factor_numerator INTEGER NOT NULL DEFAULT 10000,
  factor_base      INTEGER NOT NULL DEFAULT 10000,
  effective_from   DATE NOT NULL,
  effective_to     DATE,
  source           TEXT NOT NULL DEFAULT '',
  notes            TEXT NOT NULL DEFAULT '',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_currency_rates (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER REFERENCES tenants(id) ON DELETE RESTRICT,
  from_currency  TEXT NOT NULL,
  to_currency    TEXT NOT NULL,
  -- Integer ratio: e.g. 1 USD = 84.12 INR → numerator=8412, base=100
  rate_numerator BIGINT NOT NULL,
  rate_base      INTEGER NOT NULL DEFAULT 10000,
  rate_type      TEXT NOT NULL DEFAULT 'MONTH_CLOSE',
  rate_date      DATE NOT NULL,
  source         TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     INTEGER
);
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION C: Q2 — TAX ENGINE (3 tables)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE nidhivan_tax_profiles (
  id                          SERIAL PRIMARY KEY,
  -- Note: tenant_id NOT NULL (financial table — strict RLS, no NULL-aware)
  tenant_id                   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  profile_code                TEXT NOT NULL,
  display_name                TEXT NOT NULL,
  jurisdiction                TEXT NOT NULL DEFAULT 'IND',
  gst_rate_type               TEXT NOT NULL DEFAULT 'WORKS_18',
  -- GST rates in basis points (900 bps = 9.00%)
  cgst_rate_bps               INTEGER NOT NULL DEFAULT 900,
  sgst_rate_bps               INTEGER NOT NULL DEFAULT 900,
  igst_rate_bps               INTEGER NOT NULL DEFAULT 1800,
  -- TDS under IT Act Section 194C (basis points: 100 = 1.00%)
  it_tds_194c_rate_bps        INTEGER NOT NULL DEFAULT 100,
  -- GST TDS under GST Act Section 51 (basis points: 200 = 2.00%)
  gst_tds_rate_bps            INTEGER NOT NULL DEFAULT 200,
  -- BOCW Labour Cess (basis points: 100 = 1.00%)
  labor_cess_rate_bps         INTEGER NOT NULL DEFAULT 100,
  -- ADR-004: ₹5Cr = 5,000,000,000 paise
  e_invoice_threshold_paise   BIGINT NOT NULL DEFAULT 5000000000,
  mobilisation_gst_treatment  TEXT NOT NULL DEFAULT 'IMMEDIATE',
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  notes                       TEXT NOT NULL DEFAULT '',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- nidhivan_ra_bills created WITHOUT milestone_gate_id and journal_voucher_id FKs here.
-- Those tables (nidhivan_milestone_gates, nidhivan_journal_vouchers) are circular.
-- The deferred FKs are added via ALTER TABLE after both tables exist (Section G).
CREATE TABLE nidhivan_ra_bills (
  id                       SERIAL PRIMARY KEY,
  tenant_id                INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id               INTEGER NOT NULL REFERENCES nidhivan_projects(id) ON DELETE RESTRICT,
  boq_id                   INTEGER REFERENCES nidhivan_boqs(id) ON DELETE SET NULL,
  bill_number              TEXT NOT NULL,
  billing_type             nidhivan_billing_type NOT NULL DEFAULT 'PERIODIC',
  status                   nidhivan_ra_bill_status NOT NULL DEFAULT 'DRAFT',
  bill_period_from         DATE,
  bill_period_to           DATE,
  -- milestone_gate_id FK deferred — added in Section G after nidhivan_milestone_gates created
  milestone_gate_id        INTEGER,
  -- ADR-004: all monetary columns in paise
  gross_amount_paise       BIGINT NOT NULL DEFAULT 0,
  cgst_paise               BIGINT NOT NULL DEFAULT 0,
  sgst_paise               BIGINT NOT NULL DEFAULT 0,
  igst_paise               BIGINT NOT NULL DEFAULT 0,
  it_tds_194c_paise        BIGINT NOT NULL DEFAULT 0,
  gst_tds_paise            BIGINT NOT NULL DEFAULT 0,
  labor_cess_paise         BIGINT NOT NULL DEFAULT 0,
  net_payable_paise        BIGINT NOT NULL DEFAULT 0,
  place_of_supply_state_code TEXT NOT NULL DEFAULT '',
  origin_state_code        TEXT NOT NULL DEFAULT '',
  -- VANTAI VT-N-002: TDS 194C human gate — must be TRUE before RA Bill dispatch
  vt_n002_gate_passed      BOOLEAN NOT NULL DEFAULT FALSE,
  vt_n002_passed_at        TIMESTAMPTZ,
  vt_n002_passed_by        INTEGER,
  -- VANTAI VT-N-003: GST e-invoice IRN from NIC IRP
  e_invoice_irn            TEXT NOT NULL DEFAULT '',
  e_invoice_ack_no         TEXT NOT NULL DEFAULT '',
  e_invoice_ack_at         TIMESTAMPTZ,
  paid_at                  TIMESTAMPTZ,
  payment_ref              TEXT NOT NULL DEFAULT '',
  content_hash             TEXT NOT NULL DEFAULT '',
  notes                    TEXT NOT NULL DEFAULT '',
  -- journal_voucher_id FK deferred — added in Section G after nidhivan_journal_vouchers created
  journal_voucher_id       INTEGER,
  created_by               INTEGER,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- nidhivan_ra_bill_deductions: advance_id FK deferred (added in Section G)
CREATE TABLE nidhivan_ra_bill_deductions (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  ra_bill_id     INTEGER NOT NULL REFERENCES nidhivan_ra_bills(id) ON DELETE CASCADE,
  deduction_type TEXT NOT NULL,
  description    TEXT NOT NULL,
  -- ADR-004: paise
  amount_paise   BIGINT NOT NULL DEFAULT 0,
  -- advance_id FK deferred — added in Section G after nidhivan_project_advances created
  advance_id     INTEGER,
  notes          TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION D: Q3 — APPROVAL ENGINE (3 tables)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE nidhivan_delegation_tiers (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  tier_level      INTEGER NOT NULL,
  tier_name       TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  -- ADR-004: paise ceiling
  max_amount_paise BIGINT NOT NULL DEFAULT 0,
  role_code       TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE nidhivan_approval_threshold_rules (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id            INTEGER REFERENCES nidhivan_projects(id) ON DELETE CASCADE,
  entity_id             INTEGER REFERENCES nidhivan_entities(id) ON DELETE CASCADE,
  -- ADR-004: paise — ₹25L = 250,000,000 paise; ₹1Cr = 1,000,000,000 paise
  tier1_max_amount_paise BIGINT NOT NULL DEFAULT 250000000,
  tier2_max_amount_paise BIGINT NOT NULL DEFAULT 1000000000,
  variation_pct_for_l4  INTEGER NOT NULL DEFAULT 10,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- ⚠ IMMUTABLE TABLE: Migration grants no UPDATE/DELETE/TRUNCATE to studio_app.
-- bill_hash_at_action: SHA-256 of bill state at moment of action (tamper evidence).
-- signature: reserved for Phase 3 HSM/FIDO2 integration.
-- Strict SOD enforced at application layer: creator of ra_bill must NOT appear as approver.
CREATE TABLE nidhivan_bill_approvals (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  ra_bill_id            INTEGER NOT NULL REFERENCES nidhivan_ra_bills(id) ON DELETE RESTRICT,
  actor_user_id         INTEGER NOT NULL,
  actor_role_code       TEXT NOT NULL,
  action                nidhivan_approval_action NOT NULL,
  tier_level            INTEGER NOT NULL DEFAULT 0,
  comments              TEXT NOT NULL DEFAULT '',
  -- ADR-004: paise snapshot at action time
  amount_at_action_paise BIGINT NOT NULL DEFAULT 0,
  bill_hash_at_action   TEXT NOT NULL DEFAULT '',
  signature             TEXT NOT NULL DEFAULT '',
  signature_algo        TEXT NOT NULL DEFAULT '',
  client_ip             TEXT NOT NULL DEFAULT '',
  user_agent            TEXT NOT NULL DEFAULT '',
  acted_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: No updated_at — append-only; no UPDATE permitted
);
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION E: Q4 PART 1 — MILESTONE GATES
-- Must exist before deferred milestone_gate_id FK is added to nidhivan_ra_bills
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE nidhivan_milestone_gates (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id          INTEGER NOT NULL REFERENCES nidhivan_projects(id) ON DELETE CASCADE,
  gate_sequence       INTEGER NOT NULL DEFAULT 1,
  gate_name           TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  -- cumulative_cap_pct: integer bps (10000 = 100%)
  cumulative_cap_pct  INTEGER NOT NULL DEFAULT 0,
  -- ADR-004: paise override cap (overrides pct when non-zero)
  cumulative_cap_paise BIGINT NOT NULL DEFAULT 0,
  target_date         DATE,
  actual_date         DATE,
  is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at        TIMESTAMPTZ,
  completed_by        INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- Add deferred FK: nidhivan_ra_bills.milestone_gate_id → nidhivan_milestone_gates
ALTER TABLE nidhivan_ra_bills
  ADD CONSTRAINT fk_ra_bills_milestone_gate
  FOREIGN KEY (milestone_gate_id)
  REFERENCES nidhivan_milestone_gates(id)
  ON DELETE SET NULL;
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION F: Q4 PART 2 — PROJECT ADVANCES
-- Created before journal_voucher FK can be set; disbursement_journal_id deferred.
-- advance_id FK on nidhivan_ra_bill_deductions also resolved here.
-- ─────────────────────────────────────────────────────────────────────────────

-- nidhivan_project_advances: disbursement_journal_id FK deferred (added in Section G)
CREATE TABLE nidhivan_project_advances (
  id                        SERIAL PRIMARY KEY,
  tenant_id                 INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id                INTEGER NOT NULL REFERENCES nidhivan_projects(id) ON DELETE RESTRICT,
  advance_type              nidhivan_advance_type NOT NULL,
  status                    nidhivan_advance_status NOT NULL DEFAULT 'PENDING',
  advance_number            TEXT NOT NULL,
  -- ADR-004: all monetary columns in paise
  sanctioned_amount_paise   BIGINT NOT NULL DEFAULT 0,
  disbursed_amount_paise    BIGINT NOT NULL DEFAULT 0,
  recovered_amount_paise    BIGINT NOT NULL DEFAULT 0,
  outstanding_amount_paise  BIGINT NOT NULL DEFAULT 0,
  -- CGST Act Section 13(2): output GST booked immediately on advance receipt
  cgst_on_advance_paise     BIGINT NOT NULL DEFAULT 0,
  sgst_on_advance_paise     BIGINT NOT NULL DEFAULT 0,
  igst_on_advance_paise     BIGINT NOT NULL DEFAULT 0,
  material_description      TEXT NOT NULL DEFAULT '',
  material_storage_location TEXT NOT NULL DEFAULT '',
  inspected_by              INTEGER,
  inspected_at              TIMESTAMPTZ,
  -- disbursement_journal_id FK deferred — added in Section G
  disbursement_journal_id   INTEGER,
  sanctioned_by             INTEGER,
  sanctioned_at             TIMESTAMPTZ,
  disbursed_at              TIMESTAMPTZ,
  notes                     TEXT NOT NULL DEFAULT '',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- Now resolve the nidhivan_ra_bill_deductions.advance_id FK
ALTER TABLE nidhivan_ra_bill_deductions
  ADD CONSTRAINT fk_ra_bill_deductions_advance
  FOREIGN KEY (advance_id)
  REFERENCES nidhivan_project_advances(id)
  ON DELETE SET NULL;
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION G: Q5 — LEDGER ENGINE (4 tables)
-- Chart of Accounts → Tally Export Queue → Journal Vouchers → Ledger Entries
-- Circular FK (tally_export_queue ↔ journal_vouchers) resolved via ALTER TABLE.
-- ─────────────────────────────────────────────────────────────────────────────

-- ICAI Chart of Accounts (self-referencing adjacency list)
-- is_inter_company: flags nodes for VANTAI VT-N-004 BNLV consolidation
CREATE TABLE nidhivan_chart_of_accounts (
  id                     SERIAL PRIMARY KEY,
  tenant_id              INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  parent_id              INTEGER REFERENCES nidhivan_chart_of_accounts(id) ON DELETE SET NULL,
  account_code           TEXT NOT NULL,
  account_name           TEXT NOT NULL,
  account_type           nidhivan_account_type NOT NULL,
  is_control_account     BOOLEAN NOT NULL DEFAULT FALSE,
  is_postable            BOOLEAN NOT NULL DEFAULT TRUE,
  -- VANTAI VT-N-004: inter-company receivables/payables for BNLV group consolidation
  is_inter_company       BOOLEAN NOT NULL DEFAULT FALSE,
  inter_company_entity_id INTEGER REFERENCES nidhivan_entities(id) ON DELETE SET NULL,
  tally_ledger_name      TEXT NOT NULL DEFAULT '',
  tally_group_name       TEXT NOT NULL DEFAULT '',
  -- ASSET/EXPENSE normal_balance = DR (true); LIABILITY/EQUITY/INCOME = CR (false)
  normal_balance_dr      BOOLEAN NOT NULL DEFAULT TRUE,
  level                  INTEGER NOT NULL DEFAULT 1,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  description            TEXT NOT NULL DEFAULT '',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- Tally Prime export queue: created WITHOUT voucher_id FK (circular — resolved after journal_vouchers)
-- One-way export only: Tally → DB feedback loop is prohibited.
-- payload_hash: SHA-256 of tally_xml_payload (duplicate detection before retry)
CREATE TABLE nidhivan_tally_export_queue (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  -- voucher_id FK deferred — added after nidhivan_journal_vouchers is created
  voucher_id          INTEGER,
  tally_xml_payload   TEXT NOT NULL,
  sync_status         nidhivan_sync_status NOT NULL DEFAULT 'PENDING',
  tally_company_name  TEXT NOT NULL DEFAULT '',
  tally_voucher_number TEXT NOT NULL DEFAULT '',
  attempts            INTEGER NOT NULL DEFAULT 0,
  last_attempt_at     TIMESTAMPTZ,
  last_error          TEXT NOT NULL DEFAULT '',
  exported_at         TIMESTAMPTZ,
  acknowledged_at     TIMESTAMPTZ,
  payload_hash        TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- Double-entry journal vouchers
-- SUM(total_debit_paise) = SUM(total_credit_paise): enforced at application layer
-- tally_export_id FK to nidhivan_tally_export_queue resolves one direction of circular pair
CREATE TABLE nidhivan_journal_vouchers (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id          INTEGER REFERENCES nidhivan_projects(id) ON DELETE SET NULL,
  voucher_number      TEXT NOT NULL,
  voucher_type        nidhivan_voucher_type NOT NULL DEFAULT 'JOURNAL',
  voucher_date        DATE NOT NULL,
  narration           TEXT NOT NULL DEFAULT '',
  -- ADR-004: paise
  total_debit_paise   BIGINT NOT NULL DEFAULT 0,
  total_credit_paise  BIGINT NOT NULL DEFAULT 0,
  ra_bill_id          INTEGER REFERENCES nidhivan_ra_bills(id) ON DELETE SET NULL,
  prepared_by         INTEGER NOT NULL,
  reviewed_by         INTEGER,
  approved_by         INTEGER,
  prepared_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at         TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  tally_export_id     INTEGER REFERENCES nidhivan_tally_export_queue(id) ON DELETE SET NULL,
  is_posted           BOOLEAN NOT NULL DEFAULT FALSE,
  is_reversed         BOOLEAN NOT NULL DEFAULT FALSE,
  -- Self-ref: reversal pairs point to each other
  reversal_voucher_id INTEGER REFERENCES nidhivan_journal_vouchers(id) ON DELETE SET NULL,
  fiscal_year         TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- Resolve circular FK: nidhivan_tally_export_queue.voucher_id → nidhivan_journal_vouchers
ALTER TABLE nidhivan_tally_export_queue
  ADD CONSTRAINT fk_tally_export_queue_voucher
  FOREIGN KEY (voucher_id)
  REFERENCES nidhivan_journal_vouchers(id)
  ON DELETE RESTRICT;
--> statement-breakpoint

-- Resolve deferred FK: nidhivan_ra_bills.journal_voucher_id → nidhivan_journal_vouchers
ALTER TABLE nidhivan_ra_bills
  ADD CONSTRAINT fk_ra_bills_journal_voucher
  FOREIGN KEY (journal_voucher_id)
  REFERENCES nidhivan_journal_vouchers(id)
  ON DELETE SET NULL;
--> statement-breakpoint

-- Resolve deferred FK: nidhivan_project_advances.disbursement_journal_id
ALTER TABLE nidhivan_project_advances
  ADD CONSTRAINT fk_project_advances_disbursement_journal
  FOREIGN KEY (disbursement_journal_id)
  REFERENCES nidhivan_journal_vouchers(id)
  ON DELETE SET NULL;
--> statement-breakpoint

-- IMMUTABLE double-entry ledger (append-only)
-- line_hash: SHA-256(voucher_id || account_id || debit_paise || credit_paise || entry_date)
-- fiscal_year: 'FY2026-27'; period: 'P01'–'P12'
CREATE TABLE nidhivan_ledger_entries (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  voucher_id     INTEGER NOT NULL REFERENCES nidhivan_journal_vouchers(id) ON DELETE RESTRICT,
  account_id     INTEGER NOT NULL REFERENCES nidhivan_chart_of_accounts(id) ON DELETE RESTRICT,
  -- ADR-004: exactly one of debit_paise / credit_paise > 0 (enforced at application layer)
  debit_paise    BIGINT NOT NULL DEFAULT 0,
  credit_paise   BIGINT NOT NULL DEFAULT 0,
  project_id     INTEGER REFERENCES nidhivan_projects(id) ON DELETE SET NULL,
  line_narration TEXT NOT NULL DEFAULT '',
  entry_date     DATE NOT NULL,
  fiscal_year    TEXT NOT NULL DEFAULT '',
  period         TEXT NOT NULL DEFAULT '',
  line_hash      TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: No updated_at — append-only; DELETE/TRUNCATE revoked
);
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION H: ALTER TABLE — existing Nidhivan tables
-- ─────────────────────────────────────────────────────────────────────────────

-- nidhivan_projects: +10 columns (Aiyyo-Nidhi tax/billing extension)
ALTER TABLE nidhivan_projects
  ADD COLUMN IF NOT EXISTS jurisdiction             TEXT NOT NULL DEFAULT 'IND',
  ADD COLUMN IF NOT EXISTS currency_code            TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS measurement_system       TEXT NOT NULL DEFAULT 'METRIC',
  ADD COLUMN IF NOT EXISTS tax_profile_id           INTEGER REFERENCES nidhivan_tax_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS place_of_supply_state_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origin_state_code        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS apply_it_tds_194c        BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS apply_gst_tds            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS apply_labor_cess         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS billing_adapter_type     TEXT NOT NULL DEFAULT 'PERIODIC_RA';
--> statement-breakpoint

-- nidhivan_boqs: +2 columns
ALTER TABLE nidhivan_boqs
  ADD COLUMN IF NOT EXISTS jurisdiction         TEXT NOT NULL DEFAULT 'IND',
  ADD COLUMN IF NOT EXISTS billing_adapter_type TEXT NOT NULL DEFAULT 'PERIODIC_RA';
--> statement-breakpoint

-- nidhivan_boq_items: +5 columns
ALTER TABLE nidhivan_boq_items
  ADD COLUMN IF NOT EXISTS classification_code_id INTEGER REFERENCES nidhivan_classification_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rate_authority_id       INTEGER REFERENCES nidhivan_rate_authorities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency_code           TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS location_factor_id      INTEGER REFERENCES nidhivan_location_factors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sor_year                TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION I: ROW LEVEL SECURITY
-- Q1 Registry tables: NULL-aware policy (tenant_id IS NULL = globally visible)
-- Q2–Q5 Financial tables: strict isolation policy
-- ─────────────────────────────────────────────────────────────────────────────

-- Q1: Global Registry (NULL-aware RLS)
ALTER TABLE nidhivan_classification_systems  ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_classification_systems  FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_classification_systems
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_classification_codes    ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_classification_codes    FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_classification_codes
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_rate_authorities        ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_rate_authorities        FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_rate_authorities
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_uom_definitions         ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_uom_definitions         FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_uom_definitions
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_rate_schedules          ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_rate_schedules          FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_rate_schedules
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_location_factors        ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_location_factors        FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_location_factors
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_currency_rates          ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_currency_rates          FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_currency_rates
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

-- Q2–Q5: Financial tables (strict RLS — no NULL-aware)
ALTER TABLE nidhivan_tax_profiles            ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_tax_profiles            FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_tax_profiles
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_ra_bills                ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_ra_bills                FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_ra_bills
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_ra_bill_deductions      ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_ra_bill_deductions      FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_ra_bill_deductions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_delegation_tiers        ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_delegation_tiers        FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_delegation_tiers
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_approval_threshold_rules ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_approval_threshold_rules FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_approval_threshold_rules
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_bill_approvals          ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_bill_approvals          FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_bill_approvals
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_milestone_gates         ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_milestone_gates         FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_milestone_gates
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_project_advances        ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_project_advances        FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_project_advances
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_chart_of_accounts       ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_chart_of_accounts       FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_chart_of_accounts
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_tally_export_queue      ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_tally_export_queue      FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_tally_export_queue
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_journal_vouchers        ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_journal_vouchers        FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_journal_vouchers
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

ALTER TABLE nidhivan_ledger_entries          ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE nidhivan_ledger_entries          FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON nidhivan_ledger_entries
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION J: IMMUTABILITY — REVOKE GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

-- nidhivan_bill_approvals: append-only audit log; no modifications ever
REVOKE UPDATE   ON nidhivan_bill_approvals FROM studio_app;
--> statement-breakpoint
REVOKE DELETE   ON nidhivan_bill_approvals FROM studio_app;
--> statement-breakpoint
REVOKE TRUNCATE ON nidhivan_bill_approvals FROM studio_app;
--> statement-breakpoint

-- nidhivan_ledger_entries: immutable double-entry ledger; corrections via reversal vouchers only
REVOKE DELETE   ON nidhivan_ledger_entries FROM studio_app;
--> statement-breakpoint
REVOKE TRUNCATE ON nidhivan_ledger_entries FROM studio_app;
--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION K: INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Classification registry lookup paths
CREATE INDEX idx_nidhivan_class_systems_tenant       ON nidhivan_classification_systems(tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_class_systems_code         ON nidhivan_classification_systems(system_code);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_class_codes_system         ON nidhivan_classification_codes(system_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_class_codes_parent         ON nidhivan_classification_codes(parent_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_class_codes_tenant         ON nidhivan_classification_codes(tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_class_codes_full_code      ON nidhivan_classification_codes(full_code);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_rate_auth_tenant           ON nidhivan_rate_authorities(tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_rate_auth_system           ON nidhivan_rate_authorities(system_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_rate_schedules_authority   ON nidhivan_rate_schedules(authority_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_rate_schedules_code        ON nidhivan_rate_schedules(code_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_rate_schedules_tenant      ON nidhivan_rate_schedules(tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_location_factors_tenant    ON nidhivan_location_factors(tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_location_factors_code      ON nidhivan_location_factors(location_code);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_currency_rates_pair        ON nidhivan_currency_rates(from_currency, to_currency, rate_date);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_currency_rates_tenant      ON nidhivan_currency_rates(tenant_id);
--> statement-breakpoint

-- Tax engine
CREATE INDEX idx_nidhivan_tax_profiles_tenant        ON nidhivan_tax_profiles(tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ra_bills_tenant_project    ON nidhivan_ra_bills(tenant_id, project_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ra_bills_status            ON nidhivan_ra_bills(status);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ra_bills_vt_n002           ON nidhivan_ra_bills(vt_n002_gate_passed) WHERE vt_n002_gate_passed = FALSE;
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ra_bill_deductions_bill    ON nidhivan_ra_bill_deductions(ra_bill_id);
--> statement-breakpoint

-- Approval engine
CREATE INDEX idx_nidhivan_delegation_tiers_tenant    ON nidhivan_delegation_tiers(tenant_id, tier_level);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_bill_approvals_bill        ON nidhivan_bill_approvals(ra_bill_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_bill_approvals_actor       ON nidhivan_bill_approvals(actor_user_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_bill_approvals_tenant      ON nidhivan_bill_approvals(tenant_id, acted_at);
--> statement-breakpoint

-- Milestone gates & advances
CREATE INDEX idx_nidhivan_milestone_gates_project    ON nidhivan_milestone_gates(project_id, gate_sequence);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_project_advances_project   ON nidhivan_project_advances(project_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_project_advances_status    ON nidhivan_project_advances(status);
--> statement-breakpoint

-- Ledger engine
CREATE INDEX idx_nidhivan_coa_tenant_parent          ON nidhivan_chart_of_accounts(tenant_id, parent_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_coa_account_code           ON nidhivan_chart_of_accounts(tenant_id, account_code);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_tally_queue_status         ON nidhivan_tally_export_queue(sync_status, tenant_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_tally_queue_payload_hash   ON nidhivan_tally_export_queue(payload_hash);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_journal_vouchers_tenant    ON nidhivan_journal_vouchers(tenant_id, voucher_date);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_journal_vouchers_type      ON nidhivan_journal_vouchers(voucher_type);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_journal_vouchers_fiscal    ON nidhivan_journal_vouchers(fiscal_year, period);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ledger_entries_voucher     ON nidhivan_ledger_entries(voucher_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ledger_entries_account     ON nidhivan_ledger_entries(account_id);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ledger_entries_tenant_fy   ON nidhivan_ledger_entries(tenant_id, fiscal_year, period);
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ledger_entries_project     ON nidhivan_ledger_entries(project_id) WHERE project_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX idx_nidhivan_ledger_entries_line_hash   ON nidhivan_ledger_entries(line_hash);
--> statement-breakpoint
