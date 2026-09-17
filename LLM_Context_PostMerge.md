# BNLV Group Enterprise SaaS Platform — LLM Session Bootstrap
## POST-CONSOLIDATION STATE · BNLV-CONS-001 · September 15, 2026

---

## PASTE THIS ENTIRE FILE AS THE FIRST MESSAGE IN ANY NEW SESSION

---

## PLATFORM STATE

```
REPOSITORY  : github.com/kumarajaysharma/BMSolutions1.0
LOCAL PATH  : D:\BMS-Final\saas-studio
STACK       : Next.js 16.2.6 · Drizzle ORM 0.45.2 · Neon PostgreSQL
              Vercel · Tailwind CSS 4.1.17 · TypeScript · jose JWT · scrypt
              claude-sonnet-4-6 (primary) · claude-haiku-4-5-20251001 (classifier)
              gemini-1.5-pro (fallback)
```

## ACTIVE PHASES

- **Phase A** (DB Foundation): ✅ 100% complete — migrations 0000–0012 applied
- **Phase B** (SSG Pages): ✅ Code complete — blocked by NFT shim (workaround staged)
- **Phase C** (Commercial Launch): 🔴 ACTIVE — 10-day sprint started Sept 15, 2026
- **Consolidation** (P1+P2 Merge): ✅ Architecture resolved — files delivered

## 5 ACTIVE TENANTS

| ID  | Slug     | Subsidiary           | Status  |
|-----|----------|----------------------|---------|
| 1   | bnlv     | BNLV Group (Root)    | active  |
| 10  | bms      | BMSolutions          | active  |
| 11  | vihang   | Vihang Creations     | active  |
| TBD | nidhivan | Nidhivan Consulting  | pending |
| TBD | limsy    | LIMSY Legal          | pending |

## WHAT WAS MERGED (P2 → P1)

P2 (bmslms) was a standalone BMS operations platform with no multi-tenant RLS.
It has been architecturally merged into P1 (saas-studio) with full enterprise compliance.

Tables added (all under BMS tenant ID 10, all with FORCE RLS):
```
bms_courses            bms_modules            bms_lessons
bms_learning_paths     bms_enrollments        bms_lesson_progress
bms_ai_agents          bms_workflows          bms_studio_projects
bms_studio_addons      bms_host_containers    bms_dns_records
bms_code_red_cases     bms_assignments        bms_documents
bms_gates              (16 tables total, migrations 0013–0015)
```

## P0 IMMEDIATE ACTIONS (do these before anything else)

1. **ROTATE ANTHROPIC_API_KEY** — exposed in prior session terminal output.
   Go to: https://console.anthropic.com → API Keys → Revoke exposed key → Create new
   Update: Vercel Dashboard → bmsolutions project → Environment Variables → ANTHROPIC_API_KEY

2. **Apply migrations**:
   ```bash
   npm run db:migrate
   # Applies 0013, 0014, 0015 in sequence via DATABASE_URL_UNPOOLED
   ```

3. **Provision Nidhivan + LIMSY tenants**:
   ```bash
   node scripts/provision-tenant.mjs --slug nidhivan --name "Nidhivan Consulting" --plan enterprise
   node scripts/provision-tenant.mjs --slug limsy --name "LIMSY Legal Intelligence" --plan enterprise
   ```

4. **Seed BMS Academy**:
   ```bash
   tsx src/db/seed-bms-academy.ts
   ```

5. **Fix Vercel deployment** (already staged):
   ```bash
   git add scripts\vercel-build.mjs vercel.json
   git commit -m "fix: async NFT wrapper for Turbopack/Vercel compatibility"
   git push origin main
   ```

6. **Reset BMS admin password** (user ID 13):
   ```cmd
   node -e "const c=require('crypto'),{promisify:p}=require('util'),s=p(c.scrypt),pw='NEW_PASSWORD',salt=c.randomBytes(16);s(pw,salt,32,{N:16384,r:8,p:1,maxmem:67108864}).then(dk=>console.log('$scrypt$N=16384,r=8,p=1$'+salt.toString('base64url')+'$'+dk.toString('base64url')))"
   ```
   Then in Neon:
   ```sql
   UPDATE users SET password_hash='HASH_HERE', updated_at=NOW()
   WHERE id=13 AND email='admin@bms.bnlvconsulting.com';
   ```

## NON-NEGOTIABLE RULES (violation = immediate fix required)

```
ADR-001  : withTenant(tenantId, async (tx) => { ... }) — ALL DB queries, no exceptions
ADR-002  : DATABASE_URL_UNPOOLED for ALL migrations and seeds
AUTH     : scrypt ONLY — bcryptjs is PROHIBITED anywhere in src/
IDS      : SERIAL INTEGER + tenantId FK — UUID PKs PROHIBITED in enterprise tables
FINANCE  : bigint (paise) for INR monetary values — NEVER float/real/doublePrecision
IDEMPOTENCY : SHA-256 deterministic hash — crypto.randomUUID() PROHIBITED
AUDIT    : actor = "user:{userId}" | "system:{source}" — NO free-form strings
DEPLOY   : git push origin main ONLY — npx vercel --prod PROHIBITED
LIMSY    : NO hard DELETE on limsy_orders — append-only at DB privilege level
RLS_NEW  : All bms_* tables: FORCE ROW LEVEL SECURITY + policy TO studio_app
FLOAT    : No real/float for rating, progress, roi_multiple, success_rate, cpu_limit
```

## NEW API NAMESPACE

All P2 routes are now under `/api/bms/` in P1:

```
GET/POST   /api/bms/lms/courses         — BMS Academy course catalogue
POST       /api/bms/lms/enrollments     — Enroll user in course
GET        /api/bms/lms/my-learning     — User's enrolled courses
GET/POST   /api/bms/studio/projects     — SaaS Studio Builder projects
GET/POST   /api/bms/studio/agents       — BMS AI agent registry
POST       /api/bms/studio/workflows/[id]/run — Trigger workflow
GET/POST   /api/bms/hosting/containers  — Container management (admin only)
GET/POST   /api/bms/hosting/dns         — DNS records (admin only)
GET/POST   /api/bms/ops/code-red        — Code Red business cases
GET/POST   /api/bms/ops/assignments     — Learning assignments
GET/POST   /api/bms/ops/documents       — Document vault
GET/PUT    /api/bms/ops/gates           — Feature gates
```

## PROXY.TS ADDITIONS REQUIRED

In `src/proxy.ts`, add to ADMIN_PREFIXES:
```typescript
"/api/bms/hosting",     // Container + DNS — admin only
"/api/bms/ops/gates",   // Gate management — admin only
```

## ATP STATUS

| Category | Passed | Total | Status |
|----------|--------|-------|--------|
| P1 Existing (BLOCKER/CRITICAL) | 27 | 27 | ✅ All clear |
| P1 Existing (MAJOR/MINOR) | 13 | 33 | 20 pending |
| P2 BMS New | 0 | 20 | Pending |
| **TOTAL** | **40** | **80** | **Day 8–10** |

## REFERENCE DOCUMENTS

- `BNLV-CONS-001` — This file's parent document (master consolidation plan)
- `BNLV-MASTER-001 v2.0` — Platform architecture reference
- `BNLV-TRD-PHASE-A-001` — Phase A technical reference
- `System_State_PostMerge.json` — Machine-readable state for tool consumption
