/**
 * src/db/seed-bms-academy.ts
 *
 * BMS Academy LMS + Ops Intelligence Seed Script
 * ================================================
 * Seeds BMSolutions tenant (ID 10) with:
 *   - 3 Agentic AI courses with modules + lessons
 *   - 2 learning paths
 *   - 5 AI agents (ported from P2)
 *   - 3 workflows
 *   - 4 Code Red cases
 *   - 3 assignments
 *   - 3 documents
 *   - Gate controls
 *
 * Execute: tsx src/db/seed-bms-academy.ts
 * Requires: DATABASE_URL_UNPOOLED in environment (ADR-002)
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BMS_TENANT_ID = 10;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // ADR-002: SET LOCAL must be first statement in every seed transaction
    // FIX: Using string interpolation because PostgreSQL SET commands do not support parameterized $1 arguments.
    await client.query(`SET LOCAL app.current_tenant_id = '${BMS_TENANT_ID}'`);

    // ── Idempotency guard ────────────────────────────────────
    const existing = await client.query(
      "SELECT COUNT(*) FROM bms_courses WHERE tenant_id = $1",
      [BMS_TENANT_ID]
    );
    if (parseInt(existing.rows[0].count) > 0) {
      console.log("✅ BMS Academy already seeded — skipping.");
      await client.query("ROLLBACK");
      return;
    }

    // ── 1. Courses ───────────────────────────────────────────
    const courseRes = await client.query(`
      INSERT INTO bms_courses
        (tenant_id, title, slug, description, category, level, duration_hours,
         thumbnail_gradient, status, rating, tags, objectives)
      VALUES
        ($1, 'Agentic AI Fundamentals', 'agentic-ai-fundamentals',
         'Master the core principles of autonomous AI agent design and multi-agent orchestration.',
         'Agentic AI', 'Beginner', 12,
         'from-indigo-600 via-violet-600 to-fuchsia-600', 'published', 4.9,
         '["AI", "Agents", "LLM", "Orchestration"]',
         '["Understand agent topologies", "Build orchestrator-agent pipelines", "Deploy production agents"]'),
        ($1, 'Claude API & Prompt Engineering', 'claude-api-prompt-engineering',
         'Production-grade prompt engineering for Claude Sonnet 4.6 with structured outputs and tool use.',
         'Agentic AI', 'Intermediate', 8,
         'from-blue-600 via-cyan-600 to-teal-600', 'published', 4.8,
         '["Claude", "Anthropic", "Prompt Engineering", "Tool Use"]',
         '["Write structured system prompts", "Use tool_use correctly", "Handle streaming responses"]'),
        ($1, 'Multi-Tenant SaaS Architecture', 'multi-tenant-saas-architecture',
         'Enterprise-grade multi-tenant platform design with Row-Level Security and Zero Trust middleware.',
         'Platform Engineering', 'Advanced', 16,
         'from-emerald-600 via-green-600 to-teal-600', 'published', 4.9,
         '["SaaS", "Multi-Tenant", "RLS", "PostgreSQL", "Next.js"]',
         '["Design RLS-enforced schemas", "Build Zero Trust middleware", "Implement withTenant() patterns"]')
      RETURNING id, slug
    `, [BMS_TENANT_ID]);

    const courses = courseRes.rows;
    console.log(`✅ Inserted ${courses.length} courses`);

    // ── 2. Modules for first course ──────────────────────────
    for (const course of courses) {
      await client.query(`
        INSERT INTO bms_modules (tenant_id, course_id, title, order_index)
        VALUES
          ($1, $2, 'Module 1: Agent Architecture Fundamentals', 0),
          ($1, $2, 'Module 2: Orchestration Patterns', 1),
          ($1, $2, 'Module 3: Production Deployment', 2)
      `, [BMS_TENANT_ID, course.id]);
    }
    console.log(`✅ Inserted modules`);

    // ── 3. Learning Paths ────────────────────────────────────
    await client.query(`
      INSERT INTO bms_learning_paths
        (tenant_id, title, description, level, estimated_weeks, gradient, icon)
      VALUES
        ($1, 'AI Engineer Track',
         'Complete path from LLM fundamentals to production multi-agent systems.',
         'Intermediate', 8, 'from-violet-500 to-purple-600', 'cpu'),
        ($1, 'Platform Engineer Track',
         'Master SaaS architecture: multi-tenancy, RLS, Zero Trust, CI/CD.',
         'Advanced', 10, 'from-blue-500 to-indigo-600', 'server')
    `, [BMS_TENANT_ID]);
    console.log(`✅ Inserted 2 learning paths`);

    // ── 4. AI Agents ─────────────────────────────────────────
    await client.query(`
      INSERT INTO bms_ai_agents
        (tenant_id, name, role, description, model, tools, status, autonomy_level, success_rate)
      VALUES
        ($1, 'Legal Counsel AI', 'Supreme Court Legal Analyst',
         'Senior Advocate persona for LIMSY case analysis and legal brief drafting.',
         'claude-sonnet-4-6', '["limsy_cases","limsy_hearings","audit_logs"]',
         'active', 4, 97.20),
        ($1, 'Financial Intelligence AI', 'Infrastructure Finance Analyst',
         'McKinsey-persona for DPR narrative, BOQ analysis, and investor brief generation.',
         'claude-sonnet-4-6', '["nidhivan_dprs","nidhivan_boqs","nidhivan_financial_metrics"]',
         'active', 4, 95.80),
        ($1, 'Orchestrator', 'Task Router',
         'Classifies incoming tasks as LEGAL, FINANCIAL, HYBRID, or UNKNOWN and routes to appropriate agents.',
         'claude-haiku-4-5-20251001', '[]',
         'active', 5, 99.10),
        ($1, 'Code Reviewer', 'Senior Software Architect',
         'Reviews PRs for ADR compliance, RLS violations, and security pattern adherence.',
         'claude-sonnet-4-6', '["github","audit_logs"]',
         'active', 3, 94.50),
        ($1, 'Content Strategist', 'Brand & Content AI',
         'Generates enterprise marketing content aligned to BNLV Group brand system.',
         'claude-sonnet-4-6', '["bms_documents","bms_assignments"]',
         'active', 2, 91.30)
    `, [BMS_TENANT_ID]);
    console.log(`✅ Inserted 5 AI agents`);

    // ── 5. Code Red Cases ────────────────────────────────────
    await client.query(`
      INSERT INTO bms_code_red_cases
        (tenant_id, code, title, vertical, problem, solution, agents, impact,
         metric, roi_multiple, payback_months, complexity, effort_weeks, priority, status)
      VALUES
        ($1, 'CR-001', 'Legal Brief Auto-Generation', 'Legal Intelligence',
         'Senior advocates spend 6-8 hours per case on brief preparation and precedent research.',
         'Deploy Legal Counsel AI agent to generate first-draft briefs from LIMSY case data.',
         '["Legal Counsel AI","Orchestrator"]',
         'Reduce brief preparation time from 8 hours to 45 minutes per case.',
         '90% reduction in brief preparation time across 150+ active LIMSY cases',
         8.50, 4, 'Medium', 6, 'P0', 'in_progress'),
        ($1, 'CR-002', 'DPR Narrative Automation', 'Financial Intelligence',
         'DPR narrative writing for infrastructure projects takes 3-5 days per document.',
         'Deploy Financial Intelligence AI to generate CPWD DSR 2023-aligned DPR narratives.',
         '["Financial Intelligence AI","Orchestrator"]',
         'Generate investment-grade DPR narratives in under 2 hours.',
         '85% reduction in DPR drafting time; INR 2.4Cr annual cost savings',
         6.20, 6, 'Medium', 8, 'P0', 'proposed'),
        ($1, 'CR-003', 'Multi-Tenant RLS Audit Automation', 'Platform Security',
         'Manual RLS policy audits across 5 tenant workspaces take 2 days per sprint.',
         'Automated RLS isolation testing via audit-neon.sql + CI gate integration.',
         '["Code Reviewer"]',
         'Zero cross-tenant data leakage incidents; continuous compliance monitoring.',
         '100% automated RLS coverage; 16 hours/sprint engineering time saved',
         4.00, 3, 'Low', 4, 'P1', 'completed'),
        ($1, 'CR-004', 'Client Intake AI Triage', 'Operations',
         'Client requests in client_requests table sit unprocessed for 2-3 business days.',
         'AI-powered triage and routing of client_requests to correct subsidiary team.',
         '["Orchestrator","Content Strategist"]',
         'Sub-4-hour response SLA for all client intake requests.',
         '95% reduction in client request response time',
         3.50, 8, 'Low', 6, 'P1', 'proposed')
    `, [BMS_TENANT_ID]);
    console.log(`✅ Inserted 4 Code Red cases`);

    // ── 6. Assignments ───────────────────────────────────────
    await client.query(`
      INSERT INTO bms_assignments
        (tenant_id, code, title, course, vertical, description, prompt, deliverables, max_score, due_in_days)
      VALUES
        ($1, 'A-001', 'Build a Multi-Agent Orchestrator', 'Agentic AI Fundamentals',
         'Agentic AI',
         'Design and implement a production-ready orchestrator that routes tasks between 2 specialized agents.',
         'Create an orchestrator that accepts natural language task descriptions and routes to either a LEGAL or FINANCIAL agent based on classification. Include fallback handling and audit logging.',
         '["Working TypeScript orchestrator","RLS-compliant agent code","Test coverage for all 4 task classes","ADR-001 compliance report"]',
         100, 7),
        ($1, 'A-002', 'RLS Policy Implementation', 'Multi-Tenant SaaS Architecture',
         'Platform Engineering',
         'Implement and verify complete FORCE ROW LEVEL SECURITY on a new tenant-scoped table.',
         'Create a new table bms_experiments with tenant isolation. Write the migration SQL, Drizzle schema, withTenant() API route, and an isolation test that proves cross-tenant leakage is impossible.',
         '["Migration SQL file","Drizzle schema addition","API route with withTenant()","Isolation test passing"]',
         100, 5),
        ($1, 'A-003', 'Prompt Engineering for Legal AI', 'Claude API & Prompt Engineering',
         'Agentic AI',
         'Engineer a production system prompt for a Supreme Court legal brief generation agent.',
         'Design a system prompt for the Legal Counsel AI that produces High Court standard briefs. Test with 3 LIMSY case scenarios and evaluate against rubric.',
         '["System prompt (≤800 tokens)","3 sample outputs scored against rubric","Latency benchmark (<3s p95)","Token cost analysis"]',
         100, 10)
    `, [BMS_TENANT_ID]);
    console.log(`✅ Inserted 3 assignments`);

    // ── 7. Documents ─────────────────────────────────────────
    await client.query(`
      INSERT INTO bms_documents
        (tenant_id, code, title, type, description, version, owner, pages)
      VALUES
        ($1, 'DOC-001', 'ADR Compliance Playbook', 'Playbook',
         'Non-negotiable architectural decision records for all BNLV platform development.',
         'v2.0', 'BNLV CTO Office', 18),
        ($1, 'DOC-002', 'RLS Implementation Guide', 'Technical Guide',
         'Step-by-step guide for implementing FORCE ROW LEVEL SECURITY on any new tenant-scoped table.',
         'v1.2', 'BMSolutions R&D', 12),
        ($1, 'DOC-003', 'AI Agent Design Standards', 'Standard',
         'Standards for system prompt engineering, fallback handling, and audit logging in BNLV AI agents.',
         'v1.0', 'BNLV CTO Office', 8)
    `, [BMS_TENANT_ID]);
    console.log(`✅ Inserted 3 documents`);

    // ── 8. Gates ─────────────────────────────────────────────
    await client.query(`
      INSERT INTO bms_gates (tenant_id, key, label, status, owner)
      VALUES
        ($1, 'G-001', 'Phase A: Database Foundation', 'complete', 'CTO Office'),
        ($1, 'G-002', 'Phase B: SSG Public Pages', 'complete', 'CTO Office'),
        ($1, 'G-003', 'Phase C: BMS Academy Launch', 'in_progress', 'BMSolutions'),
        ($1, 'G-004', 'Phase C: Studio Builder Launch', 'pending', 'BMSolutions'),
        ($1, 'G-005', 'Phase C: LIMSY Commercial Go-Live', 'pending', 'LIMSY Team'),
        ($1, 'G-006', 'Phase C: Nidhivan Commercial Go-Live', 'pending', 'Nidhivan Team')
    `, [BMS_TENANT_ID]);
    console.log(`✅ Inserted 6 gates`);

    await client.query("COMMIT");
    console.log("\n🚀 BMS Academy seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });