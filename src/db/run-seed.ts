/**
 * src/db/run-seed.ts
 * BNLV Group Enterprise — CLI Execution Wrapper (Migrator Escalation)
 * 
 * SRE Note: Injects `SET ROLE studio_migrator` to bypass fractured 
 * RLS default-deny states during commercial deployment initialization.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { 
  nidhivanProjects, 
  nidhivanDprs, 
  builderComponents, 
  tenants,
  auditLogs,
  projects
} from './schema.js';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

async function run() {
  console.log("🚀 [CLI] Initiating Production Data Seeding (Migrator Escalation)...");
  
  const TARGET_TENANT_ID = 1;
  const EXECUTING_USER_ID = 1;
  const CLIENT_IP = "system-cli-execution"; 

  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  const db = drizzle(client);

  try {
    const [tenantExists] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, TARGET_TENANT_ID))
      .limit(1);

    if (!tenantExists) {
      throw new Error(`[SEED CRITICAL] Tenant ID ${TARGET_TENANT_ID} not found.`);
    }

    console.log(`[SEED START] Escalating privileges to bypass RLS for Tenant: ${tenantExists.name} (ID: ${TARGET_TENANT_ID}).`);

    await db.transaction(async (tx) => {
      
      // 1. ESCALATION: Switch to the BYPASSRLS role established in 0002_enable_rls.sql
      await tx.execute(sql.raw(`SET ROLE studio_migrator;`));
      
      // 2. Pin context for audit logging
      await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${TARGET_TENANT_ID}';`));

      // ─── NIDHIVAN CONSULTING TRACK ──────────────────────────────────────────
      const [project] = await tx
        .insert(nidhivanProjects)
        .values({
          tenantId: TARGET_TENANT_ID,
          projectCode: "BNLV-INFRA-2026",
          projectTitle: "New Delhi Smart City Hub - Core Micro-Grid",
          projectType: "infrastructure",
          sector: "Urban Development",
          implementingAgency: "Delhi Development Authority",
          projectState: "New Delhi",
          totalCostPaise: 89000000000, 
          createdBy: EXECUTING_USER_ID,
          status: "dpr_preparation"
        })
        .onConflictDoUpdate({
          target: [nidhivanProjects.tenantId, nidhivanProjects.projectCode],
          set: { projectTitle: "New Delhi Smart City Hub - Core Micro-Grid", totalCostPaise: 89000000000 }
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: TARGET_TENANT_ID,
        actor: String(EXECUTING_USER_ID),
        action: "seed.nidhivan_project.upsert",
        target: project.projectCode,
        severity: "info",
        ipAddress: CLIENT_IP,
        metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
      });

      const dprNumber = "DPR-BNLV-2026-001";
      const [existingDpr] = await tx
        .select()
        .from(nidhivanDprs)
        .where(and(eq(nidhivanDprs.projectId, project.id), eq(nidhivanDprs.dprNumber, dprNumber)))
        .limit(1);

      if (!existingDpr) {
        await tx.insert(nidhivanDprs).values({
          tenantId: TARGET_TENANT_ID,
          projectId: project.id,
          dprNumber: dprNumber,
          title: "Detailed Project Report - Smart City Micro-Grid Phase I",
          financialYear: "2026-2027",
          totalProjectCostPaise: 89000000000,
          createdBy: EXECUTING_USER_ID,
          status: "draft"
        });
        
        await tx.insert(auditLogs).values({
          tenantId: TARGET_TENANT_ID,
          actor: String(EXECUTING_USER_ID),
          action: "seed.nidhivan_dpr.insert",
          target: dprNumber,
          severity: "info",
          ipAddress: CLIENT_IP,
          metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
        });
      }

      // ─── VIHANG CREATIONS TRACK ─────────────────────────────────────────────
      let [globalProject] = await tx
        .select()
        .from(projects)
        .where(and(eq(projects.tenantId, TARGET_TENANT_ID), eq(projects.name, "Global System Layout Space")))
        .limit(1);

      if (!globalProject) {
        [globalProject] = await tx.insert(projects).values({
          tenantId: TARGET_TENANT_ID,
          name: "Global System Layout Space",
          description: "Global brand layout assets",
          status: "deployed"
        }).returning();
      }

      const [existingComponent] = await tx
        .select()
        .from(builderComponents)
        .where(and(
          eq(builderComponents.projectId, globalProject.id),
          eq(builderComponents.name, "Vihang Heraldic Design Engine Tokens")
        ))
        .limit(1);

      if (!existingComponent) {
        await tx.insert(builderComponents).values({
          tenantId: TARGET_TENANT_ID,
          projectId: globalProject.id, 
          name: "Vihang Heraldic Design Engine Tokens",
          type: "styling-token",
          sortOrder: 0,
          config: {
            typography: { primary: "Cinzel", secondary: "Inter" },
            colors: { primaryNavy: "#002040", heraldicGold: "#C5A059" }
          },
          props: { activeBaseline: "v5.1-Production" }
        });

        await tx.insert(auditLogs).values({
          tenantId: TARGET_TENANT_ID,
          actor: String(EXECUTING_USER_ID),
          action: "seed.vihang_tokens.insert",
          target: "Vihang Heraldic Design Engine Tokens",
          severity: "info",
          ipAddress: CLIENT_IP,
          metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
        });
      }
    });

    console.log("✅ [CLI] Production seeding completed successfully.");

  } catch (error) {
    console.error("❌ [CLI] FATAL ERROR during seeding execution:", error);
    process.exit(1);
  } finally {
    console.log("🔌 [CLI] Closing database connections...");
    await client.end();
    process.exit(0);
  }
}

run();