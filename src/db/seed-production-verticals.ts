/**
 * src/db/seed-production-verticals.ts
 * Production Seeder for Nidhivan Consulting & Vihang Creations
 * Sprint Closure: July 31, 2026 | Status: P3 Production-Final
 */

import { getDirectDb, withTenant } from "@/db";
import { 
  nidhivanProjects, 
  nidhivanDprs, 
  builderComponents, 
  tenants,
  auditLogs,
  projects
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { NewNidhivanProject, NewNidhivanDpr } from "@/db/schema";
import crypto from "crypto";

export async function executeProductionSeed(targetTenantId: number, executingUserId: number, clientIp: string = "system-cli") {
  const directDb = await getDirectDb();
  
  const [tenantExists] = await directDb
    .select()
    .from(tenants)
    .where(eq(tenants.id, targetTenantId))
    .limit(1);

  if (!tenantExists) {
    throw new Error(`[SEED CRITICAL] Execution halted. Tenant ID ${targetTenantId} not found.`);
  }

  console.log(`[SEED START] Scoping operations to Tenant: ${tenantExists.name} (ID: ${targetTenantId}).`);

  return await withTenant(targetTenantId, async (tx) => {
    try {
      // ─── NIDHIVAN CONSULTING TRACK ──────────────────────────────────────────

      // 1. Force context pin at the session level to prevent serverless multiplexing drift
      await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);

      const projectData: NewNidhivanProject = {
        tenantId: targetTenantId,
        projectCode: "BNLV-INFRA-2026",
        projectTitle: "New Delhi Smart City Hub - Core Micro-Grid",
        projectType: "infrastructure",
        sector: "Urban Development",
        implementingAgency: "Delhi Development Authority",
        projectState: "New Delhi",
        totalCostPaise: 89000000000, 
        createdBy: executingUserId,
        status: "dpr_preparation"
      };

      const [project] = await tx
        .insert(nidhivanProjects)
        .values(projectData)
        .onConflictDoUpdate({
          target: [nidhivanProjects.tenantId, nidhivanProjects.projectCode],
          set: { projectTitle: projectData.projectTitle, totalCostPaise: projectData.totalCostPaise }
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: targetTenantId,
        actor: String(executingUserId),
        action: "seed.nidhivan_project.upsert",
        target: project.projectCode,
        severity: "info",
        ipAddress: clientIp,
        metadata: {
          seedVersion: "v5.1-Production",
          environment: process.env.NODE_ENV || "production",
          correlationId: crypto.randomUUID()
        }
      });

      const dprData: NewNidhivanDpr = {
        tenantId: targetTenantId,
        projectId: project.id,
        dprNumber: "DPR-BNLV-2026-001",
        title: "Detailed Project Report - Smart City Micro-Grid Phase I",
        financialYear: "2026-2027",
        totalProjectCostPaise: 89000000000,
        createdBy: executingUserId,
        status: "draft"
      };

      const [existingDpr] = await tx
        .select()
        .from(nidhivanDprs)
        .where(and(eq(nidhivanDprs.projectId, project.id), eq(nidhivanDprs.dprNumber, dprData.dprNumber)))
        .limit(1);

      if (!existingDpr) {
        // 2. Re-assert context immediately before vulnerable RLS insert
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);
        
        await tx.insert(nidhivanDprs).values(dprData);
        
        await tx.insert(auditLogs).values({
          tenantId: targetTenantId,
          actor: String(executingUserId),
          action: "seed.nidhivan_dpr.insert",
          target: dprData.dprNumber,
          severity: "info",
          ipAddress: clientIp,
          metadata: {
            seedVersion: "v5.1-Production",
            environment: process.env.NODE_ENV || "production",
            correlationId: crypto.randomUUID()
          }
        });
      }

      // ─── VIHANG CREATIONS TRACK ─────────────────────────────────────────────

      let [globalProject] = await tx
        .select()
        .from(projects)
        .where(and(eq(projects.tenantId, targetTenantId), eq(projects.name, "Global System Layout Space")))
        .limit(1);

      if (!globalProject) {
        // 3. Re-assert context
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);
        
        [globalProject] = await tx.insert(projects).values({
          tenantId: targetTenantId,
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
        // 4. Final context assertion
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);
        
        await tx.insert(builderComponents).values({
          tenantId: targetTenantId,
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
          tenantId: targetTenantId,
          actor: String(executingUserId),
          action: "seed.vihang_tokens.insert",
          target: "Vihang Heraldic Design Engine Tokens",
          severity: "info",
          ipAddress: clientIp,
          metadata: {
            seedVersion: "v5.1-Production",
            environment: process.env.NODE_ENV || "production",
            correlationId: crypto.randomUUID()
          }
        });
      }

      console.log(`[SEED COMPLETE] Institutional baselines and brand tokens established.`);
      return true;

    } catch (error) {
      console.error(`[SEED TRANSACTION FAILED] Rollback initiated. Reason: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  });
}