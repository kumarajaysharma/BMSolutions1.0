/**
 * src/db/schema.ts
 * BNLV Group Enterprise Schema — Final Consolidated Platform
 * Sprint: Phase C Go-Live | Target: 57 Core Tables (0019 + 0020 + 0016 + 0017 + 0018)
 */

import {
  pgTable, serial, text, timestamp, integer, boolean, jsonb,
  pgEnum, uniqueIndex, numeric, varchar, bigint, real, date
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// ─── TYPE HELPERS ────────────────────────────────────────────

type JsonRecord = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS (Consolidated Core)
// ─────────────────────────────────────────────────────────────────────────────

export const tenantPlanEnum = pgEnum('tenant_plan', ['pilot', 'starter', 'professional', 'scale', 'enterprise']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected', 'onboarded']);

export const bmsDocumentTypeEnum = pgEnum('bms_document_type', [
  // Phase 1 — Commercial Inception
  'MOU', 'BSD', 'SLA', 'MANAGED_SERVICES_CONTRACT',
  // Phase 2 — Architecture & Design
  'ENTERPRISE_ARCHITECTURE', 'HLD', 'LLD', 'SPEC_GENERATIVE',
  // Phase 3 — Security, QA
  'SECURITY_ATP', 'TEST_PROCEDURES', 'VALIDATION_PROCEDURES',
  // Phase 4 — Launch & Closure
  'BUILD_REPORT', 'LAUNCH_ATP', 'PROJECT_CLOSURE',
  // Consolidated Subsidiary Types
  'DPR', 'BOQ_CPWD', 'LEGAL_FRAMEWORK', 'FINANCIAL_MODEL', 'CORPORATE_CHARTER',
]);

export const bmsDocumentStatusEnum = pgEnum('bms_document_status', [
  'DRAFT', 'GENERATING', 'REVIEW_PENDING', 'PUBLISHED', 'ARCHIVED',
]);

// ─────────────────────────────────────────────────────────────────────────────
// 1. CORE PLATFORM TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: tenantPlanEnum("plan").notNull().default("starter"),
  status: text("status").notNull().default("active"),
  region: text("region").notNull().default("ap-south-1"),

  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull().default(""),
  role: text("role").notNull().default("developer"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    tenantEmailUnique: uniqueIndex("users_tenant_email_uidx").on(table.tenantId, table.email)
  };
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().default(""),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const environments = pgTable("environments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("production"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  environmentId: integer("environment_id").notNull().references(() => environments.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  status: text("status").notNull().default("success"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiTasks = pgTable("ai_tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone"),
  position: text("position").notNull().default(""),
  roleSlug: text("role_slug").notNull().default("general"),
  roleTitle: text("role_title").notNull().default("General"),
  portfolio: text("portfolio"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  note: text("note"),
  status: text("status").notNull().default("applied"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const builderComponents = pgTable("builder_components", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("component"),
  type: text("type").notNull().default("default"),
  sortOrder: integer("sort_order").notNull().default(0),
  config: jsonb("config"),
  props: jsonb("props"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientRequests = pgTable('client_requests', {
  id: serial('id').primaryKey(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  companyName: text('company_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  requestedPlan: tenantPlanEnum('requested_plan').notNull().default('starter'),
  subsidiary: text('subsidiary').notNull(),
  message: text('message'),
  status: requestStatusEnum('status').notNull().default('pending'),
  processedBy: integer('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  provisionedTenantId: integer('provisioned_tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  handledByTenantId: integer('handled_by_tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prefix: text("prefix").notNull().default(""),
  keyHash: text("key_hash").notNull(),
  scopes: jsonb("scopes"),
  rateLimit: integer("rate_limit").notNull().default(1000),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  description: text("description"),
  rollout: jsonb("rollout"),
  environments: jsonb("environments"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vaultSecrets = pgTable("vault_secrets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("secret"),
  key: text("key").notNull().default(""),
  encryptedValue: text("encrypted_value").notNull().default(""),
  maskedValue: text("masked_value"),
  environment: text("environment").notNull().default("production"),
  version: integer("version").notNull().default(1),
  rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: jsonb("events"),
  signingSecretHash: text("signing_secret_hash"),
  deliveries: integer("deliveries").notNull().default(0),
  status: text("status").notNull().default("active"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  severity: text("severity").notNull().default("info"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


// ─────────────────────────────────────────────────────────────────────────────
// 2. AI AGENTS & WORKFLOWS
// ─────────────────────────────────────────────────────────────────────────────

export const bmsAiAgents = pgTable("bms_ai_agents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description").notNull(),
  model: text("model").notNull().default("claude-sonnet-4-6"),
  tools: jsonb("tools").$type<string[]>().notNull().default([]),
  systemPrompt: text("system_prompt"),
  color: text("color").notNull().default("from-violet-500 to-purple-600"),
  status: text("status").notNull().default("active"),
  autonomyLevel: integer("autonomy_level").notNull().default(3),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).notNull().default("94.50"),
  runsCount: integer("runs_count").notNull().default(0),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bmsWorkflows = pgTable("bms_workflows", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Multi-Agent"),
  difficulty: text("difficulty").notNull().default("Intermediate"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(90),
  gradient: text("gradient").notNull().default("from-emerald-500 to-teal-600"),
  steps: jsonb("steps").$type<Record<string, unknown>[]>().notNull().default([]),
  agents: jsonb("agents").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("published"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


// ─────────────────────────────────────────────────────────────────────────────
// 3. BUILDER, STUDIO & DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const bmsStudioProjects = pgTable("bms_studio_projects", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  status: text("status").notNull().default("draft"),
  description: text("description").notNull().default(""),
  gradient: text("gradient").notNull().default("from-ink-900 to-amber-900"),
  pages: jsonb("pages").$type<Record<string, unknown>[]>().notNull().default([]),
  apiRoutes: jsonb("api_routes").$type<Record<string, unknown>[]>().notNull().default([]),
  workflows: jsonb("workflows").$type<Record<string, unknown>[]>().notNull().default([]),
  deployments: jsonb("deployments").$type<Record<string, unknown>[]>().notNull().default([]),
  domain: jsonb("domain").$type<{ subdomain: string; customDomain: string; ssl: string }>().notNull().default({ subdomain: "", customDomain: "", ssl: "none" }),
  product: jsonb("product").$type<Record<string, unknown>>().notNull().default({}),
  schemaCode: text("schema_code").notNull().default(""),
  framework: jsonb("framework").$type<Record<string, unknown>>().notNull().default({}),
  theme: jsonb("theme").$type<{ primary: string; accent: string; radius: string; fontScale: number }>().notNull().default({ primary: "from-ink-900 to-amber-900", accent: "from-amber-600 to-orange-800", radius: "2xl", fontScale: 100 }),
  tables: jsonb("tables").$type<Record<string, unknown>[]>().notNull().default([]),
  envVars: jsonb("env_vars").$type<Record<string, unknown>[]>().notNull().default([]),
  plan: jsonb("plan").$type<{ tier: string; seats: number; bandwidth: string }>().notNull().default({ tier: "Pro", seats: 5, bandwidth: "12 GB" }),
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const builderPages = pgTable('builder_pages', {
  id:           serial('id').primaryKey(),
  tenantId:     integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:    integer('project_id').references(() => bmsStudioProjects.id, { onDelete: 'set null' }),
  parentId:     integer('parent_id'),       // self-ref FK added in migration SQL
  name:         text('name').notNull(),
  path:         text('path').notNull().default('/'),
  status:       text('status').notNull().default('draft'),
  blocks:       jsonb('blocks').$type<Record<string, unknown>[]>().default([]),
  theme:        text('theme').notNull().default('aurora'),
  artifactKind: text('artifact_kind').notNull().default('website'),
  sortIndex:    integer('sort_index').notNull().default(0),
  version:      integer('version').notNull().default(1),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const builderBlocks = pgTable('builder_blocks', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name:        text('name').notNull(),
  category:    text('category').notNull().default('Section'),
  brand:       text('brand').notNull().default('Shared'),
  description: text('description').notNull().default(''),
  kind:        text('kind').notNull().default('hero'),
  tags:        text('tags').notNull().default(''),
  usage:       integer('usage').notNull().default(0),
  status:      text('status').notNull().default('stable'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsDocuments = pgTable('bms_documents', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  documentType: bmsDocumentTypeEnum('document_type').notNull(),
  status: bmsDocumentStatusEnum('status').notNull().default('DRAFT'),
  phase: integer('phase').notNull(),
  artifactKey: text('artifact_key').notNull(),
  rawMarkdown: text('raw_markdown'),
  content: jsonb('content')
    .$type<{
      blocks?: Array<{
        type: 'heading' | 'paragraph' | 'table' | 'list' | 'code';
        level?: number;
        text?: string;
        headers?: string[];
        rows?: string[][];
        items?: string[];
        lang?: string;
      }>;
    }>()
    .default({}),
  scopeSnapshot: jsonb('scope_snapshot')
    .$type<Record<string, string>>()
    .default({}),
  metadata: jsonb('metadata')
    .$type<{
      modelRouting?: string;
      generationPrompt?: string;
      financialRatios?: Record<string, number>;
      cpwdRegionCode?: string;
      clientIndustry?: string;
      phase?: number;
      artifactKey?: string;
    }>()
    .default({}),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 4. AGENTIC BOOTCAMP (MIGRATION 0019 MERGED)
// ═══════════════════════════════════════════════════════════════

export const bmsTracks = pgTable('bms_tracks', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  phase: integer('phase').notNull().default(1),
  description: text('description').notNull().default(''),
  objectives: jsonb('objectives').$type<string[]>().default([]),
  durationDays: integer('duration_days').notNull().default(5),
  mode: text('mode').notNull().default('blended'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsLabs = pgTable('bms_labs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  trackId: integer('track_id').references(() => bmsTracks.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  labType: text('lab_type').notNull().default('sandbox'),
  difficulty: text('difficulty').notNull().default('beginner'),
  durationMin: integer('duration_min').notNull().default(60),
  description: text('description').notNull().default(''),
  objectives: jsonb('objectives').$type<string[]>().default([]),
  instructions: text('instructions').notNull().default(''),
  environment: text('environment').notNull().default('browser'),
  stack: text('stack').notNull().default(''),
  verifyCmd: text('verify_cmd').notNull().default(''),
  status: text('status').notNull().default('published'),
  sortIndex: integer('sort_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsCohorts = pgTable('bms_cohorts', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  trackId: integer('track_id').references(() => bmsTracks.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('forming'),
  deliveryMode: text('delivery_mode').notNull().default('online_live'),
  maxSize: integer('max_size').notNull().default(30),
  sponsor: text('sponsor').notNull().default(''),
  location: text('location').notNull().default(''),
  startDate: text('start_date').notNull().default(''),
  endDate: text('end_date').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsLabRuns = pgTable('bms_lab_runs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  labId: integer('lab_id').notNull().references(() => bmsLabs.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  cohortId: integer('cohort_id').references((): any => bmsCohorts.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('not_started'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationSec: integer('duration_sec'),
  score: integer('score'),
  attempts: integer('attempts').notNull().default(0),
  evidence: jsonb('evidence').$type<Record<string, unknown>>().default({}),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsCohortMembers = pgTable('bms_cohort_members', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  cohortId: integer('cohort_id').notNull().references(() => bmsCohorts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('participant'),
  status: text('status').notNull().default('active'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsAssessments = pgTable('bms_assessments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  trackId: integer('track_id').references(() => bmsTracks.id, { onDelete: 'set null' }),
  courseId: integer('course_id'),
  title: text('title').notNull(),
  kind: text('kind').notNull().default('quiz'),
  passingScore: integer('passing_score').notNull().default(70),
  timeLimitMin: integer('time_limit_min'),
  maxAttempts: integer('max_attempts').notNull().default(3),
  questions: jsonb('questions').$type<unknown[]>().default([]),
  rubric: jsonb('rubric').$type<Record<string, unknown>>().default({}),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsAssessmentAttempts = pgTable('bms_assessment_attempts', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  assessmentId: integer('assessment_id').notNull().references(() => bmsAssessments.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  cohortId: integer('cohort_id').references(() => bmsCohorts.id, { onDelete: 'set null' }),
  attemptNum: integer('attempt_num').notNull().default(1),
  status: text('status').notNull().default('in_progress'),
  score: integer('score'),
  answers: jsonb('answers').$type<Record<string, unknown>>().default({}),
  feedback: text('feedback').notNull().default(''),
  gradedBy: integer('graded_by').references(() => users.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
});

export const bmsDeliverySessions = pgTable('bms_delivery_sessions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  cohortId: integer('cohort_id').references(() => bmsCohorts.id, { onDelete: 'set null' }),
  trackId: integer('track_id').references(() => bmsTracks.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  mode: text('mode').notNull().default('online_live'),
  status: text('status').notNull().default('scheduled'),
  facilitator: text('facilitator').notNull().default(''),
  venue: text('venue').notNull().default(''),
  meetingUrl: text('meeting_url').notNull().default(''),
  broadcastUrl: text('broadcast_url').notNull().default(''),
  maxAttendees: integer('max_attendees').notNull().default(50),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMin: integer('duration_min').notNull().default(120),
  agenda: jsonb('agenda').$type<unknown[]>().default([]),
  recordingUrl: text('recording_url').notNull().default(''),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 5. BMS LEARNING MANAGEMENT SYSTEM (MIGRATION 0013)
// ═══════════════════════════════════════════════════════════════

export const bmsCourses = pgTable('bms_courses', {
  id:             serial('id').primaryKey(),
  tenantId:       integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  academyId:      integer('academy_id'),   // FK → bmsAcademies; bare integer — bmsAcademies declared after this table (forward-ref guard)
  title:          text('title').notNull(),
  slug:           text('slug').notNull(),
  description:    text('description').notNull().default(''),
  level:          text('level').notNull().default('beginner'),
  category:       text('category').notNull().default('management'),
  durationHours:  integer('duration_hours').notNull().default(10),
  // ADR-004: price in paise
  pricePaise:     bigint('price_paise', { mode: 'number' }).notNull().default(0),
  currency:       text('currency').notNull().default('INR'),
  instructorId:   integer('instructor_id').references(() => users.id, { onDelete: 'set null' }),
  instructorName: text('instructor_name').notNull().default(''),
  status:         text('status').notNull().default('draft'),
  thumbnailUrl:   text('thumbnail_url').notNull().default(''),
  tags:           text('tags').notNull().default(''),
  sortIndex:      integer('sort_index').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  thumbnailGradient: text('thumbnail_gradient'),
  rating:         numeric('rating', { precision: 3, scale: 2 }),
});

export const bmsModules = pgTable('bms_modules', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  courseId:    integer('course_id').notNull().references(() => bmsCourses.id, { onDelete: 'cascade' }),
  title:       text('title').notNull(),
  description: text('description').notNull().default(''),
  sortIndex:   integer('sort_index').notNull().default(0),
  status:      text('status').notNull().default('published'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  orderIndex:  integer('order_index').notNull().default(0),
});

export const bmsLessons = pgTable('bms_lessons', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  moduleId:    integer('module_id').notNull().references(() => bmsModules.id, { onDelete: 'cascade' }),
  title:       text('title').notNull(),
  kind:        text('kind').notNull().default('video'),
  content:     text('content').notNull().default(''),
  videoUrl:    text('video_url').notNull().default(''),
  durationMin: integer('duration_min').notNull().default(10),
  sortIndex:   integer('sort_index').notNull().default(0),
  isFree:      boolean('is_free').notNull().default(false),
  status:      text('status').notNull().default('published'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  orderIndex:  integer('order_index').notNull().default(0),
});

export const bmsEnrollments = pgTable('bms_enrollments', {
  id:                   serial('id').primaryKey(),
  tenantId:             integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  courseId:             integer('course_id').notNull().references(() => bmsCourses.id, { onDelete: 'cascade' }),
  userId:               integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status:               text('status').notNull().default('active'),
  enrolledAt:           timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt:          timestamp('completed_at', { withTimezone: true }),
  progress:             integer('progress').notNull().default(0),
  certificationIssued:  boolean('certification_issued').notNull().default(false),
  lastAccessedAt:       timestamp('last_accessed_at', { withTimezone: true }),
});

export const bmsLessonProgress = pgTable('bms_lesson_progress', {
  id:           serial('id').primaryKey(),
  tenantId:     integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  lessonId:     integer('lesson_id').notNull().references(() => bmsLessons.id, { onDelete: 'cascade' }),
  userId:       integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  enrollmentId: integer('enrollment_id').references(() => bmsEnrollments.id, { onDelete: 'cascade' }),
  status:       text('status').notNull().default('not_started'),
  watchedSec:   integer('watched_sec').notNull().default(0),
  completedAt:  timestamp('completed_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsAssignments = pgTable('bms_assignments', {
  id:           serial('id').primaryKey(),
  tenantId:     integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  courseId:     integer('course_id').references(() => bmsCourses.id, { onDelete: 'set null' }),
  moduleId:     integer('module_id').references(() => bmsModules.id, { onDelete: 'set null' }),
  title:        text('title').notNull(),
  description:  text('description').notNull().default(''),
  kind:         text('kind').notNull().default('submission'),
  dueInDays:    integer('due_in_days').notNull().default(7),
  maxScore:     integer('max_score').notNull().default(100),
  passingScore: integer('passing_score').notNull().default(60),
  instructions: text('instructions').notNull().default(''),
  rubric:       jsonb('rubric').$type<Record<string, unknown>>().default({}),
  status:       text('status').notNull().default('published'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsLearningPaths = pgTable('bms_learning_paths', {
  id:             serial('id').primaryKey(),
  tenantId:       integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  academyId:      integer('academy_id'),   // FK → bmsAcademies; bare integer — forward-ref guard
  title:          text('title').notNull(),
  slug:           text('slug').notNull(),
  description:    text('description').notNull().default(''),
  level:          text('level').notNull().default('intermediate'),
  courses:        jsonb('courses').$type<number[]>().default([]),
  durationHours:  integer('duration_hours').notNull().default(40),
  status:         text('status').notNull().default('published'),
  sortIndex:      integer('sort_index').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 6. EXECUTIVE LMS (MIGRATION 0019 MERGED)
// ═══════════════════════════════════════════════════════════════

export const bmsAcademies = pgTable('bms_academies', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  tagline: text('tagline').notNull().default(''),
  description: text('description').notNull().default(''),
  logoInitial: text('logo_initial').notNull().default(''),
  accentColor: text('accent_color').notNull().default('#C9A84C'),
  category: text('category').notNull().default('management'),
  country: text('country').notNull().default('India'),
  isPartner: boolean('is_partner').notNull().default(false),
  sortIndex: integer('sort_index').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsCertificates = pgTable('bms_certificates', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  courseId: integer('course_id'),
  academyId: integer('academy_id').references(() => bmsAcademies.id, { onDelete: 'set null' }),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  title: text('title').notNull(),
  credentialId: text('credential_id').notNull().unique(),
  verificationHash: text('verification_hash').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  level: text('level').notNull().default('completion'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
});

export const bmsCaseSubmissions = pgTable('bms_case_submissions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  assessmentId: integer('assessment_id').references(() => bmsAssessments.id, { onDelete: 'set null' }),
  courseId: integer('course_id'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  attachments: jsonb('attachments').$type<unknown[]>().default([]),
  status: text('status').notNull().default('draft'),
  rubricScores: jsonb('rubric_scores').$type<Record<string, number>>().default({}),
  totalScore: integer('total_score'),
  feedback: text('feedback').notNull().default(''),
  gradedBy: integer('graded_by').references(() => users.id, { onDelete: 'set null' }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsExecutiveTools = pgTable('bms_executive_tools', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  academyId: integer('academy_id').references(() => bmsAcademies.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  toolKey: text('tool_key').notNull(),
  category: text('category').notNull().default('strategy'),
  description: text('description').notNull().default(''),
  instructions: text('instructions').notNull().default(''),
  template: jsonb('template').$type<Record<string, unknown>>().default({}),
  icon: text('icon').notNull().default('◈'),
  status: text('status').notNull().default('published'),
  sortIndex: integer('sort_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsUserToolSaves = pgTable('bms_user_tool_saves', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  toolId: integer('tool_id').notNull().references(() => bmsExecutiveTools.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  contentData: jsonb('content_data').$type<Record<string, unknown>>().default({}),
  isShared: boolean('is_shared').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsMasterclasses = pgTable('bms_masterclasses', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  academyId: integer('academy_id').references(() => bmsAcademies.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  speaker: text('speaker').notNull(),
  speakerBio: text('speaker_bio').notNull().default(''),
  topic: text('topic').notNull().default(''),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('upcoming'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMin: integer('duration_min').notNull().default(60),
  meetingUrl: text('meeting_url').notNull().default(''),
  replayUrl: text('replay_url').notNull().default(''),
  maxSeats: integer('max_seats').notNull().default(500),
  registered: integer('registered').notNull().default(0),
  tags: text('tags').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsMediaPrograms = pgTable('bms_media_programs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  series: text('series').notNull().default(''),
  episode: integer('episode').notNull().default(1),
  season: integer('season').notNull().default(1),
  kind: text('kind').notNull().default('show'),
  status: text('status').notNull().default('draft'),
  synopsis: text('synopsis').notNull().default(''),
  hosts: text('hosts').notNull().default(''),
  runtimeMin: integer('runtime_min').notNull().default(30),
  thumbnailUrl: text('thumbnail_url').notNull().default(''),
  streamUrl: text('stream_url').notNull().default(''),
  tags: text('tags').notNull().default(''),
  airDate: text('air_date').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsDiscussions = pgTable('bms_discussions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  context: text('context').notNull().default('general'),
  contextId: integer('context_id'),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  status: text('status').notNull().default('open'),
  replyCount: integer('reply_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});


// ═══════════════════════════════════════════════════════════════
// 7. BMS STUDIO HOSTING (MIGRATION 0014)
// ═══════════════════════════════════════════════════════════════

export const bmsDnsRecords = pgTable('bms_dns_records', {
  id:         serial('id').primaryKey(),
  tenantId:   integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:  integer('project_id').references(() => bmsStudioProjects.id, { onDelete: 'cascade' }),
  recordType: text('record_type').notNull().default('A'),
  name:       text('name').notNull(),
  value:      text('value').notNull(),
  ttl:        integer('ttl').notNull().default(300),
  status:     text('status').notNull().default('pending'),
  provider:   text('provider').notNull().default('cloudflare'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  siteSlug:   text('site_slug'),
});

export const bmsHostContainers = pgTable('bms_host_containers', {
  id:         serial('id').primaryKey(),
  tenantId:   integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:  integer('project_id').references(() => bmsStudioProjects.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  image:      text('image').notNull().default(''),
  region:     text('region').notNull().default('ap-south-1'),
  status:     text('status').notNull().default('provisioning'),
  cpu:        text('cpu').notNull().default('0.5'),
  memory:     text('memory').notNull().default('512Mi'),
  envVars:    jsonb('env_vars').$type<Record<string, string>>().default({}),
  healthUrl:  text('health_url').notNull().default(''),
  startedAt:  timestamp('started_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsStudioAddons = pgTable('bms_studio_addons', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:   integer('project_id').references(() => bmsStudioProjects.id, { onDelete: 'cascade' }),
  addonKey:    text('addon_key').notNull(),
  name:        text('name').notNull(),
  category:    text('category').notNull().default('integration'),
  config:      jsonb('config').$type<Record<string, unknown>>().default({}),
  status:      text('status').notNull().default('active'),
  installedAt: timestamp('installed_at', { withTimezone: true }).defaultNow().notNull(),
  addonId:     integer('addon_id'),
});

// ═══════════════════════════════════════════════════════════════
// 8. BMS OPS INTELLIGENCE (MIGRATION 0015)
// ═══════════════════════════════════════════════════════════════

export const bmsCodeRedCases = pgTable('bms_code_red_cases', {
  id:               serial('id').primaryKey(),
  tenantId:         integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  title:            text('title').notNull(),
  severity:         text('severity').notNull().default('critical'),
  status:           text('status').notNull().default('open'),
  category:         text('category').notNull().default('incident'),
  description:      text('description').notNull().default(''),
  impactedSystems:  jsonb('impacted_systems').$type<string[]>().default([]),
  commander:        text('commander').notNull().default(''),
  commanderId:      integer('commander_id').references(() => users.id, { onDelete: 'set null' }),
  timeline:         jsonb('timeline').$type<Array<{ at: string; actor: string; action: string }>>().default([]),
  resolution:       text('resolution').notNull().default(''),
  detectedAt:       timestamp('detected_at', { withTimezone: true }).notNull(),
  resolvedAt:       timestamp('resolved_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 9. OPERATIONS & NIDHIVAN FINANCE (MIGRATION 0018 UPDATE)
// ═══════════════════════════════════════════════════════════════

export const bmsPendencies = pgTable('bms_pendencies', {
  id:               serial('id').primaryKey(),
  tenantId:         integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  title:            text('title').notNull(),
  detail:           text('detail').notNull().default(''),
  category:         text('category').notNull().default('security'),
  severity:         text('severity').notNull().default('medium'),
  status:           text('status').notNull().default('open'),
  owner:            text('owner').notNull().default(''),
  environment:      text('environment').notNull().default('development'),
  remediation:      text('remediation').notNull().default(''),
  targetRelease:    text('target_release').notNull().default(''),
  blocksProduction: boolean('blocks_production').notNull().default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bmsReleaseEvidence = pgTable('bms_release_evidence', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  version:     text('version').notNull(),
  environment: text('environment').notNull().default('evaluation'),
  decision:    text('decision').notNull().default('blocked'),
  actor:       text('actor').notNull(),
  notes:       text('notes').notNull().default(''),
  passed:      integer('passed').notNull().default(0),
  warnings:    integer('warnings').notNull().default(0),
  failures:    integer('failures').notNull().default(0),
  blockers:    integer('blockers').notNull().default(0),
  snapshot:    jsonb('snapshot').$type<Record<string, unknown>>().default({}),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanEntities = pgTable('nidhivan_entities', {
  id:           serial('id').primaryKey(),
  tenantId:     integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name:         text('name').notNull(),
  ticker:       text('ticker').notNull().default(''),
  sector:       text('sector').notNull().default('Financials'),
  country:      text('country').notNull().default('India'),
  status:       text('status').notNull().default('active'),
  relationship: text('relationship').notNull().default('advisory'),
  fyEnd:        text('fy_end').notNull().default('31 March'),
  currency:     text('currency').notNull().default('INR'),
  // ADR-004: bigint in paise — application divides by 100 for display (₹)
  aumPaise:     bigint('aum_paise', { mode: 'number' }).notNull().default(0),
  revenuePaise: bigint('revenue_paise', { mode: 'number' }).notNull().default(0),
  notes:        text('notes').notNull().default(''),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanAccounts = pgTable('nidhivan_accounts', {
  id:       serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  entityId: integer('entity_id').notNull().references(() => nidhivanEntities.id, { onDelete: 'cascade' }),
  code:     text('code').notNull(),
  name:     text('name').notNull(),
  type:     text('type').notNull().default('asset'),
  subtype:  text('subtype').notNull().default(''),
  currency: text('currency').notNull().default('INR'),
  active:   boolean('active').notNull().default(true),
});

export const nidhivanJournals = pgTable('nidhivan_journals', {
  id:         serial('id').primaryKey(),
  tenantId:   integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  entityId:   integer('entity_id').notNull().references(() => nidhivanEntities.id, { onDelete: 'cascade' }),
  ref:        text('ref').notNull(),
  date:       text('date').notNull().default(''),
  memo:       text('memo').notNull().default(''),
  source:     text('source').notNull().default('manual'),
  status:     text('status').notNull().default('draft'),
  // ADR-004: lines[].debit and lines[].credit MUST be in paise at application layer
  lines:      jsonb('lines').$type<Array<{
    accountId: number;
    debit:     number; // paise
    credit:    number; // paise
    memo:      string;
  }>>().default([]),
  reversalOf: integer('reversal_of').references((): any => nidhivanJournals.id, { onDelete: 'set null' }),
  createdBy:  text('created_by').notNull().default('studio'),
  postedBy:   text('posted_by').notNull().default(''),
  postedAt:   timestamp('posted_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanResearch = pgTable('nidhivan_research', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  title:       text('title').notNull(),
  desk:        text('desk').notNull().default('equity'),
  entityId:    integer('entity_id').references(() => nidhivanEntities.id, { onDelete: 'set null' }),
  status:      text('status').notNull().default('draft'),
  thesis:      text('thesis').notNull().default(''),
  body:        text('body').notNull().default(''),
  rating:      text('rating').notNull().default('hold'),
  author:      text('author').notNull().default('Nidhivan Desk'),
  publishedOn: text('published_on').notNull().default(''),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanLab = pgTable('nidhivan_lab', {
  id:         serial('id').primaryKey(),
  tenantId:   integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name:       text('name').notNull(),
  stage:      text('stage').notNull().default('ideation'),
  domain:     text('domain').notNull().default('payments'),
  hypothesis: text('hypothesis').notNull().default(''),
  outcome:    text('outcome').notNull().default(''),
  owner:      text('owner').notNull().default(''),
  spendPaise: bigint('spend_paise', { mode: 'number' }).notNull().default(0), // ADR-004
  status:     text('status').notNull().default('active'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanCounsel = pgTable('nidhivan_counsel', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  entityId:  integer('entity_id').references(() => nidhivanEntities.id, { onDelete: 'set null' }),
  title:     text('title').notNull().default('Financial Co-Counsel'),
  messages:  jsonb('messages').$type<Array<{
    role:      'user' | 'assistant';
    content:   string;
    timestamp: string;
  }>>().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanCloses = pgTable('nidhivan_closes', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  entityId:  integer('entity_id').notNull().references(() => nidhivanEntities.id, { onDelete: 'cascade' }),
  period:    text('period').notNull(),
  status:    text('status').notNull().default('open'),
  checklist: jsonb('checklist').$type<Array<{
    task:  string;
    done:  boolean;
    owner: string;
  }>>().default([]),
  owner:     text('owner').notNull().default(''),
  notes:     text('notes').notNull().default(''),
  lockedBy:  text('locked_by').notNull().default(''),
  lockedAt:  timestamp('locked_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 10. NIDHIVAN BOQ & CAPITAL PROJECTS (MIGRATION 0020+)
// ═══════════════════════════════════════════════════════════════

export const nidhivanProjects = pgTable('nidhivan_projects', {
  id:                serial('id').primaryKey(),
  tenantId:          integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  entityId:          integer('entity_id').references(() => nidhivanEntities.id, { onDelete: 'set null' }),
  name:              text('name').notNull(),
  projectCode:       text('project_code').notNull().default(''),
  category:          text('category').notNull().default('infrastructure'),
  status:            text('status').notNull().default('planning'),
  // ADR-004: monetary values in paise
  totalBudgetPaise:  bigint('total_budget_paise', { mode: 'number' }).notNull().default(0),
  spentPaise:        bigint('spent_paise', { mode: 'number' }).notNull().default(0),
  location:          text('location').notNull().default(''),
  startDate:         text('start_date').notNull().default(''),
  endDate:           text('end_date').notNull().default(''),
  metadata:          jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  // ── Aiyyo-Nidhi Extension (migration 0023) ──────────────────────────────────
  // jurisdiction: ISO-3166 alpha-3 ('IND' | 'USA' | 'GBR' | 'CAN')
  jurisdiction:            text('jurisdiction').notNull().default('IND'),
  // currencyCode: ISO-4217 — monetary columns remain in paise; this tag drives
  // conversion for cross-currency reporting (ADR-004 multi-currency extension)
  currencyCode:            text('currency_code').notNull().default('INR'),
  measurementSystem:       text('measurement_system').notNull().default('METRIC'),
  // taxProfileId: FK → nidhivan_tax_profiles (forward ref — defined in section 11)
  taxProfileId:            integer('tax_profile_id').references((): any => nidhivanTaxProfiles.id, { onDelete: 'set null' }),
  placeOfSupplyStateCode:  text('place_of_supply_state_code').notNull().default(''),
  originStateCode:         text('origin_state_code').notNull().default(''),
  // GST routing: place_of_supply_state_code !== origin_state_code → IGST; else CGST+SGST
  applyItTds194c:          boolean('apply_it_tds_194c').notNull().default(true),
  applyGstTds:             boolean('apply_gst_tds').notNull().default(false),
  applyLaborCess:          boolean('apply_labor_cess').notNull().default(true),
  billingAdapterType:      text('billing_adapter_type').notNull().default('PERIODIC_RA'),
  // ── VANTAI VT-N-001 DPDP DPA tracking (migration 0024) ─────────────────────
  // DPDP Act 2023, S.4(1)(b): Data Fiduciary must have lawful basis before processing.
  // Administrator sets vtN001DpaSigned=TRUE via PATCH /api/nidhivan/projects/:id after
  // verifying a signed DPA document exists. vtN001DpaReference must be supplied.
  vtN001DpaSigned:         boolean('vt_n001_dpa_signed').notNull().default(false),
  vtN001DpaSignedAt:       timestamp('vt_n001_dpa_signed_at', { withTimezone: true }),
  vtN001DpaReference:      text('vt_n001_dpa_reference'),
});

export const nidhivanBoqs = pgTable('nidhivan_boqs', {
  id:               serial('id').primaryKey(),
  tenantId:         integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:        integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  title:            text('title').notNull(),
  revision:         integer('revision').notNull().default(1),
  status:           text('status').notNull().default('draft'),
  currency:         text('currency').notNull().default('INR'),
  // ADR-004: total in paise
  totalAmountPaise: bigint('total_amount_paise', { mode: 'number' }).notNull().default(0),
  notes:            text('notes').notNull().default(''),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  dprId:            integer('dpr_id').references(() => nidhivanDprs.id),
  // ── Aiyyo-Nidhi Extension (migration 0023) ──────────────────────────────────
  jurisdiction:         text('jurisdiction').notNull().default('IND'),
  billingAdapterType:   text('billing_adapter_type').notNull().default('PERIODIC_RA'),
});

export const nidhivanBoqItems = pgTable('nidhivan_boq_items', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  boqId:       integer('boq_id').notNull().references(() => nidhivanBoqs.id, { onDelete: 'cascade' }),
  slNo:        integer('sl_no').notNull().default(1),
  description: text('description').notNull(),
  unit:        text('unit').notNull().default('LS'),
  quantity:    real('quantity').notNull().default(1),
  // ADR-004: monetary in paise
  ratePaise:   bigint('rate_paise', { mode: 'number' }).notNull().default(0),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull().default(0),
  category:    text('category').notNull().default('civil'),
  cpwdSorCode: text('cpwd_sor_code').notNull().default(''),
  itemNumber:      text('item_number'),
  sectionCode:     text('section_code'),
  isSectionHeader: boolean('is_section_header').notNull().default(false),
  rateRef:         text('rate_ref'),
  // ── Aiyyo-Nidhi Extension (migration 0023) ──────────────────────────────────
  classificationCodeId: integer('classification_code_id').references((): any => nidhivanClassificationCodes.id, { onDelete: 'set null' }),
  rateAuthorityId:      integer('rate_authority_id').references((): any => nidhivanRateAuthorities.id, { onDelete: 'set null' }),
  currencyCode:         text('currency_code').notNull().default('INR'),
  locationFactorId:     integer('location_factor_id').references((): any => nidhivanLocationFactors.id, { onDelete: 'set null' }),
  sorYear:              text('sor_year').notNull().default(''),
});

export const nidhivanFinancialMetrics = pgTable('nidhivan_financial_metrics', {
  id:                     serial('id').primaryKey(),
  tenantId:               integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  entityId:               integer('entity_id').notNull().references(() => nidhivanEntities.id, { onDelete: 'cascade' }),
  period:                 text('period').notNull(), // e.g. '2026-Q1', '2025-FY'
  metricType:             text('metric_type').notNull().default('quarterly'),
  // ADR-004: all monetary in paise
  revenuePaise:           bigint('revenue_paise', { mode: 'number' }).notNull().default(0),
  ebitdaPaise:            bigint('ebitda_paise', { mode: 'number' }).notNull().default(0),
  patPaise:               bigint('pat_paise', { mode: 'number' }).notNull().default(0),
  totalAssetsPaise:       bigint('total_assets_paise', { mode: 'number' }).notNull().default(0),
  totalLiabilitiesPaise:  bigint('total_liabilities_paise', { mode: 'number' }).notNull().default(0),
  ratios:                 jsonb('ratios').$type<Record<string, number>>().default({}),
  source:                 text('source').notNull().default('manual'),
  createdAt:              timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nidhivanDprs = pgTable('nidhivan_dprs', {
  id:                     serial('id').primaryKey(),
  tenantId:               integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:              integer('project_id').references(() => nidhivanProjects.id, { onDelete: 'set null' }),
  entityId:               integer('entity_id').references(() => nidhivanEntities.id, { onDelete: 'set null' }),
  title:                  text('title').notNull(),
  dprCode:                text('dpr_code').notNull().default(''),
  status:                 text('status').notNull().default('draft'),
  version:                integer('version').notNull().default(1),
  // ADR-004: total project cost in paise
  totalProjectCostPaise: bigint('total_project_cost_paise', { mode: 'number' }).notNull().default(0),
  sections:               jsonb('sections').$type<Record<string, unknown>>().default({}),
  approvedBy:             text('approved_by').notNull().default(''),
  approvedAt:             timestamp('approved_at', { withTimezone: true }),
  createdAt:              timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 11. AIYYO-NIDHI FINANCIAL ENGINE (MIGRATION 0023)
// ═══════════════════════════════════════════════════════════════
// BNLV-COUNCIL-002 Phase 2 | 2026-10-16
//
// Q1 — Global Federated Classification & Rate Registry (7 tables)
// Q2 — Tax Engine: Mixed GST Portfolio + RA Bills (3 tables)
// Q3 — Maker-Checker-Approver 4-Eyes Approval Engine (3 tables)
// Q4 — Milestone Gates + Project Advances (2 tables)
// Q5 — ICAI CoA + Double-Entry Ledger + Tally Export (4 tables)
//
// ⚠  ADR-001 PRE-CONDITION (Gary Sobers Red Team):
//    DATABASE_URL must use studio_app credentials (not neondb_owner).
//    neondb_owner carries BYPASSRLS=TRUE — all RLS below is nullified.
//    Verify `postgres://studio_app:...` prefix in Vercel + .env.local
//    before any Aiyyo-Nidhi financial data is written to production.
//
// ADR-004: All monetary columns = BIGINT paise (₹1 = 100 paise).
//          No DECIMAL / FLOAT for money anywhere.
// ADR-006: Anthropic ONLY for financial/legal/DPDP AI routes.
//          Gemini/GPT-4o/DeepSeek PROHIBITED for all VANTAI actions.
// ═══════════════════════════════════════════════════════════════

// ─── 11.1  ENUMS ────────────────────────────────────────────────

// billing_type: PERIODIC (interim RA), MILESTONE (gate-linked), FINAL
export const nidhivanBillingTypeEnum = pgEnum('nidhivan_billing_type', [
  'PERIODIC', 'MILESTONE', 'FINAL',
]);

// RA bill lifecycle — VANTAI gates enforce transitions
export const nidhivanRaBillStatusEnum = pgEnum('nidhivan_ra_bill_status', [
  'DRAFT', 'SUBMITTED', 'UNDER_CHECK', 'CERTIFIED',
  'APPROVED_FOR_PAYMENT', 'PAID', 'REJECTED',
]);

// approval_action: append-only audit record per maker/checker/approver action
export const nidhivanApprovalActionEnum = pgEnum('nidhivan_approval_action', [
  'SUBMITTED', 'L1_APPROVED', 'L2_APPROVED', 'L3_APPROVED',
  'L4_APPROVED', 'REJECTED', 'RECALLED',
]);

// advance_type: MOBILISATION (upfront) | SECURED_MATERIAL (materials at site)
export const nidhivanAdvanceTypeEnum = pgEnum('nidhivan_advance_type', [
  'MOBILISATION', 'SECURED_MATERIAL',
]);

export const nidhivanAdvanceStatusEnum = pgEnum('nidhivan_advance_status', [
  'PENDING', 'SANCTIONED', 'DISBURSED',
  'PARTIALLY_RECOVERED', 'FULLY_RECOVERED', 'LAPSED',
]);

// ICAI account classification (5-element framework)
export const nidhivanAccountTypeEnum = pgEnum('nidhivan_account_type', [
  'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE',
]);

// journal_voucher_type maps to Tally Prime Voucher Type
export const nidhivanVoucherTypeEnum = pgEnum('nidhivan_voucher_type', [
  'JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA',
  'DEBIT_NOTE', 'CREDIT_NOTE', 'RA_BILL_BOOKING',
]);

// Tally export queue state machine
export const nidhivanSyncStatusEnum = pgEnum('nidhivan_sync_status', [
  'PENDING', 'EXPORTED', 'FAILED', 'ACKNOWLEDGED',
]);

// ─── 11.2  Q1 — CLASSIFICATION & RATE REGISTRY ─────────────────

// Global Federated Classification Registry
// Supports: CPWD_DSR | CSI_MASTERFORMAT | RICS_NRM2 | CESMM4 | CUSTOM_CLIENT_WBS
// tenant_id IS NULL = global system visible to all tenants (RLS NULL-aware policy)
export const nidhivanClassificationSystems = pgTable('nidhivan_classification_systems', {
  id:                serial('id').primaryKey(),
  tenantId:          integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  systemCode:        text('system_code').notNull(),
  displayName:       text('display_name').notNull(),
  jurisdiction:      text('jurisdiction').notNull().default('GLOBAL'),
  measurementSystem: text('measurement_system').notNull().default('METRIC'),
  description:       text('description').notNull().default(''),
  isActive:          boolean('is_active').notNull().default(true),
  isGlobal:          boolean('is_global').notNull().default(false),
  version:           text('version').notNull().default(''),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Hierarchical classification codes (self-referencing adjacency list)
// parent_id = null → root node; is_leaf = true → postable (rate schedule can attach)
export const nidhivanClassificationCodes = pgTable('nidhivan_classification_codes', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  systemId:    integer('system_id').notNull().references(() => nidhivanClassificationSystems.id, { onDelete: 'restrict' }),
  parentId:    integer('parent_id').references((): AnyPgColumn => nidhivanClassificationCodes.id, { onDelete: 'set null' }),
  codeValue:   text('code_value').notNull(),
  fullCode:    text('full_code').notNull().default(''),
  description: text('description').notNull(),
  shortDesc:   text('short_desc').notNull().default(''),
  unit:        text('unit').notNull().default(''),
  level:       integer('level').notNull().default(1),
  isLeaf:      boolean('is_leaf').notNull().default(true),
  isActive:    boolean('is_active').notNull().default(true),
  metadata:    jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Rate-issuing authorities: e.g. CPWD_DSR_2023, RICS_NRM2_2022, CLIENT_CUSTOM
export const nidhivanRateAuthorities = pgTable('nidhivan_rate_authorities', {
  id:            serial('id').primaryKey(),
  tenantId:      integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  systemId:      integer('system_id').notNull().references(() => nidhivanClassificationSystems.id, { onDelete: 'restrict' }),
  authorityCode: text('authority_code').notNull(),
  displayName:   text('display_name').notNull(),
  jurisdiction:  text('jurisdiction').notNull().default('IND'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo:   date('effective_to'),
  description:   text('description').notNull().default(''),
  sourceUrl:     text('source_url').notNull().default(''),
  isActive:      boolean('is_active').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Unit of Measurement definitions
// Conversion stored as integer ratio: conversion_numerator / conversion_base
// e.g. 1 m³ = 35314 / 1000 ft³ → numerator=35314, base=1000 (no float, ADR-004 spirit)
export const nidhivanUomDefinitions = pgTable('nidhivan_uom_definitions', {
  id:                  serial('id').primaryKey(),
  tenantId:            integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  uomCode:             text('uom_code').notNull(),
  displayName:         text('display_name').notNull(),
  measurementSystem:   text('measurement_system').notNull().default('METRIC'),
  unitCategory:        text('unit_category').notNull().default(''),
  conversionNumerator: integer('conversion_numerator').notNull().default(10000),
  conversionBase:      integer('conversion_base').notNull().default(10000),
  isActive:            boolean('is_active').notNull().default(true),
  isGlobal:            boolean('is_global').notNull().default(false),
  notes:               text('notes').notNull().default(''),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Rate schedule: base rate per classification code per authority per period
// rate_minor_units: ADR-004 — paise (INR) / cents (USD) / pence (GBP)
// labour/material/overhead pcts: real acceptable here — analysis percentages, NOT money
export const nidhivanRateSchedules = pgTable('nidhivan_rate_schedules', {
  id:                   serial('id').primaryKey(),
  tenantId:             integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  authorityId:          integer('authority_id').notNull().references(() => nidhivanRateAuthorities.id, { onDelete: 'restrict' }),
  codeId:               integer('code_id').notNull().references(() => nidhivanClassificationCodes.id, { onDelete: 'restrict' }),
  uomId:                integer('uom_id').references(() => nidhivanUomDefinitions.id, { onDelete: 'set null' }),
  rateMinorUnits:       bigint('rate_minor_units', { mode: 'number' }).notNull().default(0),
  currencyCode:         text('currency_code').notNull().default('INR'),
  labourComponentPct:   real('labour_component_pct').notNull().default(0),
  materialComponentPct: real('material_component_pct').notNull().default(0),
  overheadComponentPct: real('overhead_component_pct').notNull().default(0),
  analysisRef:          text('analysis_ref').notNull().default(''),
  validFrom:            date('valid_from').notNull(),
  validTo:              date('valid_to'),
  isActive:             boolean('is_active').notNull().default(true),
  metadata:             jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Location adjustment factors: integer ratio factor_numerator / factor_base
// e.g. Mumbai high-cost zone 1.18x → numerator=11800, base=10000
export const nidhivanLocationFactors = pgTable('nidhivan_location_factors', {
  id:              serial('id').primaryKey(),
  tenantId:        integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  authorityId:     integer('authority_id').references(() => nidhivanRateAuthorities.id, { onDelete: 'set null' }),
  locationCode:    text('location_code').notNull(),
  locationName:    text('location_name').notNull(),
  jurisdiction:    text('jurisdiction').notNull().default('IND'),
  factorNumerator: integer('factor_numerator').notNull().default(10000),
  factorBase:      integer('factor_base').notNull().default(10000),
  effectiveFrom:   date('effective_from').notNull(),
  effectiveTo:     date('effective_to'),
  source:          text('source').notNull().default(''),
  notes:           text('notes').notNull().default(''),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Currency exchange rates for multi-currency BNLV Group reporting
// Rate stored as integer ratio: rate_numerator / rate_base (no float)
// e.g. 1 USD = 84.12 INR → numerator=8412, base=100
// rate_type: 'MONTH_CLOSE' | 'TRANSACTION' | 'BUDGET' | 'STANDARD'
export const nidhivanCurrencyRates = pgTable('nidhivan_currency_rates', {
  id:            serial('id').primaryKey(),
  tenantId:      integer('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  fromCurrency:  text('from_currency').notNull(),
  toCurrency:    text('to_currency').notNull(),
  rateNumerator: bigint('rate_numerator', { mode: 'number' }).notNull(),
  rateBase:      integer('rate_base').notNull().default(10000),
  rateType:      text('rate_type').notNull().default('MONTH_CLOSE'),
  rateDate:      date('rate_date').notNull(),
  source:        text('source').notNull().default(''),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy:     integer('created_by'),
});

// ─── 11.3  Q2 — TAX ENGINE ──────────────────────────────────────

// Tax profiles: per-project GST and TDS configuration
// Rates stored as basis points: 900 bps = 9.00% CGST, 1800 bps = 18% IGST
// e_invoice_threshold_paise: ₹5Cr = 5,000,000,000 paise
// GST routing: place_of_supply ≠ origin_state → IGST; else CGST+SGST
// CGST Act Section 13(2): output GST booked immediately on advance receipt
export const nidhivanTaxProfiles = pgTable('nidhivan_tax_profiles', {
  id:                       serial('id').primaryKey(),
  tenantId:                 integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  profileCode:              text('profile_code').notNull(),
  displayName:              text('display_name').notNull(),
  jurisdiction:             text('jurisdiction').notNull().default('IND'),
  gstRateType:              text('gst_rate_type').notNull().default('WORKS_18'),
  // GST components (basis points: 900 = 9.00%)
  cgstRateBps:              integer('cgst_rate_bps').notNull().default(900),
  sgstRateBps:              integer('sgst_rate_bps').notNull().default(900),
  igstRateBps:              integer('igst_rate_bps').notNull().default(1800),
  // TDS under IT Act Section 194C (basis points: 100 = 1.00%)
  itTds194cRateBps:         integer('it_tds_194c_rate_bps').notNull().default(100),
  // GST TDS under GST Act Section 51 (basis points: 200 = 2.00%)
  gstTdsRateBps:            integer('gst_tds_rate_bps').notNull().default(200),
  // BOCW Labour Cess (basis points: 100 = 1.00%)
  laborCessRateBps:         integer('labor_cess_rate_bps').notNull().default(100),
  // e-invoice mandatory threshold: ₹5Cr = 5,000,000,000 paise
  eInvoiceThresholdPaise:   bigint('e_invoice_threshold_paise', { mode: 'number' }).notNull().default(5000000000),
  mobilisationGstTreatment: text('mobilisation_gst_treatment').notNull().default('IMMEDIATE'),
  isActive:                 boolean('is_active').notNull().default(true),
  notes:                    text('notes').notNull().default(''),
  createdAt:                timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:                timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// RA (Running Account) Bills — primary billing instrument for construction projects
// VANTAI gates:
//   VT-N-002: TDS 194C human gate → vt_n002_gate_passed must be TRUE before dispatch
//   VT-N-003: GST e-invoice NIC IRP → e_invoice_irn populated before APPROVED_FOR_PAYMENT
// content_hash: SHA-256 of bill content at certification (tamper evidence)
// milestone_gate_id: forward ref (nidhivanMilestoneGates defined in section 11.5)
// journal_voucher_id: forward ref (nidhivanJournalVouchers defined in section 11.6)
export const nidhivanRaBills = pgTable('nidhivan_ra_bills', {
  id:                     serial('id').primaryKey(),
  tenantId:               integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:              integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'restrict' }),
  boqId:                  integer('boq_id').references(() => nidhivanBoqs.id, { onDelete: 'set null' }),
  billNumber:             text('bill_number').notNull(),
  billingType:            nidhivanBillingTypeEnum('billing_type').notNull().default('PERIODIC'),
  status:                 nidhivanRaBillStatusEnum('status').notNull().default('DRAFT'),
  billPeriodFrom:         date('bill_period_from'),
  billPeriodTo:           date('bill_period_to'),
  milestoneGateId:        integer('milestone_gate_id').references((): any => nidhivanMilestoneGates.id, { onDelete: 'set null' }),
  // ADR-004: all monetary fields in paise
  grossAmountPaise:       bigint('gross_amount_paise', { mode: 'number' }).notNull().default(0),
  cgstPaise:              bigint('cgst_paise', { mode: 'number' }).notNull().default(0),
  sgstPaise:              bigint('sgst_paise', { mode: 'number' }).notNull().default(0),
  igstPaise:              bigint('igst_paise', { mode: 'number' }).notNull().default(0),
  itTds194cPaise:         bigint('it_tds_194c_paise', { mode: 'number' }).notNull().default(0),
  gstTdsPaise:            bigint('gst_tds_paise', { mode: 'number' }).notNull().default(0),
  laborCessPaise:         bigint('labor_cess_paise', { mode: 'number' }).notNull().default(0),
  netPayablePaise:        bigint('net_payable_paise', { mode: 'number' }).notNull().default(0),
  placeOfSupplyStateCode: text('place_of_supply_state_code').notNull().default(''),
  originStateCode:        text('origin_state_code').notNull().default(''),
  // VT-N-002: TDS 194C human approval gate
  vtN002GatePassed:       boolean('vt_n002_gate_passed').notNull().default(false),
  vtN002PassedAt:         timestamp('vt_n002_passed_at', { withTimezone: true }),
  vtN002PassedBy:         integer('vt_n002_passed_by'),
  // VT-N-003: e-invoice IRN from NIC IRP
  eInvoiceIrn:            text('e_invoice_irn').notNull().default(''),
  eInvoiceAckNo:          text('e_invoice_ack_no').notNull().default(''),
  eInvoiceAckAt:          timestamp('e_invoice_ack_at', { withTimezone: true }),
  paidAt:                 timestamp('paid_at', { withTimezone: true }),
  paymentRef:             text('payment_ref').notNull().default(''),
  contentHash:            text('content_hash').notNull().default(''),
  notes:                  text('notes').notNull().default(''),
  journalVoucherId:       integer('journal_voucher_id').references((): any => nidhivanJournalVouchers.id, { onDelete: 'set null' }),
  createdBy:              integer('created_by'),
  createdAt:              timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// RA Bill deductions: line items subtracted from gross (TDS, advance recovery, retention)
// advance_id: forward ref (nidhivanProjectAdvances defined in section 11.5)
export const nidhivanRaBillDeductions = pgTable('nidhivan_ra_bill_deductions', {
  id:            serial('id').primaryKey(),
  tenantId:      integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  raBillId:      integer('ra_bill_id').notNull().references(() => nidhivanRaBills.id, { onDelete: 'cascade' }),
  deductionType: text('deduction_type').notNull(),
  description:   text('description').notNull(),
  amountPaise:   bigint('amount_paise', { mode: 'number' }).notNull().default(0),
  advanceId:     integer('advance_id').references((): any => nidhivanProjectAdvances.id, { onDelete: 'set null' }),
  notes:         text('notes').notNull().default(''),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 11.4  Q3 — APPROVAL ENGINE ─────────────────────────────────

// Delegation tiers: maps role_code to monetary authority ceiling
// 4-Eyes protocol (BNLV group policy):
//   ≤₹25L  (250,000,000 paise) = L1 + L2
//   ≤₹1Cr  (1,000,000,000 paise) = L1 + L2 + L3
//   >₹1Cr or >10% BOQ variation  = L1 + L2 + L3 + L4
// Strict SOD: maker (L1 SUBMITTED) ≠ any approver role
export const nidhivanDelegationTiers = pgTable('nidhivan_delegation_tiers', {
  id:             serial('id').primaryKey(),
  tenantId:       integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  tierLevel:      integer('tier_level').notNull(),
  tierName:       text('tier_name').notNull(),
  description:    text('description').notNull().default(''),
  maxAmountPaise: bigint('max_amount_paise', { mode: 'number' }).notNull().default(0),
  roleCode:       text('role_code').notNull(),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Per-project override of approval thresholds (client-mandate overrides BNLV group defaults)
export const nidhivanApprovalThresholdRules = pgTable('nidhivan_approval_threshold_rules', {
  id:                  serial('id').primaryKey(),
  tenantId:            integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:           integer('project_id').references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  entityId:            integer('entity_id').references(() => nidhivanEntities.id, { onDelete: 'cascade' }),
  tier1MaxAmountPaise: bigint('tier1_max_amount_paise', { mode: 'number' }).notNull().default(250000000),   // ₹25L
  tier2MaxAmountPaise: bigint('tier2_max_amount_paise', { mode: 'number' }).notNull().default(1000000000),  // ₹1Cr
  variationPctForL4:   integer('variation_pct_for_l4').notNull().default(10),
  isActive:            boolean('is_active').notNull().default(true),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// IMMUTABLE append-only approval audit log
// Migration 0023 REVOKEs: UPDATE, DELETE, TRUNCATE on nidhivan_bill_approvals FROM studio_app
// bill_hash_at_action: SHA-256 of bill state at moment of action (tamper detection)
// signature: reserved for Phase 3 HSM/FIDO2 integration (empty until then)
export const nidhivanBillApprovals = pgTable('nidhivan_bill_approvals', {
  id:                  serial('id').primaryKey(),
  tenantId:            integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  raBillId:            integer('ra_bill_id').notNull().references(() => nidhivanRaBills.id, { onDelete: 'restrict' }),
  actorUserId:         integer('actor_user_id').notNull(),
  actorRoleCode:       text('actor_role_code').notNull(),
  action:              nidhivanApprovalActionEnum('action').notNull(),
  tierLevel:           integer('tier_level').notNull().default(0),
  comments:            text('comments').notNull().default(''),
  amountAtActionPaise: bigint('amount_at_action_paise', { mode: 'number' }).notNull().default(0),
  billHashAtAction:    text('bill_hash_at_action').notNull().default(''),
  signature:           text('signature').notNull().default(''),
  signatureAlgo:       text('signature_algo').notNull().default(''),
  clientIp:            text('client_ip').notNull().default(''),
  userAgent:           text('user_agent').notNull().default(''),
  actedAt:             timestamp('acted_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 11.5  Q4 — MILESTONES & ADVANCES ───────────────────────────

// Milestone gates: defines the payment schedule for MILESTONE billing type
// cumulative_cap_pct: integer basis points of contract value (10000 bps = 100%)
// cumulative_cap_paise: explicit paise cap (overrides pct when both are set)
export const nidhivanMilestoneGates = pgTable('nidhivan_milestone_gates', {
  id:                 serial('id').primaryKey(),
  tenantId:           integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:          integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  gateSequence:       integer('gate_sequence').notNull().default(1),
  gateName:           text('gate_name').notNull(),
  description:        text('description').notNull().default(''),
  cumulativeCapPct:   integer('cumulative_cap_pct').notNull().default(0),
  cumulativeCapPaise: bigint('cumulative_cap_paise', { mode: 'number' }).notNull().default(0),
  targetDate:         date('target_date'),
  actualDate:         date('actual_date'),
  isCompleted:        boolean('is_completed').notNull().default(false),
  completedAt:        timestamp('completed_at', { withTimezone: true }),
  completedBy:        integer('completed_by'),
  isActive:           boolean('is_active').notNull().default(true),
  notes:              text('notes').notNull().default(''),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Project advances: MOBILISATION + SECURED_MATERIAL
// CGST Act Section 13(2): output GST booked on advance receipt (immediate)
// outstanding_amount_paise = disbursed - recovered (app layer updates on each RA bill)
// disbursement_journal_id: forward ref (nidhivanJournalVouchers defined in section 11.6)
export const nidhivanProjectAdvances = pgTable('nidhivan_project_advances', {
  id:                      serial('id').primaryKey(),
  tenantId:                integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:               integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'restrict' }),
  advanceType:             nidhivanAdvanceTypeEnum('advance_type').notNull(),
  status:                  nidhivanAdvanceStatusEnum('status').notNull().default('PENDING'),
  advanceNumber:           text('advance_number').notNull(),
  sanctionedAmountPaise:   bigint('sanctioned_amount_paise', { mode: 'number' }).notNull().default(0),
  disbursedAmountPaise:    bigint('disbursed_amount_paise', { mode: 'number' }).notNull().default(0),
  recoveredAmountPaise:    bigint('recovered_amount_paise', { mode: 'number' }).notNull().default(0),
  outstandingAmountPaise:  bigint('outstanding_amount_paise', { mode: 'number' }).notNull().default(0),
  // CGST Act Section 13(2) advance GST fields
  cgstOnAdvancePaise:      bigint('cgst_on_advance_paise', { mode: 'number' }).notNull().default(0),
  sgstOnAdvancePaise:      bigint('sgst_on_advance_paise', { mode: 'number' }).notNull().default(0),
  igstOnAdvancePaise:      bigint('igst_on_advance_paise', { mode: 'number' }).notNull().default(0),
  materialDescription:     text('material_description').notNull().default(''),
  materialStorageLocation: text('material_storage_location').notNull().default(''),
  inspectedBy:             integer('inspected_by'),
  inspectedAt:             timestamp('inspected_at', { withTimezone: true }),
  disbursementJournalId:   integer('disbursement_journal_id').references((): any => nidhivanJournalVouchers.id, { onDelete: 'set null' }),
  sanctionedBy:            integer('sanctioned_by'),
  sanctionedAt:            timestamp('sanctioned_at', { withTimezone: true }),
  disbursedAt:             timestamp('disbursed_at', { withTimezone: true }),
  notes:                   text('notes').notNull().default(''),
  createdAt:               timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── 11.6  Q5 — LEDGER ENGINE ───────────────────────────────────

// ICAI Chart of Accounts (self-referencing adjacency list)
// is_inter_company: flags inter-company nodes for VANTAI VT-N-004 consolidation
// is_postable: false = control account (no direct DR/CR entries allowed)
// normal_balance_dr: ASSET/EXPENSE=true, LIABILITY/EQUITY/INCOME=false
// tally_ledger_name + tally_group_name: Tally Prime export mapping
export const nidhivanChartOfAccounts = pgTable('nidhivan_chart_of_accounts', {
  id:                   serial('id').primaryKey(),
  tenantId:             integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  parentId:             integer('parent_id').references((): AnyPgColumn => nidhivanChartOfAccounts.id, { onDelete: 'set null' }),
  accountCode:          text('account_code').notNull(),
  accountName:          text('account_name').notNull(),
  accountType:          nidhivanAccountTypeEnum('account_type').notNull(),
  isControlAccount:     boolean('is_control_account').notNull().default(false),
  isPostable:           boolean('is_postable').notNull().default(true),
  isInterCompany:       boolean('is_inter_company').notNull().default(false),
  interCompanyEntityId: integer('inter_company_entity_id').references(() => nidhivanEntities.id, { onDelete: 'set null' }),
  tallyLedgerName:      text('tally_ledger_name').notNull().default(''),
  tallyGroupName:       text('tally_group_name').notNull().default(''),
  normalBalanceDr:      boolean('normal_balance_dr').notNull().default(true),
  level:                integer('level').notNull().default(1),
  isActive:             boolean('is_active').notNull().default(true),
  description:          text('description').notNull().default(''),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tally Prime export staging queue (one-way XML, no feedback loop from Tally to DB)
// sync_status state machine: PENDING → EXPORTED → ACKNOWLEDGED (or FAILED → retry)
// voucher_id: forward ref (nidhivanJournalVouchers defined below — circular with tallyExportId)
// payload_hash: SHA-256 of tally_xml_payload (duplicate detection before retry)
export const nidhivanTallyExportQueue = pgTable('nidhivan_tally_export_queue', {
  id:                 serial('id').primaryKey(),
  tenantId:           integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  voucherId:          integer('voucher_id').references((): any => nidhivanJournalVouchers.id, { onDelete: 'restrict' }),
  tallyXmlPayload:    text('tally_xml_payload').notNull(),
  syncStatus:         nidhivanSyncStatusEnum('sync_status').notNull().default('PENDING'),
  tallyCompanyName:   text('tally_company_name').notNull().default(''),
  tallyVoucherNumber: text('tally_voucher_number').notNull().default(''),
  attempts:           integer('attempts').notNull().default(0),
  lastAttemptAt:      timestamp('last_attempt_at', { withTimezone: true }),
  lastError:          text('last_error').notNull().default(''),
  exportedAt:         timestamp('exported_at', { withTimezone: true }),
  acknowledgedAt:     timestamp('acknowledged_at', { withTimezone: true }),
  payloadHash:        text('payload_hash').notNull().default(''),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Double-entry journal vouchers
// Sum(total_debit_paise) = Sum(total_credit_paise) enforced at application layer
// reversal_voucher_id: self-referencing FK for reversal pairs (both sides nullable)
// ra_bill_id: links RA_BILL_BOOKING voucher type back to the source RA bill
// tally_export_id: circular FK with nidhivan_tally_export_queue (both nullable)
// is_posted: true only after approval passes and double-entry balance verified
export const nidhivanJournalVouchers = pgTable('nidhivan_journal_vouchers', {
  id:                serial('id').primaryKey(),
  tenantId:          integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId:         integer('project_id').references(() => nidhivanProjects.id, { onDelete: 'set null' }),
  voucherNumber:     text('voucher_number').notNull(),
  voucherType:       nidhivanVoucherTypeEnum('voucher_type').notNull().default('JOURNAL'),
  voucherDate:       date('voucher_date').notNull(),
  narration:         text('narration').notNull().default(''),
  totalDebitPaise:   bigint('total_debit_paise', { mode: 'number' }).notNull().default(0),
  totalCreditPaise:  bigint('total_credit_paise', { mode: 'number' }).notNull().default(0),
  raBillId:          integer('ra_bill_id').references(() => nidhivanRaBills.id, { onDelete: 'set null' }),
  preparedBy:        integer('prepared_by').notNull(),
  reviewedBy:        integer('reviewed_by'),
  approvedBy:        integer('approved_by'),
  preparedAt:        timestamp('prepared_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt:        timestamp('reviewed_at', { withTimezone: true }),
  approvedAt:        timestamp('approved_at', { withTimezone: true }),
  tallyExportId:     integer('tally_export_id').references(() => nidhivanTallyExportQueue.id, { onDelete: 'set null' }),
  isPosted:          boolean('is_posted').notNull().default(false),
  isReversed:        boolean('is_reversed').notNull().default(false),
  reversalVoucherId: integer('reversal_voucher_id').references((): AnyPgColumn => nidhivanJournalVouchers.id, { onDelete: 'set null' }),
  fiscalYear:        text('fiscal_year').notNull().default(''),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// IMMUTABLE double-entry ledger (append-only)
// Migration 0023 REVOKEs: DELETE, TRUNCATE on nidhivan_ledger_entries FROM studio_app
// Exactly one of debit_paise / credit_paise > 0 per row (application-layer constraint)
// line_hash: SHA-256(voucher_id || account_id || debit_paise || credit_paise || entry_date)
// fiscal_year format: 'FY2026-27'; period format: 'P01'–'P12' within fiscal year
export const nidhivanLedgerEntries = pgTable('nidhivan_ledger_entries', {
  id:            serial('id').primaryKey(),
  tenantId:      integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  voucherId:     integer('voucher_id').notNull().references(() => nidhivanJournalVouchers.id, { onDelete: 'restrict' }),
  accountId:     integer('account_id').notNull().references(() => nidhivanChartOfAccounts.id, { onDelete: 'restrict' }),
  debitPaise:    bigint('debit_paise', { mode: 'number' }).notNull().default(0),
  creditPaise:   bigint('credit_paise', { mode: 'number' }).notNull().default(0),
  projectId:     integer('project_id').references(() => nidhivanProjects.id, { onDelete: 'set null' }),
  lineNarration: text('line_narration').notNull().default(''),
  entryDate:     date('entry_date').notNull(),
  fiscalYear:    text('fiscal_year').notNull().default(''),
  period:        text('period').notNull().default(''),
  lineHash:      text('line_hash').notNull().default(''),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════
// 12. LIMSY LEGAL (MIGRATION 0019 + MIGRATION 0016 + 0018 MERGED)
// ═══════════════════════════════════════════════════════════════

// ─── LIMSY VALIDATION CONSTANTS ──────────────────────────────
// Used at the application layer (Zod .enum(), API validation). Not DB enums.
export const VALID_LIMSY_CASE_STATUSES = [
  'active', 'pending', 'adjourned', 'closed', 'on_hold', 'archived',
] as const;

export const VALID_LIMSY_CASE_TYPES = [
  'slp', 'writ', 'criminal_appeal', 'civil_appeal', 'civil_suit',
  'arbitration', 'tribunal', 'regulatory', 'execution', 'contempt',
] as const;

export const VALID_COURT_LEVELS = [
  'supreme_court', 'high_court', 'district_court',
  'tribunal', 'arbitration_panel', 'consumer_forum',
] as const;

export const VALID_LIMSY_HEARING_STATUSES = [
  'scheduled', 'in_progress', 'adjourned', 'completed', 'cancelled',
] as const;

export const VALID_LIMSY_ORDER_TYPES = [
  'interim', 'final', 'ex_parte', 'consent', 'default', 'contempt',
] as const;

// ─────────────────────────────────────────────────────────────

export const limsyCases = pgTable('limsy_cases', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  subjectMatter: text("subject_matter").notNull(),
  reliefSought: text("relief_sought"),

  // -- MIGRATION 0016 Additions --
  synopsis: text("synopsis"),
  synopsisGeneratedAt: timestamp("synopsis_generated_at", { withTimezone: true }),
  synopsisGeneratedBy: integer("synopsis_generated_by").references(() => users.id, { onDelete: "set null" }),
  // ------------------------------

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  caseNumber:       text('case_number'),
  internalRef:      text('internal_ref'),
  caseType:         text('case_type').notNull().default('civil'),
  status:           text('status').notNull().default('intake'),
  courtLevel:       text('court_level'),
  courtName:        text('court_name'),
  courtLocation:    text('court_location'),
  petitioner:       text('petitioner'),
  respondent:       text('respondent'),
  urgencyFlag:      boolean('urgency_flag').notNull().default(false),
  nextHearingDate:  date('next_hearing_date'),
  filingDate:       date('filing_date'),
  admissionDate:    date('admission_date'),
  priorityLevel:    text('priority_level').notNull().default('normal'),
  // Self-referential FK requires AnyPgColumn to break circular inference:
  parentCaseId:     integer('parent_case_id').references((): AnyPgColumn => limsyCases.id),
  updatedBy:        integer('updated_by'),
});

export const limsyContacts = pgTable('limsy_contacts', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  designation: text('designation').notNull().default(''),
  organisation: text('organisation').notNull().default(''),
  role: text('role').notNull().default('advocate'),
  barNumber: text('bar_number').notNull().default(''),
  court: text('court').notNull().default(''),
  jurisdiction: text('jurisdiction').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  notes: text('notes').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyUserPreferences = pgTable('limsy_user_preferences', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('dark'),
  sidebarCollapsed: boolean('sidebar_collapsed').notNull().default(false),
  defaultView: text('default_view').notNull().default('docket'),
  notificationPrefs: jsonb('notification_prefs').$type<Record<string, unknown>>().default({}),
  keyboardShortcuts: jsonb('keyboard_shortcuts').$type<Record<string, unknown>>().default({}),
  language: text('language').notNull().default('en'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyWorkflowBlueprints = pgTable('limsy_workflow_blueprints', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  jurisdiction: text('jurisdiction').notNull().default('Supreme Court of India'),
  caseType: text('case_type').notNull().default('slp'),
  description: text('description').notNull().default(''),
  steps: jsonb('steps').$type<unknown[]>().default([]),
  triggers: jsonb('triggers').$type<unknown[]>().default([]),
  estimatedDays: integer('estimated_duration_days').notNull().default(180),
  isTemplate: boolean('is_template').notNull().default(true),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyCaseWorkspaces = pgTable('limsy_case_workspaces', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId: integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull().default('SHARED'),
  title: text('title').notNull().default('Case Workspace'),
  pinnedItems: jsonb('pinned_items').$type<unknown[]>().default([]),
  activeUsers: jsonb('active_users').$type<unknown[]>().default([]),
  videoUrl: text('video_url').notNull().default(''),
  isLive: boolean('is_live').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyWarRoomMessages = pgTable('limsy_war_room_messages', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  workspaceId: integer('workspace_id').notNull().references(() => limsyCaseWorkspaces.id, { onDelete: 'cascade' }),
  caseId: integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull().default('SHARED'),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'set null' }),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull().default('advocate'),
  content: text('content').notNull(),
  kind: text('kind').notNull().default('text'),
  refId: integer('ref_id'),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyDocumentTemplates = pgTable('limsy_document_templates', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('pleading'),
  jurisdiction: text('jurisdiction').notNull().default('Supreme Court of India'),
  caseType: text('case_type').notNull().default('general'),
  body: text('body').notNull().default(''),
  placeholders: jsonb('placeholders').$type<unknown[]>().default([]),
  version: integer('version').notNull().default(1),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyParties = pgTable('limsy_parties', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:      integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  role:        text('role').notNull().default('claimant'),
  name:        text('name').notNull(),
  designation: text('designation').notNull().default(''),
  counsel:     text('counsel').notNull().default(''),
  standing:    text('standing').notNull().default(''),
});

export const limsyDocuments = pgTable('limsy_documents', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:    integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  kind:      text('kind').notNull().default('pleading'),
  title:     text('title').notNull(),
  citation:  text('citation').notNull().default(''),
  status:    text('status').notNull().default('draft'),
  body:      text('body').notNull().default(''),
  filedOn:   text('filed_on').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyAuthorities = pgTable('limsy_authorities', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:    integer('case_id').references(() => limsyCases.id, { onDelete: 'cascade' }),
  kind:      text('kind').notNull().default('case'),
  citation:  text('citation').notNull(),
  court:     text('court').notNull().default(''),
  year:      text('year').notNull().default(''),
  holding:   text('holding').notNull().default(''),
  pinCite:   text('pin_cite').notNull().default(''),
  relevance: text('relevance').notNull().default(''),
});

export const limsyFrameworks = pgTable('limsy_frameworks', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:      integer('case_id').references(() => limsyCases.id, { onDelete: 'set null' }),
  name:        text('name').notNull(),
  method:      text('method').notNull().default('IRAC'),
  description: text('description').notNull().default(''),
  nodes:       jsonb('nodes').$type<Array<{
    id: string; kind: string; label: string; x: number; y: number;
    config: Record<string, unknown>;
  }>>().default([]),
  edges:       jsonb('edges').$type<Array<{
    id: string; from: string; to: string; label: string;
  }>>().default([]),
  status:      text('status').notNull().default('draft'),
  version:     integer('version').notNull().default(1),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyTrials = pgTable('limsy_trials', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:    integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  phase:     text('phase').notNull().default('pretrial'),
  inSession: boolean('in_session').notNull().default(false),
  bench:     text('bench').notNull().default(''),
  transcript: jsonb('transcript').$type<Array<{
    seat: string; speaker: string; text: string; at: string;
  }>>().default([]),
  exhibits:  jsonb('exhibits').$type<Array<{
    id: string; title: string; admitted: boolean; kind: string;
  }>>().default([]),
  roster:    jsonb('roster').$type<Array<{
    seat: string; name: string; counsel: string; role: string;
  }>>().default([]),
  rulings:   jsonb('rulings').$type<Array<{
    text: string; at: string; judge: string;
  }>>().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const limsyCounselSessions = pgTable('limsy_counsel_sessions', {
  id:        serial('id').primaryKey(),
  tenantId:  integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:    integer('case_id').references(() => limsyCases.id, { onDelete: 'set null' }),
  title:     text('title').notNull().default('Co-Counsel Session'),
  messages:  jsonb('messages').$type<Array<{
    role:    'user' | 'assistant';
    content: string;
    at:      string;
  }>>().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── LIMSY HEARINGS & ORDERS (MIGRATION 0021) ────────────────

export const limsyHearings = pgTable('limsy_hearings', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:      integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  hearingDate: text('hearing_date').notNull(),
  court:       text('court').notNull().default(''),
  courtLevel:  text('court_level').notNull().default('high_court'),
  judge:       text('judge').notNull().default(''),
  purpose:     text('purpose').notNull().default(''),
  status:      text('status').notNull().default('scheduled'),
  outcome:     text('outcome').notNull().default(''),
  nextDate:    text('next_date').notNull().default(''),
  notes:       text('notes').notNull().default(''),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  hearingNumber:     text('hearing_number'),
  scheduledDate:     date('scheduled_date'),
  actualDate:        date('actual_date'),
  courtRoom:         text('court_room'),
  adjournmentCount:  integer('adjournment_count').notNull().default(0),
  adjournmentReason: text('adjournment_reason'),
  adjournedBy:       text('adjourned_by'),
  updatedBy:         integer('updated_by'),
  updatedAt:         timestamp('updated_at', { withTimezone: true }),
});

export const limsyOrders = pgTable('limsy_orders', {
  id:          serial('id').primaryKey(),
  tenantId:    integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  caseId:      integer('case_id').notNull().references(() => limsyCases.id, { onDelete: 'cascade' }),
  hearingId:   integer('hearing_id').references(() => limsyHearings.id, { onDelete: 'set null' }),
  orderType:   text('order_type').notNull().default('interim'),
  orderDate:   text('order_date').notNull(),
  court:       text('court').notNull().default(''),
  judge:       text('judge').notNull().default(''),
  operative:   text('operative').notNull().default(''),
  status:      text('status').notNull().default('active'),
  appealable:  boolean('appealable').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  orderTitle: text('order_title'),
  cryptoHash: text('crypto_hash'),
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES (Strict Type Safety)
// ─────────────────────────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Environment = typeof environments.$inferSelect;
export type Deployment = typeof deployments.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type AiTask = typeof aiTasks.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type BuilderComponent = typeof builderComponents.$inferSelect;
export type ClientRequest = typeof clientRequests.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type VaultSecret = typeof vaultSecrets.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type BmsAiAgent = typeof bmsAiAgents.$inferSelect;
export type BmsWorkflow = typeof bmsWorkflows.$inferSelect;
export type BmsStudioProject = typeof bmsStudioProjects.$inferSelect;

export type BmsDocument = typeof bmsDocuments.$inferSelect;
export type BmsDocumentInsert = typeof bmsDocuments.$inferInsert;
export type BmsDocumentSelect = typeof bmsDocuments.$inferSelect;

export type BuilderPage = typeof builderPages.$inferSelect;
export type BuilderPageInsert = typeof builderPages.$inferInsert;
export type BuilderPageSelect = typeof builderPages.$inferSelect;
export type BuilderBlock = typeof builderBlocks.$inferSelect;

export type BmsTrackInsert = typeof bmsTracks.$inferInsert;
export type BmsCohortInsert = typeof bmsCohorts.$inferInsert;
export type BmsDeliverySessionInsert = typeof bmsDeliverySessions.$inferInsert;
export type BmsAcademyInsert = typeof bmsAcademies.$inferInsert;
export type BmsCertificateInsert = typeof bmsCertificates.$inferInsert;
export type BmsMasterclassInsert = typeof bmsMasterclasses.$inferInsert;
export type LimsyWarRoomMessageInsert = typeof limsyWarRoomMessages.$inferInsert;

export type LimsyWarRoomMessage = typeof limsyWarRoomMessages.$inferSelect;
export type LimsyCaseWorkspace = typeof limsyCaseWorkspaces.$inferSelect;

// MIGRATION 0016: LIMSY Case Typings
export type LimsyCaseInsert = typeof limsyCases.$inferInsert;
export type LimsyCaseSelect = typeof limsyCases.$inferSelect;

export type BmsPendency = typeof bmsPendencies.$inferSelect;
export type NewBmsPendency = typeof bmsPendencies.$inferInsert;
export type BmsReleaseEvidence = typeof bmsReleaseEvidence.$inferSelect;

// NIDHIVAN Typings
export type NidhivanEntity = typeof nidhivanEntities.$inferSelect;
export type NewNidhivanEntity = typeof nidhivanEntities.$inferInsert;
export type NidhivanEntityInsert = typeof nidhivanEntities.$inferInsert;
export type NidhivanEntitySelect = typeof nidhivanEntities.$inferSelect;
export type NidhivanAccount = typeof nidhivanAccounts.$inferSelect;
export type NidhivanJournal = typeof nidhivanJournals.$inferSelect;
export type NewNidhivanJournal = typeof nidhivanJournals.$inferInsert;
export type NidhivanJournalInsert = typeof nidhivanJournals.$inferInsert;
export type NidhivanResearch = typeof nidhivanResearch.$inferSelect;
export type NidhivanLab = typeof nidhivanLab.$inferSelect;
export type NidhivanCounsel = typeof nidhivanCounsel.$inferSelect;
export type NidhivanClose = typeof nidhivanCloses.$inferSelect;

// NIDHIVAN BOQ & Projects Typings
export type NidhivanProject = typeof nidhivanProjects.$inferSelect;
export type NidhivanProjectInsert = typeof nidhivanProjects.$inferInsert;
export type NidhivanBoq = typeof nidhivanBoqs.$inferSelect;
export type NidhivanBoqInsert = typeof nidhivanBoqs.$inferInsert;
export type NidhivanBoqItem = typeof nidhivanBoqItems.$inferSelect;
export type NidhivanBoqItemInsert = typeof nidhivanBoqItems.$inferInsert;
export type NidhivanFinancialMetric = typeof nidhivanFinancialMetrics.$inferSelect;
export type NidhivanDpr = typeof nidhivanDprs.$inferSelect;
export type NidhivanDprInsert = typeof nidhivanDprs.$inferInsert;

// LIMSY Extended Typings
export type LimsyParty = typeof limsyParties.$inferSelect;
export type LimsyDocument = typeof limsyDocuments.$inferSelect;
export type LimsyAuthority = typeof limsyAuthorities.$inferSelect;
export type LimsyFramework = typeof limsyFrameworks.$inferSelect;
export type LimsyTrial = typeof limsyTrials.$inferSelect;
export type LimsyTrialInsert = typeof limsyTrials.$inferInsert;
export type LimsyCounselSession = typeof limsyCounselSessions.$inferSelect;
export type LimsyCounselSessionInsert = typeof limsyCounselSessions.$inferInsert;
export type LimsyHearing = typeof limsyHearings.$inferSelect;
export type LimsyHearingInsert = typeof limsyHearings.$inferInsert;
export type LimsyOrder = typeof limsyOrders.$inferSelect;
export type LimsyOrderInsert = typeof limsyOrders.$inferInsert;

// BMS LMS Typings
export type BmsCourse = typeof bmsCourses.$inferSelect;
export type BmsCourseInsert = typeof bmsCourses.$inferInsert;
export type BmsModule = typeof bmsModules.$inferSelect;
export type BmsLesson = typeof bmsLessons.$inferSelect;
export type BmsEnrollment = typeof bmsEnrollments.$inferSelect;
export type BmsEnrollmentInsert = typeof bmsEnrollments.$inferInsert;
export type BmsLessonProgress = typeof bmsLessonProgress.$inferSelect;
export type BmsAssignment = typeof bmsAssignments.$inferSelect;
export type BmsLearningPath = typeof bmsLearningPaths.$inferSelect;

// BMS Hosting Typings
export type BmsDnsRecord = typeof bmsDnsRecords.$inferSelect;
export type BmsHostContainer = typeof bmsHostContainers.$inferSelect;
export type BmsStudioAddon = typeof bmsStudioAddons.$inferSelect;

// BMS Ops Typings
export type BmsCodeRedCase = typeof bmsCodeRedCases.$inferSelect;
export type BmsCodeRedCaseInsert = typeof bmsCodeRedCases.$inferInsert;

// LIMSY Validation Constant Types
export type LimsyCaseStatus = typeof VALID_LIMSY_CASE_STATUSES[number];
export type LimsyCaseType = typeof VALID_LIMSY_CASE_TYPES[number];
export type CourtLevel = typeof VALID_COURT_LEVELS[number];
export type LimsyHearingStatus = typeof VALID_LIMSY_HEARING_STATUSES[number];
export type LimsyOrderType = typeof VALID_LIMSY_ORDER_TYPES[number];

export type NewNidhivanProject = typeof nidhivanProjects.$inferInsert;
export type NewNidhivanDpr     = typeof nidhivanDprs.$inferInsert;