/**
 * src/db/seed-nidhivan.ts
 * Bootstraps the Nidhivan Consulting Track 2 Workspace with a CPWD
 * Schedule of Rates hierarchy.
 *
 * Execution: npx tsx src/db/seed-nidhivan.ts
 *
 * Architecture (ADR-002 — Native Admin Fallback):
 * Connects via DATABASE_URL_UNPOOLED using node-postgres (not the Neon
 * serverless driver). The owner connection carries implicit superuser
 * privileges on Neon and bypasses RLS natively. withTenant() is an
 * application-layer RLS enforcement wrapper — it must NOT be used in
 * seed scripts, which require bypass, not enforcement.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  tenants,
  users,
  nidhivanProjects,
  nidhivanDprs,
  nidhivanBoqs,
  nidhivanBoqItems,
  nidhivanFinancialMetrics,
  auditLogs
} from './schema.js';
import { eq } from 'drizzle-orm';

const NIDHIVAN_SLUG = 'nidhivan';
const ADMIN_EMAIL = 'admin@nidhivan.bnlvconsulting.com';

async function seedNidhivan() {
  console.log("🌱 Starting Nidhivan CPWD Schedule of Rates Seed...");

  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  const db = drizzle(client);

  try {
    // ── Step 1: Tenant Provisioning ─────────────────────────────────────────
    // onConflictDoNothing() targets the unique slug constraint.
    await db.insert(tenants).values({
      name: 'Nidhivan Consulting',
      slug: NIDHIVAN_SLUG,
      status: 'active',
    }).onConflictDoNothing();

    // Resolve actual tenant ID at runtime — never assume serial value.
    const [nidhivanTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, NIDHIVAN_SLUG))
      .limit(1);

    if (!nidhivanTenant) {
      throw new Error('[SEED CRITICAL] Failed to provision or locate Nidhivan tenant.');
    }

    const tenantId = nidhivanTenant.id;
    console.log(`✅ Acquired Tenant Identity: ${nidhivanTenant.name} (ID: ${tenantId})`);

    // ── Step 2: Admin User Provisioning ─────────────────────────────────────
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    let adminUserId: number;

    if (!existingAdmin) {
      const [newUser] = await db.insert(users).values({
        email: ADMIN_EMAIL,
        name: 'Nidhivan System Admin',
        tenantId,
        role: 'admin',
        active: true,
      }).returning({ id: users.id });
      adminUserId = newUser.id;
      console.log(`✅ Provisioned Admin User: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
    } else {
      adminUserId = existingAdmin.id;
      console.log(`⏭️  Admin user already exists (ID: ${adminUserId}). Skipping.`);
    }

    // ── Step 3: Idempotency Gate ─────────────────────────────────────────────
    const [existingProject] = await db
      .select({ id: nidhivanProjects.id })
      .from(nidhivanProjects)
      .where(eq(nidhivanProjects.tenantId, tenantId))
      .limit(1);

    if (existingProject) {
      console.log('✅ Idempotency Gate Triggered: Nidhivan data already seeded. Exiting.');
      process.exit(0);
    }

    // ── Step 4: Domain Data (owner connection — RLS bypassed natively) ───────
    await db.transaction(async (tx) => {

      // ── Project ────────────────────────────────────────────────────────────
      const [project] = await tx.insert(nidhivanProjects).values({
        tenantId,
        projectCode: "NH44-PKG1",
        projectTitle: "NH-44 Highway Expansion (Package 1)",
        projectType: "infrastructure",
        sector: "Transport",
        implementingAgency: "National Highways Authority of India",
        projectState: "New Delhi",
        totalCostPaise: 4676075000,
        createdBy: adminUserId,
        status: "in_progress"
      }).returning();
      console.log(`✅ Created Project: ${project.projectTitle}`);

      // ── DPR ────────────────────────────────────────────────────────────────
      const [dpr] = await tx.insert(nidhivanDprs).values({
        tenantId,
        projectId: project.id,
        dprNumber: "DPR-NH44-01",
        title: "Detailed Project Report - NH-44 Widening",
        financialYear: "2026-2027",
        totalProjectCostPaise: 4676075000,
        createdBy: adminUserId,
        status: "draft"
      }).returning();
      console.log(`✅ Created DPR Record: ${dpr.dprNumber}`);

      // ── BOQ ────────────────────────────────────────────────────────────────
      const [boq] = await tx.insert(nidhivanBoqs).values({
        tenantId,
        projectId: project.id,
        dprId: dpr.id,
        boqNumber: "BOQ-NH44-01",
        title: "Master Bill of Quantities (CPWD DSR 2023 Baseline)",
        totalAmountPaise: 4676075000,
        createdBy: adminUserId,
        status: "draft"
      }).returning();
      console.log(`✅ Created BOQ Record: ${boq.title}`);

      // ── BOQ Items (CPWD DSR 2023 hierarchy) ────────────────────────────────
      await tx.insert(nidhivanBoqItems).values([
        {
          tenantId,
          boqId: boq.id,
          itemNumber: 1,
          sectionCode: "SH-01",
          isSectionHeader: true,
          description: "SUB-HEAD 01: EARTHWORK",
          quantity: 0,
          unitRatePaise: 0,
          amountPaise: 0,
        },
        {
          tenantId,
          boqId: boq.id,
          itemNumber: 2,
          sectionCode: "SH-01",
          isSectionHeader: false,
          description: "Earth work in excavation by mechanical means (Hydraulic excavator)/manual means over areas...",
          unit: "cum",
          quantity: 4500.500,
          unitRatePaise: 21500,
          amountPaise: 96760750,
          rateRef: "DSR 2023 Item 2.6.1"
        },
        {
          tenantId,
          boqId: boq.id,
          itemNumber: 3,
          sectionCode: "SH-01",
          isSectionHeader: false,
          description: "Filling available excavated earth (excluding rock) in trenches, plinth, sides of foundations etc...",
          unit: "cum",
          quantity: 1200.000,
          unitRatePaise: 18550,
          amountPaise: 22260000,
          rateRef: "DSR 2023 Item 2.25"
        },
        {
          tenantId,
          boqId: boq.id,
          itemNumber: 4,
          sectionCode: "SH-02",
          isSectionHeader: true,
          description: "SUB-HEAD 02: CONCRETE WORK",
          quantity: 0,
          unitRatePaise: 0,
          amountPaise: 0,
        },
        {
          tenantId,
          boqId: boq.id,
          itemNumber: 5,
          sectionCode: "SH-02",
          isSectionHeader: false,
          description: "Providing and laying in position cement concrete of specified grade - 1:1.5:3.",
          unit: "cum",
          quantity: 540.250,
          unitRatePaise: 645000,
          amountPaise: 348461250,
          rateRef: "DSR 2023 Item 4.1.2"
        }
      ]);
      console.log(`✅ Seeded CPWD DSR Execution Items`);

      // ── Financial Metrics ───────────────────────────────────────────────────
      await tx.insert(nidhivanFinancialMetrics).values({
        tenantId,
        projectId: project.id,
        reportedBy: adminUserId,
        reportingPeriod: "Q1-2026",
        projectedIrrPercent: "14.50",
        reportedAt: new Date(),
      });
      console.log(`✅ Seeded Financial Metrics`);

      // ── Immutable Audit Log ─────────────────────────────────────────────────
      await tx.insert(auditLogs).values({
        tenantId,
        actor: "system_seeder",
        action: "seed_nidhivan_hierarchy",
        target: `nidhivan_projects:${project.projectCode}`,
        severity: "info",
        metadata: {
          event: "Initial CPWD Schedule of Rates Seed",
          projectCode: project.projectCode,
          entityId: project.id.toString(),
          timestamp: new Date().toISOString(),
        }
      });
      console.log(`✅ Wrote Immutable Audit Log`);

    });

    console.log("🎉 Seed Complete! The Nidhivan BOQ Engine now has live database data.");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seedNidhivan();
