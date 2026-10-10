#!/usr/bin/env node
/**
 * scripts/provision-tenant.mjs
 *
 * Safely provisions a tenant workspace and an administrative user.
 *
 * FIX (2026-10-09): salt and hash now encoded as base64url (not base64)
 *   to match the verifyScryptHash() decoder in login/route.ts.
 *   Standard base64 uses +/; base64url uses -_. The mismatch caused
 *   Buffer.from(parts[3], "base64url") to mis-decode +/→ garbage,
 *   producing wrong key bytes and timingSafeEqual() failures for ~100%
 *   of 64-byte hashes.
 *
 * FIX (2026-10-09): tenant INSERT now explicitly sets status = 'active'
 *   to satisfy the login check: tenantRows[0].status === "active".
 *   Without this, provisioned tenants cannot log in if the column default
 *   is anything other than 'active'.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const slug          = getArg("slug");
const name          = getArg("name");
const plan          = getArg("plan") || "enterprise";
const email         = getArg("admin-email");
const password      = getArg("admin-password");

if (!slug || !name || !email || !password) {
  console.error("Missing required arguments.");
  console.error(
    "Usage: node scripts/provision-tenant.mjs " +
    "--slug <slug> --name <name> --plan <plan> " +
    "--admin-email <email> --admin-password <password>"
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED is not set.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

/**
 * Generates a $scrypt$ hash using base64url encoding throughout.
 * MUST match verifyScryptHash() in src/app/api/auth/login/route.ts:
 *   Buffer.from(parts[3], "base64url")  ← salt
 *   Buffer.from(parts[4], "base64url")  ← derivedKey
 */
function hashPasswordScrypt(plainText) {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1;
  // 32-byte derived key — matches generateScryptHash() in login route
  const dk = crypto.scryptSync(plainText, salt, 32, {
    N, r, p,
    maxmem: 64 * 1024 * 1024,
  });
  // base64url — NO +/ padding characters
  return `$scrypt$N=${N},r=${r},p=${p}$${salt.toString("base64url")}$${dk.toString("base64url")}`;
}

async function main() {
  try {
    console.log(`Provisioning tenant '${slug}' (${name})...`);

    // 1. Upsert Tenant — always set status = 'active'
    let tenantId;
    const existing = await pool.query(
      `SELECT id FROM tenants WHERE slug = $1`,
      [slug]
    );

    if (existing.rows.length > 0) {
      tenantId = existing.rows[0].id;
      await pool.query(
        `UPDATE tenants SET name = $1, plan = $2, status = 'active' WHERE id = $3`,
        [name, plan, tenantId]
      );
      console.log(`Tenant updated — ID: ${tenantId}, status set to active`);
    } else {
      const res = await pool.query(
        `INSERT INTO tenants (slug, name, plan, status, created_at)
         VALUES ($1, $2, $3, 'active', NOW())
         RETURNING id`,
        [slug, name, plan]
      );
      tenantId = res.rows[0].id;
      console.log(`Tenant created — ID: ${tenantId}`);
    }

    // 2. Hash password — base64url encoded, 32-byte dk
    const passwordHash = hashPasswordScrypt(password);

    // 3. Upsert Admin User
    const userName = "पंडित अजय शर्मा";
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE tenant_id = $1 AND email = $2`,
      [tenantId, email]
    );

    if (existingUser.rows.length > 0) {
      const userId = existingUser.rows[0].id;
      await pool.query(
        `UPDATE users SET name = $1, password_hash = $2, role = 'admin' WHERE id = $3`,
        [userName, passwordHash, userId]
      );
      console.log(`Admin updated — ${email} (ID: ${userId})`);
    } else {
      const userRes = await pool.query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, active, created_at)
         VALUES ($1, $2, $3, $4, 'admin', true, NOW())
         RETURNING id`,
        [tenantId, userName, email, passwordHash]
      );
      console.log(`Admin created — ${email} (ID: ${userRes.rows[0].id})`);
    }

    console.log(`Workspace provisioned: ${slug} (tenant ID: ${tenantId})`);
  } catch (err) {
    console.error("Provisioning failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
