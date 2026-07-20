/**
 * scripts/run-rls.mjs
 *
 * Executes the RLS migration script using Node.js.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error(`✗ .env.local not found at: ${envPath}`);
    process.exit(1);
  }

  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

async function main() {
  // Validate Required Variables
  const required = ["DATABASE_URL_UNPOOLED", "STUDIO_APP_PASSWORD", "STUDIO_MIGRATOR_PASSWORD"];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`✗ Missing required environment variables: ${missing.join(", ")}`);
    console.error("Please add these to your .env.local file.");
    process.exit(1);
  }

  const sqlPath = resolve(process.cwd(), "drizzle/migrations/0002_enable_rls.sql");
  if (!existsSync(sqlPath)) {
    console.error(`✗ Migration file not found at: ${sqlPath}`);
    process.exit(1);
  }

  let sql = readFileSync(sqlPath, "utf-8");

  // Replace placeholders
  sql = sql.replace(/:STUDIO_APP_PASSWORD/g, `'${process.env.STUDIO_APP_PASSWORD}'`);
  sql = sql.replace(/:STUDIO_MIGRATOR_PASSWORD/g, `'${process.env.STUDIO_MIGRATOR_PASSWORD}'`);

  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();
    console.log("🚀 Executing RLS migration...");
    await client.query(sql);
    console.log("✅ RLS migration applied successfully.");
  } catch (err) {
    console.error("✗ Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

main();