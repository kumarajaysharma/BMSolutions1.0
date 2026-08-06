// File: src/lib/db/with-tenant.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Executes a database transaction scoped to a specific tenant.
 * Enforces Row-Level Security (RLS) by explicitly setting 'app.current_tenant_id'
 * and ensuring the transaction retains the session context.
 */
export async function withTenant<T>(
  tenantId: string | number,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  const tenantStr = String(tenantId);
  
  return await db.transaction(async (tx) => {
    // 1. Set the tenant ID for the current transaction scope ONLY (is_local = true)
    // We use sql.raw() to avoid parameterization issues on session configuration
    await tx.execute(sql.raw(`SELECT set_config('app.current_tenant_id', '${tenantStr}', true)`));
    
    // Also set app.current_tenant just in case any older RLS policies rely on it
    await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${tenantStr}', true)`));
    
    // 2. Execute the user callback with the bound transaction connection
    return await callback(tx as typeof db);
  });
}