CREATE TABLE "bms_pendencies" (
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
--> statement-breakpoint
CREATE TABLE "bms_release_evidence" (
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
--> statement-breakpoint
CREATE TABLE "builder_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Section' NOT NULL,
	"brand" text DEFAULT 'Shared' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'hero' NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"usage" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'stable' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builder_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"parent_id" integer,
	"name" text NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb,
	"theme" text DEFAULT 'aurora' NOT NULL,
	"artifact_kind" text DEFAULT 'website' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limsy_authorities" (
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
--> statement-breakpoint
CREATE TABLE "limsy_counsel_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer,
	"title" text DEFAULT 'Co-Counsel Session' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limsy_documents" (
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
--> statement-breakpoint
CREATE TABLE "limsy_frameworks" (
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
--> statement-breakpoint
CREATE TABLE "limsy_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"role" text DEFAULT 'claimant' NOT NULL,
	"name" text NOT NULL,
	"designation" text DEFAULT '' NOT NULL,
	"counsel" text DEFAULT '' NOT NULL,
	"standing" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limsy_trials" (
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
--> statement-breakpoint
CREATE TABLE "nidhivan_accounts" (
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
--> statement-breakpoint
CREATE TABLE "nidhivan_closes" (
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
--> statement-breakpoint
CREATE TABLE "nidhivan_counsel" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"entity_id" integer,
	"title" text DEFAULT 'Financial Co-Counsel' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_entities" (
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
--> statement-breakpoint
CREATE TABLE "nidhivan_journals" (
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
--> statement-breakpoint
CREATE TABLE "nidhivan_lab" (
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
--> statement-breakpoint
CREATE TABLE "nidhivan_research" (
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
--> statement-breakpoint
ALTER TABLE "bms_pendencies" ADD CONSTRAINT "bms_pendencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bms_release_evidence" ADD CONSTRAINT "bms_release_evidence_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_blocks" ADD CONSTRAINT "builder_blocks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_pages" ADD CONSTRAINT "builder_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_pages" ADD CONSTRAINT "builder_pages_project_id_bms_studio_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bms_studio_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_authorities" ADD CONSTRAINT "limsy_authorities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_authorities" ADD CONSTRAINT "limsy_authorities_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_counsel_sessions" ADD CONSTRAINT "limsy_counsel_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_counsel_sessions" ADD CONSTRAINT "limsy_counsel_sessions_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_documents" ADD CONSTRAINT "limsy_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_documents" ADD CONSTRAINT "limsy_documents_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_frameworks" ADD CONSTRAINT "limsy_frameworks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_frameworks" ADD CONSTRAINT "limsy_frameworks_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_parties" ADD CONSTRAINT "limsy_parties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_parties" ADD CONSTRAINT "limsy_parties_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_trials" ADD CONSTRAINT "limsy_trials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limsy_trials" ADD CONSTRAINT "limsy_trials_case_id_limsy_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_accounts" ADD CONSTRAINT "nidhivan_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_accounts" ADD CONSTRAINT "nidhivan_accounts_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_closes" ADD CONSTRAINT "nidhivan_closes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_closes" ADD CONSTRAINT "nidhivan_closes_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_counsel" ADD CONSTRAINT "nidhivan_counsel_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_counsel" ADD CONSTRAINT "nidhivan_counsel_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_entities" ADD CONSTRAINT "nidhivan_entities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_journals" ADD CONSTRAINT "nidhivan_journals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_journals" ADD CONSTRAINT "nidhivan_journals_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_journals" ADD CONSTRAINT "nidhivan_journals_reversal_of_nidhivan_journals_id_fk" FOREIGN KEY ("reversal_of") REFERENCES "public"."nidhivan_journals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_lab" ADD CONSTRAINT "nidhivan_lab_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_research" ADD CONSTRAINT "nidhivan_research_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_research" ADD CONSTRAINT "nidhivan_research_entity_id_nidhivan_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."nidhivan_entities"("id") ON DELETE set null ON UPDATE no action;