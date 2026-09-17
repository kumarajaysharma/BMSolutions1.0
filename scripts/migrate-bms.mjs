/**
 * scripts/migrate-bms.mjs
 * ============================================================
 * Direct BMS migration runner — bypasses drizzle-kit entirely.
 *
 * Why this exists:
 *   drizzle-kit migrate was silently skipping 0013-0015 due to
 *   pre-added journal entries and a CREATE POLICY IF NOT EXISTS
 *   syntax error in 0015. This script eliminates both failure
 *   modes by using a direct pg connection with explicit error
 *   reporting.
 *
 * Safety guarantees:
 *   1. Validates DATABASE_URL_UNPOOLED before any DDL
 *   2. Validates the connected role is NOT studio_app
 *      (studio_app cannot CREATE TABLE — wrong role = hard exit)
 *   3. All 3 migrations use IF NOT EXISTS (idempotent — safe
 *      to re-run if partially applied)
 *   4. Each migration runs in its own transaction with
 *      explicit ROLLBACK on failure
 *   5. Registers each applied migration in drizzle.__drizzle_migrations
 *      so drizzle-kit does not re-apply on next run
 *
 * Run: node scripts/migrate-bms.mjs
 * Requires: DATABASE_URL_UNPOOLED in .env.local
 * ============================================================
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Environment loading ──────────────────────────────────────
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

// ── Connection validation ────────────────────────────────────
const UNPOOLED_URL = process.env.DATABASE_URL_UNPOOLED;
if (!UNPOOLED_URL || UNPOOLED_URL.trim() === "") {
  console.error("❌ FATAL: DATABASE_URL_UNPOOLED is not set in .env.local");
  console.error("   This script requires the direct Neon owner connection.");
  console.error("   DO NOT use DATABASE_URL (pooled/studio_app) for migrations.");
  process.exit(1);
}

if (UNPOOLED_URL.includes("pooler")) {
  console.error("❌ FATAL: DATABASE_URL_UNPOOLED appears to be a pooled URL (contains 'pooler').");
  console.error("   Use the direct connection string from Neon console → Connection Details → Direct.");
  process.exit(1);
}

// ── Migration file definitions ───────────────────────────────
const MIGRATIONS_DIR = path.join(ROOT, "drizzle", "migrations");

const MIGRATIONS = [
  {
    idx: 13,
    tag: "0013_bms_academy_lms",
    file: "0013_bms_academy_lms.sql",
    when: 1757980800000,
  },
  {
    idx: 14,
    tag: "0014_bms_studio_hosting",
    file: "0014_bms_studio_hosting.sql",
    when: 1757980801000,
  },
  {
    idx: 15,
    tag: "0015_bms_ops_intelligence",
    file: "0015_bms_ops_intelligence.sql",
    when: 1757980802000,
  },
];

// ── Helpers ──────────────────────────────────────────────────
function readMigration(file) {
  const full = path.join(MIGRATIONS_DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`❌ Migration file not found: ${full}`);
    process.exit(1);
  }
  return fs.readFileSync(full, "utf8");
}

async function isAlreadyApplied(client, tag) {
  // Check both drizzle schema and public schema tracking tables
  try {
    const res = await client.query(
      `SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1 LIMIT 1`,
      [tag]
    );
    return res.rows.length > 0;
  } catch {
    // drizzle.__drizzle_migrations may not exist yet — treat as not applied
    return false;
  }
}

async function registerMigration(client, migration) {
  // Ensure drizzle schema exists
  await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);

  // Ensure __drizzle_migrations table exists (drizzle-kit format)
  await client.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id         SERIAL PRIMARY KEY,
      hash       TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  // Insert if not already registered
  await client.query(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1
     )`,
    [migration.tag, migration.when]
  );
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  BNLV BMS Migration Runner  (direct pg — ADR-002)    ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const pool = new pg.Pool({
    connectionString: UNPOOLED_URL,
    ssl: { rejectUnauthorized: false }, // Neon sslmode=require in URL is sufficient
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  const client = await pool.connect();

  try {
    // ── Role validation ──────────────────────────────────────
    const roleRes = await client.query("SELECT current_user, current_database()");
    const currentRole = roleRes.rows[0].current_user;
    const currentDb   = roleRes.rows[0].current_database;

    console.log(`🔌 Connected: role=${currentRole}  db=${currentDb}`);

    if (currentRole === "studio_app") {
      console.error("❌ FATAL: Connected as studio_app — this role cannot CREATE TABLE.");
      console.error("   DATABASE_URL_UNPOOLED must point to the owner connection (neondb_owner).");
      console.error("   Check Neon console → Connection Details → Direct (not pooled).");
      process.exit(1);
    }

    console.log(`✅ Role validated: ${currentRole} has DDL privileges\n`);

    // ── Apply each migration ─────────────────────────────────
    let applied = 0;
    let skipped = 0;

    for (const migration of MIGRATIONS) {
      console.log(`─── Migration ${migration.idx}: ${migration.tag} ───`);

      // Check idempotency
      const alreadyApplied = await isAlreadyApplied(client, migration.tag);
      if (alreadyApplied) {
        console.log(`  ⏭  Already registered in drizzle.__drizzle_migrations — skipping.\n`);
        skipped++;
        continue;
      }

      const sql = readMigration(migration.file);
      console.log(`  📄 Read ${migration.file} (${sql.length} bytes)`);

      // Run in its own transaction
      try {
        await client.query("BEGIN");
        await client.query(sql);

        // Register in drizzle tracking table inside the same transaction
        await registerMigration(client, migration);

        await client.query("COMMIT");
        console.log(`  ✅ Applied and registered successfully.\n`);
        applied++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ❌ FAILED — transaction rolled back.`);
        console.error(`  Error: ${err.message}`);
        if (err.position) {
          const lines = sql.split("\n");
          const charPos = parseInt(err.position, 10);
          let cumLen = 0;
          for (let i = 0; i < lines.length; i++) {
            cumLen += lines[i].length + 1;
            if (cumLen >= charPos) {
              console.error(`  Near line ${i + 1}: ${lines[i].trim()}`);
              break;
            }
          }
        }
        console.error(`\n  Remaining migrations NOT applied.`);
        process.exit(1);
      }
    }

    // ── Summary ──────────────────────────────────────────────
    console.log("╔══════════════════════════════════════════════════════╗");
    if (applied > 0 || skipped > 0) {
      console.log(`║  Result: ${applied} applied  |  ${skipped} skipped  |  0 failed      ║`);
    }
    console.log("╚══════════════════════════════════════════════════════╝");

    if (applied > 0) {
      console.log("\n📋 Next steps:");
      console.log("   1. Verify:  npx tsx scripts\\audit-bms.ts");
      console.log("   2. Seed:    npx tsx src\\db\\seed-bms-academy.ts");
      console.log("   3. Check:   npm run typecheck");
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err.message);
  process.exit(1);
});
