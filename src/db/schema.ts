/**
 * src/db/schema.ts
 * BNLV Group Enterprise Schema — Final Consolidated Platform (22 Tables)
 * Sprint: Phase C Go-Live | Target: 22 Tables
 */

import { 
  pgTable, serial, text, timestamp, integer, boolean, jsonb, 
  pgEnum, uniqueIndex, numeric
} from "drizzle-orm/pg-core";

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
// 1. CORE PLATFORM TABLES (16 Tables)
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
// 2. AI AGENTS & WORKFLOWS (2 Tables)
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
// 3. BUILDER, STUDIO & DOCUMENTS (4 Tables)
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
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  projectId: integer('project_id').references(() => bmsStudioProjects.id, { onDelete: 'set null' }),
  parentId: integer('parent_id'),
  name: text('name').notNull(),
  path: text('path').notNull().default('/'),
  status: text('status').notNull().default('draft'),
  blocks: jsonb('blocks').$type<Record<string, unknown>[]>().default([]),
  theme: text('theme').notNull().default('aurora'),
  artifactKind: text('artifact_kind').notNull().default('website'),
  sortIndex: integer('sort_index').notNull().default(0),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const builderBlocks = pgTable('builder_blocks', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('Section'),
  brand: text('brand').notNull().default('Shared'),
  description: text('description').notNull().default(''),
  kind: text('kind').notNull().default('hero'),
  tags: text('tags').notNull().default(''),
  usage: integer('usage').notNull().default(0),
  status: text('status').notNull().default('stable'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES (Strict Type Safety for 22 Core Tables)
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

export type BuilderPage = typeof builderPages.$inferSelect;
export type BuilderPageInsert = typeof builderPages.$inferInsert;
export type BuilderBlock = typeof builderBlocks.$inferSelect;