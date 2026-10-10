ALTER TABLE "bms_courses" ADD COLUMN "thumbnail_gradient" text;--> statement-breakpoint
ALTER TABLE "bms_courses" ADD COLUMN "rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "bms_dns_records" ADD COLUMN "site_slug" text;--> statement-breakpoint
ALTER TABLE "bms_enrollments" ADD COLUMN "last_accessed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bms_lessons" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bms_modules" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bms_studio_addons" ADD COLUMN "addon_id" integer;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "case_number" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "internal_ref" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "case_type" text DEFAULT 'civil' NOT NULL;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "status" text DEFAULT 'intake' NOT NULL;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "court_level" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "court_name" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "court_location" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "petitioner" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "respondent" text;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "urgency_flag" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "next_hearing_date" date;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "filing_date" date;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "admission_date" date;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "priority_level" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "parent_case_id" integer;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "hearing_number" text;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "scheduled_date" date;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "actual_date" date;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "court_room" text;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "adjournment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "adjournment_reason" text;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "adjourned_by" text;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "limsy_hearings" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "limsy_orders" ADD COLUMN "order_title" text;--> statement-breakpoint
ALTER TABLE "limsy_orders" ADD COLUMN "crypto_hash" text;--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD COLUMN "item_number" text;--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD COLUMN "section_code" text;--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD COLUMN "is_section_header" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD COLUMN "rate_ref" text;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD COLUMN "dpr_id" integer;--> statement-breakpoint
ALTER TABLE "limsy_cases" ADD CONSTRAINT "limsy_cases_parent_case_id_limsy_cases_id_fk" FOREIGN KEY ("parent_case_id") REFERENCES "public"."limsy_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk" FOREIGN KEY ("dpr_id") REFERENCES "public"."nidhivan_dprs"("id") ON DELETE no action ON UPDATE no action;