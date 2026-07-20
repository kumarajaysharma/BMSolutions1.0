/**
 * scripts/seed.mjs
 *
 * BNLV Studio — Database Seed Script
 * ====================================
 * Creates the master tenant and SuperAdmin account.
 * Safe to re-run: checks for existing data before inserting.
 *
 * USAGE:
 *   node scripts/seed.mjs
 *
 * REQUIREMENTS:
 *   - DATABASE_URL_UNPOOLED must be set in .env.local
 *   - Run AFTER drizzle-kit migrate and AFTER 0002_enable_rls.sql
 *   - Run as the studio_migrator role (which bypasses RLS)
 *
 * WHAT IT CREATES:
 *   Tenant:  name="BNLV Group"  slug="bnlv"  plan="enterprise"
 *   User:    name="Ajay Kumar"   email="admin@bmsolutions.com"  role="owner"
 *   Password: BMS@Studio2025!
 *
 *   Change the password immediately after first login.
 */

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { promisify } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────────
// LOAD .env.local
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  if (!existsSync(envPath)) {
    console.error("✗ .env.local not found at", envPath);
    console.error("  Create it with DATABASE_URL_UNPOOLED set.");
    process.exit(1);
  }

  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;
if (!DATABASE_URL_UNPOOLED) {
  console.error("✗ DATABASE_URL_UNPOOLED is not set in .env.local");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const SEED = {
  tenant: {
    name: "BNLV Group",
    slug: "bnlv", // Matches the workspace slug requested by the login form
    plan: "enterprise",
    region: "ap-south-1",
  },
  user: {
    name: "Ajay Kumar",
    email: "admin@bmsolutions.com",
    password: "BMS@Studio2025!", // Change on first login
    role: "owner",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CRYPTO — scrypt password hash
// ─────────────────────────────────────────────────────────────────────────────

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = await scryptAsync(password, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024, // Increased memory ceiling to prevent 'memory limit exceeded' error
  });
  return `$scrypt$N=32768,r=8,p=1$${salt.toString("base64url")}$${dk.toString("base64url")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB — raw pg connection
// ─────────────────────────────────────────────────────────────────────────────

async function getClient() {
  const { default: pg } = await import("pg");
  const { Client } = pg;

  const client = new Client({
    connectionString: DATABASE_URL_UNPOOLED,
    // Bypasses self-signed certificate chain error with Supabase pooler
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const { rows } = await client.query(
    "SELECT current_user, pg_has_role(current_user, 'studio_migrator', 'member') AS is_migrator"
  );
  const row = rows[0];
  console.log(`  Connected as: ${row.current_user}`);

  if (!row.is_migrator && row.current_user !== "studio_migrator") {
    console.warn(
      "  ⚠  Warning: not running as studio_migrator. " +
      "If RLS is enabled, inserts may be blocked."
    );
  }

  return client;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED STEPS
// ─────────────────────────────────────────────────────────────────────────────

async function seedTenant(client) {
  console.log("\n── Tenant ──────────────────────────────────");

  const existing = await client.query(
    "SELECT id, name, slug FROM tenants WHERE slug = $1",
    [SEED.tenant.slug]
  );

  if (existing.rows.length > 0) {
    const t = existing.rows[0];
    console.log(`  ✓ Tenant already exists: "${t.name}" (id=${t.id}, slug="${t.slug}")`);
    return t.id;
  }

  const result = await client.query(
    `INSERT INTO tenants (name, slug, plan, region, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
     RETURNING id, name, slug`,
    [SEED.tenant.name, SEED.tenant.slug, SEED.tenant.plan, SEED.tenant.region]
  );

  const t = result.rows[0];
  console.log(`  ✓ Created tenant: "${t.name}" (id=${t.id}, slug="${t.slug}")`);
  return t.id;
}

async function seedUser(client, tenantId) {
  console.log("\n── User ────────────────────────────────────");

  const existing = await client.query(
    "SELECT id, name, email FROM users WHERE email = $1 AND tenant_id = $2",
    [SEED.user.email, tenantId]
  );

  if (existing.rows.length > 0) {
    const u = existing.rows[0];
    console.log(`  ✓ User already exists: "${u.name}" <${u.email}> (id=${u.id})`);
    return u.id;
  }

  console.log("  Hashing password (scrypt N=32768)…");
  const passwordHash = await hashPassword(SEED.user.password);

  const result = await client.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role, active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING id, name, email, role`,
    [tenantId, SEED.user.name, SEED.user.email, passwordHash, SEED.user.role]
  );

  const u = result.rows[0];
  console.log(`  ✓ Created user: "${u.name}" <${u.email}> role=${u.role} (id=${u.id})`);
  return u.id;
}

async function seedAuditLog(client, tenantId, userId) {
  await client.query(
    `INSERT INTO audit_logs (tenant_id, actor, action, target, severity, metadata, ip_address, created_at)
     VALUES ($1, $2, 'seed.init', 'database', 'info', $3, '127.0.0.1', NOW())`,
    [
      tenantId,
      userId.toString(),
      JSON.stringify({ script: "scripts/seed.mjs", node: process.version }),
    ]
  );
  console.log("\n── Audit ───────────────────────────────────");
  console.log("  ✓ Seed audit log entry written");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║    BNLV Studio — Database Seed           ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\n  Target: ${DATABASE_URL_UNPOOLED.replace(/:[^:@]+@/, ":****@")}`);

  let client;
  try {
    client = await getClient();

    const tenantId = await seedTenant(client);
    const userId = await seedUser(client, tenantId);
    await seedAuditLog(client, tenantId, userId);

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║    Seed complete. Login credentials:     ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log(`║  Workspace : ${SEED.tenant.slug.padEnd(28)}║`);
    console.log(`║  Email     : ${SEED.user.email.padEnd(28)}║`);
    console.log(`║  Password  : ${SEED.user.password.padEnd(28)}║`);
    console.log("╠══════════════════════════════════════════╣");
    console.log("║  ⚠  Change the password after first      ║");
    console.log("║     login. Do not share these creds.    ║");
    console.log("╚══════════════════════════════════════════╝\n");
  } catch (err) {
    console.error("\n✗ Seed failed:", err.message);
    if (err.code === "42P01") {
      console.error("  Table not found. Have you run drizzle-kit migrate?");
    } else if (err.code === "42501") {
      console.error("  Permission denied. Is DATABASE_URL_UNPOOLED using studio_migrator role?");
    } else if (err.code === "23505") {
      console.error("  Unique constraint violation — record already exists.");
    }
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

main();