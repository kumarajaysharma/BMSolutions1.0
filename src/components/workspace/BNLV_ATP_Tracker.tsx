/**
 * src/components/workspaces/atp-tracker.tsx
 */

'use client';

import { useState, useEffect } from "react"

// ── Test data ──────────────────────────────────────────────────────────────────
const TESTS = [
  // ZERO-TRUST INGRESS
  { id:'ZT-001', sec:'Zero-Trust Ingress', sev:'CRITICAL', name:'www subdomain → apex 301 redirect',
    pre:'www.bnlvconsulting.com CNAME live. Cloudflare proxied.',
    steps:['curl -I https://www.bnlvconsulting.com','Verify HTTP/2 301 status line','Verify Location: https://bnlvconsulting.com','curl -IL → confirm final HTTP 200 at apex'],
    pass:'301 + correct Location header. No redirect loop. Final page HTTP 200.',
    fail:'200 on www (no redirect). 302 (must be 301). Redirect loop. Wrong Location domain.' },
  { id:'ZT-002', sec:'Zero-Trust Ingress', sev:'CRITICAL', name:'Host-header tenant resolution — valid known subdomain',
    pre:'bms.bnlvconsulting.com CNAME live. Valid bms-tenant JWT cookie.',
    steps:['Navigate to https://bms.bnlvconsulting.com/studio with valid session','Inspect downstream headers: x-tenant-id, x-tenant-slug','Verify x-tenant-id=10, x-tenant-slug=bms'],
    pass:'x-tenant-id: 10 and x-tenant-slug: bms injected by proxy. No 403/500.',
    fail:'Missing or incorrect tenant headers. 500 from getRequestContext() on missing headers.' },
  { id:'ZT-003', sec:'Zero-Trust Ingress', sev:'CRITICAL', name:'Unknown subdomain → 404 (dynamicParams = false)',
    pre:'Vercel wildcard *.bnlvconsulting.com routing active.',
    steps:['curl -I https://unknown.bnlvconsulting.com','curl -I https://attacker.bnlvconsulting.com','Verify HTTP 404 on both'],
    pass:'HTTP 404 for any subdomain not in generateStaticParams() allow-list.',
    fail:'200 or 500 returned. Any content served for unmapped subdomain.' },
  { id:'ZT-004', sec:'Zero-Trust Ingress', sev:'BLOCKER', name:'Client-injected x-tenant-id stripped by proxy (Step 2 sanitization)',
    pre:'Platform deployed. curl available.',
    steps:["curl -H 'x-tenant-id: 1' -H 'x-user-role: owner' https://bms.bnlvconsulting.com/api/limsy/cases","Inspect response — must NOT reflect bnlv root (ID 1) data","Verify 401 or 403 returned — injected headers not accepted as authoritative"],
    pass:'401/403. No bnlv-scoped data returned to bms-domain caller.',
    fail:'200 with bnlv root data. Injected headers accepted as authoritative. Cross-tenant bypass.' },
  { id:'ZT-005', sec:'Zero-Trust Ingress', sev:'HIGH', name:'Public path pass-through — no JWT required',
    pre:'Platform deployed.',
    steps:['curl https://bms.bnlvconsulting.com (no cookie) → verify 200','curl https://bms.bnlvconsulting.com/login (no cookie) → verify 200'],
    pass:'HTTP 200 on landing and login. No auth redirect on designated public paths.',
    fail:'Redirect loop or 401 on public pages. Login page requires authentication to access.' },
  { id:'ZT-006', sec:'Zero-Trust Ingress', sev:'BLOCKER', name:'Expired JWT → 401 (no silent pass-through)',
    pre:'Expired bms_session cookie (25+ hours old).',
    steps:["curl -H 'Cookie: bms_session=<expired_token>' https://bms.bnlvconsulting.com/studio","Verify HTTP 401 status","Verify no protected content in response body"],
    pass:'HTTP 401. No content served. No cookie extension.',
    fail:'HTTP 200 with protected content. Any data served on an expired token.' },
  { id:'ZT-007', sec:'Zero-Trust Ingress', sev:'BLOCKER', name:'Tampered JWT signature → 401',
    pre:'Valid JWT with last 3 chars of signature segment altered.',
    steps:['Corrupt last 3 chars of the signature segment of a valid bms_session token',"curl -H 'Cookie: bms_session=<tampered>' https://bms.bnlvconsulting.com/studio","Verify HTTP 401"],
    pass:'HTTP 401 on any signature mismatch. No content served.',
    fail:'HTTP 200 or content served on a signature-invalid token.' },
  { id:'ZT-008', sec:'Zero-Trust Ingress', sev:'CRITICAL', name:'Developer role blocked from architect-only POST endpoints',
    pre:'P-DEVELOPER session (role: developer) authenticated on limsy tenant.',
    steps:['POST /api/limsy/cases (P-DEVELOPER session) → expect 403','POST /api/limsy/hearings (P-DEVELOPER session) → expect 403','POST /api/limsy/orders (P-DEVELOPER session) → expect 403'],
    pass:'HTTP 403 on all three POST endpoints. Zero records created.',
    fail:'HTTP 201 on any endpoint for developer role. requireRole() not enforcing.' },
  { id:'ZT-009', sec:'Zero-Trust Ingress', sev:'BLOCKER', name:'Unauthenticated request to protected API → 401',
    pre:'No session cookie or Authorization header present.',
    steps:['curl https://bms.bnlvconsulting.com/api/limsy/cases (no cookie) → verify 401','curl https://bms.bnlvconsulting.com/studio (no cookie) → verify 401'],
    pass:'HTTP 401 on all protected paths. No data. No 500 with stack trace.',
    fail:'HTTP 200 or data returned without auth. HTTP 500 with stack trace (info disclosure).' },

  // AUTHENTICATION
  { id:'AUTH-001', sec:'Authentication', sev:'CRITICAL', name:'Login creates httpOnly bms_session cookie with correct attributes',
    pre:'admin@bms.bnlvconsulting.com exists with known scrypt password hash in Neon.',
    steps:['POST /api/auth/login with valid {email, password}','Inspect Set-Cookie: verify HttpOnly, Secure, SameSite=Strict, Path=/, ~24h expiry','Decode JWT payload (without verification) → tenantId=10, role=admin, userId=13'],
    pass:'HTTP 200. bms_session cookie with all 4 security attributes. Correct JWT payload.',
    fail:'401 on valid credentials. Cookie missing HttpOnly or Secure. Wrong tenant/role in payload.' },
  { id:'AUTH-002', sec:'Authentication', sev:'CRITICAL', name:'Wrong password → 401 with ≥200ms constant-time delay',
    pre:'Known user account.',
    steps:['POST /api/auth/login with correct email, wrong password','Measure response time: must be ≥200ms (MIN_RESPONSE_MS enforcement)','Verify HTTP 401 and no Set-Cookie header','Verify generic error message — no account existence enumeration'],
    pass:'Consistent 401. Response ≥200ms. No cookie. Generic error (same for wrong email vs wrong password).',
    fail:'HTTP 200. Cookie set. Response <200ms (timing attack surface). Different error messages per case.' },
  { id:'AUTH-003', sec:'Authentication', sev:'HIGH', name:'sessions.tokenHash stores SHA-256(sessionId), not raw UUID',
    pre:'Successful login complete. Neon console access.',
    steps:['Log in as admin@bms.bnlvconsulting.com','Query: SELECT token_hash FROM sessions WHERE user_id=13 ORDER BY created_at DESC LIMIT 1','Verify token_hash is exactly 64 lowercase hex characters','Verify token_hash ≠ raw JWT cookie value and ≠ raw sessionId UUID'],
    pass:'token_hash = 64-char hex. Does NOT match raw JWT or sessionId UUID. (TD-001 status)',
    fail:'token_hash equals raw JWT string or raw UUID. DB read exposes all active sessions.' },
  { id:'AUTH-004', sec:'Authentication', sev:'HIGH', name:'Session POST middleware guard executes before header injection (R13)',
    pre:'R13 remediation applied and deployed.',
    steps:['POST session endpoint without valid JWT cookie','Verify HTTP 401 returned before any handler logic executes','Verify no HTTP 500 from getRequestContext() throwing on null headers'],
    pass:'HTTP 401. Guard fires before header injection. No null-context 500.',
    fail:'HTTP 500 from getRequestContext() on null context headers. Session created without auth.' },

  // ROW-LEVEL SECURITY
  { id:'RLS-001', sec:'Row-Level Security', sev:'BLOCKER', name:'withTenant() — own-tenant rows only, zero cross-tenant leakage',
    pre:'limsy_cases has rows for both limsy and bms tenants. P-ARCHITECT on limsy.',
    steps:['GET /api/limsy/cases (limsy session) → note all returned case IDs','Query Neon: SELECT id, tenant_id FROM limsy_cases','Cross-reference: verify ALL returned IDs have tenant_id = limsy_tenant_id'],
    pass:'Zero bms-tenant rows in response. Row count matches WHERE tenant_id=limsy_id.',
    fail:'Any row with wrong tenant_id returned. OR empty response when own-tenant records exist.' },
  { id:'RLS-002', sec:'Row-Level Security', sev:'BLOCKER', name:'Cross-tenant isolation — bms actor cannot read limsy records',
    pre:'P-ALIEN authenticated as admin@bms.bnlvconsulting.com (tenant 10). limsy_cases has records.',
    steps:['Authenticate as bms admin (tenant 10, from bms.bnlvconsulting.com)','GET /api/limsy/cases with bms session','Verify zero limsy records in response'],
    pass:'Empty array [] or HTTP 403. No limsy-tenant records returned to bms-scoped session.',
    fail:'Any limsy record visible to bms-tenant caller. Cross-tenant data leakage confirmed.' },
  { id:'RLS-003', sec:'Row-Level Security', sev:'CRITICAL', name:'FORCE RLS — zero-row silent failure without withTenant() context',
    pre:'Direct database access via studio_app role.',
    steps:['Using studio_app role, execute: db.select().from(limsyCases) without withTenant()','Verify result is empty array []','Verify NO database exception is raised — RLS silently hides all rows'],
    pass:'Empty array []. No exception thrown. FORCE RLS confirmed active and transparent.',
    fail:'Any rows returned without withTenant() context. FORCE RLS not enforcing — critical failure.' },
  { id:'RLS-004', sec:'Row-Level Security', sev:'BLOCKER', name:'DELETE privilege REVOKED for studio_app on limsy_orders (migration 0004)',
    pre:'Neon console or DATABASE_URL_UNPOOLED connection.',
    steps:["SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='limsy_orders' AND grantee='studio_app'","Verify DELETE is absent from result","Attempt: DELETE FROM limsy_orders WHERE id=1 via studio_app role","Verify ERROR: permission denied for table limsy_orders (42501)"],
    pass:'DELETE not in grants list. 42501 on direct delete attempt via studio_app role.',
    fail:'DELETE in grants list. Delete succeeds. Immutable legal record can be hard-deleted.' },
  { id:'RLS-005', sec:'Row-Level Security', sev:'CRITICAL', name:'Nidhivan RLS isolation — nidhivan_projects tenant-scoped',
    pre:'nidhivan seed executed. bms tenant provisioned.',
    steps:['GET /api/nidhivan/projects (bms admin session) → verify empty []','GET /api/nidhivan/projects (nidhivan admin session) → verify project records returned'],
    pass:'Strict isolation. bms sees zero nidhivan projects. nidhivan sees own records.',
    fail:'nidhivan records returned to bms-tenant caller. nidhivan_projects RLS not enforcing.' },

  // LIMSY CASES API
  { id:'LC-001', sec:'LIMSY Cases API', sev:'CRITICAL', name:'POST — file valid SLP case (happy path)',
    pre:'P-ARCHITECT on limsy tenant. All four CRs cleared and deployed.',
    steps:['POST /api/limsy/cases with: internalRef, courtLevel=supreme_court, courtName, caseType=slp, petitioner, respondent, subjectMatter','Verify HTTP 201','Verify tenantId, internalRef, status=intake in response',"Query audit_logs: actor must be 'user:<userId>' format (not bare integer)"],
    pass:"HTTP 201. Record in DB. status='intake'. Audit actor = 'user:{userId}'.",
    fail:'Non-201. No record. Audit actor is bare integer. Wrong tenant scoping.' },
  { id:'LC-002', sec:'LIMSY Cases API', sev:'HIGH', name:'POST — missing required field → 400 with field list',
    pre:'P-ARCHITECT authenticated.',
    steps:['POST /api/limsy/cases with body missing the petitioner field','Verify HTTP 400 (no DB round-trip)','Verify error message lists all 7 required field names'],
    pass:'HTTP 400. Error: "Required fields: internalRef, courtLevel, courtName, caseType, petitioner, respondent, subjectMatter."',
    fail:'HTTP 500 from DB NOT NULL constraint. HTTP 201 with NULL petitioner. Error missing field list.' },
  { id:'LC-003', sec:'LIMSY Cases API', sev:'HIGH', name:'POST — invalid courtLevel enum → 400 before DB round-trip',
    pre:'P-ARCHITECT authenticated.',
    steps:["POST /api/limsy/cases with courtLevel: 'municipal_court' (not in VALID_COURT_LEVELS)",'Verify HTTP 400 (pre-flight validation, before DB call)','Verify error lists all valid VALID_COURT_LEVELS values'],
    pass:'HTTP 400. Complete valid enum list in error body. No PG 23514 constraint violation.',
    fail:'HTTP 500 from PostgreSQL enum error. HTTP 201 with invalid enum stored.' },
  { id:'LC-004', sec:'LIMSY Cases API', sev:'HIGH', name:'GET — developer role receives projected fields only (CR-003)',
    pre:'CR-003 fix deployed. P-DEVELOPER session active on limsy. At least one case record exists.',
    steps:['GET /api/limsy/cases (P-DEVELOPER session)','Verify petitioner, respondent, subjectMatter, reliefSought, actsSections are ABSENT','Verify id, internalRef, caseType, status, courtLevel, urgencyFlag, nextHearingDate are PRESENT'],
    pass:'Party/operative fields absent. Docket metadata present. HTTP 200.',
    fail:'petitioner or respondent visible in developer-role response. SELECT * returned.' },
  { id:'LC-005', sec:'LIMSY Cases API', sev:'CRITICAL', name:"PATCH — valid status transition by architect",
    pre:"P-ARCHITECT. Case LC-001 exists (status='intake').",
    steps:["PATCH /api/limsy/cases with {id: <LC-001-id>, status: 'diarised'}","Verify HTTP 200 and status='diarised' in response","Query audit_logs: action='limsy.case.update:...', actor='user:<userId>'"],
    pass:"HTTP 200. Status updated to 'diarised' in DB. Audit actor in 'user:{userId}' format.",
    fail:'HTTP 400 on valid status. Status not updated in DB. Audit actor in wrong format.' },
  { id:'LC-006', sec:'LIMSY Cases API', sev:'HIGH', name:'PATCH — invalid status value → 400 before DB round-trip',
    pre:'P-ARCHITECT. Any case record.',
    steps:["PATCH /api/limsy/cases with {id: 1, status: 'INVALID_STATUS'}","Verify HTTP 400 (pre-flight before withTenant())","Verify error body lists VALID_LIMSY_CASE_STATUSES"],
    pass:'HTTP 400. Complete enum list in error. No DB mutation.',
    fail:'HTTP 500 from PG enum constraint violation. HTTP 200 with invalid status written.' },
  { id:'LC-007', sec:'LIMSY Cases API', sev:'HIGH', name:'POST — internalRef uniqueness enforced within tenant',
    pre:"Case with internalRef='LIMSY-2026-001' already exists under limsy tenant.",
    steps:["POST /api/limsy/cases with internalRef='LIMSY-2026-001' (duplicate submission)",'Verify unique constraint violation response'],
    pass:'HTTP 409 or 500 with unique constraint error. No duplicate row created.',
    fail:'HTTP 201 returned. Duplicate internalRef under same tenant accepted by DB.' },

  // LIMSY HEARINGS API
  { id:'LH-001', sec:'LIMSY Hearings API', sev:'CRITICAL', name:'POST — schedule valid hearing (happy path)',
    pre:'P-ARCHITECT on limsy. Case LC-001 exists. CR-001 and CR-002 cleared.',
    steps:['POST /api/limsy/hearings with {caseId, scheduledDate, hearingNumber: 1, courtRoom}','Verify HTTP 201','Verify adjournmentCount = 0 in response (always server-initialized to zero)',"Verify audit actor = 'user:<userId>'"],
    pass:'HTTP 201. adjournmentCount=0 server-initialized. Audit actor in correct format.',
    fail:'adjournmentCount ≠ 0. Client could supply adjournmentCount in POST body. Wrong audit format.' },
  { id:'LH-002', sec:'LIMSY Hearings API', sev:'HIGH', name:'POST — hearingNumber < 1 → 400 (boundary validation)',
    pre:'P-ARCHITECT authenticated.',
    steps:['POST /api/limsy/hearings with hearingNumber: 0 → verify HTTP 400','POST /api/limsy/hearings with hearingNumber: -5 → verify HTTP 400'],
    pass:"HTTP 400 for both. Error: 'hearingNumber must be a positive integer.'",
    fail:'HTTP 201 with hearingNumber=0 or negative. DB constraint is only line of defence.' },
  { id:'LH-003', sec:'LIMSY Hearings API', sev:'BLOCKER', name:'PATCH — adjournmentCount NOT client-writable (CR-001 verification)',
    pre:'CR-001 fix deployed. Hearing LH-001 at adjournmentCount=0. P-ARCHITECT.',
    steps:['PATCH /api/limsy/hearings with {id: <LH-001-id>, adjournmentCount: 999}','Verify 999 is NOT persisted to DB','Query: SELECT adjournment_count FROM limsy_hearings WHERE id=<LH-001-id>','Verify value unchanged (still 0 or server-computed value only)'],
    pass:'adjournmentCount=999 not persisted. DB value unchanged. Client write rejected.',
    fail:'DB adjournment_count = 999. Client successfully tampered a court-of-record legal field.' },
  { id:'LH-004', sec:'LIMSY Hearings API', sev:'CRITICAL', name:"PATCH — adjournmentCount auto-increments on 'adjourned' status (atomic SQL)",
    pre:'CR-001 applied. Hearing at adjournmentCount=0.',
    steps:["PATCH /api/limsy/hearings with {id, status: 'adjourned'}","Query DB: SELECT adjournment_count → must be 1","Repeat PATCH with status='adjourned'","Query DB → must be 2"],
    pass:'Increments by 1 per adjourned transition. No client input. Atomic SQL: adjournment_count + 1.',
    fail:'Count unchanged on adjournment. Non-atomic read-modify-write (race condition risk).' },
  { id:'LH-005', sec:'LIMSY Hearings API', sev:'HIGH', name:'POST — (case_id, hearing_number) unique constraint enforced',
    pre:'Hearing number 1 for case LC-001 already exists in limsy tenant.',
    steps:['POST /api/limsy/hearings with same caseId and hearingNumber=1 (exact duplicate)','Verify unique constraint violation response (HTTP 409 or 500 with PG error)'],
    pass:'Constraint violation. No duplicate hearing created.',
    fail:'HTTP 201 returned. Duplicate hearing number for same case accepted.' },

  // LIMSY ORDERS API
  { id:'LO-001', sec:'LIMSY Orders API', sev:'CRITICAL', name:'POST — record order with server-side SHA-256 cryptographic hash',
    pre:'P-ARCHITECT. Case LC-001 and Hearing LH-001 exist. CR-002 cleared.',
    steps:['POST /api/limsy/orders with {caseId, orderDate, orderType, orderTitle, operative}','Verify HTTP 201. Verify cryptoHash is exactly 64 lowercase hex chars.',"Independently compute SHA-256('<caseId>:<orderDate.toISOString()>:<orderType>:<operative.trim()>')","Verify computed hash === response cryptoHash","Verify audit: severity='critical', actor='user:<userId>'"],
    pass:"Hash verified by independent computation. Audit severity='critical'. Actor='user:{userId}'.",
    fail:'Hash absent, wrong, or varies due to timezone/whitespace. Audit severity or actor wrong.' },
  { id:'LO-002', sec:'LIMSY Orders API', sev:'CRITICAL', name:'GET — developer role → 403 (CR-002 RBAC elevation verified)',
    pre:'P-DEVELOPER session active. Order LO-001 exists in limsy tenant.',
    steps:['GET /api/limsy/orders using P-DEVELOPER session','Verify HTTP 403'],
    pass:'HTTP 403. No order data (operative text, cryptoHash) returned to developer-role caller.',
    fail:'HTTP 200. Orders returned to developer. Cryptographic operative text exposed below architect level.' },
  { id:'LO-003', sec:'LIMSY Orders API', sev:'HIGH', name:'POST — invalid orderType enum → 400 before DB round-trip',
    pre:'P-ARCHITECT authenticated.',
    steps:["POST /api/limsy/orders with orderType: 'injunction' (not in VALID_LIMSY_ORDER_TYPES)",'Verify HTTP 400 (pre-flight validation)','Verify error body lists all valid VALID_LIMSY_ORDER_TYPES values'],
    pass:'HTTP 400. Complete valid enum list in error. No PG 23514 constraint violation.',
    fail:'HTTP 500 from PostgreSQL enum error. HTTP 201 with invalid type stored.' },
  { id:'LO-004', sec:'LIMSY Orders API', sev:'BLOCKER', name:'DELETE → 405 — legal record immutability enforced (two layers)',
    pre:'P-ARCHITECT. Order LO-001 exists.',
    steps:['Attempt DELETE /api/limsy/orders','Verify HTTP 405 Method Not Allowed from Next.js route handler','Confirm studio_app DELETE privilege separately rejected with 42501 (from RLS-004)'],
    pass:'HTTP 405 from API layer. HTTP 42501 from DB layer. Both enforcement layers confirmed.',
    fail:'HTTP 200 or 204. Order deleted. Immutable legal record violated at any layer.' },

  // LIMSY DASHBOARD UI
  { id:'UI-LIMSY-001', sec:'LIMSY Dashboard UI', sev:'CRITICAL', name:'Docket list renders with role-gated column projection',
    pre:'P-ARCHITECT authenticated. ≥3 case records in limsy. CR-003 deployed.',
    steps:['Navigate to https://limsy.bnlvconsulting.com/studio/limsy','Verify page loads without console errors','Inspect case cards: internalRef, caseType, courtLevel, status, urgencyFlag badge visible','Verify no raw tenant_id, createdBy, or party names exposed in non-architect view'],
    pass:'Docket list renders all expected fields. Urgency badge present when urgencyFlag=true.',
    fail:'Blank page. API 403/500. Missing docket fields. Console errors. Hallucinated columns.' },
  { id:'UI-LIMSY-002', sec:'LIMSY Dashboard UI', sev:'HIGH', name:'Orders tab — cryptoHash truncated display (SHA-256[:16]…)',
    pre:'P-ARCHITECT. Order LO-001 with cryptoHash exists.',
    steps:["Navigate to studio/limsy → click 'Orders' tab","Verify 'Cryptographically Verified Judicial Orders' header visible","Locate LO-001: verify display shows 'SHA-256: <first-16-chars>…'","Verify full 64-char hash NOT displayed (truncation: o.cryptoHash.slice(0,16)+'…')"],
    pass:"Tab renders. Hash truncated to 16 chars. Stay badge shown when hasStay=true.",
    fail:'Full 64-char hash displayed. Tab blank. hasStay badge absent.' },
  { id:'UI-LIMSY-003', sec:'LIMSY Dashboard UI', sev:'CRITICAL', name:'Petition intake form POSTs to /api/limsy/cases on submit',
    pre:'P-ARCHITECT on limsy tenant.',
    steps:['Fill all required fields in the petition intake form','Submit the form','Verify POST /api/limsy/cases returns HTTP 201 in Network tab','Verify new case appears in docket list. Verify form resets to initial state.'],
    pass:'HTTP 201 from API. Case visible in docket list. Form resets.',
    fail:'HTTP 403/400/500 on submit. Case not created. Page crash or form errors.' },

  // CLIENT INTAKE DASHBOARD
  { id:'CI-001', sec:'Client Intake', sev:'CRITICAL', name:'Intake creates client_request with deterministic SHA-256 idempotency key',
    pre:'Public intake form live on subsidiary subdomain. client_requests table with FORCE RLS active.',
    steps:['Fill and submit intake form on https://bms.bnlvconsulting.com','Query: SELECT idempotency_key, status, handled_by_tenant_id FROM client_requests WHERE contact_email=<submitted_email>','Verify idempotency_key is exactly 64 lowercase hex chars','Verify status=pending. Verify handled_by_tenant_id=bnlv root tenant ID.'],
    pass:"Row created. idempotency_key = 64-char hex (SHA-256). status='pending'. handled_by_tenant_id correct.",
    fail:'No row. idempotency_key is UUID v4 (randomUUID violation). status wrong or NULL.' },
  { id:'CI-002', sec:'Client Intake', sev:'HIGH', name:'Duplicate intake within same clock hour is idempotent (retry safety)',
    pre:'CI-001 completed. Same subsidiary, email, companyName available.',
    steps:['Re-submit identical intake form within the same clock hour (same hourBucket)','Verify NO duplicate row in client_requests','Verify no HTTP 500 exposed to user (HTTP 409 or 200 acceptable)'],
    pass:'Single row in DB. UNIQUE constraint on idempotency_key deduplicates silently.',
    fail:'Duplicate row created. UUID key used (non-deterministic, breaks retry safety). HTTP 500 exposed.' },
  { id:'CI-003', sec:'Client Intake', sev:'HIGH', name:'handled_by_tenant_id defaults via dynamic subquery (not hardcoded integer)',
    pre:"client_requests column has dynamic DEFAULT (SELECT id FROM tenants WHERE slug='bnlv' LIMIT 1).",
    steps:['Submit intake without explicitly supplying handled_by_tenant_id',"Query: SELECT handled_by_tenant_id FROM client_requests WHERE id=<latest_id>","Verify value = (SELECT id FROM tenants WHERE slug='bnlv')"],
    pass:'Value matches slug-resolved bnlv ID. NOT hardcoded integer 1.',
    fail:'Value = 1 (hardcoded, fragile). NULL. Wrong tenant ID. Fails if bnlv root is not ID 1.' },
  { id:'CI-004', sec:'Client Intake', sev:'CRITICAL', name:'Admin dashboard lists all pending client_requests (bnlv-scoped)',
    pre:'P-ADMIN (bnlv root authenticated). At least one pending request exists.',
    steps:['Navigate to bnlv tenant admin dashboard','Verify all pending requests visible with: status, company, contact, subsidiary, requestedPlan','Verify no requests from unrelated tenants visible (RLS enforcement)'],
    pass:'Complete pending list. RLS-scoped to bnlv. No cross-tenant request leakage.',
    fail:'Empty list despite pending requests existing. Cross-tenant requests visible.' },

  // AUDIT LOGS UI
  { id:'AU-001', sec:'Audit Logs UI', sev:'CRITICAL', name:"All audit log actors comply with ADR-001 format (post-CR-002)",
    pre:'Multiple audit log entries generated via LIMSY cases/hearings/orders operations.',
    steps:["Query: SELECT DISTINCT actor FROM audit_logs WHERE tenant_id=<limsy_tenant_id>","Verify ALL actor values match pattern 'user:{integer}' or 'system:{source}'","Verify ZERO bare integer strings (e.g. '13' without 'user:' prefix)"],
    pass:"100% pattern match. Zero violations. All actors in 'user:{userId}' or 'system:{source}' format.",
    fail:"Any actor = bare integer string. Free-form string not matching ADR-001 pattern. (Pre-fix entries excepted — document those separately)" },
  { id:'AU-002', sec:'Audit Logs UI', sev:'HIGH', name:'Audit log UI displays entries filtered to authenticated tenant (RLS)',
    pre:'P-ADMIN authenticated on bms. Audit entries exist for both bms and limsy tenants.',
    steps:['Navigate to audit logs UI (bms.bnlvconsulting.com)','Verify only bms-tenant audit entries displayed','Verify zero limsy-tenant audit entries visible'],
    pass:'No cross-tenant audit entry leakage. Entries correctly filtered by tenant_id via RLS.',
    fail:'Audit entries from other tenants visible. Full audit_logs table exposed.' },
  { id:'AU-003', sec:'Audit Logs UI', sev:'HIGH', name:"severity='critical' on all limsy order creation audit entries",
    pre:'Order LO-001 created.',
    steps:["Query: SELECT severity, action FROM audit_logs WHERE action LIKE 'limsy.order.record:%' AND tenant_id=<limsy_id>","Verify ALL entries have severity='critical'"],
    pass:"severity='critical' on every order creation entry. Critical severity distinguishes immutable record creation.",
    fail:"severity='warn' or 'info' on order creation. Not 'critical' as required." },

  // NIDHIVAN DPR/BOQ
  { id:'NV-001', sec:'Nidhivan DPR/BOQ', sev:'CRITICAL', name:'All monetary columns stored as bigint in paise — no float types',
    pre:'nidhivan seed applied. nidhivan_boq_items has records.',
    steps:["SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('nidhivan_boqs','nidhivan_boq_items','nidhivan_dprs') AND column_name LIKE '%paise%'","Verify ALL *_paise columns: data_type = 'bigint'",'Query sample: SELECT unit_rate_paise, amount_paise FROM nidhivan_boq_items LIMIT 3','Verify values are integers (e.g. 21500 = ₹215.00)'],
    pass:"data_type='bigint' for ALL monetary columns. Sample values are integers.",
    fail:'Any monetary column is double_precision, float4, or integer (integer overflows at ~₹21.5L in paise).' },
  { id:'NV-002', sec:'Nidhivan DPR/BOQ', sev:'MEDIUM', name:'BOQ quantity float aggregation risk — document variance',
    pre:'BOQ items with decimal quantities seeded (e.g. 4500.500, 1200.000).',
    steps:["SELECT data_type FROM information_schema.columns WHERE table_name='nidhivan_boq_items' AND column_name='quantity'",'If double_precision: run SUM(quantity) on decimal set, compare to expected result','Document any aggregation variance > 0.001'],
    pass:'No variance > 0.001 on test values. Or column migrated to numeric(12,3) (Phase C).',
    fail:'Variance > 0.001 producing incorrect BOQ totals. Known Phase C backlog risk.' },
  { id:'NV-003', sec:'Nidhivan DPR/BOQ', sev:'CRITICAL', name:'Nidhivan workspace RLS isolation from cross-tenant reads',
    pre:'nidhivan seed applied. bms tenant provisioned.',
    steps:['GET /api/nidhivan/projects (bms admin session) → verify empty []','GET /api/nidhivan/projects (nidhivan admin session) → verify project records returned'],
    pass:'Strict isolation. bms sees zero nidhivan projects. nidhivan admin sees own records.',
    fail:'nidhivan records visible to bms-tenant caller. nidhivan_projects RLS not enforcing.' },

  // NEON DRIVER STABILITY
  { id:'NEO-001', sec:'Neon Driver Stability', sev:'BLOCKER', name:'SET LOCAL does not leak across pooled connections under concurrency',
    pre:'Two concurrent authenticated sessions from different tenants (bms and limsy).',
    steps:['Simulate 20 concurrent requests: 10 from bms tenant + 10 from limsy tenant, interleaved','For each response, verify tenant_id in returned data matches the caller tenant','Verify zero cross-tenant responses across the full set'],
    pass:'Every response correctly tenant-scoped. Zero cross-tenant data in any response.',
    fail:'Any response returns data from wrong tenant. SET LOCAL leaked across pooled connection.' },
  { id:'NEO-002', sec:'Neon Driver Stability', sev:'CRITICAL', name:'DATABASE_URL_UNPOOLED used for all seed scripts (ADR-002)',
    pre:'seed-nidhivan.ts available. DATABASE_URL_UNPOOLED set in .env.local.',
    steps:['Inspect seed-nidhivan.ts: connection must reference DATABASE_URL_UNPOOLED (not DATABASE_URL)','Run: node src/db/seed-nidhivan.ts','Verify exit code 0. No 42501 errors. All 5 entity types created in Neon.'],
    pass:'Exit code 0. All entities in DB. No 42501 permission denied errors.',
    fail:'42501 error. Seed fails. Any entity type missing. DATABASE_URL (pooled) used instead.' },
  { id:'NEO-003', sec:'Neon Driver Stability', sev:'HIGH', name:'Drizzle migration journal — 10 rows, all hashes, sequence=10 (PRE-VERIFIED)',
    pre:'CR-004 SELECT output confirmed (10 rows, sequence last_value=10). ✅ ALREADY VERIFIED.',
    steps:["SELECT id, hash FROM \"drizzle\".\"__drizzle_migrations\" ORDER BY id ASC → verify 10 rows","Verify all 9 migration hashes + 0009_schema_hardening present","SELECT last_value FROM pg_sequences WHERE schemaname='drizzle' → verify last_value=10"],
    pass:'10 rows. All hashes present. Sequence last_value=10. ✅ MARK PASS — pre-verified via CR-004.',
    fail:'Row count <10. Missing hash. Sequence mismatch. ID gap. (Would require re-running CR-004 fix.)' },

  // DEPLOYMENT VERIFICATION
  { id:'DV-001', sec:'Deployment Verification', sev:'HIGH', name:'Phase B SSG pages render on all 4 subsidiary subdomains',
    pre:'Phase B deployed to Vercel. All four Cloudflare subdomain CNAMEs live.',
    steps:['Navigate to https://bms.bnlvconsulting.com → verify HTTP 200','Navigate to https://nidhivan.bnlvconsulting.com → verify HTTP 200','Navigate to https://limsy.bnlvconsulting.com → verify HTTP 200','Navigate to https://vihang.bnlvconsulting.com → verify HTTP 200'],
    pass:'HTTP 200 on all 4 subdomains. SSG content rendered correctly with subsidiary branding.',
    fail:'Any subdomain returns 404/500. Blank pages. Routing not resolving.' },
  { id:'DV-002', sec:'Deployment Verification', sev:'HIGH', name:'BNLV group portal renders with navy/gold brand system',
    pre:'Phase B deployed.',
    steps:['Navigate to https://bnlvconsulting.com','Verify navy/gold brand system applied (not plain/unstyled HTML)','Verify no console errors. Subsidiary navigation links functional.'],
    pass:'Navy/gold brand visible. Portal renders correctly. No console errors.',
    fail:'Unstyled content. Blank page. Console errors. Broken subsidiary navigation.' },
  { id:'DV-003', sec:'Deployment Verification', sev:'HIGH', name:'Unknown subdomain → 404 (dynamicParams=false enforced at edge)',
    pre:'Vercel wildcard routing active.',
    steps:['curl -I https://unknown.bnlvconsulting.com → verify HTTP 404','curl -I https://test.bnlvconsulting.com → verify HTTP 404'],
    pass:'HTTP 404 for all subdomains not in generateStaticParams() allow-list.',
    fail:'HTTP 200 or 500 returned for unlisted subdomain.' },
  { id:'DV-004', sec:'Deployment Verification', sev:'HIGH', name:'www redirect is HTTP 301 permanent (not 302 temporary)',
    pre:'Cloudflare DNS live. www CNAME active.',
    steps:['curl -I https://www.bnlvconsulting.com','Verify HTTP 301 (not 302)','Verify Location: https://bnlvconsulting.com (exact, no trailing slash)'],
    pass:'HTTP 301. Location: https://bnlvconsulting.com.',
    fail:'HTTP 200 (no redirect). HTTP 302 (temporary). Wrong Location header value.' },
  { id:'DV-005', sec:'Deployment Verification', sev:'CRITICAL', name:'BMS admin login succeeds post-password-reset (user ID 13)',
    pre:'Scrypt password hash applied to user ID 13 in Neon. Hash format: $scrypt$N=16384,r=8,p=1$...',
    steps:['Navigate to https://bms.bnlvconsulting.com/login','Login as admin@bms.bnlvconsulting.com with the reset password','Verify bms_session cookie set. Verify /studio loads without HTTP 401.'],
    pass:'HTTP 200. bms_session cookie set with correct attributes. Studio loads.',
    fail:'HTTP 401. Cookie not set. Studio inaccessible. Scrypt hash in wrong format.' },
  { id:'DV-006', sec:'Deployment Verification', sev:'HIGH', name:'Vercel Edge region is bom1 (Mumbai) — confirmed in runtime',
    pre:'Platform deployed to Vercel. bom1 region configured.',
    steps:['curl -I https://bms.bnlvconsulting.com → inspect x-vercel-id response header',"Verify header value contains 'bom1'"],
    pass:"x-vercel-id header contains 'bom1'. Edge function executing in Mumbai region.",
    fail:'Different region code in x-vercel-id. Header absent.' },
  { id:'DV-007', sec:'Deployment Verification', sev:'HIGH', name:'TypeScript build — zero errors (npm run build)',
    pre:'All CR fixes committed to main. Local build environment available.',
    steps:['Run: npm run build','Verify exit code 0',"Verify output: 'Compiled successfully.' Zero TypeScript errors across all routes."],
    pass:'Exit 0. Zero TS errors. All routes compiled (including the HearingPatch type fix).',
    fail:'Any TS error. Non-zero exit code. Type mismatch on any LIMSY route or hearings PATCH.' },
  { id:'DV-008', sec:'Deployment Verification', sev:'HIGH', name:'Cloudflare WAF active on all subdomains (CF-Ray header present)',
    pre:'Cloudflare proxied (orange cloud) on all *.bnlvconsulting.com DNS records.',
    steps:['curl -I https://bms.bnlvconsulting.com → inspect CF-Ray header','curl -I https://limsy.bnlvconsulting.com → inspect CF-Ray header','Verify CF-Ray present on both'],
    pass:'CF-Ray header present on all subdomains. WAF active and proxying.',
    fail:'CF-Ray absent. Requests hitting Vercel origin directly. WAF bypassed.' },
  { id:'DV-009', sec:'Deployment Verification', sev:'HIGH', name:'GitHub Actions CI passes on main branch (all 4 jobs green)',
    pre:'All CR fixes pushed to main. CI workflow active.',
    steps:['GitHub → kumarajaysharma/BMSolutions1.0 → Actions → main → latest run','Verify all 4 CI jobs green: type-check, lint, build, migration-journal-gate','Verify no CODEOWNERS-blocked PRs outstanding'],
    pass:'All 4 CI jobs green. No failures. Static analysis gates (as any, JWT fallback, LIMSY DELETE) clear.',
    fail:'Any CI job red. as any cast detected. JWT fallback regression. Migration journal gate fails.' },
  { id:'DV-010', sec:'Deployment Verification', sev:'CRITICAL', name:'Admin password for user ID 13 confirmed in scrypt format in DB',
    pre:'DV-005 executed successfully.',
    steps:['Verify DV-005 passed (login succeeded)',"Query Neon: SELECT password_hash FROM users WHERE id=13","Verify format matches: $scrypt$N=16384,r=8,p=1$<salt_b64url>$<dk_b64url>"],
    pass:'Login succeeded (DV-005). password_hash in correct scrypt format in DB.',
    fail:'Login failed. NULL password_hash. Raw password stored. Hash in wrong format.' },
]

const SECTIONS = [...new Set(TESTS.map(t => t.sec))]
const STATUSES = ['PASS', 'FAIL', 'BLOCKED', 'N/A']

const SEV_STYLE = {
  BLOCKER:  { bg: 'var(--fill-danger)',   color: 'white' },
  CRITICAL: { bg: 'var(--bg-danger)',     color: 'var(--text-danger)' },
  HIGH:     { bg: 'var(--bg-warning)',    color: 'var(--text-warning)' },
  MEDIUM:   { bg: 'var(--surface-0)',     color: 'var(--text-secondary)' },
  LOW:      { bg: 'var(--bg-success)',    color: 'var(--text-success)' },
}

const ST_STYLE = {
  PASS:    { bg: 'var(--bg-success)',  color: 'var(--text-success)',  border: 'var(--border-success)',  icon: 'ti-check' },
  FAIL:    { bg: 'var(--bg-danger)',   color: 'var(--text-danger)',   border: 'var(--border-danger)',   icon: 'ti-x' },
  BLOCKED: { bg: 'var(--bg-warning)',  color: 'var(--text-warning)',  border: 'var(--border-warning)',  icon: 'ti-ban' },
  'N/A':   { bg: 'var(--surface-1)',   color: 'var(--text-muted)',    border: 'var(--border)',          icon: 'ti-minus' },
  PENDING: { bg: 'var(--surface-1)',   color: 'var(--text-muted)',    border: 'var(--border)',          icon: 'ti-circle-dashed' },
}

export default function ATPTracker() {
  const [results, setResults]       = useState({})
  const [activeSection, setSection] = useState(SECTIONS[0])
  const [expandedId, setExpanded]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saveLabel, setSaveLabel]   = useState('auto-saved')

  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage.get('bnlv-atp-v3')
        if (r) setResults(JSON.parse(r.value))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const persist = async (updated) => {
    setSaveLabel('saving…')
    try {
      await window.storage.set('bnlv-atp-v3', JSON.stringify(updated))
      setSaveLabel('saved')
    } catch { setSaveLabel('save error') }
  }

  const setStatus = (id, s) => {
    const cur = results[id]?.status
    const next = cur === s ? undefined : s
    const updated = { ...results, [id]: { ...(results[id] || {}), status: next } }
    setResults(updated)
    persist(updated)
  }

  const setNotes = (id, notes) => {
    const updated = { ...results, [id]: { ...(results[id] || {}), notes } }
    setResults(updated)
    persist(updated)
  }

  const bc   = TESTS.filter(t => ['BLOCKER','CRITICAL'].includes(t.sev))
  const bcP  = bc.filter(t => results[t.id]?.status === 'PASS').length
  const bcF  = bc.filter(t => results[t.id]?.status === 'FAIL').length
  const totP = TESTS.filter(t => results[t.id]?.status === 'PASS').length
  const totF = TESTS.filter(t => results[t.id]?.status === 'FAIL').length
  const done = TESTS.filter(t => results[t.id]?.status).length

  const gate = bcF > 0 ? 'NO-GO' : bcP === bc.length && done === TESTS.length ? 'GO' : 'IN PROGRESS'
  const gateColor = bcF > 0 ? 'var(--text-danger)' : gate === 'GO' ? 'var(--text-success)' : 'var(--text-warning)'
  const gateBg    = bcF > 0 ? 'var(--bg-danger)'   : gate === 'GO' ? 'var(--bg-success)'   : 'var(--bg-warning)'

  const secStat = sec => {
    const ts = TESTS.filter(t => t.sec === sec)
    return { total: ts.length, pass: ts.filter(t => results[t.id]?.status==='PASS').length, fail: ts.filter(t => results[t.id]?.status==='FAIL').length }
  }

  if (loading) return (
    <div style={{ padding:'2rem', color:'var(--text-secondary)', fontSize:13, fontFamily:'var(--font-mono)' }}>
      Loading ATP execution state…
    </div>
  )

  const activeTests = TESTS.filter(t => t.sec === activeSection)

  return (
    <div style={{ color:'var(--text-primary)', fontFamily:'var(--font-sans)' }}>

      {/* ── Header ── */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'var(--surface-2)', borderBottom:'0.5px solid var(--border-strong)', padding:'10px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <code style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>BNLV-ATP-MASTER-001</code>
            <span style={{ width:1, height:14, background:'var(--border)' }}/>
            <span style={{ fontSize:13, fontWeight:500 }}>Master Acceptance Test Procedure</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {[{l:'pass',v:totP,c:'var(--text-success)'},{l:'fail',v:totF,c:'var(--text-danger)'},{l:'pending',v:TESTS.length-done,c:'var(--text-muted)'}].map(({l,v,c}) => (
              <div key={l} style={{ background:'var(--surface-1)', border:'0.5px solid var(--border)', borderRadius:'var(--radius)', padding:'3px 10px', textAlign:'center', minWidth:46 }}>
                <div style={{ fontSize:15, fontWeight:500, color:c, lineHeight:1.1 }}>{v}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</div>
              </div>
            ))}
            <div style={{ background:gateBg, border:`0.5px solid ${gateColor}`, borderRadius:'var(--radius)', padding:'5px 14px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:gateColor, fontFamily:'var(--font-mono)', fontWeight:700, letterSpacing:'0.06em' }}>{gate}</div>
            </div>
          </div>
        </div>

        {/* BLOCKER/CRITICAL bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
          <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
            BLOCKER / CRITICAL — {bcP} / {bc.length}
          </span>
          <div style={{ flex:1, height:3, background:'var(--surface-0)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, width:`${Math.round(bcP/bc.length*100)}%`, background: bcF>0 ? 'var(--fill-danger)' : 'var(--fill-success)', transition:'width 0.3s ease' }}/>
          </div>
          {bcF > 0 && <span style={{ fontSize:10, color:'var(--text-danger)', fontWeight:500, whiteSpace:'nowrap', fontFamily:'var(--font-mono)' }}>{bcF} FAIL</span>}
          <span style={{ fontSize:10, color:'var(--text-muted)', whiteSpace:'nowrap', fontFamily:'var(--font-mono)' }}>{saveLabel}</span>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div style={{ background:'var(--surface-1)', borderBottom:'0.5px solid var(--border)', overflowX:'auto' }}>
        <div style={{ display:'flex', padding:'0 8px', minWidth:'max-content' }}>
          {SECTIONS.map(sec => {
            const s = secStat(sec)
            const active = sec === activeSection
            return (
              <button key={sec} onClick={() => { setSection(sec); setExpanded(null) }} style={{
                background:'none', border:'none', cursor:'pointer',
                padding:'9px 12px',
                borderBottom: active ? '2px solid var(--border-accent)' : '2px solid transparent',
                color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
                fontFamily:'var(--font-sans)', fontSize:12, fontWeight: active ? 500 : 400,
                whiteSpace:'nowrap', lineHeight:1.2,
              }}>
                {sec}
                <span style={{
                  marginLeft:5, fontSize:10, fontFamily:'var(--font-mono)',
                  color: s.fail>0 ? 'var(--text-danger)' : s.pass===s.total ? 'var(--text-success)' : 'var(--text-muted)'
                }}>
                  {s.pass}/{s.total}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Test cards ── */}
      <div style={{ padding:'14px 16px' }}>
        {activeTests.map(test => {
          const r   = results[test.id] || {}
          const st  = r.status || 'PENDING'
          const stS = ST_STYLE[st]
          const svS = SEV_STYLE[test.sev]
          const exp = expandedId === test.id

          return (
            <div key={test.id} style={{
              background:'var(--surface-2)',
              border:`0.5px solid ${st==='FAIL' ? 'var(--border-danger)' : st==='PASS' ? 'var(--border-success)' : 'var(--border)'}`,
              borderRadius:12, marginBottom:9, overflow:'hidden',
            }}>
              {/* Card header row */}
              <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px' }}>

                {/* Status icon */}
                <div style={{ width:30, height:30, borderRadius:'var(--radius)', background:stS.bg, border:`0.5px solid ${stS.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`ti ${stS.icon}`} style={{ fontSize:14, color:stS.color }} aria-hidden="true"/>
                </div>

                {/* ID */}
                <code style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{test.id}</code>

                {/* Name */}
                <span style={{ fontSize:12, fontWeight:500, flex:1, color:'var(--text-primary)', lineHeight:1.3 }}>{test.name}</span>

                {/* Severity */}
                <span style={{ background:svS.bg, color:svS.color, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, flexShrink:0, fontFamily:'var(--font-mono)', letterSpacing:'0.04em', border:'0.5px solid transparent' }}>{test.sev}</span>

                {/* Status buttons */}
                <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                  {STATUSES.map(s => {
                    const sc  = ST_STYLE[s]
                    const sel = st === s
                    return (
                      <button key={s} onClick={() => setStatus(test.id, s)} style={{
                        background: sel ? sc.bg : 'transparent',
                        color: sel ? sc.color : 'var(--text-muted)',
                        border: `0.5px solid ${sel ? sc.border : 'var(--border)'}`,
                        borderRadius:'var(--radius)', padding:'3px 8px',
                        fontSize:10, fontWeight:500, cursor:'pointer',
                        fontFamily:'var(--font-mono)',
                      }}>{s}</button>
                    )
                  })}
                </div>

                {/* Expand */}
                <button onClick={() => setExpanded(exp ? null : test.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px', flexShrink:0 }} aria-label={exp ? 'Collapse test detail' : 'Expand test detail'}>
                  <i className={`ti ${exp ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize:15 }} aria-hidden="true"/>
                </button>
              </div>

              {/* Expanded detail */}
              {exp && (
                <div style={{ borderTop:'0.5px solid var(--border)', padding:'12px 14px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>

                    <div>
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Prerequisites</div>
                      <div style={{ fontSize:11, color:'var(--text-secondary)', background:'var(--surface-1)', padding:'8px 10px', borderRadius:'var(--radius)', lineHeight:1.6, border:'0.5px solid var(--border)' }}>{test.pre}</div>
                    </div>

                    <div>
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Test steps</div>
                      <div style={{ background:'var(--surface-1)', padding:'8px 10px', borderRadius:'var(--radius)', border:'0.5px solid var(--border)' }}>
                        {test.steps.map((step, i) => (
                          <div key={i} style={{ display:'flex', gap:7, marginBottom: i < test.steps.length-1 ? 5 : 0 }}>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color:'var(--text-accent)', minWidth:14, paddingTop:2 }}>{i+1}.</span>
                            <code style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-primary)', lineHeight:1.5, wordBreak:'break-all' }}>{step}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text-success)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                        <i className="ti ti-check" style={{ marginRight:3, fontSize:11 }} aria-hidden="true"/>Pass criteria
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-success)', background:'var(--bg-success)', padding:'8px 10px', borderRadius:'var(--radius)', lineHeight:1.6, border:'0.5px solid var(--border-success)' }}>{test.pass}</div>
                    </div>

                    <div>
                      <div style={{ fontSize:10, fontWeight:500, color:'var(--text-danger)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                        <i className="ti ti-x" style={{ marginRight:3, fontSize:11 }} aria-hidden="true"/>Fail criteria
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-danger)', background:'var(--bg-danger)', padding:'8px 10px', borderRadius:'var(--radius)', lineHeight:1.6, border:'0.5px solid var(--border-danger)' }}>{test.fail}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize:10, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Execution notes</div>
                    <textarea
                      value={r.notes || ''}
                      onChange={e => setNotes(test.id, e.target.value)}
                      placeholder="Record actual results, timestamps, defect references, deviations from expected…"
                      rows={3}
                      style={{ width:'100%', boxSizing:'border-box', fontFamily:'var(--font-mono)', fontSize:11, resize:'vertical' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

