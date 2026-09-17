-- ============================================================
-- Migration: 0013_bms_academy_lms.sql
-- Platform: BNLV Group Enterprise SaaS (saas-studio)
-- Purpose:  Port bmslms LMS tables with tenantId scoping + RLS
-- Source:   Merged from project-2bmslms/src/db/schema.ts
-- Execute:  DATABASE_URL_UNPOOLED (owner connection — ADR-002)
-- Author:   Office of the CTO, BNLV Group
-- Date:     2026-09-15
-- ============================================================

-- ── 1. bms_courses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_courses (
  id                   SERIAL PRIMARY KEY,
  tenant_id            INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  slug                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  long_description     TEXT,
  category             TEXT NOT NULL DEFAULT 'Agentic AI',
  level                TEXT NOT NULL DEFAULT 'Beginner',
  duration_hours       INTEGER NOT NULL DEFAULT 8,
  thumbnail_gradient   TEXT NOT NULL DEFAULT 'from-indigo-600 via-violet-600 to-fuchsia-600',
  status               TEXT NOT NULL DEFAULT 'published',
  instructor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating               NUMERIC(3,1) NOT NULL DEFAULT 4.8,
  enrollments_count    INTEGER NOT NULL DEFAULT 0,
  tags                 JSONB NOT NULL DEFAULT '[]',
  objectives           JSONB NOT NULL DEFAULT '[]',
  prerequisites        JSONB NOT NULL DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, slug)
);

ALTER TABLE bms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_courses FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_courses_tenant_isolation ON bms_courses
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 2. bms_modules ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_modules (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id    INTEGER NOT NULL REFERENCES bms_courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_modules FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_modules_tenant_isolation ON bms_modules
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 3. bms_lessons ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_lessons (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id        INTEGER NOT NULL REFERENCES bms_modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'video',
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  content          TEXT,
  video_url        TEXT,
  code_starter     TEXT,
  order_index      INTEGER NOT NULL DEFAULT 0,
  is_free          BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE bms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_lessons FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_lessons_tenant_isolation ON bms_lessons
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 4. bms_learning_paths ───────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_learning_paths (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  level           TEXT NOT NULL DEFAULT 'Beginner',
  estimated_weeks INTEGER NOT NULL DEFAULT 6,
  gradient        TEXT NOT NULL DEFAULT 'from-cyan-500 to-blue-600',
  icon            TEXT NOT NULL DEFAULT 'route',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_learning_paths FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_learning_paths_tenant_isolation ON bms_learning_paths
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 5. bms_enrollments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_enrollments (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id        INTEGER NOT NULL REFERENCES bms_courses(id) ON DELETE CASCADE,
  progress         NUMERIC(5,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active',
  enrolled_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at     TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (tenant_id, user_id, course_id)
);

ALTER TABLE bms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_enrollments FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_enrollments_tenant_isolation ON bms_enrollments
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 6. bms_lesson_progress ──────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_lesson_progress (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES bms_lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (tenant_id, user_id, lesson_id)
);

ALTER TABLE bms_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_lesson_progress FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_lesson_progress_tenant_isolation ON bms_lesson_progress
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 7. bms_ai_agents ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_ai_agents (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  description   TEXT NOT NULL,
  model         TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  tools         JSONB NOT NULL DEFAULT '[]',
  system_prompt TEXT,
  color         TEXT NOT NULL DEFAULT 'from-violet-500 to-purple-600',
  status        TEXT NOT NULL DEFAULT 'active',
  autonomy_level INTEGER NOT NULL DEFAULT 3,
  success_rate  NUMERIC(5,2) NOT NULL DEFAULT 94.50,
  runs_count    INTEGER NOT NULL DEFAULT 0,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_ai_agents FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_ai_agents_tenant_isolation ON bms_ai_agents
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ── 8. bms_workflows ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bms_workflows (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'Multi-Agent',
  difficulty        TEXT NOT NULL DEFAULT 'Intermediate',
  estimated_minutes INTEGER NOT NULL DEFAULT 90,
  gradient          TEXT NOT NULL DEFAULT 'from-emerald-500 to-teal-600',
  steps             JSONB NOT NULL DEFAULT '[]',
  agents            JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'published',
  created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE bms_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_workflows FORCE ROW LEVEL SECURITY;
CREATE POLICY bms_workflows_tenant_isolation ON bms_workflows
  FOR ALL TO studio_app
  USING  (tenant_id = current_setting('app.current_tenant_id', true)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);
