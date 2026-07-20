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
import type { NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// EDGE RUNTIME: WebSocket constructor for Cloudflare/Vercel Edge
// ─────────────────────────────────────────────────────────────────────────────

if (
  typeof process === "undefined" ||
  process.env.NEXT_RUNTIME === "edge" ||
  process.env.CF_WORKER === "true"
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    console.warn(`[db/index] Warning: Missing environment variable: "${name}".`);
    return "";
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
// POOL CONNECTION MANAGER
// ─────────────────────────────────────────────────────────────────────────────

const globalForDb = globalThis as typeof globalThis & {
  __bnlvStudioPool?: Pool;
};

function getPool(): Pool {
  if (!globalForDb.__bnlvStudioPool) {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("connect", (client) => {
      client.query(SESSION_INIT_SQL).catch((err: Error) => {
        console.error("[db/pool] Failed to apply session init SQL:", err.message);
      });
    });

    pool.on("error", (err: Error) => {
      console.error("[db/pool] Unexpected idle client error:", err.message);
    });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__bnlvStudioPool = pool;
    }

    globalForDb.__bnlvStudioPool = pool;
  }
  return globalForDb.__bnlvStudioPool;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getDb() — Shared Drizzle Instance (No RLS)
// ─────────────────────────────────────────────────────────────────────────────

let _db: NeonDatabase<typeof schema> | null = null;

export async function getDb(): Promise<NeonDatabase<typeof schema>> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
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
  const database = await getDb();
  return database.transaction(async (tx) => {
    await tx.execute(sql`set local app.current_tenant_id = ${tenantId.toString()}`);
    return await callback(tx);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. createTenantClient() — RLS via Connection Leasing
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantClient {
  db: NeonDatabase<typeof schema>;
  cleanup: () => Promise<void>;
}

export async function createTenantClient(tenantId: string | number): Promise<TenantClient> {
  if (!tenantId) {
    throw new Error("[db/index] Invalid tenantId provided to createTenantClient.");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(SESSION_INIT_SQL);
    await client.query(
      "SELECT set_config('app.current_tenant_id', $1::text, false)",
      [tenantId.toString()]
    );
  } catch (err) {
    client.release(true); 
    throw err;
  }

  const tenantDb = drizzle(client as unknown as Pool, { schema });

  return {
    db: tenantDb,
    cleanup: async () => {
      try {
        await client.query("SELECT set_config('app.current_tenant_id', '', false)");
      } finally {
        client.release();
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. getMigrationClient() — HTTP transport for Drizzle-kit
// ─────────────────────────────────────────────────────────────────────────────

let _migrationDb: NeonDatabase<typeof schema> | null = null;

export function getMigrationClient(): NeonDatabase<typeof schema> {
  if (!_migrationDb) {
    const sqlConnection = neon(DATABASE_URL_UNPOOLED) as NeonQueryFunction<boolean, boolean>;
    _migrationDb = drizzle(sqlConnection, { schema });
  }
  return _migrationDb;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. checkDbHealth() & closeDb()
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
}