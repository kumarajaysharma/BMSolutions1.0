#!/usr/bin/env node
/**
 * scripts/provision-tenant.mjs
 * 
 * Safely provisions a tenant workspace and an administrative user 
 * addressing schema constraints for name and composite unique indexes.
 * Updated to generate $scrypt$ hashes and correctly assign the admin role.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Prioritize loading .env.local to access DATABASE_URL_UNPOOLED
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const slug = getArg("slug");
const name = getArg("name");
const plan = getArg("plan") || "enterprise";
const email = getArg("admin-email");
const password = getArg("admin-password");

if (!slug || !name || !email || !password) {
  console.error("❌ Missing required arguments.");
  console.error("Usage: node scripts/provision-tenant.mjs --slug <slug> --name <name> --plan <plan> --admin-email <email> --admin-password <password>");
  process.exit(1);
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Database URL is not set in environment variables.");
  process.exit(1);
}

// Use standard pg client with SSL enabled for Neon/Supabase compatibility
const pool = new pg.Pool({ 
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

// Helper to generate $scrypt$ hashes compatible with BNLV auth requirements
function hashPasswordScrypt(plainText) {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1;
  const hash = crypto.scryptSync(plainText, salt, 64, { N, r, p });
  return `$scrypt$N=${N},r=${r},p=${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function main() {
  try {
    console.log(`⏳ Provisioning tenant workspace '${slug}' (${name})...`);

    // 1. Check or Insert Tenant
    let tenantId;
    const existingTenant = await pool.query(`SELECT id FROM tenants WHERE slug = $1`, [slug]);
    
    if (existingTenant.rows.length > 0) {
      tenantId = existingTenant.rows[0].id;
      await pool.query(
        `UPDATE tenants SET name = $1, plan = $2 WHERE id = $3`,
        [name, plan, tenantId]
      );
      console.log(`✅ Tenant updated with ID: ${tenantId}`);
    } else {
      const tenantRes = await pool.query(
        `INSERT INTO tenants (slug, name, plan, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id`,
        [slug, name, plan]
      );
      tenantId = tenantRes.rows[0].id;
      console.log(`✅ Tenant created with ID: ${tenantId}`);
    }

    // 2. Hash password securely using scrypt (required by diagnostic)
    const passwordHash = hashPasswordScrypt(password);
    
    // 3. Apply explicit Super Admin Developer identity
    const userName = "पंडित अजय शर्मा";

    // 4. Check or Insert User using composite tenant_id and email check
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
      console.log(`✅ Admin user updated: ${email} (ID: ${userId})`);
    } else {
      const userRes = await pool.query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, 'admin', NOW()) RETURNING id`,
        [tenantId, userName, email, passwordHash]
      );
      console.log(`✅ Admin user created: ${email} (ID: ${userRes.rows[0].id})`);
    }

    console.log(`🎉 Successfully provisioned workspace: ${slug}`);
  } catch (err) {
    console.error("❌ Provisioning failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();