/**
 * src/db/seed-nidhivan.ts
 * Bootstraps the Nidhivan Consulting Track 2 Workspace with a CPWD Schedule of Rates hierarchy.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
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

const ADMIN_EMAIL = 'admin@nidhivan.bnlvconsulting.com';

async function seedNidhivan() {
  console.log("🌱 Starting Nidhivan CPWD Schedule of Rates Seed...");

  // Enforce unpooled direct connection for administrative RLS bypass
  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  const db = drizzle(client);

  try {
    // 1. Tenant Provisioning (Public/Unforced Table)
    let tenantRecords = await db.select().from(tenants).where(eq(tenants.slug, 'nidhivan')).limit(1);
    let tenantId: number;

    if (tenantRecords.length === 0) {
      const [newTenant] = await db.insert(tenants).values({
        name: 'Nidhivan Consulting',
        slug: 'nidhivan',
        status: 'active',
      }).returning({ id: tenants.id });
      tenantId = newTenant.id;
      console.log(`✅ Provisioned Tenant: Nidhivan Consulting (ID: ${tenantId})`);
    } else {
      tenantId = tenantRecords[0].id;
      console.log(`✅ Acquired Tenant Identity: Nidhivan Consulting (ID: ${tenantId})`);
    }
    
    // 2. Admin User Provisioning (Public/Unforced Table)
    let adminUsers = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    let adminUserId: number;

    if (adminUsers.length === 0) {
      const [newUser] = await db.insert(users).values({
        email: ADMIN_EMAIL,
        name: 'Nidhivan System Admin',
        tenantId: tenantId,
        role: 'admin',
        active: true,
      }).returning({ id: users.id });
      adminUserId = newUser.id;
      console.log(`✅ Provisioned Admin User: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
    } else {
      adminUserId = adminUsers[0].id;
      console.log(`⏭️  Admin user already exists (ID: ${adminUserId}). Skipping.`);
    }

    // 3. SECURE CONNECTION-LEVEL RLS BINDING
    // Binds the tenant ID to the entire unpooled session. This permanently 
    // resolves the node-postgres asynchronous tick context-dropping.
    await client.query(`SET app.current_tenant_id = '${tenantId}'`);

    // 4. Data Seeding inside strict Transaction
    await db.transaction(async (tx) => {
      
      // Idempotency Gate
      const existingProjects = await tx
        .select({ id: nidhivanProjects.id })
        .from(nidhivanProjects)
        .where(eq(nidhivanProjects.tenantId, tenantId))
        .limit(1);

      if (existingProjects.length > 0) {
        console.log('✅ Idempotency Gate Triggered: Nidhivan Consulting data already seeded. Exiting.');
        return; // Exit transaction gracefully
      }

      const [project] = await tx.insert(nidhivanProjects).values({
        tenantId: tenantId,
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

      const [dpr] = await tx.insert(nidhivanDprs).values({
        tenantId: tenantId,
        projectId: project.id,
        dprNumber: "DPR-NH44-01",
        title: "Detailed Project Report - NH-44 Widening",
        financialYear: "2026-2027",
        totalProjectCostPaise: 4676075000,
        createdBy: adminUserId,
        status: "draft"
      }).returning();
      console.log(`✅ Created DPR Record: ${dpr.dprNumber}`);

      const [boq] = await tx.insert(nidhivanBoqs).values({
        tenantId: tenantId,
        projectId: project.id,
        dprId: dpr.id,
        boqNumber: "BOQ-NH44-01",
        title: "Master Bill of Quantities (CPWD DSR 2023 Baseline)",
        totalAmountPaise: 4676075000,
        createdBy: adminUserId,
        status: "draft"
      }).returning();
      console.log(`✅ Created BOQ Record: ${boq.title}`);

      await tx.insert(nidhivanBoqItems).values([
        {
          tenantId: tenantId,
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
          tenantId: tenantId,
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
          tenantId: tenantId,
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
          tenantId: tenantId,
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
          tenantId: tenantId,
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
      
      await tx.insert(nidhivanFinancialMetrics).values({
        tenantId: tenantId,
        projectId: project.id,
        reportedBy: adminUserId,
        reportingPeriod: "Q1-2026",
        projectedIrrPercent: "14.50",
        reportedAt: new Date(),
      });
      console.log(`✅ Seeded Financial Metrics`);

      await tx.insert(auditLogs).values({
        tenantId: tenantId,
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