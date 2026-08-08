/**
 * src/db/run-seed.ts
 * BNLV Group Enterprise — CLI Execution Wrapper (Native Admin Seeder)
 *
 * Architecture Decision (ADR-002): SET ROLE studio_migrator is permanently
 * retired. Neon's serverless infrastructure blocks lateral role switching for
 * non-superusers. This script executes via the primary DB owner connection,
 * which carries implicit superuser privileges and bypasses RLS natively.
 * No role escalation is required or attempted.
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
  console.log("🚀 [CLI] Initiating Production Data Seeding (Native Admin Execution)...");

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

    console.log(`[SEED START] Seeding platform data for Tenant: ${tenantExists.name} (ID: ${TARGET_TENANT_ID}).`);

    await db.transaction(async (tx) => {

      // Pin tenant context for audit logging (session-local — does not persist across connections)
      await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${TARGET_TENANT_ID}';`));

      // ─── NIDHIVAN CONSULTING TRACK ──────────────────────────────────────────
      // Scope: Tenant 1 (BNLV HQ) platform-level demonstration project.
      // Note: Tenant 10 (Nidhivan Consulting) domain data is seeded via
      //       src/db/seed-nidhivan.ts executed separately.

      const [existingProject] = await tx
        .select()
        .from(nidhivanProjects)
        .where(and(
          eq(nidhivanProjects.tenantId, TARGET_TENANT_ID),
          eq(nidhivanProjects.projectCode, "BNLV-INFRA-2026")
        ))
        .limit(1);

      let project: typeof nidhivanProjects.$inferSelect;

      if (!existingProject) {
        const [inserted] = await tx
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
          .returning();

        project = inserted;

        await tx.insert(auditLogs).values({
          tenantId: TARGET_TENANT_ID,
          actor: String(EXECUTING_USER_ID),
          action: "seed.nidhivan_project.insert",
          target: project.projectCode,
          severity: "info",
          ipAddress: CLIENT_IP,
          metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
        });

        console.log(`✅ [CLI] Seeded Nidhivan demo project: ${project.projectCode}`);
      } else {
        project = existingProject;
        console.log(`⏭️  [CLI] Nidhivan demo project already exists (${existingProject.projectCode}). Skipping.`);
      }

      const dprNumber = "DPR-BNLV-2026-001";
      const [existingDpr] = await tx
        .select()
        .from(nidhivanDprs)
        .where(and(
          eq(nidhivanDprs.projectId, project.id),
          eq(nidhivanDprs.dprNumber, dprNumber)
        ))
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

        console.log(`✅ [CLI] Seeded DPR: ${dprNumber}`);
      } else {
        console.log(`⏭️  [CLI] DPR ${dprNumber} already exists. Skipping.`);
      }

      // ─── VIHANG CREATIONS TRACK ─────────────────────────────────────────────

      let [globalProject] = await tx
        .select()
        .from(projects)
        .where(and(
          eq(projects.tenantId, TARGET_TENANT_ID),
          eq(projects.name, "Global System Layout Space")
        ))
        .limit(1);

      if (!globalProject) {
        [globalProject] = await tx.insert(projects).values({
          tenantId: TARGET_TENANT_ID,
          name: "Global System Layout Space",
          description: "Global brand layout assets",
        }).returning();
        console.log(`✅ [CLI] Seeded Vihang global project.`);
      } else {
        console.log(`⏭️  [CLI] Global Layout Space already exists. Skipping.`);
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

        console.log(`✅ [CLI] Seeded Vihang design tokens.`);
      } else {
        console.log(`⏭️  [CLI] Vihang tokens already exist. Skipping.`);
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
