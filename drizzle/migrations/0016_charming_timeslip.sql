CREATE TYPE "public"."bms_document_status" AS ENUM('DRAFT', 'GENERATING', 'REVIEW_PENDING', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."bms_document_type" AS ENUM('MOU', 'BSD', 'SLA', 'MANAGED_SERVICES_CONTRACT', 'ENTERPRISE_ARCHITECTURE', 'HLD', 'LLD', 'SPEC_GENERATIVE', 'SECURITY_ATP', 'TEST_PROCEDURES', 'VALIDATION_PROCEDURES', 'BUILD_REPORT', 'LAUNCH_ATP', 'PROJECT_CLOSURE', 'DPR', 'BOQ_CPWD', 'LEGAL_FRAMEWORK', 'FINANCIAL_MODEL', 'CORPORATE_CHARTER');--> statement-breakpoint
CREATE TABLE "bms_ai_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"description" text NOT NULL,
	"model" text DEFAULT 'claude-sonnet-4-6' NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"system_prompt" text,
	"color" text DEFAULT 'from-violet-500 to-purple-600' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"autonomy_level" integer DEFAULT 3 NOT NULL,
	"success_rate" numeric(5, 2) DEFAULT '94.50' NOT NULL,
	"runs_count" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"course" text NOT NULL,
	"vertical" text DEFAULT 'Agentic AI' NOT NULL,
	"description" text NOT NULL,
	"prompt" text NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rubric" text,
	"max_score" integer DEFAULT 100 NOT NULL,
	"due_in_days" integer DEFAULT 7 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"score" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_code_red_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"vertical" text NOT NULL,
	"business_unit" text DEFAULT 'BMSolutions' NOT NULL,
	"problem" text NOT NULL,
	"solution" text NOT NULL,
	"agents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"impact" text NOT NULL,
	"metric" text DEFAULT '' NOT NULL,
	"roi_multiple" numeric(6, 2) DEFAULT '3.00' NOT NULL,
	"payback_months" integer DEFAULT 9 NOT NULL,
	"complexity" text DEFAULT 'Medium' NOT NULL,
	"effort_weeks" integer DEFAULT 10 NOT NULL,
	"priority" text DEFAULT 'P1' NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"architecture" text DEFAULT 'hub-spoke' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"category" text DEFAULT 'Agentic AI' NOT NULL,
	"level" text DEFAULT 'Beginner' NOT NULL,
	"duration_hours" integer DEFAULT 8 NOT NULL,
	"thumbnail_gradient" text DEFAULT 'from-indigo-600 via-violet-600 to-fuchsia-600' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"instructor_id" integer,
	"rating" numeric(3, 1) DEFAULT '4.8' NOT NULL,
	"enrollments_count" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_dns_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"site_slug" text NOT NULL,
	"type" text DEFAULT 'A' NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"ttl" integer DEFAULT 3600 NOT NULL,
	"proxied" boolean DEFAULT true NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"author_id" integer,
	"title" text NOT NULL,
	"document_type" "bms_document_type" NOT NULL,
	"status" "bms_document_status" DEFAULT 'DRAFT' NOT NULL,
	"phase" integer NOT NULL,
	"artifact_key" text NOT NULL,
	"raw_markdown" text,
	"content" jsonb DEFAULT '{}'::jsonb,
	"scope_snapshot" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"progress" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_gates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"owner" text DEFAULT 'पंडित अजय शर्मा' NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_host_containers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"site_slug" text NOT NULL,
	"image" text DEFAULT 'bms/site-runtime:latest' NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"port" integer DEFAULT 10000 NOT NULL,
	"region" text DEFAULT 'ap-south-1' NOT NULL,
	"cpu_limit" numeric(4, 2) DEFAULT '1.0' NOT NULL,
	"mem_limit_mb" integer DEFAULT 512 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_learning_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"level" text DEFAULT 'Beginner' NOT NULL,
	"estimated_weeks" integer DEFAULT 6 NOT NULL,
	"gradient" text DEFAULT 'from-cyan-500 to-blue-600' NOT NULL,
	"icon" text DEFAULT 'route' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bms_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'video' NOT NULL,
	"duration_minutes" integer DEFAULT 15 NOT NULL,
	"content" text,
	"video_url" text,
	"code_starter" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_studio_addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"addon_id" text NOT NULL,
	"kind" text DEFAULT 'skill' NOT NULL,
	"custom" boolean DEFAULT false NOT NULL,
	"installed" boolean DEFAULT true NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now(),
	"installed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bms_studio_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"gradient" text DEFAULT 'from-ink-900 to-amber-900' NOT NULL,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"api_routes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"workflows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deployments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"domain" jsonb DEFAULT '{"subdomain":"","customDomain":"","ssl":"none"}'::jsonb NOT NULL,
	"product" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"schema_code" text DEFAULT '' NOT NULL,
	"framework" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" jsonb DEFAULT '{"primary":"from-ink-900 to-amber-900","accent":"from-amber-600 to-orange-800","radius":"2xl","fontScale":100}'::jsonb NOT NULL,
	"tables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"env_vars" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"plan" jsonb DEFAULT '{"tier":"Pro","seats":5,"bandwidth":"12 GB"}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bms_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'Multi-Agent' NOT NULL,
	"difficulty" text DEFAULT 'Intermediate' NOT NULL,
	"estimated_minutes" integer DEFAULT 90 NOT NULL,
	"gradient" text DEFAULT 'from-emerald-500 to-teal-600' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"agents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ALTER COLUMN "contingency_pct" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ALTER COLUMN "contingency_pct" SET DEFAULT '5.00';--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ALTER COLUMN "overhead_pct" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ALTER COLUMN "overhead_pct" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ALTER COLUMN "gst_pct" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ALTER COLUMN "gst_pct" SET DEFAULT '18.00';--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ALTER COLUMN "contingency_pct" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ALTER COLUMN "contingency_pct" SET DEFAULT '5.00';--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ALTER COLUMN "overhead_pct" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ALTER COLUMN "overhead_pct" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "synopsis" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "synopsis_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "synopsis_generated_by" integer;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "estimated_fees_paise" bigint;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "billed_amount_paise" bigint;--> statement-breakpoint
ALTER TABLE "limsy_orders" ADD COLUMN "cost_amount_paise" bigint;--> statement-breakpoint
ALTER TABLE "bms_ai_agents" ADD CONSTRAINT "bms_ai_agents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_ai_agents" ADD CONSTRAINT "bms_ai_agents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_assignments" ADD CONSTRAINT "bms_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_code_red_cases" ADD CONSTRAINT "bms_code_red_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_courses" ADD CONSTRAINT "bms_courses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_courses" ADD CONSTRAINT "bms_courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_dns_records" ADD CONSTRAINT "bms_dns_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_documents" ADD CONSTRAINT "bms_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_documents" ADD CONSTRAINT "bms_documents_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_enrollments" ADD CONSTRAINT "bms_enrollments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_enrollments" ADD CONSTRAINT "bms_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_enrollments" ADD CONSTRAINT "bms_enrollments_course_id_bms_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bms_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_gates" ADD CONSTRAINT "bms_gates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_host_containers" ADD CONSTRAINT "bms_host_containers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_learning_paths" ADD CONSTRAINT "bms_learning_paths_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_lesson_progress" ADD CONSTRAINT "bms_lesson_progress_lesson_id_bms_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."bms_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_lessons" ADD CONSTRAINT "bms_lessons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_lessons" ADD CONSTRAINT "bms_lessons_module_id_bms_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."bms_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_modules" ADD CONSTRAINT "bms_modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_modules" ADD CONSTRAINT "bms_modules_course_id_bms_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."bms_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_studio_addons" ADD CONSTRAINT "bms_studio_addons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_studio_projects" ADD CONSTRAINT "bms_studio_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_workflows" ADD CONSTRAINT "bms_workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_workflows" ADD CONSTRAINT "bms_workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD CONSTRAINT "limsy_cases_synopsis_generated_by_users_id_fk" FOREIGN KEY ("synopsis_generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD CONSTRAINT "limsy_cases_parent_case_id_limsy_cases_id_fk" FOREIGN KEY ("parent_case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_orders" ADD CONSTRAINT "limsy_orders_appeal_case_id_limsy_cases_id_fk" FOREIGN KEY ("appeal_case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" DROP COLUMN "candidate_name";--> statement-breakpoint
ALTER TABLE "limsy_cases" DROP COLUMN "estimated_fees";--> statement-breakpoint
ALTER TABLE "limsy_cases" DROP COLUMN "billed_amount";--> statement-breakpoint
ALTER TABLE "limsy_orders" DROP COLUMN "cost_amount";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "token";