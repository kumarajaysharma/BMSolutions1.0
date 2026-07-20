/**
 * scripts/create-user.mjs
 *
 * BNLV Studio — Database User Creation
 * ====================================
 * Adds additional users to an existing tenant.
 *
 * USAGE:
 *   node scripts/create-user.mjs \
 *     --tenant bmsolutions \
 *     --name "Jos Parera" \
 *     --email jos@bmsolutions.com \
 *     --role admin \
 *     --password "Temp@2025!"
 *
 * ROLES: owner | admin | architect | developer | designer | viewer
 */

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { promisify } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// LOAD .env.local
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  if (!existsSync(envPath)) return;
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

// ─────────────────────────────────────────────────────────────────────────────
// PARSE CLI ARGS
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return result;
}

const VALID_ROLES = ["owner", "admin", "architect", "developer", "designer", "viewer"];

function validateArgs(args) {
  const required = ["tenant", "name", "email", "role", "password"];
  for (const key of required) {
    if (!args[key]) {
      console.error(`✗ Missing required argument: --${key}`);
      console.error("  Usage: node scripts/create-user.mjs --tenant <slug> --name <name> --email <email> --role <role> --password <password>");
      process.exit(1);
    }
  }
  if (!VALID_ROLES.includes(args.role)) {
    console.error(`✗ Invalid role: "${args.role}". Must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (args.password.length < 8) {
    console.error("✗ Password must be at least 8 characters");
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRYPTO — scrypt password hash
// ─────────────────────────────────────────────────────────────────────────────

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = await scryptAsync(password, salt, 32, { N: 32768, r: 8, p: 1 });
  return `$scrypt$N=32768,r=8,p=1$${salt.toString("base64url")}$${dk.toString("base64url")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  validateArgs(args);

  const dbUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    console.error("✗ DATABASE_URL_UNPOOLED is not set in .env.local");
    process.exit(1);
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();

    // 1. Resolve tenant
    const tenantResult = await client.query(
      "SELECT id, name FROM tenants WHERE slug = $1 AND status = 'active'",
      [args.tenant]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`✗ Tenant not found or not active: "${args.tenant}"`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`  Tenant: "${tenant.name}" (id=${tenant.id})`);

    // 2. Check for duplicate user
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1 AND tenant_id = $2",
      [args.email.toLowerCase(), tenant.id]
    );

    if (existing.rows.length > 0) {
      console.error(`✗ User already exists: ${args.email} in tenant ${args.tenant}`);
      process.exit(1);
    }

    // 3. Hash password
    console.log("  Hashing password…");
    const passwordHash = await hashPassword(args.password);

    // 4. Insert user
    const result = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, name, email, role`,
      [tenant.id, args.name, args.email.toLowerCase(), passwordHash, args.role]
    );

    // 5. Audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, actor, action, target, severity, ip_address, created_at)
       VALUES ($1, 'seed-script', 'user.create', $2, 'info', '127.0.0.1', NOW())`,
      [tenant.id, `user:${result.rows[0].id}`]
    );

    const u = result.rows[0];
    console.log(`\n  ✓ User created:`);
    console.log(`    Name    : ${u.name}`);
    console.log(`    Email   : ${u.email}`);
    console.log(`    Role    : ${u.role}`);
    console.log(`    Tenant  : ${args.tenant}`);
    console.log(`    User ID : ${u.id}\n`);
    
  } catch (err) {
    console.error("✗ Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();