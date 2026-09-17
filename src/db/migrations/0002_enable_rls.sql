-- =============================================================================
-- Migration: 0002_enable_rls.sql
-- BNLV Studio — Row-Level Security for all tenant-scoped tables
-- =============================================================================
-- Run with:
--   psql "$DATABASE_URL_UNPOOLED" \
--     -v STUDIO_APP_PASSWORD="<password>" \
--     -v STUDIO_MIGRATOR_PASSWORD="<password>" \
--     -f 0002_enable_rls.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Create application roles
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'studio_app') THEN
    CREATE ROLE studio_app NOINHERIT LOGIN PASSWORD :'STUDIO_APP_PASSWORD';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'studio_migrator') THEN
    CREATE ROLE studio_migrator NOINHERIT LOGIN PASSWORD :'STUDIO_MIGRATOR_PASSWORD'
      BYPASSRLS;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Grant privileges
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO studio_app;
GRANT USAGE ON SCHEMA public TO studio_migrator;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO studio_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO studio_migrator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO studio_migrator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO studio_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO studio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO studio_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studio_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO studio_app;

-- audit_logs is append-only at the DB level
REVOKE UPDATE, DELETE ON TABLE audit_logs FROM studio_app;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- sessions: excluded from RLS — required pre-tenant-context for bootstrap lookup
-- client_requests / job_applications: platform-level, no tenant scope

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tenant resolver function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::integer;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenants_app_select ON tenants;
CREATE POLICY tenants_app_select ON tenants
  FOR SELECT TO studio_app
  USING (id = current_tenant_id());

DROP POLICY IF EXISTS tenants_app_update ON tenants;
CREATE POLICY tenants_app_update ON tenants
  FOR UPDATE TO studio_app
  USING (id = current_tenant_id())
  WITH CHECK (id = current_tenant_id());

DROP POLICY IF EXISTS users_app_all ON users;
CREATE POLICY users_app_all ON users
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS projects_app_all ON projects;
CREATE POLICY projects_app_all ON projects
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS builder_components_app_all ON builder_components;
CREATE POLICY builder_components_app_all ON builder_components
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS ai_tasks_app_all ON ai_tasks;
CREATE POLICY ai_tasks_app_all ON ai_tasks
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS environments_app_all ON environments;
CREATE POLICY environments_app_all ON environments
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS deployments_app_all ON deployments;
CREATE POLICY deployments_app_all ON deployments
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS api_keys_app_all ON api_keys;
CREATE POLICY api_keys_app_all ON api_keys
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS feature_flags_app_all ON feature_flags;
CREATE POLICY feature_flags_app_all ON feature_flags
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS vault_secrets_app_all ON vault_secrets;
CREATE POLICY vault_secrets_app_all ON vault_secrets
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS webhook_endpoints_app_all ON webhook_endpoints;
CREATE POLICY webhook_endpoints_app_all ON webhook_endpoints
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS incidents_app_all ON incidents;
CREATE POLICY incidents_app_all ON incidents
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS audit_logs_app_select ON audit_logs;
CREATE POLICY audit_logs_app_select ON audit_logs
  FOR SELECT TO studio_app
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS audit_logs_app_insert ON audit_logs;
CREATE POLICY audit_logs_app_insert ON audit_logs
  FOR INSERT TO studio_app
  WITH CHECK (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verification (run manually)
-- ─────────────────────────────────────────────────────────────────────────────

/*
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Isolation test (should return 0 rows for any non-existent tenant):
SET app.current_tenant_id = '99999';
SELECT count(*) FROM projects;
SET app.current_tenant_id = '';
*/