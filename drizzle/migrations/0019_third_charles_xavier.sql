CREATE TABLE IF NOT EXISTS "bms_academies" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_initial" text DEFAULT '' NOT NULL,
	"accent_color" text DEFAULT '#C9A84C' NOT NULL,
	"category" text DEFAULT 'management' NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"is_partner" boolean DEFAULT false NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "slug" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "tagline" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "logo_initial" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "accent_color" text DEFAULT '#C9A84C' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'management' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "is_partner" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "sort_index" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_academies" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_assessment_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"assessment_id" integer NOT NULL,
	"user_id" integer,
	"cohort_id" integer,
	"attempt_num" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"score" integer,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"feedback" text DEFAULT '' NOT NULL,
	"graded_by" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"graded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "assessment_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "cohort_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "attempt_num" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'in_progress' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "score" integer;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "answers" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "feedback" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "graded_by" integer;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bms_assessment_attempts" ADD COLUMN IF NOT EXISTS "graded_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"track_id" integer,
	"title" text NOT NULL,
	"kind" text DEFAULT 'quiz' NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"time_limit_min" integer,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb,
	"rubric" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "track_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'quiz' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "passing_score" integer DEFAULT 70 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "time_limit_min" integer;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "max_attempts" integer DEFAULT 3 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "questions" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "rubric" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_assessments" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_case_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"assessment_id" integer,
	"user_id" integer,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"rubric_scores" jsonb DEFAULT '{}'::jsonb,
	"total_score" integer,
	"feedback" text DEFAULT '' NOT NULL,
	"graded_by" integer,
	"submitted_at" timestamp with time zone,
	"graded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "assessment_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "body" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "rubric_scores" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "total_score" integer;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "feedback" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "graded_by" integer;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "graded_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bms_case_submissions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer,
	"academy_id" integer,
	"recipient_name" text NOT NULL,
	"recipient_email" text NOT NULL,
	"title" text NOT NULL,
	"credential_id" text NOT NULL,
	"verification_hash" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"level" text DEFAULT 'completion' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "bms_certificates_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "academy_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "recipient_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "recipient_email" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "credential_id" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "verification_hash" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "issued_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "level" text DEFAULT 'completion' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_certificates" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_cohort_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"cohort_id" integer NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'participant' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "cohort_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "email" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'participant' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohort_members" ADD COLUMN IF NOT EXISTS "joined_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_cohorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"track_id" integer,
	"status" text DEFAULT 'forming' NOT NULL,
	"delivery_mode" text DEFAULT 'online_live' NOT NULL,
	"max_size" integer DEFAULT 30 NOT NULL,
	"sponsor" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"start_date" text DEFAULT '' NOT NULL,
	"end_date" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "code" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "track_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'forming' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "delivery_mode" text DEFAULT 'online_live' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "max_size" integer DEFAULT 30 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "sponsor" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "location" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "start_date" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "end_date" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_cohorts" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_delivery_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"cohort_id" integer,
	"track_id" integer,
	"title" text NOT NULL,
	"mode" text DEFAULT 'online_live' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"facilitator" text DEFAULT '' NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"meeting_url" text DEFAULT '' NOT NULL,
	"broadcast_url" text DEFAULT '' NOT NULL,
	"max_attendees" integer DEFAULT 50 NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_min" integer DEFAULT 120 NOT NULL,
	"agenda" jsonb DEFAULT '[]'::jsonb,
	"recording_url" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "cohort_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "track_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "mode" text DEFAULT 'online_live' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'scheduled' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "facilitator" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "venue" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "meeting_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "broadcast_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "max_attendees" integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp with time zone NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "duration_min" integer DEFAULT 120 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "agenda" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "recording_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "notes" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_delivery_sessions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"context" text DEFAULT 'general' NOT NULL,
	"context_id" integer,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"author_id" integer,
	"author_name" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "context" text DEFAULT 'general' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "context_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "body" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "author_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "author_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "reply_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_discussions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_executive_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"academy_id" integer,
	"name" text NOT NULL,
	"tool_key" text NOT NULL,
	"category" text DEFAULT 'strategy' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"template" jsonb DEFAULT '{}'::jsonb,
	"icon" text DEFAULT '◈' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "academy_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "tool_key" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'strategy' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "instructions" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "template" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT '◈' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "sort_index" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_executive_tools" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_lab_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"lab_id" integer NOT NULL,
	"user_id" integer,
	"cohort_id" integer,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_sec" integer,
	"score" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "lab_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "cohort_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'not_started' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "duration_sec" integer;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "score" integer;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "evidence" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "notes" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_lab_runs" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_labs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"track_id" integer,
	"title" text NOT NULL,
	"lab_type" text DEFAULT 'sandbox' NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb,
	"instructions" text DEFAULT '' NOT NULL,
	"environment" text DEFAULT 'browser' NOT NULL,
	"stack" text DEFAULT '' NOT NULL,
	"verify_cmd" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "track_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "lab_type" text DEFAULT 'sandbox' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "difficulty" text DEFAULT 'beginner' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "duration_min" integer DEFAULT 60 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "objectives" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "instructions" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "environment" text DEFAULT 'browser' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "stack" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "verify_cmd" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "sort_index" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_labs" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_masterclasses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"academy_id" integer,
	"title" text NOT NULL,
	"speaker" text NOT NULL,
	"speaker_bio" text DEFAULT '' NOT NULL,
	"topic" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"meeting_url" text DEFAULT '' NOT NULL,
	"replay_url" text DEFAULT '' NOT NULL,
	"max_seats" integer DEFAULT 500 NOT NULL,
	"registered" integer DEFAULT 0 NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "academy_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "speaker" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "speaker_bio" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "topic" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'upcoming' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp with time zone NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "duration_min" integer DEFAULT 60 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "meeting_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "replay_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "max_seats" integer DEFAULT 500 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "registered" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "tags" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_masterclasses" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_media_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"series" text DEFAULT '' NOT NULL,
	"episode" integer DEFAULT 1 NOT NULL,
	"season" integer DEFAULT 1 NOT NULL,
	"kind" text DEFAULT 'show' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"synopsis" text DEFAULT '' NOT NULL,
	"hosts" text DEFAULT '' NOT NULL,
	"runtime_min" integer DEFAULT 30 NOT NULL,
	"thumbnail_url" text DEFAULT '' NOT NULL,
	"stream_url" text DEFAULT '' NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"air_date" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "series" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "episode" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "season" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'show' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "synopsis" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "hosts" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "runtime_min" integer DEFAULT 30 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "thumbnail_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "stream_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "tags" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "air_date" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_media_programs" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"phase" integer DEFAULT 1 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb,
	"duration_days" integer DEFAULT 5 NOT NULL,
	"mode" text DEFAULT 'blended' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "code" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "objectives" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "duration_days" integer DEFAULT 5 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "mode" text DEFAULT 'blended' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_tracks" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bms_user_tool_saves" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"tool_id" integer NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"content_data" jsonb DEFAULT '{}'::jsonb,
	"is_shared" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "tool_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "content_data" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "is_shared" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "bms_user_tool_saves" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "limsy_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"designation" text DEFAULT '' NOT NULL,
	"organisation" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'advocate' NOT NULL,
	"bar_number" text DEFAULT '' NOT NULL,
	"court" text DEFAULT '' NOT NULL,
	"jurisdiction" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "designation" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "organisation" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'advocate' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "bar_number" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "court" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "jurisdiction" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "email" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "phone" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "notes" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_contacts" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "limsy_document_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'pleading' NOT NULL,
	"jurisdiction" text DEFAULT 'Supreme Court of India' NOT NULL,
	"case_type" text DEFAULT 'general' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"placeholders" jsonb DEFAULT '[]'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'pleading' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "jurisdiction" text DEFAULT 'Supreme Court of India' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "case_type" text DEFAULT 'general' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "body" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "placeholders" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_document_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "limsy_user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"default_view" text DEFAULT 'docket' NOT NULL,
	"notification_prefs" jsonb DEFAULT '{}'::jsonb,
	"keyboard_shortcuts" jsonb DEFAULT '{}'::jsonb,
	"language" text DEFAULT 'en' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "theme" text DEFAULT 'dark' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "sidebar_collapsed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "default_view" text DEFAULT 'docket' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "keyboard_shortcuts" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_user_preferences" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "limsy_workflow_blueprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"jurisdiction" text DEFAULT 'Supreme Court of India' NOT NULL,
	"case_type" text DEFAULT 'slp' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"triggers" jsonb DEFAULT '[]'::jsonb,
	"estimated_duration_days" integer DEFAULT 180 NOT NULL,
	"is_template" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "jurisdiction" text DEFAULT 'Supreme Court of India' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "case_type" text DEFAULT 'slp' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "steps" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "triggers" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "estimated_duration_days" integer DEFAULT 180 NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;
--> statement-breakpoint
ALTER TABLE "limsy_workflow_blueprints" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_academies" ADD CONSTRAINT "bms_academies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessment_attempts" ADD CONSTRAINT "bms_assessment_attempts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessment_attempts" ADD CONSTRAINT "bms_assessment_attempts_assessment_id_bms_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."bms_assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessment_attempts" ADD CONSTRAINT "bms_assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessment_attempts" ADD CONSTRAINT "bms_assessment_attempts_cohort_id_bms_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."bms_cohorts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessment_attempts" ADD CONSTRAINT "bms_assessment_attempts_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessments" ADD CONSTRAINT "bms_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_assessments" ADD CONSTRAINT "bms_assessments_track_id_bms_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."bms_tracks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_case_submissions" ADD CONSTRAINT "bms_case_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_case_submissions" ADD CONSTRAINT "bms_case_submissions_assessment_id_bms_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."bms_assessments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_case_submissions" ADD CONSTRAINT "bms_case_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_case_submissions" ADD CONSTRAINT "bms_case_submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_certificates" ADD CONSTRAINT "bms_certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_certificates" ADD CONSTRAINT "bms_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_certificates" ADD CONSTRAINT "bms_certificates_academy_id_bms_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."bms_academies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_cohort_members" ADD CONSTRAINT "bms_cohort_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_cohort_members" ADD CONSTRAINT "bms_cohort_members_cohort_id_bms_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."bms_cohorts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_cohort_members" ADD CONSTRAINT "bms_cohort_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_cohorts" ADD CONSTRAINT "bms_cohorts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_cohorts" ADD CONSTRAINT "bms_cohorts_track_id_bms_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."bms_tracks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_delivery_sessions" ADD CONSTRAINT "bms_delivery_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_delivery_sessions" ADD CONSTRAINT "bms_delivery_sessions_cohort_id_bms_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."bms_cohorts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_delivery_sessions" ADD CONSTRAINT "bms_delivery_sessions_track_id_bms_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."bms_tracks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_discussions" ADD CONSTRAINT "bms_discussions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_discussions" ADD CONSTRAINT "bms_discussions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_executive_tools" ADD CONSTRAINT "bms_executive_tools_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_executive_tools" ADD CONSTRAINT "bms_executive_tools_academy_id_bms_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."bms_academies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_lab_runs" ADD CONSTRAINT "bms_lab_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_lab_runs" ADD CONSTRAINT "bms_lab_runs_lab_id_bms_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."bms_labs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_lab_runs" ADD CONSTRAINT "bms_lab_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_lab_runs" ADD CONSTRAINT "bms_lab_runs_cohort_id_bms_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."bms_cohorts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_labs" ADD CONSTRAINT "bms_labs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_labs" ADD CONSTRAINT "bms_labs_track_id_bms_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."bms_tracks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_masterclasses" ADD CONSTRAINT "bms_masterclasses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_masterclasses" ADD CONSTRAINT "bms_masterclasses_academy_id_bms_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."bms_academies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_media_programs" ADD CONSTRAINT "bms_media_programs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_tracks" ADD CONSTRAINT "bms_tracks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_user_tool_saves" ADD CONSTRAINT "bms_user_tool_saves_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_user_tool_saves" ADD CONSTRAINT "bms_user_tool_saves_tool_id_bms_executive_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."bms_executive_tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "bms_user_tool_saves" ADD CONSTRAINT "bms_user_tool_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "limsy_contacts" ADD CONSTRAINT "limsy_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "limsy_document_templates" ADD CONSTRAINT "limsy_document_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "limsy_user_preferences" ADD CONSTRAINT "limsy_user_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "limsy_user_preferences" ADD CONSTRAINT "limsy_user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;--> statement-breakpoint
DO $idempotent$ BEGIN
  ALTER TABLE "limsy_workflow_blueprints" ADD CONSTRAINT "limsy_workflow_blueprints_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN SQLSTATE '42710' THEN NULL;
  WHEN SQLSTATE '42P07' THEN NULL;
END $idempotent$;