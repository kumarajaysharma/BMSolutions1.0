-- ============================================================
-- BNLV Group — Neon Database Complete Audit
-- Run in Neon SQL Editor — execute each section in order
-- Document: BNLV-DB-AUDIT-001
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: TENANTS
-- Expected: 5 tenants — bnlv, bms, nidhivan, limsy, vihang
-- ────────────────────────────────────────────────────────────
SELECT
    '1. TENANTS' AS section,
    id,
    slug,
    name,
    plan,
    status,
    region,
    created_at::date AS created
FROM tenants
ORDER BY id;

-- ────────────────────────────────────────────────────────────
-- SECTION 2: USERS PER TENANT
-- ────────────────────────────────────────────────────────────
SELECT
    '2. USERS' AS section,
    u.id,
    u.email,
    u.role,
    u.active,
    t.slug AS tenant,
    LEFT(u.password_hash, 7) AS hash_prefix,
    LENGTH(u.password_hash) AS hash_length,
    CASE
        WHEN u.password_hash LIKE '$scrypt%'  THEN '✅ scrypt'
        WHEN LENGTH(u.password_hash) = 36     THEN '⚠️  raw UUID (no auth)'
        WHEN u.password_hash IS NULL           THEN '❌ NULL'
        ELSE '? unknown format'
    END AS hash_status
FROM users u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.tenant_id, u.id;

-- ────────────────────────────────────────────────────────────
-- SECTION 3: DRIZZLE MIGRATION JOURNAL
-- Expected: 10 rows, IDs 1–10, all hashes present, sequence=10
-- ────────────────────────────────────────────────────────────
SELECT
    '3. MIGRATION JOURNAL' AS section,
    id,
    hash,
    to_timestamp(created_at / 1000)::date AS applied_date
FROM "drizzle"."__drizzle_migrations"
ORDER BY id ASC;

-- Sequence state
SELECT
    '3b. SEQUENCE' AS section,
    last_value,
    CASE WHEN last_value >= 10 THEN '✅ OK' ELSE '❌ DRIFT — reset required' END AS status
FROM pg_sequences
WHERE schemaname = 'drizzle'
  AND sequencename LIKE '%drizzle_migrations%';

-- ────────────────────────────────────────────────────────────
-- SECTION 4: RLS ENFORCEMENT ON LIMSY TABLES
-- Expected: rowsecurity=t AND relforcerowsecurity=t on all 4
-- ────────────────────────────────────────────────────────────
SELECT
    '4. RLS STATE' AS section,
    t.tablename,
    t.rowsecurity        AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    CASE
        WHEN t.rowsecurity AND c.relforcerowsecurity THEN '✅ ENFORCED'
        WHEN t.rowsecurity AND NOT c.relforcerowsecurity THEN '⚠️  ENABLED NOT FORCED — policy bypassable by owner'
        ELSE '❌ NOT ACTIVE'
    END AS status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename IN (
    'limsy_cases',
    'limsy_hearings',
    'limsy_orders',
    'limsy_bench_assignments'
)
ORDER BY t.tablename;

-- ────────────────────────────────────────────────────────────
-- SECTION 5: STUDIO_APP PRIVILEGE AUDIT
-- Expected: DELETE and TRUNCATE absent from limsy_orders
-- ────────────────────────────────────────────────────────────
SELECT
    '5. studio_app GRANTS' AS section,
    table_name,
    STRING_AGG(privilege_type, ', ' ORDER BY privilege_type) AS granted_privileges,
    CASE
        WHEN STRING_AGG(privilege_type, ',') LIKE '%DELETE%'   THEN '❌ DELETE present — security violation'
        WHEN STRING_AGG(privilege_type, ',') LIKE '%TRUNCATE%' THEN '❌ TRUNCATE present — security violation'
        ELSE '✅ DELETE and TRUNCATE absent'
    END AS status
FROM information_schema.role_table_grants
WHERE grantee = 'studio_app'
  AND table_name IN ('limsy_cases','limsy_hearings','limsy_orders','limsy_bench_assignments')
GROUP BY table_name
ORDER BY table_name;

-- ────────────────────────────────────────────────────────────
-- SECTION 6: ROLE BYPASS RLS CHECK
-- studio_app must have rolbypassrls = false
-- neondb_owner will have rolbypassrls = true (expected)
-- ────────────────────────────────────────────────────────────
SELECT
    '6. ROLE BYPASSRLS' AS section,
    rolname,
    rolbypassrls,
    CASE
        WHEN rolname = 'studio_app'   AND NOT rolbypassrls THEN '✅ studio_app cannot bypass RLS'
        WHEN rolname = 'studio_app'   AND rolbypassrls     THEN '❌ studio_app BYPASSES RLS — critical'
        WHEN rolname = 'neondb_owner' AND rolbypassrls     THEN '✅ neondb_owner bypasses RLS (owner, expected)'
        ELSE 'ℹ️  info'
    END AS status
FROM pg_roles
WHERE rolname IN ('studio_app','neondb_owner','studio_migrator')
ORDER BY rolname;

-- ────────────────────────────────────────────────────────────
-- SECTION 7: RLS POLICIES ON LIMSY TABLES
-- Expected: at least 1 policy per table with correct USING clause
-- ────────────────────────────────────────────────────────────
SELECT
    '7. RLS POLICIES' AS section,
    tablename,
    policyname,
    cmd,
    qual         AS using_clause,
    with_check   AS with_check_clause
FROM pg_policies
WHERE tablename IN ('limsy_cases','limsy_hearings','limsy_orders','limsy_bench_assignments')
ORDER BY tablename, policyname;

-- ────────────────────────────────────────────────────────────
-- SECTION 8: LIMSY DATA STATE
-- ────────────────────────────────────────────────────────────
SELECT
    '8. LIMSY DATA' AS section,
    (SELECT COUNT(*) FROM limsy_cases)            AS cases,
    (SELECT COUNT(*) FROM limsy_hearings)          AS hearings,
    (SELECT COUNT(*) FROM limsy_orders)            AS orders,
    (SELECT COUNT(*) FROM limsy_bench_assignments) AS bench_assignments;

-- Cases detail
SELECT
    id,
    tenant_id,
    internal_ref,
    case_type,
    status,
    court_level,
    urgency_flag,
    created_at::date AS filed_date,
    created_by
FROM limsy_cases
ORDER BY created_at DESC;

-- Hearings detail
SELECT
    id,
    tenant_id,
    case_id,
    hearing_number,
    status,
    adjournment_count,
    scheduled_date::date AS hearing_date
FROM limsy_hearings
ORDER BY id;

-- Orders detail (crypto hash verification)
SELECT
    id,
    tenant_id,
    order_type,
    order_title,
    LEFT(crypto_hash, 16) || '…' AS hash_prefix,
    LENGTH(crypto_hash)           AS hash_length,
    CASE
        WHEN LENGTH(crypto_hash) = 64 THEN '✅ SHA-256 (64 chars)'
        ELSE '❌ Wrong hash length'
    END AS hash_status,
    order_date::date AS ordered
FROM limsy_orders
ORDER BY id;

-- ────────────────────────────────────────────────────────────
-- SECTION 9: AUDIT LOG COMPLIANCE — ADR-001 ACTOR FORMAT
-- Expected: ALL actors match 'user:{integer}' or 'system:{source}'
-- ────────────────────────────────────────────────────────────
SELECT
    '9. AUDIT LOG ACTORS' AS section,
    actor,
    COUNT(*)              AS entry_count,
    CASE
        WHEN actor ~ '^user:[0-9]+$'    THEN '✅ Compliant — user:{integer}'
        WHEN actor ~ '^system:.+'       THEN '✅ Compliant — system:{source}'
        WHEN actor ~ '^[0-9]+$'         THEN '❌ NON-COMPLIANT — bare integer (pre-CR-002 entry)'
        ELSE                                 '⚠️  Unknown format'
    END AS compliance_status
FROM audit_logs
GROUP BY actor
ORDER BY entry_count DESC
LIMIT 20;

-- Recent audit entries
SELECT
    id,
    tenant_id,
    actor,
    action,
    severity,
    ip_address,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- ────────────────────────────────────────────────────────────
-- SECTION 10: SESSIONS TABLE — TD-001 VERIFICATION
-- Expected hash_length = 64 (SHA-256 hex) NOT 36 (raw UUID)
-- ────────────────────────────────────────────────────────────
SELECT
    '10. SESSIONS' AS section,
    id,
    user_id,
    LENGTH(token_hash) AS hash_length,
    token_hash ~ '^[a-f0-9]{64}$' AS is_sha256,
    LEFT(token_hash, 8) AS hash_prefix,
    CASE
        WHEN LENGTH(token_hash) = 64 AND token_hash ~ '^[a-f0-9]{64}$' THEN '✅ SHA-256 hash'
        WHEN LENGTH(token_hash) = 36 THEN '❌ TD-001: Raw UUID stored — Phase C fix required'
        ELSE '⚠️  Unknown format'
    END AS status,
    created_at::date AS session_date
FROM sessions
ORDER BY created_at DESC
LIMIT 10;

-- ────────────────────────────────────────────────────────────
-- SECTION 11: NIDHIVAN DATA STATE
-- Expected: all 5 entity types non-zero for tenant_id=7
-- ────────────────────────────────────────────────────────────
SELECT
    '11. NIDHIVAN DATA' AS section,
    (SELECT COUNT(*) FROM nidhivan_projects          WHERE tenant_id = 7) AS projects,
    (SELECT COUNT(*) FROM nidhivan_dprs              WHERE tenant_id = 7) AS dprs,
    (SELECT COUNT(*) FROM nidhivan_boqs              WHERE tenant_id = 7) AS boqs,
    (SELECT COUNT(*) FROM nidhivan_boq_items         WHERE tenant_id = 7) AS boq_items,
    (SELECT COUNT(*) FROM nidhivan_financial_metrics WHERE tenant_id = 7) AS metrics;

-- Financial precision check
SELECT
    '11b. NIDHIVAN FINANCIAL PRECISION' AS section,
    column_name,
    data_type,
    CASE
        WHEN data_type = 'bigint'           THEN '✅ bigint (paise — correct)'
        WHEN data_type = 'double precision' THEN '⚠️  double_precision — float risk'
        WHEN data_type = 'numeric'          THEN '✅ numeric — safe'
        ELSE data_type
    END AS precision_status
FROM information_schema.columns
WHERE table_name IN ('nidhivan_boqs','nidhivan_boq_items','nidhivan_dprs','nidhivan_financial_metrics')
  AND (column_name LIKE '%paise%' OR column_name = 'quantity')
ORDER BY table_name, column_name;

-- ────────────────────────────────────────────────────────────
-- SECTION 12: CLIENT REQUESTS (intake pipeline)
-- ────────────────────────────────────────────────────────────
SELECT
    '12. CLIENT REQUESTS' AS section,
    id,
    company_name,
    contact_email,
    status,
    LENGTH(idempotency_key) AS key_length,
    CASE
        WHEN LENGTH(idempotency_key) = 64 THEN '✅ SHA-256'
        ELSE '❌ Wrong key format'
    END AS key_status,
    handled_by_tenant_id,
    created_at::date AS submitted
FROM client_requests
ORDER BY created_at DESC
LIMIT 10;

-- ────────────────────────────────────────────────────────────
-- SECTION 13: SUMMARY HEALTH DASHBOARD
-- One-query overview of entire DB state
-- ────────────────────────────────────────────────────────────
SELECT
    '13. DB HEALTH SUMMARY' AS section,
    (SELECT COUNT(*) FROM tenants)                                                AS tenant_count,
    (SELECT COUNT(*) FROM users)                                                  AS user_count,
    (SELECT COUNT(*) FROM "drizzle"."__drizzle_migrations")                       AS migration_count,
    (SELECT COUNT(*) FROM limsy_cases)                                            AS limsy_cases,
    (SELECT COUNT(*) FROM limsy_hearings)                                         AS limsy_hearings,
    (SELECT COUNT(*) FROM limsy_orders)                                           AS limsy_orders,
    (SELECT COUNT(*) FROM audit_logs)                                             AS audit_entries,
    (SELECT COUNT(*) FROM sessions)                                               AS active_sessions,
    (SELECT COUNT(*) FROM nidhivan_boq_items WHERE tenant_id = 7)                AS nidhivan_boq_items,
    (SELECT COUNT(*) FROM client_requests)                                        AS intake_requests,
    (SELECT COUNT(*) FROM audit_logs WHERE actor ~ '^user:[0-9]+$')              AS compliant_actors,
    (SELECT COUNT(*) FROM audit_logs WHERE actor ~ '^[0-9]+$')                   AS non_compliant_actors;
