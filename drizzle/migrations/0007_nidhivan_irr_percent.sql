CREATE TYPE "public"."nidhivan_boq_status" AS ENUM('draft', 'approved', 'revision_required', 'finalized');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_dpr_status" AS ENUM('draft', 'under_review', 'approved', 'submitted', 'returned', 'archived');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_period_type" AS ENUM('monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_project_status" AS ENUM('conceptual', 'dpr_preparation', 'dpr_submitted', 'appraisal', 'sanctioned', 'in_progress', 'completed', 'abandoned', 'archived');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_project_type" AS ENUM('infrastructure', 'housing', 'water_sanitation', 'energy', 'transport', 'healthcare', 'education', 'agriculture', 'industrial', 'urban_development', 'rural_development', 'digital', 'environment', 'other');--> statement-breakpoint
CREATE TABLE "nidhivan_boq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"boq_id" integer NOT NULL,
	"item_number" integer NOT NULL,
	"section_code" text,
	"is_section_header" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"unit" text,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"unit_rate_paise" bigint DEFAULT 0 NOT NULL,
	"amount_paise" bigint DEFAULT 0 NOT NULL,
	"rate_ref" text,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_boqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"dpr_id" integer NOT NULL,
	"boq_version" integer DEFAULT 1 NOT NULL,
	"boq_number" text NOT NULL,
	"title" text NOT NULL,
	"status" "nidhivan_boq_status" DEFAULT 'draft' NOT NULL,
	"base_amount_paise" bigint DEFAULT 0 NOT NULL,
	"contingency_pct" real DEFAULT 5 NOT NULL,
	"contingency_amount_paise" bigint DEFAULT 0 NOT NULL,
	"overhead_pct" real DEFAULT 0 NOT NULL,
	"overhead_amount_paise" bigint DEFAULT 0 NOT NULL,
	"gst_pct" real DEFAULT 18 NOT NULL,
	"gst_amount_paise" bigint DEFAULT 0 NOT NULL,
	"total_amount_paise" bigint DEFAULT 0 NOT NULL,
	"base_year" text,
	"rate_schedule_ref" text,
	"approval_date" timestamp with time zone,
	"document_links" jsonb,
	"crypto_hash" text,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_dprs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"dpr_version" integer DEFAULT 1 NOT NULL,
	"dpr_number" text NOT NULL,
	"title" text NOT NULL,
	"financial_year" text NOT NULL,
	"status" "nidhivan_dpr_status" DEFAULT 'draft' NOT NULL,
	"total_project_cost_paise" bigint DEFAULT 0 NOT NULL,
	"central_share_paise" bigint DEFAULT 0 NOT NULL,
	"state_share_paise" bigint DEFAULT 0 NOT NULL,
	"beneficiary_share_paise" bigint DEFAULT 0 NOT NULL,
	"loan_paise" bigint DEFAULT 0 NOT NULL,
	"cost_basis_year" text,
	"contingency_pct" real DEFAULT 5 NOT NULL,
	"overhead_pct" real DEFAULT 0 NOT NULL,
	"sections" jsonb DEFAULT '{}',
	"consultant_name" text,
	"prepared_by" text,
	"submitted_to" text,
	"approval_authority" text,
	"approval_ref" text,
	"approval_date" timestamp with time zone,
	"document_links" jsonb,
	"crypto_hash" text,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_financial_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"reporting_period" text NOT NULL,
	"period_type" "nidhivan_period_type" DEFAULT 'monthly' NOT NULL,
	"funds_released_central_paise" bigint DEFAULT 0 NOT NULL,
	"funds_released_state_paise" bigint DEFAULT 0 NOT NULL,
	"funds_released_beneficiary_paise" bigint DEFAULT 0 NOT NULL,
	"expenditure_cumulative_paise" bigint DEFAULT 0 NOT NULL,
	"expenditure_this_period_paise" bigint DEFAULT 0 NOT NULL,
	"balance_available_paise" bigint DEFAULT 0 NOT NULL,
	"physical_progress_pct" integer DEFAULT 0 NOT NULL,
	"financial_progress_pct" integer DEFAULT 0 NOT NULL,
	"projected_irr_percent" numeric(5, 2),
	"remarks" text,
	"reported_by" integer NOT NULL,
	"reported_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_code" text NOT NULL,
	"project_title" text NOT NULL,
	"project_type" "nidhivan_project_type" NOT NULL,
	"sector" text NOT NULL,
	"subsector" text,
	"implementing_agency" text NOT NULL,
	"sponsoring_authority" text,
	"project_state" text NOT NULL,
	"project_district" text,
	"project_location" text,
	"total_cost_paise" bigint DEFAULT 0 NOT NULL,
	"central_share_paise" bigint DEFAULT 0 NOT NULL,
	"state_share_paise" bigint DEFAULT 0 NOT NULL,
	"beneficiary_share_paise" bigint DEFAULT 0 NOT NULL,
	"loan_paise" bigint DEFAULT 0 NOT NULL,
	"funding_agencies" jsonb,
	"status" "nidhivan_project_status" DEFAULT 'conceptual' NOT NULL,
	"urgency_flag" boolean DEFAULT false NOT NULL,
	"priority_level" integer DEFAULT 3 NOT NULL,
	"appraisal_date" timestamp with time zone,
	"sanction_date" timestamp with time zone,
	"commencement_date" timestamp with time zone,
	"target_completion_date" timestamp with time zone,
	"actual_completion_date" timestamp with time zone,
	"project_scope" text,
	"objectives" text,
	"outcomes" text,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD CONSTRAINT "nidhivan_boq_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD CONSTRAINT "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."nidhivan_boqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk" FOREIGN KEY ("dpr_id") REFERENCES "public"."nidhivan_dprs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_projects" ADD CONSTRAINT "nidhivan_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nidhivan_boq_items_tenant_boq_idx" ON "nidhivan_boq_items" USING btree ("tenant_id","boq_id");--> statement-breakpoint
CREATE INDEX "nidhivan_boqs_tenant_dpr_idx" ON "nidhivan_boqs" USING btree ("tenant_id","dpr_id");--> statement-breakpoint
CREATE INDEX "nidhivan_dprs_tenant_project_idx" ON "nidhivan_dprs" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "nidhivan_financial_metrics_tenant_project_idx" ON "nidhivan_financial_metrics" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "nidhivan_projects_tenant_idx" ON "nidhivan_projects" USING btree ("tenant_id");