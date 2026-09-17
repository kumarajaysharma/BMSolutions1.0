/**
 * scripts/check-status.mjs
 * ============================================================
 * BNLV Platform — Full Status Diagnostic
 * Checks database, env vars, build, git, and sprint progress.
 *
 * Run: node scripts/check-status.mjs
 * ============================================================
 */

import pg from "pg";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

// ── Colour helpers ───────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;   // green
const R = (s) => `\x1b[31m${s}\x1b[0m`;   // red
const Y = (s) => `\x1b[33m${s}\x1b[0m`;   // yellow
const B = (s) => `\x1b[1m${s}\x1b[0m`;    // bold
const tick  = G("✅");
const cross = R("❌");
const warn  = Y("⚠️ ");

let totalPass = 0, totalFail = 0, totalWarn = 0;

function pass(msg) { console.log(`  ${tick}  ${msg}`); totalPass++; }
function fail(msg) { console.log(`  ${cross} ${msg}`); totalFail++; }
function caution(msg) { console.log(`  ${warn} ${msg}`); totalWarn++; }
function header(title) {
  console.log(`\n${B("══")} ${B(title)} ${"═".repeat(Math.max(0, 52 - title.length))}`);
}

// ── Shell helper (non-fatal) ─────────────────────────────────
function sh(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim();
  } catch (e) {
    return null;
  }
}

// ════════════════════════════════════════════════════════════
async function main() {
  console.log(B("\n╔══════════════════════════════════════════════════════╗"));
  console.log(B(  "║  BNLV Platform — Full Status Diagnostic              ║"));
  console.log(B(  "╚══════════════════════════════════════════════════════╝"));
  console.log(`   ${new Date().toISOString()}   Phase C Sprint\n`);

  // ════════════════════════════════════════════════════════
  // CHECK 1 — Environment Variables
  // ════════════════════════════════════════════════════════
  header("CHECK 1: Environment Variables");

  const REQUIRED_VARS = [
    { key: "DATABASE_URL",                    hint: "Pooled Neon URL (studio_app)" },
    { key: "DATABASE_URL_UNPOOLED",           hint: "Direct Neon URL (neondb_owner) — must not contain '.pooler.'" },
    { key: "JWT_SECRET",                      hint: "Min 64 hex chars" },
    { key: "ANTHROPIC_API_KEY",               hint: "Anthropic console — rotate if exposed" },
    { key: "NEXT_PUBLIC_APP_URL",             hint: "https://bms.bnlvconsulting.com in prod" },
  ];
  const OPTIONAL_VARS = [
    { key: "GOOGLE_GENERATIVE_AI_API_KEY",    hint: "Gemini fallback for Financial Agent" },
    { key: "ANTHROPIC_WORKSPACE_ID",          hint: "Optional workspace scoping" },
    { key: "CLOUDFLARE_API_TOKEN",            hint: "Required when BMS_HOSTING_ENABLED=true" },
    { key: "CLOUDFLARE_ZONE_ID",              hint: "Required when BMS_HOSTING_ENABLED=true" },
    { key: "BMS_HOSTING_ENABLED",             hint: "Should be 'false' for Phase C launch" },
    { key: "BMS_ACADEMY_PUBLIC_COURSES",      hint: "Should be 'true'" },
  ];

  for (const { key, hint } of REQUIRED_VARS) {
    const val = process.env[key];
    if (!val || val.includes("CHANGE_ME") || val.trim() === "") {
      fail(`${key} — MISSING or placeholder  [${hint}]`);
    } else if (key === "DATABASE_URL_UNPOOLED" && val.includes("pooler")) {
      fail(`${key} — contains 'pooler' — this is the POOLED URL, not direct  [${hint}]`);
    } else if (key === "DATABASE_URL_UNPOOLED" && val.includes("studio_app")) {
      fail(`${key} — role is studio_app — must be neondb_owner  [${hint}]`);
    } else if (key === "JWT_SECRET" && val.length < 64) {
      fail(`${key} — too short (${val.length} chars, min 64)  [${hint}]`);
    } else {
      pass(`${key} — set  (${val.slice(0, 8)}...)`);
    }
  }

  for (const { key, hint } of OPTIONAL_VARS) {
    const val = process.env[key];
    if (!val || val.includes("CHANGE_ME") || val.trim() === "") {
      caution(`${key} — not set  [${hint}]`);
    } else {
      pass(`${key} — set`);
    }
  }

  // ════════════════════════════════════════════════════════
  // CHECK 2 — Database: Migrations + Tenants + Seed
  // ════════════════════════════════════════════════════════
  header("CHECK 2: Database — Migrations, Tenants, RLS, Seed");

  const UNPOOLED = process.env.DATABASE_URL_UNPOOLED;
  if (!UNPOOLED || UNPOOLED.includes("CHANGE_ME")) {
    caution("DATABASE_URL_UNPOOLED not set — skipping all DB checks.");
  } else {
    const pool = new pg.Pool({
      connectionString: UNPOOLED,
      ssl: { rejectUnauthorized: false },
      max: 1, connectionTimeoutMillis: 8000,
    });
    let client;
    try {
      client = await pool.connect();
      const roleRow = await client.query("SELECT current_user");
      const role = roleRow.rows[0].current_user;
      pass(`DB connected as: ${role}`);
      if (role === "studio_app") {
        fail("DATABASE_URL_UNPOOLED connects as studio_app — must be neondb_owner");
      }

      // ── Applied migrations ───────────────────────────────
      const migRes = await client.query(
        `SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at`
      ).catch(() => ({ rows: [] }));
      const applied = migRes.rows.map(r => r.hash);
      const EXPECTED_MIGRATIONS = [
        "0000_initial_schema", "0001_users", "0002_sessions",
        "0003_audit_logs", "0004_limsy_tables", "0005_nidhivan_tables",
        "0006_client_requests", "0007_job_applications",
        "0008_commercial_launch_foundation", "0009_schema_hardening",
        "0010_nidhivan_schema", "0011_limsy_rls", "0012_nidhivan_rls_policies",
        "0013_bms_academy_lms", "0014_bms_studio_hosting",
        "0015_bms_ops_intelligence",
      ];
      console.log(`\n  Applied migrations (${applied.length} in drizzle.__drizzle_migrations):`);
      for (const m of EXPECTED_MIGRATIONS) {
        if (applied.includes(m)) pass(m);
        else caution(`${m} — NOT registered (may still exist if applied outside drizzle-kit)`);
      }

      // ── Tenant registry ──────────────────────────────────
      console.log("\n  Tenant registry:");
      const tenantRes = await client.query(
        `SELECT id, slug, name, plan, created_at FROM tenants ORDER BY id`
      );
      const EXPECTED_SLUGS = ["bnlv", "bms", "vihang", "nidhivan", "limsy"];
      const tenantMap = new Map(tenantRes.rows.map(r => [r.slug, r]));
      for (const slug of EXPECTED_SLUGS) {
        const t = tenantMap.get(slug);
        if (t) pass(`${slug.padEnd(10)} id=${String(t.id).padEnd(4)} plan=${t.plan}`);
        else    fail(`${slug.padEnd(10)} — NOT PROVISIONED`);
      }

      // ── BMS table existence ──────────────────────────────
      console.log("\n  BMS tables (16 expected):");
      const tRes = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_name LIKE 'bms_%' ORDER BY table_name
      `);
      const existTables = new Set(tRes.rows.map(r => r.table_name));
      const BMS_TABLES = [
        "bms_ai_agents","bms_assignments","bms_code_red_cases","bms_courses",
        "bms_dns_records","bms_documents","bms_enrollments","bms_gates",
        "bms_host_containers","bms_learning_paths","bms_lesson_progress",
        "bms_lessons","bms_modules","bms_studio_addons","bms_studio_projects",
        "bms_workflows",
      ];
      let bmsTableFail = 0;
      for (const t of BMS_TABLES) {
        if (existTables.has(t)) pass(t);
        else { fail(`${t} — MISSING`); bmsTableFail++; }
      }
      if (bmsTableFail === 0) console.log(G("  ✔  All 16 bms_* tables present"));
      else console.log(R(`  ✘  ${bmsTableFail} bms_* table(s) missing — run: node scripts/migrate-bms.mjs`));

      // ── Nidhivan RLS ─────────────────────────────────────
      console.log("\n  Nidhivan RLS policies:");
      const nRes = await client.query(`
        SELECT tablename FROM pg_policies
        WHERE tablename IN ('nidhivan_dprs','nidhivan_boqs','nidhivan_boq_items',
                            'nidhivan_financial_metrics','nidhivan_projects')
        GROUP BY tablename
      `);
      const nTables = new Set(nRes.rows.map(r => r.tablename));
      for (const t of ["nidhivan_dprs","nidhivan_boqs","nidhivan_boq_items",
                        "nidhivan_financial_metrics","nidhivan_projects"]) {
        if (nTables.has(t)) pass(`${t} — policy present`);
        else                fail(`${t} — NO RLS POLICY`);
      }

      // ── Seed data ────────────────────────────────────────
      console.log("\n  BMS seed data (tenant_id=10):");
      const SEED_CHECKS = [
        { tbl: "bms_courses",         expect: 3 },
        { tbl: "bms_learning_paths",  expect: 2 },
        { tbl: "bms_ai_agents",       expect: 5 },
        { tbl: "bms_code_red_cases",  expect: 4 },
        { tbl: "bms_assignments",     expect: 3 },
        { tbl: "bms_documents",       expect: 3 },
        { tbl: "bms_gates",           expect: 6 },
      ];
      for (const { tbl, expect } of SEED_CHECKS) {
        try {
          const r = await client.query(
            `SELECT COUNT(*) AS n FROM ${tbl} WHERE tenant_id=10`
          );
          const n = parseInt(r.rows[0].n);
          if (n >= expect) pass(`${tbl.padEnd(22)} count=${n} (expected ≥${expect})`);
          else if (n > 0)  caution(`${tbl.padEnd(22)} count=${n} (expected ≥${expect}) — partial seed`);
          else             fail(`${tbl.padEnd(22)} count=0 — run: npx tsx src/db/seed-bms-academy.ts`);
        } catch {
          fail(`${tbl} — table query failed (may not exist)`);
        }
      }

      // ── BMS admin user ───────────────────────────────────
      console.log("\n  Admin accounts:");
      const adminRes = await client.query(`
        SELECT u.id, u.email, u.role, u.password_hash, t.slug
        FROM users u JOIN tenants t ON t.id = u.tenant_id
        WHERE u.email IN (
          'admin@bms.bnlvconsulting.com',
          'admin@nidhivan.bnlvconsulting.com',
          'admin@limsy.bnlvconsulting.com'
        ) ORDER BY t.slug
      `);
      const EXPECTED_ADMINS = [
        "admin@bms.bnlvconsulting.com",
        "admin@nidhivan.bnlvconsulting.com",
        "admin@limsy.bnlvconsulting.com",
      ];
      const adminMap = new Map(adminRes.rows.map(r => [r.email, r]));
      for (const email of EXPECTED_ADMINS) {
        const a = adminMap.get(email);
        if (!a) {
          fail(`${email} — USER NOT FOUND`);
        } else if (!a.password_hash.startsWith("$scrypt$")) {
          fail(`${email} (id=${a.id}) — password_hash is NOT scrypt format — reset required`);
        } else {
          pass(`${email} (id=${a.id}, role=${a.role}) — scrypt hash OK`);
        }
      }

    } catch (err) {
      fail(`Database connection failed: ${err.message}`);
    } finally {
      if (client) client.release();
      await pool.end();
    }
  }

  // ════════════════════════════════════════════════════════
  // CHECK 3 — TypeScript Build
  // ════════════════════════════════════════════════════════
  header("CHECK 3: TypeScript");
  console.log("  Running npm run typecheck (this may take 10-20s)...");
  const tsOut = sh("npm run typecheck 2>&1", ROOT);
  if (tsOut === null) {
    fail("typecheck command failed to execute");
  } else if (tsOut.includes("error TS")) {
    const errors = tsOut.split("\n").filter(l => l.includes("error TS"));
    fail(`TypeScript errors detected (${errors.length}):`);
    errors.slice(0, 5).forEach(e => console.log(R(`    ${e.trim()}`)));
    if (errors.length > 5) console.log(R(`    ... and ${errors.length - 5} more`));
  } else if (tsOut.includes("Found 0 errors") || tsOut === "") {
    pass("TypeScript — 0 errors");
  } else {
    caution(`typecheck output unclear — inspect manually:\n    ${tsOut.slice(0, 200)}`);
  }

  // ════════════════════════════════════════════════════════
  // CHECK 4 — Git State
  // ════════════════════════════════════════════════════════
  header("CHECK 4: Git Repository State");

  const branch   = sh("git rev-parse --abbrev-ref HEAD");
  const lastHash = sh("git log --oneline -1");
  const uncommit = sh("git status --porcelain");
  const unpushed = sh("git log @{u}.. --oneline 2>/dev/null") ?? "";

  branch   ? pass(`Branch: ${branch}`) : caution("Could not determine branch");
  lastHash ? pass(`Last commit: ${lastHash}`) : caution("No commits found");

  if (uncommit && uncommit.length > 0) {
    const lines = uncommit.split("\n").filter(Boolean);
    caution(`${lines.length} uncommitted change(s):`);
    lines.slice(0, 8).forEach(l => console.log(Y(`    ${l}`)));
  } else {
    pass("Working tree clean");
  }

  if (unpushed && unpushed.trim().length > 0) {
    const lines = unpushed.split("\n").filter(Boolean);
    caution(`${lines.length} unpushed commit(s) — run: git push origin main`);
    lines.forEach(l => console.log(Y(`    ${l}`)));
  } else {
    pass("All commits pushed to remote");
  }

  // Key files check
  console.log("\n  Key file presence:");
  const KEY_FILES = [
    { f: "scripts/vercel-build.mjs",          label: "NFT shim wrapper" },
    { f: "scripts/migrate-bms.mjs",            label: "BMS migration runner" },
    { f: "scripts/provision-tenant.mjs",        label: "Tenant provisioner" },
    { f: "src/db/seed-bms-academy.ts",          label: "BMS Academy seed" },
    { f: "drizzle/migrations/0013_bms_academy_lms.sql",    label: "Migration 0013" },
    { f: "drizzle/migrations/0014_bms_studio_hosting.sql", label: "Migration 0014" },
    { f: "drizzle/migrations/0015_bms_ops_intelligence.sql","label": "Migration 0015" },
    { f: "src/app/api/bms/lms/courses/route.ts",           label: "LMS courses route" },
    { f: "src/app/api/bms/studio/projects/route.ts",       label: "Studio projects route" },
    { f: "src/app/api/bms/ops/code-red/route.ts",          label: "Ops code-red route" },
    { f: "src/app/api/bms/hosting/containers/route.ts",    label: "Hosting containers route" },
    { f: "vercel.json",                        label: "Vercel config (NFT buildCommand)" },
  ];
  for (const { f, label } of KEY_FILES) {
    const full = path.join(ROOT, f);
    if (fs.existsSync(full)) pass(`${f.padEnd(52)} [${label}]`);
    else                      fail(`${f} — MISSING  [${label}]`);
  }

  // ════════════════════════════════════════════════════════
  // CHECK 5 — vercel.json NFT shim
  // ════════════════════════════════════════════════════════
  header("CHECK 5: Vercel Deployment Config");
  const vercelJson = path.join(ROOT, "vercel.json");
  if (!fs.existsSync(vercelJson)) {
    fail("vercel.json not found");
  } else {
    try {
      const vj = JSON.parse(fs.readFileSync(vercelJson, "utf8"));
      if (vj.buildCommand && vj.buildCommand.includes("vercel-build")) {
        pass(`buildCommand: ${vj.buildCommand}`);
      } else {
        fail(`buildCommand does not reference vercel-build.mjs — NFT shim not active`);
        caution(`Current value: ${vj.buildCommand ?? "(not set)"}`);
        caution(`Required: "buildCommand": "node scripts/vercel-build.mjs"`);
      }
      if (vj.rewrites && vj.rewrites.some(r => r.destination?.includes(":subdomain"))) {
        pass("Subdomain rewrite rule present");
      } else {
        caution("Subdomain rewrite rule not detected — verify wildcard *.bnlvconsulting.com routing");
      }
    } catch {
      fail("vercel.json is not valid JSON");
    }
  }

  // ════════════════════════════════════════════════════════
  // CHECK 6 — Sprint Progress Summary
  // ════════════════════════════════════════════════════════
  header("CHECK 6: Phase C Sprint Progress");

  const SPRINT = [
    { done: true,  item: "SEC-001  Rotate ANTHROPIC_API_KEY" },
    { done: true,  item: "DB       Migration 0013 (BMS Academy LMS)" },
    { done: true,  item: "DB       Migration 0014 (BMS Studio + Hosting)" },
    { done: true,  item: "DB       Migration 0015 (Ops Intelligence + Nidhivan RLS)" },
    { done: true,  item: "DB       Nidhivan RLS remediation (boqs, boq_items, metrics, projects)" },
    { done: false, item: "SEED     seed-bms-academy.ts (courses, agents, code-red, gates)" },
    { done: false, item: "TS       npm run typecheck — zero errors" },
    { done: false, item: "TENANT   Provision nidhivan tenant" },
    { done: false, item: "TENANT   Provision limsy tenant" },
    { done: false, item: "AUTH     Reset admin@bms.bnlvconsulting.com password (user ID 13)" },
    { done: false, item: "DEPLOY   Push scripts/vercel-build.mjs + vercel.json to unblock Vercel" },
    { done: false, item: "DEPLOY   Update DATABASE_URL_UNPOOLED in Vercel dashboard" },
    { done: false, item: "API      Implement remaining 11 /api/bms/* route handlers" },
    { done: false, item: "UI       BMS Academy workspace tab" },
    { done: false, item: "UI       Studio Builder tabs" },
    { done: false, item: "UI       Ops Intelligence pages" },
    { done: false, item: "ATP      Run BMS-001 through BMS-020 (20 new tests)" },
    { done: false, item: "ATP      Run remaining 20 P1 tests" },
    { done: false, item: "QA       RLS isolation battery across all 5 tenants" },
    { done: false, item: "GO       CTO sign-off — commercial launch" },
  ];

  const done  = SPRINT.filter(s => s.done);
  const pend  = SPRINT.filter(s => !s.done);

  console.log(G(`\n  Completed (${done.length}/${SPRINT.length}):`));
  done.forEach(s => console.log(G(`    ✔  ${s.item}`)));
  console.log(Y(`\n  Pending (${pend.length}/${SPRINT.length}):`));
  pend.forEach((s, i) => console.log(Y(`    ${String(i + 1).padStart(2)}.  ${s.item}`)));

  // ════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ════════════════════════════════════════════════════════
  console.log(`\n${"═".repeat(54)}`);
  console.log(B("DIAGNOSTIC SUMMARY"));
  console.log(`  ${G("✅ Pass")}    ${totalPass}`);
  console.log(`  ${R("❌ Fail")}    ${totalFail}`);
  console.log(`  ${Y("⚠️  Warn")}    ${totalWarn}`);
  console.log("═".repeat(54));

  if (totalFail === 0 && totalWarn <= 3) {
    console.log(G(B("\n  Platform status: GO — proceed to next sprint item")));
  } else if (totalFail === 0) {
    console.log(Y(B("\n  Platform status: CONDITIONAL GO — address warnings")));
  } else {
    console.log(R(B(`\n  Platform status: BLOCKED — ${totalFail} failure(s) must be resolved first`)));
    console.log(R("  Fix all ❌ items before proceeding to seed or deployment.\n"));
  }
}

main().catch(err => { console.error(R(`\n❌ Diagnostic crashed: ${err.message}`)); process.exit(1); });
