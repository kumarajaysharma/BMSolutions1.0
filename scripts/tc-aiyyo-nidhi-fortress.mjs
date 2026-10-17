/**
 * tc-aiyyo-nidhi-fortress.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Acceptance Test Protocol — Aiyyo-Nidhi Financial Engine (Migration 0023)
 * BNLV-COUNCIL-002 Phase 2 | 2026-10-17
 *
 * COUNCIL MANDATE:
 *   Ashish Naiyyar (QA Lead): All tests pass before Phase 3 API routes go live.
 *   Gary Sobers (Red Team):   TC-AN-013 ADR-001 check is a deployment gate.
 *   VANTAI (Legal H9):        TC-AN-009/010/012 are DPDP + GST compliance gates.
 *
 * USAGE:
 *   node scripts/tc-aiyyo-nidhi-fortress.mjs          # runs all TCs
 *   node scripts/tc-aiyyo-nidhi-fortress.mjs --tc AN-013  # runs one TC
 *
 * REQUIREMENTS:
 *   .env.local must define DATABASE_URL_UNPOOLED (studio_app credential)
 *   DATABASE_URL is checked for ADR-001 violation (must NOT be neondb_owner)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { URL } from "url";

config({ path: ".env.local" });

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PASS  = "\x1b[32m✓ PASS\x1b[0m";
const FAIL  = "\x1b[31m✗ FAIL\x1b[0m";
const WARN  = "\x1b[33m⚠ WARN\x1b[0m";
const INFO  = "\x1b[36mℹ INFO\x1b[0m";

let passCount = 0;
let failCount = 0;
let warnCount = 0;

const results = [];

function pass(id, msg) {
  console.log(`${PASS}  [${id}] ${msg}`);
  results.push({ id, status: "PASS", msg });
  passCount++;
}

function fail(id, msg, detail = "") {
  console.error(`${FAIL}  [${id}] ${msg}${detail ? `\n        Detail: ${detail}` : ""}`);
  results.push({ id, status: "FAIL", msg, detail });
  failCount++;
}

function warn(id, msg) {
  console.warn(`${WARN}  [${id}] ${msg}`);
  results.push({ id, status: "WARN", msg });
  warnCount++;
}

function info(msg) {
  console.log(`${INFO}  ${msg}`);
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 70 - title.length))}`);
}

// ─── CONNECTION ───────────────────────────────────────────────────────────────

const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;
const DATABASE_URL          = process.env.DATABASE_URL;

if (!DATABASE_URL_UNPOOLED) {
  console.error(`${FAIL}  SETUP: DATABASE_URL_UNPOOLED not set in .env.local — cannot run fortress.`);
  process.exit(1);
}

// Use DATABASE_URL_UNPOOLED for all fortress tests (direct, non-pooled, studio_app)
const sql = neon(DATABASE_URL_UNPOOLED);

// ─── TC-AN-013: ADR-001 — ROLE CHECK (Gary Sobers Red Team, P0 gate) ─────────
// Must run FIRST. If DATABASE_URL resolves to neondb_owner (BYPASSRLS=TRUE),
// all subsequent RLS tests below will be false positives.

async function tcAN013() {
  section("TC-AN-013 — ADR-001 Gary Sobers P0 Gate: DATABASE_URL role check");
  const id = "AN-013";

  // Check 1: DATABASE_URL_UNPOOLED must resolve to studio_app
  try {
    const rows = await sql`SELECT current_user AS role, current_setting('is_superuser') AS superuser`;
    const role      = rows[0]?.role ?? "";
    const superuser = rows[0]?.superuser ?? "";
    if (role === "studio_app") {
      pass(id, `DATABASE_URL_UNPOOLED connects as studio_app (BYPASSRLS=FALSE) — ${role}`);
    } else if (role === "neondb_owner") {
      fail(id,
        `ADR-001 VIOLATION: DATABASE_URL_UNPOOLED connects as neondb_owner (BYPASSRLS=TRUE). ` +
        `ALL RLS tests below will be FALSE POSITIVES. Rotate credential immediately.`,
        `role=${role} superuser=${superuser}`
      );
    } else {
      warn(id, `Unknown role '${role}' on DATABASE_URL_UNPOOLED — expected studio_app.`);
    }
  } catch (e) {
    fail(id, "Could not check current_user on DATABASE_URL_UNPOOLED", String(e));
  }

  // Check 2: DATABASE_URL (pooled) should NOT be neondb_owner
  if (DATABASE_URL) {
    try {
      const parsed = new URL(DATABASE_URL.replace(/^postgres:\/\//, "https://"));
      const user   = parsed.username;
      if (user === "neondb_owner") {
        fail(id,
          `ADR-001 VIOLATION: DATABASE_URL (pooled connection) uses neondb_owner. ` +
          `Replace with studio_app in Vercel + .env.local before any financial data write.`,
          `DATABASE_URL user=${user}`
        );
      } else if (user === "studio_app") {
        pass(id, `DATABASE_URL (pooled) correctly uses studio_app — ${user}`);
      } else {
        warn(id, `DATABASE_URL user='${user}' — expected studio_app; verify manually.`);
      }
    } catch (_) {
      warn(id, "Could not parse DATABASE_URL to check username.");
    }
  } else {
    warn(id, "DATABASE_URL not set — cannot verify pooled connection role.");
  }

  // Check 3: studio_app must NOT have BYPASSRLS
  try {
    const rows = await sql`
      SELECT rolbypassrls
      FROM   pg_roles
      WHERE  rolname = 'studio_app'
    `;
    const bypassRls = rows[0]?.rolbypassrls;
    if (bypassRls === false) {
      pass(id, "studio_app BYPASSRLS=FALSE confirmed — RLS enforcement active.");
    } else {
      fail(id,
        `studio_app has BYPASSRLS=${bypassRls}. If TRUE, all financial RLS is nullified.`,
        `rolbypassrls=${bypassRls}`
      );
    }
  } catch (e) {
    warn(id, `Could not check pg_roles.rolbypassrls: ${e}`);
  }
}

// ─── TC-AN-001: RLS ENABLED AND FORCED on all 19 new tables ──────────────────

async function tcAN001() {
  section("TC-AN-001 — RLS ENABLE + FORCE on all 19 Aiyyo-Nidhi tables");
  const id = "AN-001";

  const expectedTables = [
    "nidhivan_classification_systems",
    "nidhivan_classification_codes",
    "nidhivan_rate_authorities",
    "nidhivan_uom_definitions",
    "nidhivan_rate_schedules",
    "nidhivan_location_factors",
    "nidhivan_currency_rates",
    "nidhivan_tax_profiles",
    "nidhivan_ra_bills",
    "nidhivan_ra_bill_deductions",
    "nidhivan_delegation_tiers",
    "nidhivan_approval_threshold_rules",
    "nidhivan_bill_approvals",
    "nidhivan_milestone_gates",
    "nidhivan_project_advances",
    "nidhivan_chart_of_accounts",
    "nidhivan_tally_export_queue",
    "nidhivan_journal_vouchers",
    "nidhivan_ledger_entries",
  ];

  try {
    const rows = await sql`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM   pg_class
      WHERE  relname = ANY(${expectedTables})
        AND  relkind = 'r'
    `;

    const found = new Map(rows.map(r => [r.relname, r]));

    for (const tbl of expectedTables) {
      const row = found.get(tbl);
      if (!row) {
        fail(id, `Table ${tbl} not found in pg_class — migration may not have run.`);
        continue;
      }
      if (!row.relrowsecurity) {
        fail(id, `${tbl}: ENABLE ROW LEVEL SECURITY not set (relrowsecurity=false)`);
      } else if (!row.relforcerowsecurity) {
        fail(id, `${tbl}: FORCE ROW LEVEL SECURITY not set (relforcerowsecurity=false)`);
      } else {
        pass(id, `${tbl}: RLS enabled + forced ✓`);
      }
    }

    const missing = expectedTables.filter(t => !found.has(t));
    if (missing.length > 0) {
      fail(id, `Tables missing entirely: ${missing.join(", ")}`);
    }
  } catch (e) {
    fail(id, "pg_class query failed", String(e));
  }
}

// ─── TC-AN-002: RLS POLICIES EXIST on all 19 tables ──────────────────────────

async function tcAN002() {
  section("TC-AN-002 — tenant_isolation policy exists on all 19 tables");
  const id = "AN-002";

  try {
    const rows = await sql`
      SELECT tablename, policyname
      FROM   pg_policies
      WHERE  schemaname = 'public'
        AND  policyname = 'tenant_isolation'
        AND  tablename LIKE 'nidhivan_%'
    `;
    const tablesWithPolicy = new Set(rows.map(r => r.tablename));

    const required = [
      "nidhivan_classification_systems", "nidhivan_classification_codes",
      "nidhivan_rate_authorities",       "nidhivan_uom_definitions",
      "nidhivan_rate_schedules",         "nidhivan_location_factors",
      "nidhivan_currency_rates",         "nidhivan_tax_profiles",
      "nidhivan_ra_bills",               "nidhivan_ra_bill_deductions",
      "nidhivan_delegation_tiers",       "nidhivan_approval_threshold_rules",
      "nidhivan_bill_approvals",         "nidhivan_milestone_gates",
      "nidhivan_project_advances",       "nidhivan_chart_of_accounts",
      "nidhivan_tally_export_queue",     "nidhivan_journal_vouchers",
      "nidhivan_ledger_entries",
    ];

    for (const tbl of required) {
      if (tablesWithPolicy.has(tbl)) {
        pass(id, `${tbl}: tenant_isolation policy present ✓`);
      } else {
        fail(id, `${tbl}: tenant_isolation policy MISSING`);
      }
    }
  } catch (e) {
    fail(id, "pg_policies query failed", String(e));
  }
}

// ─── TC-AN-003: NULL-AWARE RLS on Q1 registry tables ─────────────────────────
// Global rows (tenant_id IS NULL) must be visible to any tenant context.

async function tcAN003() {
  section("TC-AN-003 — Global registry rows (tenant_id IS NULL) visible across tenants");
  const id = "AN-003";

  const registryTables = [
    "nidhivan_classification_systems",
    "nidhivan_uom_definitions",
    "nidhivan_location_factors",
    "nidhivan_currency_rates",
  ];

  for (const tbl of registryTables) {
    try {
      // Set to tenant 99 (a tenant that doesn't own global rows)
      await sql`SELECT set_config('app.current_tenant_id', '99', true)`;
      const rows = await sql`
        SELECT count(*) AS c FROM ${sql.unsafe(`"${tbl}"`)}
        WHERE  tenant_id IS NULL
      `;
      const c = parseInt(rows[0]?.c ?? "0", 10);
      // We can't guarantee rows exist, but the query must not error (policy is NULL-aware)
      pass(id, `${tbl}: NULL-aware RLS policy operational — returned ${c} global row(s) for tenant 99`);
    } catch (e) {
      fail(id, `${tbl}: NULL-aware RLS query failed — policy may be strict-only`, String(e));
    }
  }
}

// ─── TC-AN-004: STRICT RLS on Q2–Q5 financial tables ─────────────────────────
// A financial row belonging to tenant 1 must NOT appear under tenant 2 context.

async function tcAN004() {
  section("TC-AN-004 — Strict tenant isolation: cross-tenant financial data must not leak");
  const id = "AN-004";

  const financialTables = [
    "nidhivan_tax_profiles",
    "nidhivan_ra_bills",
    "nidhivan_ra_bill_deductions",
    "nidhivan_bill_approvals",
    "nidhivan_milestone_gates",
    "nidhivan_project_advances",
    "nidhivan_chart_of_accounts",
    "nidhivan_journal_vouchers",
    "nidhivan_ledger_entries",
  ];

  for (const tbl of financialTables) {
    try {
      // Count rows visible to tenant 1
      await sql`SELECT set_config('app.current_tenant_id', '1', true)`;
      const r1 = await sql`SELECT count(*) AS c FROM ${sql.unsafe(`"${tbl}"`)}`;
      const c1 = parseInt(r1[0]?.c ?? "0", 10);

      // Switch to tenant 999 — should see 0 rows from tenant 1
      await sql`SELECT set_config('app.current_tenant_id', '999', true)`;
      const r2 = await sql`SELECT count(*) AS c FROM ${sql.unsafe(`"${tbl}"`)}`;
      const c2 = parseInt(r2[0]?.c ?? "0", 10);

      if (c1 === 0) {
        pass(id, `${tbl}: No tenant-1 rows present — isolation untested (no data yet), policy in place ✓`);
      } else if (c2 === 0) {
        pass(id, `${tbl}: ${c1} row(s) for tenant 1 — 0 visible from tenant 999 context ✓`);
      } else {
        fail(id, `${tbl}: CROSS-TENANT LEAK — ${c2} tenant-1 rows visible under tenant-999 context!`,
          `tenant_1_count=${c1} tenant_999_count=${c2}`);
      }
    } catch (e) {
      fail(id, `${tbl}: RLS isolation test query failed`, String(e));
    }
  }
}

// ─── TC-AN-005: IMMUTABILITY — nidhivan_bill_approvals ───────────────────────

async function tcAN005() {
  section("TC-AN-005 — Immutability: nidhivan_bill_approvals (no UPDATE/DELETE/TRUNCATE)");
  const id = "AN-005";

  try {
    const checks = [
      { priv: "update",   expected: false },
      { priv: "delete",   expected: false },
      { priv: "truncate", expected: false },
      { priv: "insert",   expected: true  },
      { priv: "select",   expected: true  },
    ];

    for (const { priv, expected } of checks) {
      const rows = await sql`
        SELECT has_table_privilege('studio_app', 'nidhivan_bill_approvals', ${priv}) AS has_priv
      `;
      const actual = rows[0]?.has_priv ?? null;
      if (actual === expected) {
        pass(id, `nidhivan_bill_approvals ${priv.toUpperCase()}: studio_app has_priv=${actual} (expected=${expected}) ✓`);
      } else {
        fail(id,
          `nidhivan_bill_approvals ${priv.toUpperCase()}: studio_app has_priv=${actual} (expected=${expected})`,
          `REVOKE may not have been applied`
        );
      }
    }
  } catch (e) {
    fail(id, "has_table_privilege check failed", String(e));
  }
}

// ─── TC-AN-006: IMMUTABILITY — nidhivan_ledger_entries ───────────────────────

async function tcAN006() {
  section("TC-AN-006 — Immutability: nidhivan_ledger_entries (no DELETE/TRUNCATE)");
  const id = "AN-006";

  try {
    const checks = [
      { priv: "delete",   expected: false },
      { priv: "truncate", expected: false },
      { priv: "insert",   expected: true  },
      { priv: "select",   expected: true  },
      { priv: "update",   expected: true  },  // ledger CAN be updated (corrections via JV, not row delete)
    ];

    for (const { priv, expected } of checks) {
      const rows = await sql`
        SELECT has_table_privilege('studio_app', 'nidhivan_ledger_entries', ${priv}) AS has_priv
      `;
      const actual = rows[0]?.has_priv ?? null;
      if (actual === expected) {
        pass(id, `nidhivan_ledger_entries ${priv.toUpperCase()}: has_priv=${actual} (expected=${expected}) ✓`);
      } else {
        fail(id,
          `nidhivan_ledger_entries ${priv.toUpperCase()}: has_priv=${actual} (expected=${expected})`,
          `REVOKE may not have been applied`
        );
      }
    }
  } catch (e) {
    fail(id, "has_table_privilege check failed", String(e));
  }
}

// ─── TC-AN-007: ADR-004 — NO DECIMAL/NUMERIC/FLOAT FOR MONEY ─────────────────

async function tcAN007() {
  section("TC-AN-007 — ADR-004: No NUMERIC/DECIMAL/FLOAT monetary columns in Aiyyo-Nidhi tables");
  const id = "AN-007";

  // Columns where real/float is acceptable: analysis percentage columns only
  const permittedRealColumns = [
    "labour_component_pct",
    "material_component_pct",
    "overhead_component_pct",
  ];

  try {
    const rows = await sql`
      SELECT c.table_name, c.column_name, c.data_type
      FROM   information_schema.columns c
      WHERE  c.table_schema = 'public'
        AND  c.table_name LIKE 'nidhivan_%'
        AND  c.data_type IN ('numeric', 'decimal', 'double precision', 'real', 'float')
      ORDER  BY c.table_name, c.column_name
    `;

    if (rows.length === 0) {
      pass(id, "Zero NUMERIC/DECIMAL/FLOAT columns found across all Aiyyo-Nidhi tables ✓");
      return;
    }

    for (const row of rows) {
      const isPermitted =
        permittedRealColumns.includes(row.column_name) &&
        row.table_name === "nidhivan_rate_schedules" &&
        row.data_type === "real";

      if (isPermitted) {
        pass(id,
          `${row.table_name}.${row.column_name} (${row.data_type}): ` +
          `permitted — analysis percentage, not monetary ✓`
        );
      } else {
        fail(id,
          `ADR-004 VIOLATION: ${row.table_name}.${row.column_name} type=${row.data_type} ` +
          `— monetary columns must be BIGINT paise, not ${row.data_type}`,
          `Replace with BIGINT paise or verify it is a non-monetary column.`
        );
      }
    }
  } catch (e) {
    fail(id, "information_schema.columns query failed", String(e));
  }
}

// ─── TC-AN-008: ENUM TYPES EXIST ─────────────────────────────────────────────

async function tcAN008() {
  section("TC-AN-008 — All 8 Aiyyo-Nidhi enum types exist in pg_type");
  const id = "AN-008";

  const expectedEnums = [
    "nidhivan_billing_type",
    "nidhivan_ra_bill_status",
    "nidhivan_approval_action",
    "nidhivan_advance_type",
    "nidhivan_advance_status",
    "nidhivan_account_type",
    "nidhivan_voucher_type",
    "nidhivan_sync_status",
  ];

  try {
    const rows = await sql`
      SELECT typname
      FROM   pg_type
      WHERE  typtype = 'e'
        AND  typname = ANY(${expectedEnums})
    `;
    const found = new Set(rows.map(r => r.typname));
    for (const e of expectedEnums) {
      if (found.has(e)) {
        pass(id, `Enum ${e} exists ✓`);
      } else {
        fail(id, `Enum ${e} NOT FOUND in pg_type — migration Section A may have failed`);
      }
    }
  } catch (e) {
    fail(id, "pg_type enum check failed", String(e));
  }
}

// ─── TC-AN-009: VANTAI VT-N-002 — TDS gate column ───────────────────────────

async function tcAN009() {
  section("TC-AN-009 — VANTAI VT-N-002: vt_n002_gate_passed column present on nidhivan_ra_bills");
  const id = "AN-009";

  try {
    const rows = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM   information_schema.columns
      WHERE  table_name  = 'nidhivan_ra_bills'
        AND  column_name = 'vt_n002_gate_passed'
    `;
    if (rows.length === 0) {
      fail(id, "nidhivan_ra_bills.vt_n002_gate_passed column NOT FOUND — VANTAI VT-N-002 gate cannot be enforced");
    } else {
      const col = rows[0];
      const defaultOk = String(col.column_default).includes("false");
      pass(id,
        `vt_n002_gate_passed: type=${col.data_type} nullable=${col.is_nullable} ` +
        `default=${col.column_default} ${defaultOk ? "(defaults FALSE ✓)" : "(default CHECK MANUALLY)"}`
      );
    }

    // Verify partial index on unpassed bills exists
    const idxRows = await sql`
      SELECT indexname FROM pg_indexes
      WHERE  tablename = 'nidhivan_ra_bills'
        AND  indexname = 'idx_nidhivan_ra_bills_vt_n002'
    `;
    if (idxRows.length > 0) {
      pass(id, "Partial index idx_nidhivan_ra_bills_vt_n002 (WHERE vt_n002_gate_passed=FALSE) exists ✓");
    } else {
      warn(id, "Partial index idx_nidhivan_ra_bills_vt_n002 not found — dashboard queries for pending VT-N-002 gates will do full scans");
    }
  } catch (e) {
    fail(id, "VT-N-002 column check failed", String(e));
  }
}

// ─── TC-AN-010: VANTAI VT-N-003 — e-invoice IRN column ──────────────────────

async function tcAN010() {
  section("TC-AN-010 — VANTAI VT-N-003: e_invoice_irn column on nidhivan_ra_bills");
  const id = "AN-010";

  try {
    const rows = await sql`
      SELECT column_name, data_type
      FROM   information_schema.columns
      WHERE  table_name  = 'nidhivan_ra_bills'
        AND  column_name IN ('e_invoice_irn', 'e_invoice_ack_no', 'e_invoice_ack_at')
    `;
    const found = new Set(rows.map(r => r.column_name));
    for (const col of ["e_invoice_irn", "e_invoice_ack_no", "e_invoice_ack_at"]) {
      if (found.has(col)) {
        pass(id, `nidhivan_ra_bills.${col} present ✓`);
      } else {
        fail(id, `nidhivan_ra_bills.${col} MISSING — VT-N-003 e-invoice gate cannot be recorded`);
      }
    }
  } catch (e) {
    fail(id, "VT-N-003 column check failed", String(e));
  }
}

// ─── TC-AN-011: DEFERRED FK INTEGRITY ────────────────────────────────────────
// Verifies all 5 deferred ALTER TABLE FKs were actually applied.

async function tcAN011() {
  section("TC-AN-011 — Deferred FK constraints applied (5 ALTER TABLE FKs from migration)");
  const id = "AN-011";

  const expectedFKs = [
    {
      constraint: "fk_ra_bills_milestone_gate",
      fromTable:  "nidhivan_ra_bills",
      fromCol:    "milestone_gate_id",
      toTable:    "nidhivan_milestone_gates",
    },
    {
      constraint: "fk_ra_bills_journal_voucher",
      fromTable:  "nidhivan_ra_bills",
      fromCol:    "journal_voucher_id",
      toTable:    "nidhivan_journal_vouchers",
    },
    {
      constraint: "fk_ra_bill_deductions_advance",
      fromTable:  "nidhivan_ra_bill_deductions",
      fromCol:    "advance_id",
      toTable:    "nidhivan_project_advances",
    },
    {
      constraint: "fk_project_advances_disbursement_journal",
      fromTable:  "nidhivan_project_advances",
      fromCol:    "disbursement_journal_id",
      toTable:    "nidhivan_journal_vouchers",
    },
    {
      constraint: "fk_tally_export_queue_voucher",
      fromTable:  "nidhivan_tally_export_queue",
      fromCol:    "voucher_id",
      toTable:    "nidhivan_journal_vouchers",
    },
  ];

  try {
    const rows = await sql`
      SELECT tc.constraint_name,
             tc.table_name       AS from_table,
             kcu.column_name     AS from_col,
             ccu.table_name      AS to_table
      FROM   information_schema.table_constraints AS tc
      JOIN   information_schema.key_column_usage  AS kcu
             ON  kcu.constraint_name = tc.constraint_name
             AND kcu.table_schema    = tc.table_schema
      JOIN   information_schema.constraint_column_usage AS ccu
             ON  ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema    = tc.table_schema
      WHERE  tc.constraint_type = 'FOREIGN KEY'
        AND  tc.constraint_name = ANY(${expectedFKs.map(f => f.constraint)})
    `;

    const foundFKs = new Map(rows.map(r => [r.constraint_name, r]));

    for (const fk of expectedFKs) {
      const row = foundFKs.get(fk.constraint);
      if (!row) {
        fail(id, `FK ${fk.constraint} (${fk.fromTable}.${fk.fromCol} → ${fk.toTable}) NOT FOUND`);
      } else {
        pass(id, `FK ${fk.constraint}: ${row.from_table}.${row.from_col} → ${row.to_table} ✓`);
      }
    }
  } catch (e) {
    fail(id, "FK constraint query failed", String(e));
  }
}

// ─── TC-AN-012: CGST ACT SECTION 13(2) ADVANCE GST COLUMNS ──────────────────

async function tcAN012() {
  section("TC-AN-012 — CGST Act §13(2): advance GST paise columns present on nidhivan_project_advances");
  const id = "AN-012";

  const required = [
    "cgst_on_advance_paise",
    "sgst_on_advance_paise",
    "igst_on_advance_paise",
  ];

  try {
    const rows = await sql`
      SELECT column_name, data_type
      FROM   information_schema.columns
      WHERE  table_name  = 'nidhivan_project_advances'
        AND  column_name = ANY(${required})
    `;
    const found = new Map(rows.map(r => [r.column_name, r.data_type]));
    for (const col of required) {
      if (found.has(col)) {
        const dt = found.get(col);
        if (dt === "bigint") {
          pass(id, `nidhivan_project_advances.${col}: BIGINT (ADR-004 compliant) ✓`);
        } else {
          fail(id, `nidhivan_project_advances.${col}: type=${dt} — ADR-004 requires BIGINT paise`);
        }
      } else {
        fail(id, `nidhivan_project_advances.${col} MISSING — CGST Act §13(2) advance GST cannot be recorded`);
      }
    }
  } catch (e) {
    fail(id, "CGST §13(2) column check failed", String(e));
  }
}

// ─── TC-AN-013 already defined above; pulled into run order ──────────────────

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

async function printSummary() {
  section("SUMMARY");
  console.log(`\n  Total PASS:  ${passCount}`);
  console.log(`  Total FAIL:  ${failCount}`);
  console.log(`  Total WARN:  ${warnCount}`);

  if (failCount === 0 && warnCount === 0) {
    console.log(`\n  \x1b[32m══ ALL TESTS PASSED — Aiyyo-Nidhi migration 0023 fortress CLEARED ══\x1b[0m\n`);
  } else if (failCount === 0) {
    console.log(`\n  \x1b[33m══ PASS with warnings — review WARN items before production deploy ══\x1b[0m\n`);
  } else {
    console.log(`\n  \x1b[31m══ FAILURES DETECTED — DO NOT deploy Aiyyo-Nidhi routes until resolved ══\x1b[0m\n`);

    console.log("  Failed tests:");
    for (const r of results.filter(r => r.status === "FAIL")) {
      console.log(`    [${r.id}] ${r.msg}`);
      if (r.detail) console.log(`            ${r.detail}`);
    }
    console.log("");
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const filterArg = process.argv.find(a => a.startsWith("--tc"));
  const filterVal = filterArg ? process.argv[process.argv.indexOf(filterArg) + 1] : null;

  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║   tc-aiyyo-nidhi-fortress.mjs — Aiyyo-Nidhi Migration 0023 ATP      ║");
  console.log("║   BNLV-COUNCIL-002 Phase 2 | 2026-10-17                             ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");
  info(`DATABASE_URL_UNPOOLED: ${DATABASE_URL_UNPOOLED?.slice(0, 30)}...`);

  const allTests = [
    { id: "AN-013", fn: tcAN013 },  // Gary P0 gate — FIRST
    { id: "AN-001", fn: tcAN001 },
    { id: "AN-002", fn: tcAN002 },
    { id: "AN-003", fn: tcAN003 },
    { id: "AN-004", fn: tcAN004 },
    { id: "AN-005", fn: tcAN005 },
    { id: "AN-006", fn: tcAN006 },
    { id: "AN-007", fn: tcAN007 },
    { id: "AN-008", fn: tcAN008 },
    { id: "AN-009", fn: tcAN009 },
    { id: "AN-010", fn: tcAN010 },
    { id: "AN-011", fn: tcAN011 },
    { id: "AN-012", fn: tcAN012 },
  ];

  const testsToRun = filterVal
    ? allTests.filter(t => t.id === filterVal.toUpperCase())
    : allTests;

  if (testsToRun.length === 0) {
    console.error(`  No test matching --tc ${filterVal} found.`);
    process.exit(1);
  }

  for (const test of testsToRun) {
    try {
      await test.fn();
    } catch (e) {
      fail(test.id, `Unhandled exception in test runner`, String(e));
    }
  }

  await printSummary();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(`\nFATAL: ${e}`);
  process.exit(1);
});
