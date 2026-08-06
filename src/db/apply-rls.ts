/**
 * src/db/apply-rls.ts
 * BNLV Group Enterprise — Raw SQL Migration Executor
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';
import { getDirectDb, closeDb } from './index';

async function applySecurityPolicies() {
  console.log("🔐 [SECURITY] Initiating Nidhivan RLS Hardening Deployment...");
  
  try {
    const db = await getDirectDb();
    
    // Resolve the path to the manual SQL migration file
    const sqlPath = path.join(process.cwd(), 'drizzle', 'migrations', '0005_nidhivan_rls_hardening.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File not found: ${sqlPath}`);
    }

    const query = fs.readFileSync(sqlPath, 'utf8');

    // Execute the raw query utilizing the unpooled direct connection
    await db.execute(sql.raw(query));
    
    console.log("✅ [SECURITY] Nidhivan RLS Policies and Migrator Bypasses successfully applied.");
  } catch (error) {
    console.error("❌ [SECURITY FATAL] Failed to apply RLS hardening:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Closing database connections...");
    await closeDb();
    process.exit(0);
  }
}

applySecurityPolicies();