# BNLV Group — Enterprise SaaS Platform (saas-studio)
# PROJECT PROGRESS SUMMARY & LLM SESSION BOOTSTRAP

---

```
DOCUMENT REF    : BNLV-LLM-CTX-001
DATE            : August 13, 2026
ISSUED BY       : Office of the Chief Technology Officer
AUDIENCE        : CTO · SMEs · Solution Architects · Developers
CLASSIFICATION  : Internal — Restricted
REPOSITORY      : github.com/kumarajaysharma/BMSolutions1.0
LOCAL PATH      : D:\BMS-Final\saas-studio
PRIMARY BRANCH  : main
```

---

## HOW TO USE THIS FILE

Paste this entire file into a new LLM session as the first message. It
provides complete architectural awareness, all active decisions, all pending
items, and mandatory developer patterns. No prior session context is needed.

---

## EXECUTIVE SUMMARY

The BNLV Group Enterprise SaaS Platform (`saas-studio`) is a Next.js 16 App
Router multi-tenant platform serving four subsidiaries under the BNLV Group
conglomerate. Phase A (Commercial Launch Foundation) is 100% complete and
production-verified. Phase B (Public Website & Subsidiary SSG Pages) is
implemented and code-complete but awaiting a clean Vercel production deployment
due to a Next.js 16 + Turbopack + Vercel CLI packaging compatibility issue.
A verified build workaround (NFT shim) is staged and awaiting final push.

---

## 1. PLATFORM OVERVIEW

### 1.1 Product Identity

| Attribute           | Value                                                |
|---------------------|------------------------------------------------------|
| Platform Name       | saas-studio                                          |
| Conglomerate        | BNLV Group of Companies                              |
| Group Domain        | bnlvconsulting.com                                   |
| Admin Entry Point   | bms.bnlvconsulting.com/login                         |
| CTO / System Arch   | Ajay Kumar (Chartered Accountant + Enterprise AI)    |

### 1.2 Technology Stack

| Layer              | Technology                                                  |
|--------------------|-------------------------------------------------------------|
| Web Framework      | Next.js 16.2.6 — App Router (TypeScript)                   |
| ORM                | Drizzle ORM 0.45.2                                         |
| Database           | PostgreSQL via Neon Serverless                              |
| Auth               | JWT (jose) · scrypt password hashing · httpOnly cookies     |
| Middleware         | Next.js Edge Runtime — proxy.ts with Zero Trust model       |
| Styling            | Tailwind CSS 4.1.17                                         |
| Deployment         | Vercel (GitHub integration — auto-deploy on push to main)   |
| WAF / CDN          | Cloudflare                                                  |
| Connection Roles   | studio_app (runtime) · owner connection (migrations/seeds)  |
| State Management   | Zustand                                                     |

### 1.3 Active Tenant Registry

| Tenant ID | Slug      | Subsidiary              | Domain                        | Plan       | Admin Account                       |
|-----------|-----------|-------------------------|-------------------------------|------------|-------------------------------------|
| 1         | bnlv      | BNLV Group (Root)       | bnlvconsulting.com            | enterprise | admin@bnlvconsulting.com            |
| 10        | bms       | BMSolutions              | bms.bnlvconsulting.com        | enterprise | admin@bms.bnlvconsulting.com (ID 13)|
| 11        | vihang    | Vihang Creations         | vihang.bnlvconsulting.com     | enterprise | admin@vihang.bnlvconsulting.com     |
| TBD       | nidhivan  | Nidhivan Consulting      | nidhivan.bnlvconsulting.com   | enterprise | admin@nidhivan.bnlvconsulting.com   |
| TBD       | limsy     | Legal Intelligence       | limsy.bnlvconsulting.com      | enterprise | admin@limsy.bnlvconsulting.com      |

> **Note:** Nidhivan and LIMSY tenant IDs are pending confirmation from the
> Neon console. Their workspace schema tables and RLS policies are fully
> implemented in schema.ts.

---

## 2. REPOSITORY STATE

### 2.1 Branch & Commit Status

```
Branch:   main
Remote:   github.com/kumarajaysharma/BMSolutions1.0
```

Recent commit history (most recent first):

| Commit    | Message                                                                          |
|-----------|----------------------------------------------------------------------------------|
| b1877ee   | ci: trigger GitHub integration deployment (empty commit)                         |
| 19a3562   | fix: isolate edge runtime — jwt.ts decouples jose from next/headers              |
| 3c5b2e0   | fix: remove config export from proxy.ts to resolve Turbopack NFT failure         |
| a8b4853   | fix: define middleware config inline for turbopack compatibility                  |
| 4da80be   | fix: vercel rewrite regex named capture for subdomain routing                    |
| 4eb7341   | fix: add www redirect to proxy, wire middleware.ts entry point                   |
| a11c1e9   | feat(phase-b): subsidiary SSG pages, BNLV brand system, schema hardening         |
| 18830c0   | fix: TS build errors — SubsidiaryPageProps, schema column alignment              |

### 2.2 Key File Map

```
saas-studio/
├── middleware.ts                         # Next.js Edge entry — delegates to src/proxy.ts
├── vercel.json                           # Routing, headers, www redirect, buildCommand
├── package.json                          # type: module, postbuild NFT shim hook
├── next.config.ts                        # Next.js config
├── tailwind.config.ts                    # BNLV brand tokens (navy, gold, cream)
├── drizzle/
│   └── migrations/
│       ├── 0008_commercial_launch_foundation.sql   # Phase A schema
│       └── 0009_schema_hardening.sql               # No-op (verified no changes needed)
├── scripts/
│   ├── create-middleware-nft.mjs         # Postbuild NFT shim (local builds)
│   └── vercel-build.mjs                 # PENDING PUSH — Vercel build wrapper (mid-build NFT)
└── src/
    ├── proxy.ts                          # Zero Trust middleware logic (Edge-safe)
    ├── app/
    │   ├── actions.ts                    # Server action — client intake (Zod + SHA-256)
    │   ├── [subdomain]/
    │   │   ├── page.tsx                  # SSG subsidiary landing pages (4 subsidiaries)
    │   │   ├── layout.tsx               # Subsidiary layout shell
    │   │   └── _components/
    │   │       └── IntakeForm.tsx        # Client component — useActionState intake form
    │   ├── (public)/
    │   │   └── page.tsx                  # BNLV Group main portal (bnlvconsulting.com)
    │   └── api/
    │       ├── auth/login/route.ts       # scrypt + bcrypt password verification
    │       ├── careers/route.ts          # Job applications intake
    │       ├── requests/route.ts         # Client scheduling requests
    │       ├── nidhivan/                 # Nidhivan DPR/BOQ/Metrics API routes
    │       └── limsy/                    # LIMSY cases/hearings/orders API routes
    ├── db/
    │   ├── schema.ts                     # Complete Drizzle ORM schema (680 lines)
    │   └── index.ts                      # Database connection (pooled + unpooled)
    └── lib/
        ├── jwt.ts                        # EDGE-SAFE JWT — jose only, no next/headers
        ├── auth.ts                       # SERVER-ONLY — imports jwt.ts + next/headers
        ├── proxy.ts                      # see src/proxy.ts above
        ├── roles.ts                      # Edge-safe RBAC — zero imports, pure logic
        └── request-context.ts            # Server-side request context helpers
```

---

## 3. PHASE A — COMPLETE ✅

**Status:** 100% production-verified on Neon PostgreSQL.

### 3.1 Migration 0008 — Commercial Launch Foundation

All changes applied and verified via `information_schema.columns` diagnostics:

| Change                            | Type               | Verified Status     |
|-----------------------------------|--------------------|---------------------|
| `tenant_plan` enum expansion      | ADD VALUE          | ✅ Confirmed in Neon |
| `stripe_customer_id` column       | ADD COLUMN         | ✅ Confirmed in Neon |
| `stripe_subscription_id` column   | ADD COLUMN         | ✅ Confirmed in Neon |
| `stripe_price_id` column          | ADD COLUMN         | ✅ Confirmed in Neon |
| `plan_expires_at` column          | ADD COLUMN         | ✅ Confirmed in Neon |
| `client_requests` table created   | CREATE TABLE       | ✅ Confirmed in Neon |
| RLS + FORCE RLS on client_requests| ALTER TABLE        | ✅ Confirmed in Neon |

### 3.2 Migration 0009 — Schema Hardening (NO-OP)

All targeted columns were provisioned correctly from inception. Zero ALTER
statements were required. Confirmed via `information_schema.columns` queries:

| Target Column               | Table            | Data Type      | Verified     |
|-----------------------------|------------------|----------------|--------------|
| `estimated_fees_paise`      | limsy_cases      | bigint         | ✅ Correct   |
| `billed_amount_paise`       | limsy_cases      | bigint         | ✅ Correct   |
| `cost_amount_paise`         | limsy_orders     | bigint         | ✅ Correct   |
| `token_hash`                | sessions         | text           | ✅ Correct   |
| `name` (no `candidate_name`)| job_applications | text           | ✅ Correct   |
| `contingency_pct`           | nidhivan_boqs    | numeric(5,2)   | ✅ Correct   |
| `overhead_pct`              | nidhivan_boqs    | numeric(5,2)   | ✅ Correct   |
| `gst_pct`                   | nidhivan_boqs    | numeric(5,2)   | ✅ Correct   |
| `contingency_pct`           | nidhivan_dprs    | numeric(5,2)   | ✅ Correct   |
| `overhead_pct`              | nidhivan_dprs    | numeric(5,2)   | ✅ Correct   |

### 3.3 Tenant Provisioning

- BMSolutions (ID 10) — `admin@bms.bnlvconsulting.com` — enterprise — active ✅
- Vihang Creations (ID 11) — `admin@vihang.bnlvconsulting.com` — enterprise — active ✅

---

## 4. PHASE B — CODE COMPLETE, DEPLOYMENT PENDING ⚠️

### 4.1 Routing Architecture

**Decision:** Vercel wildcard rewrites + Next.js `[subdomain]` dynamic route group.

```json
// vercel.json — active rewrite rule
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "(?<subdomain>[^.]+)\\.bnlvconsulting\\.com" }],
  "destination": "/:subdomain/:path*"
}
```

`dynamicParams = false` enforces static 404 for any unlisted subdomain at the edge.
`generateStaticParams()` pre-renders: `bms`, `nidhivan`, `limsy`, `vihang`.

### 4.2 Phase B Files — All Verified & Committed

| File                                       | Status      | Purpose                                    |
|--------------------------------------------|-------------|--------------------------------------------|
| `src/app/[subdomain]/page.tsx`             | ✅ Committed | SSG landing page (4 subsidiaries)          |
| `src/app/[subdomain]/layout.tsx`           | ✅ Committed | Subsidiary layout shell                    |
| `src/app/[subdomain]/_components/IntakeForm.tsx` | ✅ Committed | Client intake form (useActionState)  |
| `src/app/actions.ts`                       | ✅ Committed | Server action (SHA-256 idempotency, Zod)   |
| `src/app/(public)/page.tsx`                | ✅ Committed | BNLV portal (navy/gold brand system)       |
| `tailwind.config.ts`                       | ✅ Committed | BNLV brand tokens                          |
| `vercel.json`                              | ✅ Committed | Rewrites, headers, www redirect            |
| `middleware.ts`                            | ✅ Committed | Edge entry — delegates to src/proxy.ts     |
| `src/proxy.ts`                             | ✅ Committed | Zero Trust proxy (edge-safe, jwt.ts import)|
| `src/lib/jwt.ts`                           | ✅ Committed | Edge-safe JWT (jose only)                  |
| `src/lib/auth.ts`                          | ✅ Committed | Server-only cookies (imports jwt.ts)       |

### 4.3 Metadata Per Subsidiary (generateMetadata)

| Slug     | Title Tag                                                           |
|----------|---------------------------------------------------------------------|
| bms      | BMSolutions — Enterprise SaaS & Website Builder Suites \| BNLV Group |
| nidhivan | Nidhivan Consulting — Institutional DPR, BOQ & Financial Engine     |
| limsy    | LIMSY — Supreme Court Standard Docket & Case Intelligence           |
| vihang   | Vihang Creations — Enterprise Digital Asset & Layout Studios        |

---

## 5. SECURITY ARCHITECTURE

### 5.1 Zero Trust Middleware Chain

```
Request → middleware.ts
           └── src/proxy.ts
               ├── Step 0: www.bnlvconsulting.com → 301 apex (before all auth)
               ├── Step 1: Host-header tenant resolution (slug mapping)
               ├── Step 2: Strip + sanitize managed headers (injection prevention)
               ├── Step 3: Public paths pass-through (no JWT required)
               ├── Step 4: JWT verification via src/lib/jwt.ts (< 5ms)
               ├── Step 5: RBAC enforcement via src/lib/roles.ts
               └── Step 6: Inject verified x-tenant-id, x-user-id, x-user-role
```

### 5.2 Critical Edge Runtime Boundary

```
EDGE RUNTIME (middleware)          SERVER RUNTIME (API routes, RSC)
─────────────────────────          ────────────────────────────────
src/lib/jwt.ts     ← SAFE          src/lib/auth.ts    ← SERVER ONLY
  └── jose only                      ├── imports jwt.ts
                                      └── imports next/headers (cookies)
src/lib/roles.ts   ← SAFE
  └── zero imports
```

**CRITICAL:** `next/headers` is NOT available in Edge Runtime. Importing
`auth.ts` from middleware caused Turbopack's NFT generator to fail with
`ENOENT: middleware.js.nft.json`. Fixed by creating `jwt.ts` as the
edge-safe JWT boundary.

### 5.3 Authentication Flow

- **Cookie name:** `bms_session` (httpOnly, secure, sameSite: strict)
- **Algorithm:** HS256 (jose SignJWT/jwtVerify)
- **JWT_SECRET:** Minimum 32 characters — enforced at startup
- **Session duration:** 24 hours
- **Password hashing:** scrypt (N=16384, r=8, p=1) — format: `$scrypt$N=16384,r=8,p=1$<salt>$<dk>`
- **Timing attack prevention:** MIN_RESPONSE_MS = 200ms enforced on all login responses
- **Session DB record:** `sessions` table — `tokenHash` stores SHA-256(sessionId), NOT raw token

### 5.4 Row-Level Security (ADR-001)

- All tenant-scoped tables: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`
- Session variable: `app.current_tenant_id` (SET LOCAL inside transactions)
- Authorised query path: `withTenant(tenantId, async (tx) => {...})` — ONLY
- Connection for migrations/seeds: `DATABASE_URL_UNPOOLED` (owner connection)
- Connection for runtime: `DATABASE_URL` (pooled)

### 5.5 RBAC Role Hierarchy

```
owner (0) > admin (1) > architect (2) > developer (3) > designer (4) > viewer (5)
```

`hasMinimumRole(actual, required)` — returns false for unknown roles (CRITICAL security failsafe).

---

## 6. ARCHITECTURE DECISION RECORDS

### ADR-001: Database-Level RLS for Multi-Tenancy — ACCEPTED

- All queries through `withTenant()` wrapper
- `studio_app` role operates under FORCE RLS on all tenant-scoped tables
- Hard deletes on `limsy_orders` prohibited at DB privilege level
- `SET LOCAL app.current_tenant_id` must be first statement in any transaction

### ADR-002: Native Admin Seeding on Neon Serverless — ACCEPTED

- `SET ROLE studio_migrator` permanently deprecated
- All migrations and seeds: `DATABASE_URL_UNPOOLED` (owner connection)
- CLI scripts must manually inject `SET LOCAL app.current_tenant_id` before any DML/DQL
- `SELECT` for idempotency checks also requires SET LOCAL (FORCE RLS hides all rows otherwise)

---

## 7. DATABASE SCHEMA SUMMARY

### 7.1 Core Tables

| Table               | Purpose                                     | Key Constraints                    |
|---------------------|---------------------------------------------|------------------------------------|
| `tenants`           | Tenant registry with Stripe billing columns | slug UNIQUE, plan enum             |
| `users`             | User accounts per tenant                    | email+tenantId UNIQUE              |
| `sessions`          | Active sessions                             | tokenHash (SHA-256, NOT raw token) |
| `client_requests`   | Enterprise intake                           | idempotencyKey UNIQUE, RLS active  |
| `audit_logs`        | DPDP compliance audit trail                 | actor format: user:{userId}        |
| `job_applications`  | Careers intake                              | name column (candidateName removed)|

### 7.2 Nidhivan Workspace Tables

`nidhivan_projects`, `nidhivan_dprs`, `nidhivan_boqs`, `nidhivan_boq_items`,
`nidhivan_financial_metrics` — all with FORCE RLS.

**Financial precision:** All monetary columns are `bigint` in paise.
**Percentages:** `numeric(5,2)` (contingencyPct, overheadPct, gstPct).

### 7.3 LIMSY Workspace Tables

`limsy_cases`, `limsy_bench_assignments`, `limsy_hearings`, `limsy_orders`

**Monetary columns:** `estimatedFeesPaise` and `billedAmountPaise` (bigint).
`costAmountPaise` on limsy_orders (bigint).
**Self-referential FKs:** `parentCaseId` and `appealCaseId` use `AnyPgColumn` type.

### 7.4 Financial Precision Convention

```typescript
// ALL monetary values stored as bigint in paise
// 1 rupee = 100 paise
// LAKH = 10_000_000 paise
// CRORE = 1_000_000_000 paise

// CORRECT:
amountPaise: bigint('amount_paise', { mode: 'number' }).notNull()

// VIOLATION — never use for financial data:
amount: doublePrecision('amount')  // floating-point precision loss
amount: integer('amount')          // overflows at ~₹21.5L in paise
```

---

## 8. MANDATORY DEVELOPER GUIDELINES

### 8.1 Connection String Discipline

| Connection              | Authorised Use                                        |
|-------------------------|-------------------------------------------------------|
| `DATABASE_URL`          | Pooled — application runtime ONLY (API routes, RSC)   |
| `DATABASE_URL_UNPOOLED` | Direct — migrations, seeds, CLI scripts ONLY          |

### 8.2 withTenant() — Mandatory Query Pattern

```typescript
// ✅ CORRECT
const result = await withTenant(tenantId, async (tx) => {
  return tx.select().from(nidhivanProjects).where(...);
});

// ❌ VIOLATION — returns zero rows silently (RLS hides all)
const result = await db.select().from(nidhivanProjects).where(...);
```

### 8.3 Admin CLI Script Pattern

```typescript
// REQUIRED — inside DATABASE_URL_UNPOOLED transaction:
await client.query('BEGIN');
await client.query("SET LOCAL app.current_tenant_id = $1", [tenantId]); // FIRST
// ... DML/DQL here
await client.query('COMMIT');
```

### 8.4 Idempotency Key — client_requests

```typescript
// ✅ CORRECT — deterministic SHA-256
const hourBucket = new Date().toISOString().slice(0, 13);
const idempotencyKey = createHash('sha256')
  .update(`${subsidiary}:${contactEmail}:${companyName}:${hourBucket}`)
  .digest('hex');

// ❌ VIOLATION — breaks retry safety
const idempotencyKey = crypto.randomUUID();
```

### 8.5 Audit Log Actor Format

```typescript
actor: `user:${userId}`,      // human-initiated
actor: 'system:scheduler',    // automated job
actor: 'system:landing-page', // public form
actor: 'system:migration',    // migration script
```

### 8.6 Schema Drift Prevention

- Any SQL executed directly on Neon must be reflected in `schema.ts` in the same commit
- `npm run db:migrate` is the ONLY authorised mechanism for production schema changes
- PRs modifying `schema.ts` without a corresponding migration file are blocked from main

### 8.7 Edge Runtime Import Rules

```typescript
// ALLOWED in middleware/proxy (Edge Runtime):
import { decrypt } from '@/lib/jwt';    // jose only
import { hasMinimumRole } from '@/lib/roles'; // zero imports

// NEVER import from edge runtime:
import { cookies } from 'next/headers';  // server-only
import { db } from '@/db';              // Node.js (pg driver)
import crypto from 'crypto';            // Node.js built-in
```

---

## 9. DEPLOYMENT INFRASTRUCTURE

### 9.1 Current Setup

| Component              | Configuration                                          |
|------------------------|--------------------------------------------------------|
| Git Remote             | github.com/kumarajaysharma/BMSolutions1.0              |
| Vercel Project         | vercel.com/bnlv/bmsolutions                            |
| GitHub Integration     | Connected — auto-deploy on push to main                |
| Custom Domain          | bms.bnlvconsulting.com (and *.bnlvconsulting.com)      |
| Edge Region            | bom1 (Mumbai) — confirmed in runtime logs              |
| Database               | Neon PostgreSQL (Neon console: confirmed production)    |

### 9.2 Environment Variables Required in Vercel Dashboard

| Variable                 | Description                                  |
|--------------------------|----------------------------------------------|
| `DATABASE_URL`           | Pooled Neon connection string                |
| `DATABASE_URL_UNPOOLED`  | Direct Neon connection (migrations/seeds)    |
| `JWT_SECRET`             | Minimum 32-char random string (HS256 key)    |
| `NEXT_TURBOPACK`         | Set to `0` (prevents some Turbopack issues)  |

### 9.3 ACTIVE DEPLOYMENT BLOCKER — NFT Shim

**Issue:** Next.js 16 Turbopack outputs middleware to `.next/server/middleware/`
(directory). Vercel's `modifyConfig` adds a finalization step inside `next build`
that reads `.next/server/middleware.js.nft.json` (webpack-era path). The file
does not exist → ENOENT → build fails.

**Root cause:** Vercel CLI 58.9.5 packaging code is not updated for Next.js 16
Turbopack's directory-based middleware output format. `NEXT_TURBOPACK=0` env
var does NOT prevent `modifyConfig` from re-enabling Turbopack.

**Solution staged (NOT YET PUSHED):**

Two files need to be placed and committed:

1. **`scripts/vercel-build.mjs`** — Async build wrapper that:
   - Spawns `next build` as a child process
   - Polls every 50ms for `.next/server/middleware/` to appear
   - Creates `middleware.js.nft.json` the instant the directory appears
   - Exits with `next build`'s exit code

2. **`vercel.json`** — Updated to include:
   ```json
   "buildCommand": "node scripts/vercel-build.mjs"
   ```
   This replaces `npm run build` as the build entry point.

**Local build verification confirms:**
```
✓ Compiled successfully
✓ Finished TypeScript (0 errors)
✓ Collecting page data (24/24)
✓ Generating static pages (24/24)
✓ Finalizing page optimization
[nft-shim] Created middleware.js.nft.json (89 entries)
```

**Files confirmed clean and ready to commit:**
- `scripts/vercel-build.mjs` — PENDING git add + push
- `vercel.json` (with buildCommand) — PENDING git add + push

### 9.4 Deployment Workflow (post-fix)

```bash
git add scripts/vercel-build.mjs vercel.json
git commit -m "fix: async vercel-build wrapper creates NFT mid-build for Turbopack compatibility"
git push origin main
# GitHub integration deploys automatically — no npx vercel --prod needed
```

**DO NOT use `npx vercel --prod`** — Vercel CLI 58.x packaging is incompatible
with Next.js 16 Turbopack middleware output structure.

---

## 10. PENDING ITEMS (ORDERED BY PRIORITY)

### P0 — IMMEDIATE (Blocking Production)

- [ ] **Commit and push `vercel-build.mjs` + updated `vercel.json`**
  ```
  git add scripts\vercel-build.mjs vercel.json
  git commit -m "fix: async vercel-build wrapper creates NFT mid-build"
  git push origin main
  ```

- [ ] **Reset admin password for BMSolutions (user ID 13)**
  Generate scrypt hash locally:
  ```cmd
  node -e "const crypto=require('crypto');const{promisify}=require('util');const s=promisify(crypto.scrypt);const pwd='ACTUAL_PASSWORD';const salt=crypto.randomBytes(16);s(pwd,salt,32,{N:16384,r:8,p:1,maxmem:67108864}).then(dk=>{console.log('$scrypt$N=16384,r=8,p=1$'+salt.toString('base64url')+'$'+dk.toString('base64url'));});"
  ```
  Apply in Neon:
  ```sql
  UPDATE users SET password_hash = 'HASH_HERE', updated_at = NOW()
  WHERE id = 13 AND email = 'admin@bms.bnlvconsulting.com';
  ```

### P1 — POST-DEPLOYMENT VERIFICATION

- [ ] `https://www.bnlvconsulting.com` → 301 to apex
- [ ] `https://bnlvconsulting.com` → BNLV portal renders (navy/gold brand)
- [ ] `https://bms.bnlvconsulting.com` → BMSolutions SSG landing page
- [ ] `https://nidhivan.bnlvconsulting.com` → Nidhivan SSG landing page
- [ ] `https://limsy.bnlvconsulting.com` → LIMSY SSG landing page
- [ ] `https://vihang.bnlvconsulting.com` → Vihang SSG landing page
- [ ] `https://bms.bnlvconsulting.com/login` → Admin login succeeds
- [ ] `https://unknown.bnlvconsulting.com` → 404 (dynamicParams = false)
- [ ] Intake form submit → Row in `client_requests` with SHA-256 idempotency_key

### P2 — SECURITY REMEDIATIONS (Phase C)

- [ ] **`sessions.tokenHash` stores raw UUID** — should store SHA-256(sessionId)
  ```typescript
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex');
  ```

- [ ] **`generateScryptHash("__dummy__")` in login route** — executes on every
  login adding 80-150ms. Cache at module level:
  ```typescript
  const DUMMY_HASH_PROMISE = generateScryptHash("__dummy__");
  const DUMMY_HASH = await DUMMY_HASH_PROMISE; // inside handler
  ```

- [ ] **CSP headers** — `nonce`-based Content-Security-Policy required for
  Next.js 15+ server actions. Cannot be set as static header in vercel.json.
  Requires `middleware.ts` implementation using `crypto.randomBytes()`.

- [ ] **HSTS** — Set in Cloudflare SSL/TLS panel (not Vercel origin):
  `max-age=31536000; includeSubDomains; preload`

### P3 — PHASE C SCOPE

- [ ] Nidhivan tenant provisioning (formal seed script execution)
- [ ] LIMSY tenant provisioning
- [ ] Admin dashboard (`/admin`) UI for client_requests management
- [ ] Stripe webhook integration (billing columns are live, integration pending)
- [ ] bms-logo.png optimization (currently 7.65 MB — target < 200 KB)

---

## 11. KNOWN ARCHITECTURAL RISKS

| Risk | Severity | Description | Status |
|------|----------|-------------|--------|
| Turbopack + Vercel CLI incompatibility | HIGH | NFT file path mismatch blocks production build | Workaround staged |
| sessionId stored as tokenHash (not hashed) | HIGH | DB read exposes all active sessions | Phase C backlog |
| `client_requests.handledByTenantId` default | MEDIUM | Dynamic resolution query per intake request adds latency | Acceptable for current load |
| `nidhivan_boq_items.quantity: doublePrecision` | MEDIUM | Float aggregation risk in BOQ summation | Phase C review |
| `limsy_cases.tags: text` | LOW | Should be text[] or jsonb for multi-value tags | Phase C review |
| bms-logo.png 7.65 MB hero image | LOW | LCP score impact on bnlvconsulting.com | Phase C |
| Vercel Hobby plan | MEDIUM | Incompatible with commercial commitments | Upgrade on Phase C |

---

## 12. SESSION BOOTSTRAP PROMPT

**Copy and paste the following as the opening message in any new LLM session:**

---

```
We are resuming development on the BNLV Group Enterprise SaaS Platform
(saas-studio).

REPOSITORY: github.com/kumarajaysharma/BMSolutions1.0
LOCAL PATH: D:\BMS-Final\saas-studio
STACK: Next.js 16.2.6 App Router · Drizzle ORM · Neon PostgreSQL ·
       Vercel · Tailwind CSS 4 · TypeScript · jose JWT · scrypt auth

CURRENT STATE:
- Phase A (Commercial Launch Foundation): 100% complete, Neon-verified
- Phase B (Public SSG Pages): Code complete, deployment blocked by
  Vercel/Turbopack/Next.js 16 NFT file incompatibility
- Migration 0008 (commercial_launch_foundation): Applied and verified
- Migration 0009 (schema_hardening): No-op — all columns were correct
- GitHub Integration: Connected to Vercel for auto-deploy

MANDATORY RULES (non-negotiable):
1. All DB queries through withTenant() — ADR-001
2. Migrations via DATABASE_URL_UNPOOLED — ADR-002
3. SET LOCAL app.current_tenant_id before any DML/DQL in seeds
4. Idempotency keys: SHA-256 deterministic hash, NOT randomUUID()
5. Financial columns: bigint in paise — never float or integer
6. Edge Runtime: only import from src/lib/jwt.ts and src/lib/roles.ts
7. Audit actor format: user:{userId} | system:{source}
8. DO NOT run npx vercel --prod — use git push for GitHub integration

IMMEDIATE NEXT ACTION:
Commit and push scripts/vercel-build.mjs + vercel.json (buildCommand override)
to resolve the Turbopack NFT build blocker. Then reset admin password for
user ID 13 (admin@bms.bnlvconsulting.com) using the scrypt hash format:
$scrypt$N=16384,r=8,p=1$<salt_base64url>$<dk_base64url>

Please confirm you have read the full PROJECT_PROGRESS_SUMMARY.md and ask
for any specific area you need to work on.
```

---

## 13. REFERENCE: CRITICAL COMMANDS

### Database Migration

```bash
npm run db:migrate        # Apply pending Drizzle migrations (uses DATABASE_URL_UNPOOLED)
npm run db:generate       # Generate new migration from schema.ts changes
```

### Local Development

```bash
npm run dev               # Start dev server (Turbopack) — localhost:3000
npm run build             # Production build — verify zero errors before push
npm run typecheck         # TypeScript check without building
```

### Deployment (GitHub Integration — PREFERRED)

```bash
git add .
git commit -m "your message"
git push origin main      # Auto-triggers Vercel deployment
```

### Password Hash Generation (scrypt — matches login/route.ts)

```cmd
node -e "const crypto=require('crypto');const{promisify}=require('util');const s=promisify(crypto.scrypt);const pwd='YOUR_PASSWORD';const salt=crypto.randomBytes(16);s(pwd,salt,32,{N:16384,r:8,p:1,maxmem:67108864}).then(dk=>{console.log('$scrypt$N=16384,r=8,p=1$'+salt.toString('base64url')+'$'+dk.toString('base64url'));});"
```

### Verify Columns in Neon

```sql
-- Check specific table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'TABLE_NAME'
ORDER BY ordinal_position;
```

---

*Document auto-generated from session context — BNLV Group CTO Office*
*BNLV-LLM-CTX-001 · August 13, 2026 · Phase B Active*
