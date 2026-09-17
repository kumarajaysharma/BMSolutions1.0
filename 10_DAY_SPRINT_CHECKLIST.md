# BNLV Phase C — 10-Day Commercial Launch Sprint
## EXECUTION CHECKLIST · Started: September 15, 2026

Mark items with [x] as completed. This file tracks progress against BNLV-CONS-001.

---

## 🔴 BEFORE ANYTHING ELSE

- [ ] **SEC-001** ROTATE ANTHROPIC_API_KEY at https://console.anthropic.com
- [ ] Update Vercel env var: ANTHROPIC_API_KEY (production + preview)
- [ ] Confirm TRUNCATE TABLE sessions previously executed (cookies.txt incident)

---

## DAY 1 — September 16, 2026 — Schema + Database

### Track A: Migrations
- [ ] Copy migration files to `drizzle/migrations/`:
  - [ ] `0013_bms_academy_lms.sql`
  - [ ] `0014_bms_studio_hosting.sql`
  - [ ] `0015_bms_ops_intelligence.sql`
- [ ] Update `drizzle/migrations/meta/_journal.json` with 3 new entries
- [ ] Run `npm run db:migrate` — verify zero errors
- [ ] Confirm via Neon console: all 16 new bms_* tables present
- [ ] Confirm FORCE ROW LEVEL SECURITY active on all 16 tables
  ```sql
  SELECT relname, relrowsecurity, relforcerowsecurity
  FROM pg_class WHERE relname LIKE 'bms_%';
  ```

### Track B: Schema
- [ ] Append `schema-bms-additions.ts` content to `src/db/schema.ts`
- [ ] Run `npm run typecheck` — zero errors required
- [ ] Verify no `real()` or `doublePrecision()` in BMS tables

---

## DAY 2 — September 17, 2026 — Tenants + Seed

### Track A: Tenant Provisioning
- [ ] Provision Nidhivan tenant: `node scripts/provision-tenant.mjs --slug nidhivan --name "Nidhivan Consulting" --plan enterprise`
- [ ] Record Nidhivan tenant ID in Active Tenant Registry
- [ ] Provision LIMSY tenant: `node scripts/provision-tenant.mjs --slug limsy --name "LIMSY Legal Intelligence" --plan enterprise`
- [ ] Record LIMSY tenant ID in Active Tenant Registry
- [ ] Verify RLS isolation: query each tenant as studio_app — confirm no cross-tenant data
- [ ] Confirm nidhivan_boqs now returns data (not empty array) via `/api/nidhivan/boqs`

### Track B: Seed Data
- [ ] Run BMS Academy seed: `tsx src/db/seed-bms-academy.ts`
- [ ] Verify: 3 courses, 2 paths, 5 agents, 4 code-red cases inserted in BMS tenant
- [ ] Reset admin@bms.bnlvconsulting.com password (user ID 13)

---

## DAY 3 — September 18, 2026 — LMS API Routes

- [ ] Port `/api/bms/lms/courses/route.ts` (delivered)
- [ ] Port `/api/bms/lms/enrollments/route.ts` (delivered)
- [ ] Create `/api/bms/lms/modules/route.ts`
- [ ] Create `/api/bms/lms/lessons/route.ts`
- [ ] Create `/api/bms/lms/paths/route.ts`
- [ ] Create `/api/bms/lms/progress/route.ts`
- [ ] Create `/api/bms/lms/my-learning/route.ts`
- [ ] Test: GET /api/bms/lms/courses with BMS JWT returns 3 courses
- [ ] Test: GET /api/bms/lms/courses with LIMSY JWT returns empty array (RLS isolation)

---

## DAY 4 — September 19, 2026 — Studio + Ops APIs

- [ ] Port `/api/bms/studio/projects/route.ts` (delivered)
- [ ] Port `/api/bms/studio/agents/route.ts`
- [ ] Port `/api/bms/studio/workflows/route.ts`
- [ ] Port `/api/bms/studio/consolidate/route.ts`
- [ ] Port `/api/bms/studio/addons/route.ts`
- [ ] Port `/api/bms/ops/code-red/route.ts` (delivered)
- [ ] Port `/api/bms/ops/assignments/route.ts`
- [ ] Port `/api/bms/ops/documents/route.ts`
- [ ] Port `/api/bms/ops/gates/route.ts`
- [ ] Port `/api/bms/hosting/containers/route.ts` (delivered)
- [ ] Port `/api/bms/hosting/dns/route.ts`
- [ ] Port `/api/bms/dashboard/route.ts`
- [ ] Add ADMIN_PREFIXES to proxy.ts for hosting + gates

---

## DAY 5 — September 20, 2026 — UI: BMS Academy

- [ ] Create `/src/app/studio/bms-academy/page.tsx` — course grid
- [ ] Create `/src/app/studio/bms-academy/courses/[id]/page.tsx` — course detail + enroll
- [ ] Create `/src/app/studio/bms-academy/my-learning/page.tsx` — learner dashboard
- [ ] Create `/src/app/studio/bms-academy/paths/page.tsx` — learning paths
- [ ] Add "BMS Academy" tab to StudioShell sidebar nav
- [ ] Verify live data renders from API (not mock data)

---

## DAY 6 — September 21, 2026 — UI: Studio Builder + Ops

- [ ] Create `/src/app/studio/builder/page.tsx` (from P2's dashboard/studio/page.tsx)
- [ ] Create `/src/app/studio/builder/[id]/page.tsx` (project detail)
- [ ] Create `/src/app/studio/code-red/page.tsx`
- [ ] Create `/src/app/studio/assignments/page.tsx`
- [ ] Create `/src/app/studio/documents/page.tsx`
- [ ] Create `/src/app/studio/hosting/page.tsx`
- [ ] Fix UI-DEFECT-001: `/403` route returning 404

---

## DAY 7 — September 22, 2026 — DevOps + Production

- [ ] Push NFT shim (if not already pushed):
  ```bash
  git add scripts\vercel-build.mjs vercel.json
  git commit -m "fix: async NFT wrapper for Turbopack/Vercel compatibility"
  git push origin main
  ```
- [ ] Verify Vercel build succeeds (no ENOENT NFT error)
- [ ] Add CI steps from `ci-bms-additions.yml` to `.github/workflows/ci.yml`
- [ ] Update Vercel env vars: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
- [ ] Update ANTHROPIC_API_KEY (post-rotation) in Vercel
- [ ] Confirm all 5 subdomains resolve and SSG pages render:
  - [ ] https://bnlvconsulting.com
  - [ ] https://bms.bnlvconsulting.com
  - [ ] https://nidhivan.bnlvconsulting.com
  - [ ] https://limsy.bnlvconsulting.com
  - [ ] https://vihang.bnlvconsulting.com

---

## DAY 8 — September 23, 2026 — Security QA

- [ ] Run RLS isolation battery: all 5 tenants × all workspace tables
- [ ] Confirm no cross-tenant data leakage in BMS + Nidhivan + LIMSY tables
- [ ] Run CI security audit gate locally: `npm run build && npm run typecheck`
- [ ] Audit actor format compliance: grep for free-form actor strings
- [ ] Verify no bcryptjs in node_modules (or if present, not imported from src/)
- [ ] Confirm ANTHROPIC_API_KEY rotation completed — old key deactivated
- [ ] Run ATP tests BMS-012 through BMS-014 (security-specific)

---

## DAY 9 — September 24, 2026 — Functional ATP

- [ ] Run ATP tests BMS-001 through BMS-020 (full BMS test matrix)
- [ ] Run remaining 20 P1 ATP tests (MAJOR/MINOR tier)
- [ ] Document all test results with pass/fail and evidence
- [ ] Fix any BLOCKER or CRITICAL failures before proceeding
- [ ] Load test: simulate 10 concurrent users on BMS Academy enroll flow

---

## DAY 10 — September 25, 2026 — Final Validation + GO

- [ ] Achieve ≥58/60 ATP test passes (BMS-specific: 100% BLOCKER/CRITICAL)
- [ ] All 5 subdomains confirmed live and functional
- [ ] Admin login confirmed for all 3 provisioned tenants
- [ ] Nidhivan DPR/BOQ API returning live data (not empty arrays)
- [ ] AI orchestration: test LEGAL, FINANCIAL, HYBRID task routing
- [ ] CTO sign-off: formal GO/NO-GO gate decision
- [ ] Update System_State_PostMerge.json with final tenant IDs + ATP results
- [ ] Tag release: `git tag v1.0.0-commercial && git push --tags`

---

*BNLV Group · Office of the CTO · Phase C Sprint*
