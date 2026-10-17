-- =============================================================================
-- Migration 0019: Final Platform Consolidation
-- File: drizzle/migrations/0019_final_platform_consolidation.sql
-- Executed via: npm run db:migrate (DATABASE_URL_UNPOOLED — ADR-002)
-- Sources: agentic-ai-bootcamp-platform.zip
--          build-limsy-judicial-platform.zip
--          E-LMS_BNLV-A.zip
-- =============================================================================
--
-- 22 NEW TABLES — zero conflicts with migrations 0000–0018
-- All tables: INTEGER serial PK · tenant_id FK → tenants(id) · RLS enforced
-- Financial columns: NONE in this migration — no paise conversion required
-- Hard delete revoked on: bms_certificates, limsy_war_room_messages
--
-- SECTION A: AGENTIC BOOTCAMP (8 tables)
--   bms_tracks, bms_labs, bms_lab_runs, bms_cohorts, bms_cohort_members,
--   bms_assessments, bms_assessment_attempts, bms_delivery_sessions
--
-- SECTION B: LIMSY JUDICIAL PLATFORM (6 tables)
--   limsy_contacts, limsy_user_preferences, limsy_workflow_blueprints,
--   limsy_case_workspaces, limsy_war_room_messages, limsy_document_templates
--
-- SECTION C: EXECUTIVE LMS (8 tables)
--   bms_academies, bms_certificates, bms_case_submissions,
--   bms_executive_tools, bms_user_tool_saves, bms_masterclasses,
--   bms_media_programs, bms_discussions
-- =============================================================================

-- ── RLS helper macro ─────────────────────────────────────────────────────────
-- Pattern: tenant_id = current_setting('app.current_tenant_id', TRUE)::integer
-- SET LOCAL injected by withTenant() before every query (ADR-001)

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION A: AGENTIC BOOTCAMP PLATFORM
-- ═════════════════════════════════════════════════════════════════════════════

-- A1. bms_tracks — Bootcamp curriculum tracks (Orient / Build / Verify / Reflect)
CREATE TABLE IF NOT EXISTS bms_tracks (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,                -- e.g. 'ORIENT', 'BUILD', 'VERIFY', 'REFLECT'
  phase       INTEGER NOT NULL DEFAULT 1,   -- track sequence order
  description TEXT NOT NULL DEFAULT '',
  objectives  JSONB NOT NULL DEFAULT '[]',  -- Array<string>
  duration_days INTEGER NOT NULL DEFAULT 5,
  mode        TEXT NOT NULL DEFAULT 'blended', -- self-paced | blended | live
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_tracks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_tracks_rls ON bms_tracks;
CREATE POLICY bms_tracks_rls ON bms_tracks AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_tracks_tenant_idx ON bms_tracks (tenant_id, phase);

-- A2. bms_labs — Technical hands-on lab definitions
CREATE TABLE IF NOT EXISTS bms_labs (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  track_id     INTEGER REFERENCES bms_tracks(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  lab_type     TEXT NOT NULL DEFAULT 'sandbox', -- sandbox | guided | challenge | capstone
  difficulty   TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced | expert
  duration_min INTEGER NOT NULL DEFAULT 60,
  description  TEXT NOT NULL DEFAULT '',
  objectives   JSONB NOT NULL DEFAULT '[]',      -- Array<string>
  instructions TEXT NOT NULL DEFAULT '',
  environment  TEXT NOT NULL DEFAULT 'browser',  -- browser | docker | cloud | hybrid
  stack        TEXT NOT NULL DEFAULT '',          -- tech stack tags
  verify_cmd   TEXT NOT NULL DEFAULT '',          -- verification command/URL
  status       TEXT NOT NULL DEFAULT 'published',
  sort_index   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_labs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_labs_rls ON bms_labs;
CREATE POLICY bms_labs_rls ON bms_labs AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_labs_tenant_idx ON bms_labs (tenant_id, lab_type, status);

-- A3. bms_lab_runs — Lab execution instances per user
CREATE TABLE IF NOT EXISTS bms_lab_runs (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  lab_id        INTEGER NOT NULL REFERENCES bms_labs(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cohort_id     INTEGER, -- FK added after bms_cohorts is created
  status        TEXT NOT NULL DEFAULT 'not_started', -- not_started | running | paused | completed | timed_out
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  duration_sec  INTEGER,
  score         INTEGER,              -- 0–100
  attempts      INTEGER NOT NULL DEFAULT 0,
  evidence      JSONB NOT NULL DEFAULT '{}', -- screenshot URLs, verification output
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_lab_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_lab_runs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_lab_runs_rls ON bms_lab_runs;
CREATE POLICY bms_lab_runs_rls ON bms_lab_runs AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_lab_runs_tenant_idx ON bms_lab_runs (tenant_id, lab_id, user_id);

-- A4. bms_cohorts — Training cohorts with sponsors
CREATE TABLE IF NOT EXISTS bms_cohorts (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,               -- e.g. 'COHORT-2026-Q4'
  track_id      INTEGER REFERENCES bms_tracks(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'forming', -- forming | active | completed | archived
  delivery_mode TEXT NOT NULL DEFAULT 'online_live',
  max_size      INTEGER NOT NULL DEFAULT 30,
  sponsor       TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',    -- for offline cohorts
  start_date    TEXT NOT NULL DEFAULT '',
  end_date      TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_cohorts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_cohorts_rls ON bms_cohorts;
CREATE POLICY bms_cohorts_rls ON bms_cohorts AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_cohorts_tenant_idx ON bms_cohorts (tenant_id, status);

-- Add FK from bms_lab_runs.cohort_id → bms_cohorts
ALTER TABLE bms_lab_runs
  ADD CONSTRAINT bms_lab_runs_cohort_fk
  FOREIGN KEY (cohort_id) REFERENCES bms_cohorts(id) ON DELETE SET NULL;

-- A5. bms_cohort_members — Cohort membership roster
CREATE TABLE IF NOT EXISTS bms_cohort_members (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  cohort_id   INTEGER NOT NULL REFERENCES bms_cohorts(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'participant', -- participant | facilitator | observer | sponsor
  status      TEXT NOT NULL DEFAULT 'active',
  joined_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT bms_cohort_members_unique UNIQUE (tenant_id, cohort_id, email)
);
ALTER TABLE bms_cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_cohort_members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_cohort_members_rls ON bms_cohort_members;
CREATE POLICY bms_cohort_members_rls ON bms_cohort_members AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_cohort_members_tenant_idx ON bms_cohort_members (tenant_id, cohort_id);

-- A6. bms_assessments — Quizzes, case studies, coding challenges
CREATE TABLE IF NOT EXISTS bms_assessments (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  track_id      INTEGER REFERENCES bms_tracks(id) ON DELETE SET NULL,
  course_id     INTEGER REFERENCES bms_courses(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'quiz', -- quiz | case_study | coding | project | peer_review
  passing_score INTEGER NOT NULL DEFAULT 70,  -- 0–100
  time_limit_min INTEGER,
  max_attempts  INTEGER NOT NULL DEFAULT 3,
  questions     JSONB NOT NULL DEFAULT '[]',  -- Array<{id, type, prompt, options, answer, points}>
  rubric        JSONB NOT NULL DEFAULT '{}',  -- For case study / project grading
  status        TEXT NOT NULL DEFAULT 'published',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_assessments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_assessments_rls ON bms_assessments;
CREATE POLICY bms_assessments_rls ON bms_assessments AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_assessments_tenant_idx ON bms_assessments (tenant_id, kind, status);

-- A7. bms_assessment_attempts — User attempt records
CREATE TABLE IF NOT EXISTS bms_assessment_attempts (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  assessment_id  INTEGER NOT NULL REFERENCES bms_assessments(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cohort_id      INTEGER REFERENCES bms_cohorts(id) ON DELETE SET NULL,
  attempt_num    INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | submitted | graded | timed_out
  score          INTEGER,                -- 0–100 final score
  answers        JSONB NOT NULL DEFAULT '{}',
  feedback       TEXT NOT NULL DEFAULT '',
  graded_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  started_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  submitted_at   TIMESTAMPTZ,
  graded_at      TIMESTAMPTZ
);
ALTER TABLE bms_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_assessment_attempts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_assessment_attempts_rls ON bms_assessment_attempts;
CREATE POLICY bms_assessment_attempts_rls ON bms_assessment_attempts AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_assessment_attempts_tenant_idx ON bms_assessment_attempts (tenant_id, assessment_id, user_id);

-- A8. bms_delivery_sessions — Online/Offline/Hybrid+HDTV scheduling
CREATE TABLE IF NOT EXISTS bms_delivery_sessions (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  cohort_id      INTEGER REFERENCES bms_cohorts(id) ON DELETE SET NULL,
  track_id       INTEGER REFERENCES bms_tracks(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  mode           TEXT NOT NULL DEFAULT 'online_live',
                 -- online_live | offline_onsite | hybrid | hdtv_broadcast | async_recording
  status         TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | live | completed | cancelled
  facilitator    TEXT NOT NULL DEFAULT '',
  venue          TEXT NOT NULL DEFAULT '',           -- for offline
  meeting_url    TEXT NOT NULL DEFAULT '',           -- for online
  broadcast_url  TEXT NOT NULL DEFAULT '',           -- for HDTV
  max_attendees  INTEGER NOT NULL DEFAULT 50,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_min   INTEGER NOT NULL DEFAULT 120,
  agenda         JSONB NOT NULL DEFAULT '[]',        -- Array<{time, topic, facilitator}>
  recording_url  TEXT NOT NULL DEFAULT '',
  notes          TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_delivery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_delivery_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_delivery_sessions_rls ON bms_delivery_sessions;
CREATE POLICY bms_delivery_sessions_rls ON bms_delivery_sessions AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_delivery_sessions_tenant_idx ON bms_delivery_sessions (tenant_id, mode, status);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION B: LIMSY JUDICIAL PLATFORM
-- ═════════════════════════════════════════════════════════════════════════════

-- B1. limsy_contacts — Legal contacts and directory
CREATE TABLE IF NOT EXISTS limsy_contacts (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  designation  TEXT NOT NULL DEFAULT '',
  organisation TEXT NOT NULL DEFAULT '',
  role         TEXT NOT NULL DEFAULT 'advocate',
                -- advocate | judge | clerk | expert | witness | client | opposing_counsel
  bar_number   TEXT NOT NULL DEFAULT '',
  court        TEXT NOT NULL DEFAULT '',
  jurisdiction TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  notes        TEXT NOT NULL DEFAULT '',
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE limsy_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_contacts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_contacts_rls ON limsy_contacts;
CREATE POLICY limsy_contacts_rls ON limsy_contacts AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_contacts_tenant_idx ON limsy_contacts (tenant_id, role, active);

-- B2. limsy_user_preferences — UX preferences per user
CREATE TABLE IF NOT EXISTS limsy_user_preferences (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme             TEXT NOT NULL DEFAULT 'dark',      -- dark | light | high_contrast
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  default_view      TEXT NOT NULL DEFAULT 'docket',    -- docket | matters | trial | frameworks
  notification_prefs JSONB NOT NULL DEFAULT '{}',
  keyboard_shortcuts JSONB NOT NULL DEFAULT '{}',
  language          TEXT NOT NULL DEFAULT 'en',
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT limsy_user_preferences_unique UNIQUE (tenant_id, user_id)
);
ALTER TABLE limsy_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_user_preferences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_user_preferences_rls ON limsy_user_preferences;
CREATE POLICY limsy_user_preferences_rls ON limsy_user_preferences AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_user_preferences_tenant_idx ON limsy_user_preferences (tenant_id, user_id);

-- B3. limsy_workflow_blueprints — Jurisdiction-specific workflow templates
CREATE TABLE IF NOT EXISTS limsy_workflow_blueprints (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'Supreme Court of India',
  case_type    TEXT NOT NULL DEFAULT 'slp',
  description  TEXT NOT NULL DEFAULT '',
  -- steps: Array<{phase, title, duration_days, responsible, checklist: string[], gate: string}>
  steps        JSONB NOT NULL DEFAULT '[]',
  -- triggers: Array<{event, action, auto: boolean}>
  triggers     JSONB NOT NULL DEFAULT '[]',
  estimated_duration_days INTEGER NOT NULL DEFAULT 180,
  is_template  BOOLEAN NOT NULL DEFAULT TRUE,
  status       TEXT NOT NULL DEFAULT 'published',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE limsy_workflow_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_workflow_blueprints FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_workflow_blueprints_rls ON limsy_workflow_blueprints;
CREATE POLICY limsy_workflow_blueprints_rls ON limsy_workflow_blueprints AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_workflow_blueprints_tenant_idx ON limsy_workflow_blueprints (tenant_id, jurisdiction, case_type);

-- B4. limsy_case_workspaces — Collaborative case workspace state
CREATE TABLE IF NOT EXISTS limsy_case_workspaces (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  case_id       INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL DEFAULT 'SHARED',  -- SHARED | CHAMBERS | PROCEEDING
  title         TEXT NOT NULL DEFAULT 'Case Workspace',
  pinned_items  JSONB NOT NULL DEFAULT '[]',     -- Array<{type, ref_id, title}>
  active_users  JSONB NOT NULL DEFAULT '[]',     -- Array<{user_id, name, role}>
  video_url     TEXT NOT NULL DEFAULT '',
  is_live       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT limsy_case_workspaces_unique UNIQUE (tenant_id, case_id, channel)
);
ALTER TABLE limsy_case_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_case_workspaces FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_case_workspaces_rls ON limsy_case_workspaces;
CREATE POLICY limsy_case_workspaces_rls ON limsy_case_workspaces AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_case_workspaces_tenant_idx ON limsy_case_workspaces (tenant_id, case_id, channel);

-- B5. limsy_war_room_messages — Real-time war room messages
-- Channel-gated: SHARED (all roles) | CHAMBERS (judge/admin) | PROCEEDING (all during hearing)
-- Hard delete revoked — war room log is a legal record
CREATE TABLE IF NOT EXISTS limsy_war_room_messages (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  workspace_id INTEGER NOT NULL REFERENCES limsy_case_workspaces(id) ON DELETE CASCADE,
  case_id      INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL DEFAULT 'SHARED',
  sender_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_name  TEXT NOT NULL,
  sender_role  TEXT NOT NULL DEFAULT 'advocate',
  content      TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'text', -- text | annotation | exhibit_ref | ruling | system
  ref_id       INTEGER,                      -- reference to order/exhibit if kind ≠ text
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE limsy_war_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_war_room_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_war_room_messages_rls ON limsy_war_room_messages;
CREATE POLICY limsy_war_room_messages_rls ON limsy_war_room_messages AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
REVOKE DELETE ON limsy_war_room_messages FROM studio_app; -- legal record
REVOKE TRUNCATE ON limsy_war_room_messages FROM studio_app;
CREATE INDEX IF NOT EXISTS limsy_war_room_messages_tenant_idx ON limsy_war_room_messages (tenant_id, case_id, channel, created_at DESC);

-- B6. limsy_document_templates — Reusable document templates
CREATE TABLE IF NOT EXISTS limsy_document_templates (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'pleading',
                -- pleading | petition | affidavit | application | vakalatname | brief | counter
  jurisdiction TEXT NOT NULL DEFAULT 'Supreme Court of India',
  case_type    TEXT NOT NULL DEFAULT 'general',
  body         TEXT NOT NULL DEFAULT '',    -- Markdown template with {{PLACEHOLDERS}}
  placeholders JSONB NOT NULL DEFAULT '[]', -- Array<{key, label, type: string|date|text}>
  version      INTEGER NOT NULL DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'published',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE limsy_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_document_templates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS limsy_document_templates_rls ON limsy_document_templates;
CREATE POLICY limsy_document_templates_rls ON limsy_document_templates AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS limsy_document_templates_tenant_idx ON limsy_document_templates (tenant_id, kind, status);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION C: EXECUTIVE LMS
-- ═════════════════════════════════════════════════════════════════════════════

-- C1. bms_academies — Institutional academy brands
CREATE TABLE IF NOT EXISTS bms_academies (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,             -- e.g. 'hbs', 'mckinsey', 'stanford'
  tagline       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  logo_initial  TEXT NOT NULL DEFAULT '',  -- initials for avatar display
  accent_color  TEXT NOT NULL DEFAULT '#C9A84C',
  category      TEXT NOT NULL DEFAULT 'management', -- management | technology | finance | law | strategy
  country       TEXT NOT NULL DEFAULT 'India',
  is_partner    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_index    INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT bms_academies_slug_unique UNIQUE (tenant_id, slug)
);
ALTER TABLE bms_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_academies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_academies_rls ON bms_academies;
CREATE POLICY bms_academies_rls ON bms_academies AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_academies_tenant_idx ON bms_academies (tenant_id, category, active);

-- C2. bms_certificates — Verifiable digital certificates
-- SHA-256 verification hash computed server-side at issue time
-- Hard delete revoked — certificates are verifiable credentials
CREATE TABLE IF NOT EXISTS bms_certificates (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  course_id        INTEGER REFERENCES bms_courses(id) ON DELETE SET NULL,
  academy_id       INTEGER REFERENCES bms_academies(id) ON DELETE SET NULL,
  recipient_name   TEXT NOT NULL,
  recipient_email  TEXT NOT NULL,
  title            TEXT NOT NULL,             -- 'Certificate of Completion — AI Strategy'
  credential_id    TEXT NOT NULL UNIQUE,      -- e.g. 'BNLV-2026-HBS-00042'
  -- SHA-256 of: tenantId:courseId:userId:recipientEmail:issuedAt.toISOString()
  verification_hash TEXT NOT NULL,
  issued_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at       TIMESTAMPTZ,
  level            TEXT NOT NULL DEFAULT 'completion',
                   -- completion | achievement | distinction | excellence | mastery
  metadata         JSONB NOT NULL DEFAULT '{}'
);
ALTER TABLE bms_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_certificates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_certificates_rls ON bms_certificates;
CREATE POLICY bms_certificates_rls ON bms_certificates AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
REVOKE DELETE ON bms_certificates FROM studio_app;   -- immutable credential
REVOKE TRUNCATE ON bms_certificates FROM studio_app;
CREATE INDEX IF NOT EXISTS bms_certificates_tenant_idx ON bms_certificates (tenant_id, user_id, course_id);

-- C3. bms_case_submissions — Executive case study submissions with rubric
CREATE TABLE IF NOT EXISTS bms_case_submissions (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  assessment_id  INTEGER REFERENCES bms_assessments(id) ON DELETE SET NULL,
  course_id      INTEGER REFERENCES bms_courses(id) ON DELETE SET NULL,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  body           TEXT NOT NULL DEFAULT '',     -- full submission text
  attachments    JSONB NOT NULL DEFAULT '[]',  -- Array<{name, url, type}>
  status         TEXT NOT NULL DEFAULT 'draft', -- draft | submitted | under_review | graded | revision_required
  rubric_scores  JSONB NOT NULL DEFAULT '{}',  -- Record<criterion, score>
  total_score    INTEGER,                      -- 0–100
  feedback       TEXT NOT NULL DEFAULT '',
  graded_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  submitted_at   TIMESTAMPTZ,
  graded_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_case_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_case_submissions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_case_submissions_rls ON bms_case_submissions;
CREATE POLICY bms_case_submissions_rls ON bms_case_submissions AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_case_submissions_tenant_idx ON bms_case_submissions (tenant_id, status, user_id);

-- C4. bms_executive_tools — MBB/HBS framework tools
CREATE TABLE IF NOT EXISTS bms_executive_tools (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  academy_id   INTEGER REFERENCES bms_academies(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  tool_key     TEXT NOT NULL,  -- 'porter5', 'mece', 'bcg_matrix', 'mckinsey_7s', 'pyramid'
  category     TEXT NOT NULL DEFAULT 'strategy', -- strategy | finance | operations | marketing | leadership
  description  TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  template     JSONB NOT NULL DEFAULT '{}', -- default tool configuration/fields
  icon         TEXT NOT NULL DEFAULT '◈',
  status       TEXT NOT NULL DEFAULT 'published',
  sort_index   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT bms_executive_tools_key_unique UNIQUE (tenant_id, tool_key)
);
ALTER TABLE bms_executive_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_executive_tools FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_executive_tools_rls ON bms_executive_tools;
CREATE POLICY bms_executive_tools_rls ON bms_executive_tools AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_executive_tools_tenant_idx ON bms_executive_tools (tenant_id, category, status);

-- C5. bms_user_tool_saves — Saved framework tool configurations
CREATE TABLE IF NOT EXISTS bms_user_tool_saves (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  tool_id      INTEGER NOT NULL REFERENCES bms_executive_tools(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}',  -- tool-specific field values
  is_shared    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_user_tool_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_user_tool_saves FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_user_tool_saves_rls ON bms_user_tool_saves;
CREATE POLICY bms_user_tool_saves_rls ON bms_user_tool_saves AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_user_tool_saves_tenant_idx ON bms_user_tool_saves (tenant_id, tool_id, user_id);

-- C6. bms_masterclasses — Live executive masterclass events
CREATE TABLE IF NOT EXISTS bms_masterclasses (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  academy_id      INTEGER REFERENCES bms_academies(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  speaker         TEXT NOT NULL,
  speaker_bio     TEXT NOT NULL DEFAULT '',
  topic           TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'upcoming',
                  -- upcoming | live | replay_available | archived
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 60,
  meeting_url     TEXT NOT NULL DEFAULT '',
  replay_url      TEXT NOT NULL DEFAULT '',
  max_seats       INTEGER NOT NULL DEFAULT 500,
  registered      INTEGER NOT NULL DEFAULT 0,
  tags            TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_masterclasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_masterclasses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_masterclasses_rls ON bms_masterclasses;
CREATE POLICY bms_masterclasses_rls ON bms_masterclasses AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_masterclasses_tenant_idx ON bms_masterclasses (tenant_id, status, scheduled_at DESC);

-- C7. bms_media_programs — BNLV Broadcast programming
CREATE TABLE IF NOT EXISTS bms_media_programs (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  title        TEXT NOT NULL,
  series       TEXT NOT NULL DEFAULT '',
  episode      INTEGER NOT NULL DEFAULT 1,
  season       INTEGER NOT NULL DEFAULT 1,
  kind         TEXT NOT NULL DEFAULT 'show',
                -- show | documentary | case_study | interview | panel | training_film
  status       TEXT NOT NULL DEFAULT 'draft',
                -- draft | in_production | post_production | published | archived
  synopsis     TEXT NOT NULL DEFAULT '',
  hosts        TEXT NOT NULL DEFAULT '',
  runtime_min  INTEGER NOT NULL DEFAULT 30,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  stream_url   TEXT NOT NULL DEFAULT '',
  tags         TEXT NOT NULL DEFAULT '',
  air_date     TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_media_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_media_programs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_media_programs_rls ON bms_media_programs;
CREATE POLICY bms_media_programs_rls ON bms_media_programs AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_media_programs_tenant_idx ON bms_media_programs (tenant_id, kind, status);

-- C8. bms_discussions — Cross-module discussion threads
CREATE TABLE IF NOT EXISTS bms_discussions (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  context     TEXT NOT NULL DEFAULT 'general', -- course | lab | cohort | general | masterclass
  context_id  INTEGER,                         -- FK to the relevant context table
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  status      TEXT NOT NULL DEFAULT 'open',   -- open | resolved | closed
  reply_count INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE bms_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_discussions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bms_discussions_rls ON bms_discussions;
CREATE POLICY bms_discussions_rls ON bms_discussions AS PERMISSIVE FOR ALL TO studio_app
  USING      (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer);
CREATE INDEX IF NOT EXISTS bms_discussions_tenant_idx ON bms_discussions (tenant_id, context, status);

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═════════════════════════════════════════════════════════════════════════════
--
-- After migration, verify all 22 tables:
-- SELECT COUNT(*) FROM pg_tables WHERE tablename IN (
--   'bms_tracks','bms_labs','bms_lab_runs','bms_cohorts','bms_cohort_members',
--   'bms_assessments','bms_assessment_attempts','bms_delivery_sessions',
--   'limsy_contacts','limsy_user_preferences','limsy_workflow_blueprints',
--   'limsy_case_workspaces','limsy_war_room_messages','limsy_document_templates',
--   'bms_academies','bms_certificates','bms_case_submissions',
--   'bms_executive_tools','bms_user_tool_saves','bms_masterclasses',
--   'bms_media_programs','bms_discussions'
-- );
-- Expected: 22
--
-- Verify hard-delete revokes on 3 immutable tables:
-- SELECT table_name FROM information_schema.role_table_grants
-- WHERE grantee = 'studio_app' AND privilege_type = 'DELETE'
-- AND table_name IN ('bms_certificates','limsy_war_room_messages','bms_certificates');
-- Expected: 0 rows
