DO $$ BEGIN
  CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected', 'onboarded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."tenant_plan" AS ENUM('pilot', 'starter', 'professional', 'scale', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "client_requests" DROP CONSTRAINT IF EXISTS "client_requests_tenant_id_tenants_id_fk";
--> statement-breakpoint
-- Safely drop default and alter status column using text casting to prevent type mismatch errors
ALTER TABLE "client_requests" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "client_requests" ALTER COLUMN "status" SET DATA TYPE "public"."request_status" USING "status"::text::"public"."request_status";
--> statement-breakpoint
ALTER TABLE "client_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."request_status";
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'starter'::"public"."tenant_plan";
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DATA TYPE "public"."tenant_plan" USING "plan"::"public"."tenant_plan";
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "idempotency_key" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "company_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "contact_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "contact_email" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "contact_phone" text;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "requested_plan" "tenant_plan" DEFAULT 'starter' NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "subsidiary" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "message" text;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "processed_by" integer;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "processed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "provisioned_tenant_id" integer;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "handled_by_tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_price_id" text;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp with time zone;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_provisioned_tenant_id_tenants_id_fk" FOREIGN KEY ("provisioned_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_handled_by_tenant_id_tenants_id_fk" FOREIGN KEY ("handled_by_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "tenant_id";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "name";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "email";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "company";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "service";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "preferred_date";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "preferred_time";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "notes";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "subject";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP CONSTRAINT IF EXISTS "client_requests_idempotency_key_unique";
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_idempotency_key_unique" UNIQUE("idempotency_key");
--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "tenants_stripe_customer_id_unique";
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_stripe_customer_id_unique" UNIQUE("stripe_customer_id");
--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "tenants_stripe_subscription_id_unique";
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");