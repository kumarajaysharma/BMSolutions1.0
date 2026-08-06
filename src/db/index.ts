/**
 * src/db/index.ts
 *
 * BNLV Studio — Production Neon Serverless DB Client
 */

// --- FIX: Explicitly load .env.local ---
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// ---------------------------------------

import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// EDGE RUNTIME: WebSocket constructor for Cloudflare/Vercel Edge
// ─────────────────────────────────────────────────────────────────────────────

if (
  typeof process === "undefined" ||
  process.env.NEXT_RUNTIME === "edge" ||
  process.env.CF_WORKER === "true"
) {
  const ws = (globalThis as any).WebSocket;
  if (ws) {
    neonConfig.webSocketConstructor = ws;
  }
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineConnect = false; 
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[db/index] CRITICAL: Missing environment variable: "${name}".`);
    } else {
      console.warn(`[db/index] Warning: Missing environment variable: "${name}".`);
      return "";
    }
  }
  return value.trim();
}

const DATABASE_URL = requireEnv("DATABASE_URL");
const DATABASE_URL_UNPOOLED = requireEnv("DATABASE_URL_UNPOOLED");

// ─────────────────────────────────────────────────────────────────────────────
// SESSION INIT SQL
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_INIT_SQL = `
  SET statement_timeout = '10s';
  SET idle_in_transaction_session_timeout = '30s';
  SET lock_timeout = '5s';
  SET application_name = 'bnlv-studio-app';
  SET search_path = public;
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// POOL CONNECTION MANAGERS
// ─────────────────────────────────────────────────────────────────────────────

const globalForDb = globalThis as typeof globalThis & {
  __bnlvStudioPool?: Pool;
  __bnlvDirectPool?: Pool;
};

// Standard pool via PgBouncer for lightweight read/write operations (No RLS Context required)
function getPool(): Pool {
  if (!globalForDb.__bnlvStudioPool) {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("connect", (client: any) => {
      client.query(SESSION_INIT_SQL).catch((err: Error) => {
        console.error("[db/pool] Failed to apply session init SQL:", err.message);
      });
    });

    pool.on("error", (err: Error) => {
      console.error("[db/pool] Unexpected idle client error:", err.message);
    });

    globalForDb.__bnlvStudioPool = pool;
  }
  return globalForDb.__bnlvStudioPool;
}

// Direct connection pool bypassing PgBouncer specifically for RLS Transaction Integrity
function getDirectPool(): Pool {
  if (!globalForDb.__bnlvDirectPool) {
    const pool = new Pool({
      connectionString: DATABASE_URL_UNPOOLED,
      ssl: { rejectUnauthorized: true },
      max: 5, // Limiting concurrent direct unpooled connections
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("connect", (client: any) => {
      client.query(SESSION_INIT_SQL).catch((err: Error) => {
        console.error("[db/directPool] Failed to apply session init SQL:", err.message);
      });
    });

    pool.on("error", (err: Error) => {
      console.error("[db/directPool] Unexpected idle client error:", err.message);
    });

    globalForDb.__bnlvDirectPool = pool;
  }
  return globalForDb.__bnlvDirectPool;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getDb() & getDirectDb() — Shared Drizzle Instances
// ─────────────────────────────────────────────────────────────────────────────

let _db: NeonDatabase<typeof schema> | null = null;
let _directDb: NeonDatabase<typeof schema> | null = null;

export async function getDb(): Promise<NeonDatabase<typeof schema>> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export async function getDirectDb(): Promise<NeonDatabase<typeof schema>> {
  if (!_directDb) {
    _directDb = drizzle(getDirectPool(), { schema });
  }
  return _directDb;
}

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_target, prop) {
    if (!_db) _db = drizzle(getPool(), { schema });
    return _db[prop as keyof NeonDatabase<typeof schema>];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. withTenant() — RLS via Transactions (Safest Serverless Pattern)
// ─────────────────────────────────────────────────────────────────────────────

export async function withTenant<T>(
  tenantId: string | number,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error("[db/index] CRITICAL: Invalid falsy tenantId provided to withTenant().");
  }

  // Use direct DB instance to bypass PgBouncer and guarantee SET LOCAL isolation
  const database = await getDirectDb();
  
  return database.transaction(async (tx) => {
    // Parameter-safe equivalent to SET LOCAL using true flag for transaction-scoped duration
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId.toString()}::text, true)`);
    return await callback(tx);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. getMigrationClient() — HTTP transport for Drizzle-kit
// ─────────────────────────────────────────────────────────────────────────────

let _migrationDb: NeonDatabase<typeof schema> | null = null;

export function getMigrationClient(): NeonDatabase<typeof schema> {
  if (!_migrationDb) {
    const sqlConnection = neon(DATABASE_URL_UNPOOLED);
    _migrationDb = drizzle(sqlConnection as any, { schema });
  }
  return _migrationDb;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. checkDbHealth() & closeDb()
// ─────────────────────────────────────────────────────────────────────────────

export async function checkDbHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const database = await getDb();
    await database.execute(sql`SELECT 1`);
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function closeDb(): Promise<void> {
  if (globalForDb.__bnlvStudioPool) {
    await globalForDb.__bnlvStudioPool.end();
    globalForDb.__bnlvStudioPool = undefined;
    _db = null;
  }
  if (globalForDb.__bnlvDirectPool) {
    await globalForDb.__bnlvDirectPool.end();
    globalForDb.__bnlvDirectPool = undefined;
    _directDb = null;
  }
}