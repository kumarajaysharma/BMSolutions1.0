-- =============================================================================
-- 0020_complex_terrax_safe_v2.sql
-- BNLV Group — BMSolutions Platform
-- Safe edition v2 of drizzle-generated 0020_complex_terrax.sql
-- Modifications vs original:
--   1. CREATE TABLE → CREATE TABLE IF NOT EXISTS (36 tables)
--   2. ALTER TABLE ADD COLUMN → DO $$ EXCEPTION duplicate_column (3 columns)
--   3. ALTER TABLE ADD CONSTRAINT → DO $$ EXCEPTION duplicate_object /
--      undefined_column / others (76 constraints)
--   4. SECTION 2b: ADD COLUMN IF NOT EXISTS for known missing LIMSY columns
-- Apply via : Neon Console → SQL Editor → run as neondb_owner
-- After apply: npx drizzle-kit generate → verify zero diff
-- ADR-004   : all monetary columns are BIGINT in paise (₹ × 100)
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: CREATE TABLES (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "bms_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"course_id" integer,
	"module_id" integer,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'submission' NOT NULL,
	"due_in_days" integer DEFAULT 7 NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"passing_score" integer DEFAULT 60 NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"rubric" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_code_red_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"severity" text DEFAULT 'critical' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"category" text DEFAULT 'incident' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"impacted_systems" jsonb DEFAULT '[]'::jsonb,
	"commander" text DEFAULT '' NOT NULL,
	"commander_id" integer,
	"timeline" jsonb DEFAULT '[]'::jsonb,
	"resolution" text DEFAULT '' NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"academy_id" integer,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"level" text DEFAULT 'beginner' NOT NULL,
	"category" text DEFAULT 'management' NOT NULL,
	"duration_hours" integer DEFAULT 10 NOT NULL,
	"price_paise" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"instructor_id" integer,
	"instructor_name" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"thumbnail_url" text DEFAULT '' NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_dns_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"record_type" text DEFAULT 'A' NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"ttl" integer DEFAULT 300 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'cloudflare' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"user_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"progress" integer DEFAULT 0 NOT NULL,
	"certification_issued" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_host_containers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"name" text NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"region" text DEFAULT 'ap-south-1' NOT NULL,
	"status" text DEFAULT 'provisioning' NOT NULL,
	"cpu" text DEFAULT '0.5' NOT NULL,
	"memory" text DEFAULT '512Mi' NOT NULL,
	"env_vars" jsonb DEFAULT '{}'::jsonb,
	"health_url" text DEFAULT '' NOT NULL,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_learning_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"academy_id" integer,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"level" text DEFAULT 'intermediate' NOT NULL,
	"courses" jsonb DEFAULT '[]'::jsonb,
	"duration_hours" integer DEFAULT 40 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"user_id" integer,
	"enrollment_id" integer,
	"status" text DEFAULT 'not_started' NOT NULL,
	"watched_sec" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'video' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"video_url" text DEFAULT '' NOT NULL,
	"duration_min" integer DEFAULT 10 NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_pendencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'security' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"environment" text DEFAULT 'development' NOT NULL,
	"remediation" text DEFAULT '' NOT NULL,
	"target_release" text DEFAULT '' NOT NULL,
	"blocks_production" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_release_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"version" text NOT NULL,
	"environment" text DEFAULT 'evaluation' NOT NULL,
	"decision" text DEFAULT 'blocked' NOT NULL,
	"actor" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"passed" integer DEFAULT 0 NOT NULL,
	"warnings" integer DEFAULT 0 NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"blockers" integer DEFAULT 0 NOT NULL,
	"snapshot" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bms_studio_addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"addon_key" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'integration' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_authorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer,
	"kind" text DEFAULT 'case' NOT NULL,
	"citation" text NOT NULL,
	"court" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"holding" text DEFAULT '' NOT NULL,
	"pin_cite" text DEFAULT '' NOT NULL,
	"relevance" text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_case_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"channel" text DEFAULT 'SHARED' NOT NULL,
	"title" text DEFAULT 'Case Workspace' NOT NULL,
	"pinned_items" jsonb DEFAULT '[]'::jsonb,
	"active_users" jsonb DEFAULT '[]'::jsonb,
	"video_url" text DEFAULT '' NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"subject_matter" text NOT NULL,
	"relief_sought" text,
	"synopsis" text,
	"synopsis_generated_at" timestamp with time zone,
	"synopsis_generated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_counsel_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer,
	"title" text DEFAULT 'Co-Counsel Session' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"kind" text DEFAULT 'pleading' NOT NULL,
	"title" text NOT NULL,
	"citation" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"filed_on" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer,
	"name" text NOT NULL,
	"method" text DEFAULT 'IRAC' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"nodes" jsonb DEFAULT '[]'::jsonb,
	"edges" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_hearings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"hearing_date" text NOT NULL,
	"court" text DEFAULT '' NOT NULL,
	"court_level" text DEFAULT 'high_court' NOT NULL,
	"judge" text DEFAULT '' NOT NULL,
	"purpose" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"outcome" text DEFAULT '' NOT NULL,
	"next_date" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"hearing_id" integer,
	"order_type" text DEFAULT 'interim' NOT NULL,
	"order_date" text NOT NULL,
	"court" text DEFAULT '' NOT NULL,
	"judge" text DEFAULT '' NOT NULL,
	"operative" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"appealable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"role" text DEFAULT 'claimant' NOT NULL,
	"name" text NOT NULL,
	"designation" text DEFAULT '' NOT NULL,
	"counsel" text DEFAULT '' NOT NULL,
	"standing" text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_trials" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"phase" text DEFAULT 'pretrial' NOT NULL,
	"in_session" boolean DEFAULT false NOT NULL,
	"bench" text DEFAULT '' NOT NULL,
	"transcript" jsonb DEFAULT '[]'::jsonb,
	"exhibits" jsonb DEFAULT '[]'::jsonb,
	"roster" jsonb DEFAULT '[]'::jsonb,
	"rulings" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "limsy_war_room_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"workspace_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"channel" text DEFAULT 'SHARED' NOT NULL,
	"sender_id" integer,
	"sender_name" text NOT NULL,
	"sender_role" text DEFAULT 'advocate' NOT NULL,
	"content" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"ref_id" integer,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'asset' NOT NULL,
	"subtype" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_boq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"boq_id" integer NOT NULL,
	"sl_no" integer DEFAULT 1 NOT NULL,
	"description" text NOT NULL,
	"unit" text DEFAULT 'LS' NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"rate_paise" bigint DEFAULT 0 NOT NULL,
	"amount_paise" bigint DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'civil' NOT NULL,
	"cpwd_sor_code" text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_boqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"total_amount_paise" bigint DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_closes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"period" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"owner" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"locked_by" text DEFAULT '' NOT NULL,
	"locked_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_counsel" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer,
	"title" text DEFAULT 'Financial Co-Counsel' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_dprs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"entity_id" integer,
	"title" text NOT NULL,
	"dpr_code" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"total_project_cost_paise" bigint DEFAULT 0 NOT NULL,
	"sections" jsonb DEFAULT '{}'::jsonb,
	"approved_by" text DEFAULT '' NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"ticker" text DEFAULT '' NOT NULL,
	"sector" text DEFAULT 'Financials' NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"relationship" text DEFAULT 'advisory' NOT NULL,
	"fy_end" text DEFAULT '31 March' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"aum_paise" bigint DEFAULT 0 NOT NULL,
	"revenue_paise" bigint DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_financial_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"period" text NOT NULL,
	"metric_type" text DEFAULT 'quarterly' NOT NULL,
	"revenue_paise" bigint DEFAULT 0 NOT NULL,
	"ebitda_paise" bigint DEFAULT 0 NOT NULL,
	"pat_paise" bigint DEFAULT 0 NOT NULL,
	"total_assets_paise" bigint DEFAULT 0 NOT NULL,
	"total_liabilities_paise" bigint DEFAULT 0 NOT NULL,
	"ratios" jsonb DEFAULT '{}'::jsonb,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_journals" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"ref" text NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"memo" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb,
	"reversal_of" integer,
	"created_by" text DEFAULT 'studio' NOT NULL,
	"posted_by" text DEFAULT '' NOT NULL,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_lab" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"stage" text DEFAULT 'ideation' NOT NULL,
	"domain" text DEFAULT 'payments' NOT NULL,
	"hypothesis" text DEFAULT '' NOT NULL,
	"outcome" text DEFAULT '' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"spend_paise" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer,
	"name" text NOT NULL,
	"project_code" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'infrastructure' NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"total_budget_paise" bigint DEFAULT 0 NOT NULL,
	"spent_paise" bigint DEFAULT 0 NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"start_date" text DEFAULT '' NOT NULL,
	"end_date" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "nidhivan_research" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"desk" text DEFAULT 'equity' NOT NULL,
	"entity_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"thesis" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"rating" text DEFAULT 'hold' NOT NULL,
	"author" text DEFAULT 'Nidhivan Desk' NOT NULL,
	"published_on" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: ADD COLUMN on existing tables (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "bms_assessments" ADD COLUMN "course_id" integer;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'bms_assessments.course_id already exists — skipped';
END $$;

DO $$ BEGIN
  ALTER TABLE "bms_case_submissions" ADD COLUMN "course_id" integer;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'bms_case_submissions.course_id already exists — skipped';
END $$;

DO $$ BEGIN
  ALTER TABLE "bms_certificates" ADD COLUMN "course_id" integer;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'bms_certificates.course_id already exists — skipped';
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2b: RECOVERY ADD COLUMN IF NOT EXISTS (partially-recovered tables)
-- These LIMSY tables exist in the DB but lost columns during DROP CASCADE.
-- CREATE TABLE IF NOT EXISTS above skipped them; we patch missing columns here.
-- All tables use native PG 14+ syntax; safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- LIMSY tables: case_id column missing in partially-recovered state
ALTER TABLE IF EXISTS "limsy_authorities"      ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_case_workspaces"  ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_counsel_sessions" ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_documents"        ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_frameworks"       ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_hearings"         ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_orders"           ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_parties"          ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_trials"           ADD COLUMN IF NOT EXISTS "case_id" integer;
ALTER TABLE IF EXISTS "limsy_war_room_messages" ADD COLUMN IF NOT EXISTS "case_id" integer;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: FOREIGN KEY CONSTRAINTS (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "bms_assignments" ADD CONSTRAINT "bms_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_assignments" ADD CONSTRAINT "bms_assignments_course_id_bms_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bms_courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_assignments" ADD CONSTRAINT "bms_assignments_module_id_bms_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."bms_modules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_code_red_cases" ADD CONSTRAINT "bms_code_red_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_code_red_cases" ADD CONSTRAINT "bms_code_red_cases_commander_id_users_id_fk" FOREIGN KEY ("commander_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_courses" ADD CONSTRAINT "bms_courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_courses" ADD CONSTRAINT "bms_courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_dns_records" ADD CONSTRAINT "bms_dns_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_dns_records" ADD CONSTRAINT "bms_dns_records_project_id_bms_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bms_studio_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_enrollments" ADD CONSTRAINT "bms_enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_enrollments" ADD CONSTRAINT "bms_enrollments_course_id_bms_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bms_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_enrollments" ADD CONSTRAINT "bms_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_host_containers" ADD CONSTRAINT "bms_host_containers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_host_containers" ADD CONSTRAINT "bms_host_containers_project_id_bms_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bms_studio_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_learning_paths" ADD CONSTRAINT "bms_learning_paths_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_lesson_id_bms_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."bms_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_enrollment_id_bms_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."bms_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_lessons" ADD CONSTRAINT "bms_lessons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_lessons" ADD CONSTRAINT "bms_lessons_module_id_bms_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."bms_modules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_modules" ADD CONSTRAINT "bms_modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_modules" ADD CONSTRAINT "bms_modules_course_id_bms_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bms_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_pendencies" ADD CONSTRAINT "bms_pendencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_release_evidence" ADD CONSTRAINT "bms_release_evidence_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_studio_addons" ADD CONSTRAINT "bms_studio_addons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "bms_studio_addons" ADD CONSTRAINT "bms_studio_addons_project_id_bms_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bms_studio_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_authorities" ADD CONSTRAINT "limsy_authorities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_authorities" ADD CONSTRAINT "limsy_authorities_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_case_workspaces" ADD CONSTRAINT "limsy_case_workspaces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_case_workspaces" ADD CONSTRAINT "limsy_case_workspaces_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_cases" ADD CONSTRAINT "limsy_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_cases" ADD CONSTRAINT "limsy_cases_synopsis_generated_by_users_id_fk" FOREIGN KEY ("synopsis_generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_counsel_sessions" ADD CONSTRAINT "limsy_counsel_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_counsel_sessions" ADD CONSTRAINT "limsy_counsel_sessions_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_documents" ADD CONSTRAINT "limsy_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_documents" ADD CONSTRAINT "limsy_documents_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_frameworks" ADD CONSTRAINT "limsy_frameworks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_frameworks" ADD CONSTRAINT "limsy_frameworks_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_hearings" ADD CONSTRAINT "limsy_hearings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_hearings" ADD CONSTRAINT "limsy_hearings_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_orders" ADD CONSTRAINT "limsy_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_orders" ADD CONSTRAINT "limsy_orders_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_orders" ADD CONSTRAINT "limsy_orders_hearing_id_limsy_hearings_id_fk" FOREIGN KEY ("hearing_id") REFERENCES "public"."limsy_hearings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_parties" ADD CONSTRAINT "limsy_parties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_parties" ADD CONSTRAINT "limsy_parties_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_trials" ADD CONSTRAINT "limsy_trials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_trials" ADD CONSTRAINT "limsy_trials_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_war_room_messages" ADD CONSTRAINT "limsy_war_room_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_war_room_messages" ADD CONSTRAINT "limsy_war_room_messages_workspace_id_limsy_case_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."limsy_case_workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_war_room_messages" ADD CONSTRAINT "limsy_war_room_messages_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "limsy_war_room_messages" ADD CONSTRAINT "limsy_war_room_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_accounts" ADD CONSTRAINT "nidhivan_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_accounts" ADD CONSTRAINT "nidhivan_accounts_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_boq_items" ADD CONSTRAINT "nidhivan_boq_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_boq_items" ADD CONSTRAINT "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."nidhivan_boqs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_closes" ADD CONSTRAINT "nidhivan_closes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_closes" ADD CONSTRAINT "nidhivan_closes_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_counsel" ADD CONSTRAINT "nidhivan_counsel_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_counsel" ADD CONSTRAINT "nidhivan_counsel_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_entities" ADD CONSTRAINT "nidhivan_entities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_journals" ADD CONSTRAINT "nidhivan_journals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_journals" ADD CONSTRAINT "nidhivan_journals_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_journals" ADD CONSTRAINT "nidhivan_journals_reversal_of_nidhivan_journals_id_fk" FOREIGN KEY ("reversal_of") REFERENCES "public"."nidhivan_journals"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_lab" ADD CONSTRAINT "nidhivan_lab_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_projects" ADD CONSTRAINT "nidhivan_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_projects" ADD CONSTRAINT "nidhivan_projects_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_research" ADD CONSTRAINT "nidhivan_research_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

DO $$ BEGIN
  ALTER TABLE "nidhivan_research" ADD CONSTRAINT "nidhivan_research_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN others THEN RAISE NOTICE 'constraint skipped: %', SQLERRM; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
COMMIT;
-- ─────────────────────────────────────────────────────────────────────────────

-- POST-APPLY VERIFICATION
-- Run these queries after COMMIT to confirm state:

-- 1. Table count — expect 78
SELECT COUNT(*) AS table_count FROM pg_tables WHERE schemaname = 'public';

-- 2. Full table list — verify all 78 present
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 3. FK activation check — any skipped FKs mean a referenced base table is missing
SELECT
  conname        AS constraint_name,
  conrelid::regclass AS on_table,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN (
    'bms_assignments','bms_code_red_cases','bms_courses','bms_dns_records',
    'bms_enrollments','bms_host_containers','bms_learning_paths',
    'bms_lesson_progress','bms_lessons','bms_modules','bms_pendencies',
    'bms_release_evidence','bms_studio_addons','limsy_authorities',
    'limsy_case_workspaces','limsy_cases','limsy_counsel_sessions',
    'limsy_documents','limsy_frameworks','limsy_hearings','limsy_orders',
    'limsy_parties','limsy_trials','limsy_war_room_messages',
    'nidhivan_accounts','nidhivan_boq_items','nidhivan_boqs',
    'nidhivan_closes','nidhivan_counsel','nidhivan_dprs','nidhivan_entities',
    'nidhivan_financial_metrics','nidhivan_journals','nidhivan_lab',
    'nidhivan_projects','nidhivan_research'
  )
ORDER BY conrelid::regclass::text, conname;
-- Expected: 76 rows. Missing rows = FK skipped due to undefined_table.

-- 4. Column additions — verify course_id added
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'course_id'
  AND table_name IN ('bms_assessments','bms_case_submissions','bms_certificates')
ORDER BY table_name;
-- Expected: 3 rows
