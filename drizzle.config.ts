/**
 * drizzle.config.ts — BNLV Group Enterprise Platform
 * Document ID: BNLV-CFG-DB-001 | Revision: 2.0
 *
 * MERGE DECISIONS (existing project config + enterprise audit config):
 *
 *  1. DATABASE_URL_UNPOOLED preserved (from existing):
 *     Neon exposes two connection strings:
 *       - DATABASE_URL         → PgBouncer pooled   (use in Next.js app queries)
 *       - DATABASE_URL_UNPOOLED → Direct TCP         (required here — drizzle-kit
 *                                                     runs DDL/schema migrations;
 *                                                     PgBouncer does not support
 *                                                     DDL in transaction mode)
 *     Priority: UNPOOLED → DATABASE_URL → fail.
 *
 *  2. Migration output path preserved as ./drizzle/migrations (from existing):
 *     Changing this on a live project breaks migration history tracking.
 *     drizzle-kit resolves applied migrations by comparing ./drizzle/migrations
 *     against the __drizzle_migrations table. Do NOT change this path.
 *
 *  3. SSL enforcement added (from enterprise audit):
 *     Production rejects plaintext connections.
 *     Neon's connection URL already includes ?sslmode=require — this config
 *     adds an explicit layer for defense-in-depth and non-Neon environments.
 *
 *  4. Startup validation added (from enterprise audit):
 *     Fail loudly with actionable message before any DB connection attempt.
 *
 *  5. strict + verbose added (from enterprise audit):
 *     strict: explicit confirmation required before destructive operations.
 *     verbose: every SQL statement logged during CLI execution.
 *
 *  6. Migration schema/table added (from enterprise audit):
 *     Isolates migration tracking in a dedicated 'drizzle' schema — prevents
 *     collision with application tables in the 'public' schema.
 *
 *  7. .env fallback added (from enterprise audit):
 *     dotenv loads .env.local first, then .env as fallback.
 *     Neither file should ever be committed to VCS.
 */

import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// ---------------------------------------------------------------------------
// Environment loading — .env.local takes precedence over .env
// drizzle-kit runs as a CLI tool outside the Next.js runtime, so dotenv
// must be called explicitly here.
// ---------------------------------------------------------------------------

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// ---------------------------------------------------------------------------
// URL resolution
//
// Priority order:
//   1. DATABASE_URL_UNPOOLED — Neon direct TCP connection (required for DDL)
//   2. DATABASE_URL          — fallback for non-Neon or local PostgreSQL
//
// NEVER use the pooled DATABASE_URL for drizzle-kit. PgBouncer's transaction
// pooling mode does not support SET commands, advisory locks, or DDL statements
// that drizzle-kit depends on during migrations.
// ---------------------------------------------------------------------------

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "[drizzle.config] No database URL found.\n" +
    "  Required in .env.local (or injected at runtime):\n" +
    "    DATABASE_URL_UNPOOLED=postgresql://...   ← preferred (Neon direct)\n" +
    "    DATABASE_URL=postgresql://...            ← fallback (local / non-Neon)\n" +
    "  Copy .env.example to .env.local and populate both values."
  );
}

// ---------------------------------------------------------------------------
// SSL configuration
//
// Production: SSL enforced with certificate verification.
// Development: SSL disabled (local PostgreSQL typically has no TLS).
//
// NOTE for Neon users: Neon's connection string already includes
// ?sslmode=require. This config layer adds explicit rejectUnauthorized
// enforcement as a second control — defense-in-depth.
//
// Optional env vars:
//   DATABASE_SSL_CA                   — PEM string for custom CA chain
//   DATABASE_SSL_REJECT_UNAUTHORIZED  — set to "false" ONLY in local dev
//                                       with a self-signed cert
// ---------------------------------------------------------------------------

const isProduction = process.env.NODE_ENV === "production";
const sslCa = process.env.DATABASE_SSL_CA;
const rejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";

const sslConfig = isProduction
  ? {
      rejectUnauthorized: true,            // Always true in production — not configurable
      ...(sslCa ? { ca: sslCa } : {}),
    }
  : false;                                 // Disabled in local dev

// ---------------------------------------------------------------------------
// Drizzle Kit configuration
// ---------------------------------------------------------------------------

export default defineConfig({
  dialect: "postgresql",

  // Single source of truth for the database schema
  schema: "./src/db/schema.ts",

  // PRESERVED from existing project: do not change on a live deployment.
  // Changing this path causes drizzle-kit to lose track of applied migrations.
  out: "./drizzle/migrations",

  dbCredentials: {
    url: databaseUrl,
    ssl: sslConfig,
  },

  migrations: {
    // Dedicated PostgreSQL schema for migration tracking.
    // Keeps __drizzle_migrations out of the public schema.
    schema: "drizzle",
    table:  "__drizzle_migrations",
  },

  // Require explicit confirmation before any destructive operation
  // (e.g., DROP TABLE, DROP COLUMN). Prevents accidental data loss.
  strict: true,

  // Log every SQL statement executed by the drizzle-kit CLI.
  // Disable if output becomes too noisy during routine migrations.
  verbose: true,
});
