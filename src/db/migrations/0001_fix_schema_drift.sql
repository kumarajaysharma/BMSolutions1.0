-- ─────────────────────────────────────────────────────────────────────────────
-- Actual Schema Drift Fixes
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "ai_tasks" ADD COLUMN "title" text DEFAULT 'Untitled Task' NOT NULL;
ALTER TABLE "builder_components" ADD COLUMN "name" text DEFAULT 'component' NOT NULL;
ALTER TABLE "builder_components" ADD COLUMN "config" jsonb;
ALTER TABLE "client_requests" ADD COLUMN "tenant_id" integer DEFAULT 1 NOT NULL;
ALTER TABLE "client_requests" ADD COLUMN "subject" text DEFAULT 'Client Inquiry' NOT NULL;
ALTER TABLE "environments" ADD COLUMN "type" text DEFAULT 'production' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "tenant_id" integer DEFAULT 1 NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "candidate_name" text DEFAULT '' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "phone" text;
ALTER TABLE "job_applications" ADD COLUMN "position" text DEFAULT '' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "resume_url" text;
ALTER TABLE "job_applications" ADD COLUMN "cover_letter" text;
ALTER TABLE "sessions" ADD COLUMN "token" text DEFAULT '' NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Missing Foreign Key Constraints
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
 ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;