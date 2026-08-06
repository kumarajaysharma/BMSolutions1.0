#!/usr/bin/env node
/**
 * migrate.mjs (Project Root)
 *
 * Runs all pending Drizzle migrations against the target database.
 * Explicitly loads .env.production for environment variables.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Pool }   from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicitly load .env.production
dotenv.config({ path: path.resolve(__dirname, ".env.production") });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("❌  DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set in .env.production.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db   = drizzle(pool);

console.log("⏳  Running migrations...");

try {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "./drizzle/migrations"),
  });
  console.log("✅  Migrations complete.");
} catch (error) {
  console.error("❌  Migration failed:", error);
  process.exit(1);
} finally {
  await pool.end();
}