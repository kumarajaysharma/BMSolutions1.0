/**
 * src/db/seed-nidhivan.ts
 * Bootstraps the Nidhivan Consulting Track 2 Workspace with a CPWD Schedule of Rates hierarchy.
 */

import { db } from './index';
import { 
  tenants, 
  users, 
  nidhivanProjects, 
  nidhivanDprs, 
  nidhivanBoqs, 
  nidhivanBoqItems, 
  nidhivanFinancialMetrics, 
  auditLogs 
} from './schema';
import { withTenant } from '@/lib/db/with-tenant';
import { safeJson } from '@/lib/safe-json';
import { eq } from 'drizzle-orm';

// Constants locked to Nidhivan Consulting domain
const NIDHIVAN_TENANT_ID = 10;
const ADMIN_EMAIL = 'admin@nidhivan.bnlvconsulting.com';

async function seedNidhivan() {
  console.log("🌱 Starting Nidhivan CPWD Schedule of Rates Seed...");

  // 1. Tenant Provisioning
  await db.insert(tenants).values({
    id: NIDHIVAN_TENANT_ID,
    name: 'Nidhivan Consulting',
    slug: 'nidhivan',
    domain: 'nidhivan.bnlvconsulting.com',
    isActive: true,
  }).onConflictDoNothing();
  
  console.log(`✅ Acquired Tenant Identity: Nidhivan Consulting (ID: ${NIDHIVAN_TENANT_ID})`);

  // 2. Admin User Provisioning (Prerequisite for reportedBy FK & Audit Logs)
  let adminUsers = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  let adminUserId: number;

  if (adminUsers.length === 0) {
    const [newUser] = await db.insert(users).values({
      email: ADMIN_EMAIL,
      name: 'Nidhivan System Admin',
      tenantId: NIDHIVAN_TENANT_ID,
      role: 'admin',
      isActive: true,
    }).returning({ id: users.id });
    adminUserId = newUser.id;
  } else {
    adminUserId = adminUsers[0].id;
  }

  // 3. Idempotency Gate (Existence Check for Tenant 10)
  const existingProjects = await db
    .select({ id: nidhivanProjects.id })
    .from(nidhivanProjects)
    .where(eq(nidhivanProjects.tenantId, NIDHIVAN_TENANT_ID))
    .limit(1);

  if (existingProjects.length > 0) {
    console.log('✅ Idempotency Gate Triggered: Nidhivan Consulting data already seeded. Exiting.');
    process.exit(0);
  }

  // 4. Wrap operations inside the official withTenant RLS transaction wrapper
  await withTenant(NIDHIVAN_TENANT_ID, async (tx) => {
    
    // Create Project
    const [project] = await tx.insert(nidhivanProjects).values({
      tenantId: NIDHIVAN_TENANT_ID,
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

    // Create Detailed Project Report (DPR)
    const [dpr] = await tx.insert(nidhivanDprs).values({
      tenantId: NIDHIVAN_TENANT_ID,
      projectId: project.id,
      dprNumber: "DPR-NH44-01",
      title: "Detailed Project Report - NH-44 Widening",
      financialYear: "2026-2027",
      totalProjectCostPaise: 4676075000,
      createdBy: adminUserId,
      status: "draft"
    }).returning();
    console.log(`✅ Created DPR Record: ${dpr.dprNumber}`);

    // Create BOQ Record
    const [boq] = await tx.insert(nidhivanBoqs).values({
      tenantId: NIDHIVAN_TENANT_ID,
      projectId: project.id,
      dprId: dpr.id,
      boqNumber: "BOQ-NH44-01",
      title: "Master Bill of Quantities (CPWD DSR 2023 Baseline)",
      totalAmountPaise: 4676075000,
      createdBy: adminUserId,
      status: "draft"
    }).returning();
    console.log(`✅ Created BOQ Record: ${boq.title}`);

    // Create Execution Items (Headers and DSR Items)
    await tx.insert(nidhivanBoqItems).values([
      {
        tenantId: NIDHIVAN_TENANT_ID,
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
        tenantId: NIDHIVAN_TENANT_ID,
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
        tenantId: NIDHIVAN_TENANT_ID,
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
        tenantId: NIDHIVAN_TENANT_ID,
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
        tenantId: NIDHIVAN_TENANT_ID,
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

    // Insert Financial Metrics (Satisfies non-nullable reportedBy FK)
    await tx.insert(nidhivanFinancialMetrics).values({
      tenantId: NIDHIVAN_TENANT_ID,
      projectId: project.id,
      reportedBy: adminUserId,
      totalEstimatedCostPaise: 4676075000,
      projectedIrrPercent: "14.50",
      npvPaise: 125000000, // Example NPV baseline
    });
    console.log(`✅ Seeded Financial Metrics`);

    // Insert Immutable Audit Log Record
    await tx.insert(auditLogs).values({
      tenantId: NIDHIVAN_TENANT_ID,
      action: 'seed_nidhivan_cpwd',
      entity: 'nidhivan_system',
      entityId: project.id.toString(),
      actor: `user:${adminUserId}`,
      details: safeJson({
        event: 'Initial CPWD Schedule of Rates Seed',
        projectCode: project.projectCode,
        timestamp: new Date().toISOString(),
      }),
      createdAt: new Date(),
    });
    console.log(`✅ Wrote Immutable Audit Log`);

  });

  console.log("🎉 Seed Complete! The Nidhivan BOQ Engine now has live database data.");
  process.exit(0);
}

seedNidhivan().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});