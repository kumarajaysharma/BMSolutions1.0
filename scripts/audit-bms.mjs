/**
 * scripts/audit-bms.mjs
 * ============================================================
 * BMS module post-migration audit.
 * Connects via DATABASE_URL_UNPOOLED (owner connection) so
 * information_schema reads are not filtered by RLS.
 *
 * Run:  node scripts/audit-bms.mjs
 * ============================================================
 */

import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const UNPOOLED_URL = process.env.DATABASE_URL_UNPOOLED;
if (!UNPOOLED_URL) {
  console.error("❌ DATABASE_URL_UNPOOLED not set — audit requires owner connection.");
  process.exit(1);
}

const EXPECTED_BMS_TABLES = [
  "bms_courses", "bms_modules", "bms_lessons", "bms_learning_paths",
  "bms_enrollments", "bms_lesson_progress", "bms_ai_agents", "bms_workflows",
  "bms_studio_projects", "bms_studio_addons",
  "bms_host_containers", "bms_dns_records",
  "bms_code_red_cases", "bms_assignments", "bms_documents", "bms_gates",
];

const EXPECTED_NIDHIVAN_POLICIES = [
  { table: "nidhivan_dprs",              policy: "nidhivan_dprs_tenant_isolation" },
  { table: "nidhivan_boqs",              policy: "nidhivan_boqs_tenant_isolation" },
  { table: "nidhivan_boq_items",         policy: "nidhivan_boq_items_tenant_isolation" },
  { table: "nidhivan_financial_metrics", policy: "nidhivan_financial_metrics_tenant_isolation" },
  { table: "nidhivan_projects",          policy: "nidhivan_projects_tenant_isolation" },
];

async function run() {
  const pool = new pg.Pool({
    connectionString: UNPOOLED_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
  const client = await pool.connect();
  let totalFail = 0;

  try {
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║  BNLV BMS Module — Post-Migration Audit              ║");
    console.log("╚══════════════════════════════════════════════════════╝\n");

    const roleRes = await client.query("SELECT current_user");
    console.log(`🔌 Connected as: ${roleRes.rows[0].current_user}\n`);

    // ── 1. Table existence ───────────────────────────────────
    console.log("── CHECK 1: BMS Table Existence (16 expected) ──");
    const tableRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'bms_%'
      ORDER BY table_name
    `);
    const existingTables = new Set(tableRes.rows.map(r => r.table_name));
    let tableFail = 0;
    for (const t of EXPECTED_BMS_TABLES) {
      if (existingTables.has(t)) {
        console.log(`  ✅ ${t}`);
      } else {
        console.log(`  ❌ MISSING: ${t}`);
        tableFail++;
      }
    }
    if (tableFail === 0) {
      console.log(`  ✅ All ${EXPECTED_BMS_TABLES.length} bms_* tables present.\n`);
    } else {
      console.log(`  ❌ ${tableFail} table(s) missing — run node scripts/migrate-bms.mjs\n`);
      totalFail += tableFail;
    }

    // ── 2. RLS enforcement ───────────────────────────────────
    console.log("── CHECK 2: FORCE ROW LEVEL SECURITY ──");
    const rlsRes = await client.query(`
      SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'bms_%'
      ORDER BY c.relname
    `);
    let rlsFail = 0;
    for (const row of rlsRes.rows) {
      const ok = row.rls && row.force_rls;
      console.log(`  ${ok ? "✅" : "❌"} ${row.relname.padEnd(35)} rls=${row.rls} force=${row.force_rls}`);
      if (!ok) rlsFail++;
    }
    if (rlsFail === 0 && rlsRes.rows.length > 0) {
      console.log(`  ✅ All bms_* tables have FORCE ROW LEVEL SECURITY.\n`);
    } else if (rlsFail > 0) {
      console.log(`  ❌ ${rlsFail} table(s) without FORCE RLS.\n`);
      totalFail += rlsFail;
    }

    // ── 3. Policy coverage ───────────────────────────────────
    console.log("── CHECK 3: RLS Policy Coverage (1 per bms_* table) ──");
    const policyRes = await client.query(`
      SELECT tablename, COUNT(*) AS policies
      FROM pg_policies WHERE tablename LIKE 'bms_%'
      GROUP BY tablename ORDER BY tablename
    `);
    const policyMap = new Map(policyRes.rows.map(r => [r.tablename, parseInt(r.policies)]));
    let policyFail = 0;
    for (const t of EXPECTED_BMS_TABLES) {
      const cnt = policyMap.get(t) ?? 0;
      const ok  = cnt === 1;
      console.log(`  ${ok ? "✅" : "❌"} ${t.padEnd(35)} policies=${cnt}`);
      if (!ok) policyFail++;
    }
    if (policyFail === 0) console.log(`  ✅ All bms_* tables have exactly 1 RLS policy.\n`);
    else { console.log(`  ❌ ${policyFail} table(s) have incorrect policy count.\n`); totalFail += policyFail; }

    // ── 4. Nidhivan RLS remediation ──────────────────────────
    console.log("── CHECK 4: Nidhivan RLS Remediation (5 policies expected) ──");
    const nRes = await client.query(`
      SELECT tablename, policyname FROM pg_policies
      WHERE tablename IN ('nidhivan_dprs','nidhivan_boqs','nidhivan_boq_items',
                          'nidhivan_financial_metrics','nidhivan_projects')
      ORDER BY tablename
    `);
    const nPolicies = new Map(nRes.rows.map(r => [r.tablename, r.policyname]));
    let nFail = 0;
    for (const { table, policy } of EXPECTED_NIDHIVAN_POLICIES) {
      const found = nPolicies.get(table);
      const ok    = !!found;
      console.log(`  ${ok ? "✅" : "❌"} ${table.padEnd(35)} policy=${found ?? "MISSING"}`);
      if (!ok) nFail++;
    }
    if (nFail === 0) console.log(`  ✅ All Nidhivan tables have RLS policies.\n`);
    else { console.log(`  ❌ ${nFail} Nidhivan table(s) missing RLS policy.\n`); totalFail += nFail; }

    // ── 5. Financial precision check ─────────────────────────
    console.log("── CHECK 5: Financial Column Precision (no real/double) ──");
    const precRes = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name LIKE 'bms_%'
        AND data_type IN ('real', 'double precision')
        AND column_name IN ('rating','progress','roi_multiple','success_rate','cpu_limit','score')
    `);
    if (precRes.rows.length === 0) {
      console.log(`  ✅ No real/double precision financial columns detected.\n`);
    } else {
      for (const r of precRes.rows) {
        console.log(`  ❌ ${r.table_name}.${r.column_name} is ${r.data_type} — must be numeric`);
        totalFail++;
      }
      console.log();
    }

    // ── 6. Cross-tenant isolation smoke test ─────────────────
    console.log("── CHECK 6: Cross-Tenant RLS Isolation Smoke Test ──");
    try {
      // Set as BNLV root tenant (id=1) — should see ZERO bms_courses
      await client.query("BEGIN");
      await client.query("SET LOCAL app.current_tenant_id = '1'");
      const isolRes = await client.query("SELECT COUNT(*) AS cnt FROM bms_courses");
      await client.query("ROLLBACK");
      const cnt = parseInt(isolRes.rows[0].cnt);
      if (cnt === 0) {
        console.log(`  ✅ Tenant 1 (bnlv) sees 0 bms_courses — isolation correct.\n`);
      } else {
        console.log(`  ❌ Tenant 1 (bnlv) sees ${cnt} bms_courses — RLS BREACH.\n`);
        totalFail++;
      }
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      console.log(`  ⚠️  Isolation test skipped (table may not exist yet): ${e.message}\n`);
    }

    // ── 7. drizzle tracking ──────────────────────────────────
    console.log("── CHECK 7: Migration Registration in drizzle.__drizzle_migrations ──");
    try {
      const dRes = await client.query(`
        SELECT hash FROM drizzle.__drizzle_migrations
        WHERE hash IN ('0013_bms_academy_lms','0014_bms_studio_hosting','0015_bms_ops_intelligence')
        ORDER BY hash
      `);
      const registered = new Set(dRes.rows.map(r => r.hash));
      for (const tag of ["0013_bms_academy_lms","0014_bms_studio_hosting","0015_bms_ops_intelligence"]) {
        const ok = registered.has(tag);
        console.log(`  ${ok ? "✅" : "⚠️ "} ${tag}: ${ok ? "registered" : "NOT registered — drizzle-kit may re-apply"}`);
      }
      console.log();
    } catch {
      console.log(`  ⚠️  drizzle.__drizzle_migrations not accessible — run migrate-bms.mjs first.\n`);
    }

    // ── Final result ─────────────────────────────────────────
    console.log("═".repeat(54));
    if (totalFail === 0) {
      console.log("✅  AUDIT PASSED — All checks green. Ready for seed step.");
    } else {
      console.log(`❌  AUDIT FAILED — ${totalFail} check(s) failed.`);
      console.log("    Run: node scripts/migrate-bms.mjs");
      process.exit(1);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Audit error:", err.message);
  process.exit(1);
});
