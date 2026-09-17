-- ============================================================
-- Migration: 0014_bms_studio_hosting.sql
-- Purpose:  BMS SaaS Studio Builder + Hosting Layer
-- Execute:  DATABASE_URL_UNPOOLED (ADR-002)
-- ============================================================

-- ── 1. bms_studio_projects ──────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_studio_projects (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',
  description  TEXT NOT NULL DEFAULT '',
  gradient     TEXT NOT NULL DEFAULT 'from-ink-900 to-amber-900',
  pages        JSONB NOT NULL DEFAULT '[]',
  api_routes   JSONB NOT NULL DEFAULT '[]',
  workflows    JSONB NOT NULL DEFAULT '[]',
  deployments  JSONB NOT NULL DEFAULT '[]',
  domain       JSONB NOT NULL DEFAULT '{"subdomain":"","customDomain":"","ssl":"none"}',
  product      JSONB NOT NULL DEFAULT '{}',
  schema_code  TEXT NOT NULL DEFAULT '',
  framework    JSONB NOT NULL DEFAULT '{}',
  theme        JSONB NOT NULL DEFAULT '{"primary":"from-ink-900 to-amber-900","accent":"from-amber-600 to-orange-800","radius":"2xl","fontScale":100}',
  tables       JSONB NOT NULL DEFAULT '[]',
  env_vars     JSONB NOT NULL DEFAULT '[]',
  plan         JSONB NOT NULL DEFAULT '{"tier":"Pro","seats":5,"bandwidth":"12 GB"}',
  version      INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, slug)
);

ALTER TABLE bms_studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_studio_projects FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_studio_projects_tenant_isolation ON bms_studio_projects
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 2. bms_studio_addons ────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_studio_addons (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  addon_id     TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'skill',
  custom       BOOLEAN NOT NULL DEFAULT FALSE,
  installed    BOOLEAN NOT NULL DEFAULT TRUE,
  meta         JSONB NOT NULL DEFAULT '{}',
  version      TEXT NOT NULL DEFAULT '1.0.0',
  files        JSONB NOT NULL DEFAULT '[]',
  history      JSONB NOT NULL DEFAULT '[]',
  synced_at    TIMESTAMPTZ DEFAULT NOW(),
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, addon_id)
);

ALTER TABLE bms_studio_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_studio_addons FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_studio_addons_tenant_isolation ON bms_studio_addons
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 3. bms_host_containers ──────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_host_containers (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_slug    TEXT NOT NULL,
  image        TEXT NOT NULL DEFAULT 'bms/site-runtime:latest',
  status       TEXT NOT NULL DEFAULT 'running',
  port         INTEGER NOT NULL DEFAULT 10000,
  region       TEXT NOT NULL DEFAULT 'ap-south-1',
  cpu_limit    NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  mem_limit_mb INTEGER NOT NULL DEFAULT 512,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_host_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_host_containers FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_host_containers_tenant_isolation ON bms_host_containers
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 4. bms_dns_records ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_dns_records (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_slug  TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'A',
  name       TEXT NOT NULL,
  content    TEXT NOT NULL,
  ttl        INTEGER NOT NULL DEFAULT 3600,
  proxied    BOOLEAN NOT NULL DEFAULT TRUE,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_dns_records FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_dns_records_tenant_isolation ON bms_dns_records
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);
