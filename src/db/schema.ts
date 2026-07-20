/**
 * saas-studio/src/db/schema.ts
 *
 * BNLV Studio — Production Drizzle Schema
 * ========================================
 * - All tenant-scoped tables carry a NOT NULL tenant_id FK → tenants.id
 * - Enums replace raw text columns for constrained domains (plan, status, role …)
 * - Composite unique constraints enforce business rules (user email per tenant, etc.)
 * - B-tree indexes on every tenant_id + high-cardinality filter column pair
 * - builderComponents gains a denormalised tenant_id for RLS compatibility
 * - clientRequests / jobApplications intentionally omit tenant_id (platform-level data)
 *   but carry their own integrity constraints
 *
 * RLS SQL migration lives in: 0002_enable_rls.sql
 */

import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const tenantPlanEnum = pgEnum("tenant_plan", ["starter", "scale", "enterprise"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended", "deleted"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "architect", "developer", "designer", "viewer"]);
export const projectFrameworkEnum = pgEnum("project_framework", ["react-vite", "nextjs", "vue-vite", "remix"]);
export const projectStatusEnum = pgEnum("project_status", ["draft", "building", "deployed", "archived"]);
export const taskClassEnum = pgEnum("task_class", ["planning", "backend", "frontend", "styling", "security"]);
export const taskStatusEnum = pgEnum("task_status", ["queued", "running", "verified", "committed", "blocked", "failed"]);
export const securityStatusEnum = pgEnum("security_status", ["pending", "pass", "warn", "fail"]);
export const envNameEnum = pgEnum("env_name", ["development", "staging", "production"]);
export const envTierEnum = pgEnum("env_tier", ["standard", "performance", "dedicated"]);
export const envStatusEnum = pgEnum("env_status", ["provisioning", "running", "degraded", "destroyed"]);
export const deploymentStatusEnum = pgEnum("deployment_status", ["running", "success", "failed", "rolled_back"]);
export const apiKeyStatusEnum = pgEnum("api_key_status", ["active", "revoked"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["active", "paused"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["sev1", "sev2", "sev3"]);
export const incidentStatusEnum = pgEnum("incident_status", ["open", "monitoring", "resolved"]);
export const auditSeverityEnum = pgEnum("audit_severity", ["info", "warn", "critical"]);
export const clientRequestServiceEnum = pgEnum("client_request_service", ["platform-demo", "architecture-consult", "migration-assessment", "security-review"]);
export const clientRequestStatusEnum = pgEnum("client_request_status", ["pending", "confirmed", "completed", "cancelled"]);
export const jobApplicationStatusEnum = pgEnum("job_application_status", ["received", "screening", "interview", "offer", "closed"]);

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: tenants
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable(
  "tenants",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    plan: tenantPlanEnum("plan").notNull().default("scale"),
    status: tenantStatusEnum("status").notNull().default("active"),
    region: text("region").notNull().default("us-east-1"),
    // The JSONB Edge CMS column
    siteData: jsonb("site_data").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tenants_slug_uidx").on(t.slug),
    index("tenants_status_idx").on(t.status),
    index("tenants_plan_idx").on(t.plan),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull().default(""),
    role: userRoleEnum("role").notNull().default("developer"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_tenant_email_uidx").on(t.tenantId, t.email),
    index("users_tenant_id_idx").on(t.tenantId),
    index("users_tenant_role_idx").on(t.tenantId, t.role),
    index("users_active_idx").on(t.active),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent").notNull().default(""),
    ipAddress: text("ip_address").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_tenant_id_idx").on(t.tenantId),
    uniqueIndex("sessions_token_hash_uidx").on(t.tokenHash),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    framework: projectFrameworkEnum("framework").notNull().default("react-vite"),
    status: projectStatusEnum("status").notNull().default("draft"),
    designTokens: jsonb("design_tokens").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_tenant_id_idx").on(t.tenantId),
    index("projects_tenant_status_idx").on(t.tenantId, t.status),
    uniqueIndex("projects_tenant_name_uidx").on(t.tenantId, t.name),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// BUILDER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

export const builderComponents = pgTable(
  "builder_components",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("builder_components_tenant_id_idx").on(t.tenantId),
    index("builder_components_project_id_idx").on(t.projectId),
    index("builder_components_project_sort_idx").on(t.projectId, t.sortOrder),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// AI TASKS
// ─────────────────────────────────────────────────────────────────────────────

export const aiTasks = pgTable(
  "ai_tasks",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    prompt: text("prompt").notNull(),
    taskClass: taskClassEnum("task_class").notNull(),
    routedModel: text("routed_model").notNull(),
    routingReason: text("routing_reason").notNull().default(""),
    complexityScore: integer("complexity_score").notNull().default(0),
    status: taskStatusEnum("status").notNull().default("queued"),
    stages: jsonb("stages").$type<{ name: string; model: string; status: string; durationMs: number; detail: string }[]>().notNull().default([]),
    output: text("output").notNull().default(""),
    securityStatus: securityStatusEnum("security_status").notNull().default("pending"),
    securityFindings: jsonb("security_findings").$type<{ rule: string; severity: string; message: string; line: number }[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_tasks_tenant_id_idx").on(t.tenantId),
    index("ai_tasks_tenant_status_idx").on(t.tenantId, t.status),
    index("ai_tasks_project_id_idx").on(t.projectId),
    index("ai_tasks_security_status_idx").on(t.tenantId, t.securityStatus),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const environments = pgTable(
  "environments",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: envNameEnum("name").notNull(),
    region: text("region").notNull().default("us-east-1"),
    tier: envTierEnum("tier").notNull().default("standard"),
    status: envStatusEnum("status").notNull().default("provisioning"),
    terraform: text("terraform").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("environments_tenant_id_idx").on(t.tenantId),
    index("environments_project_id_idx").on(t.projectId),
    uniqueIndex("environments_project_name_uidx").on(t.projectId, t.name),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const deployments = pgTable(
  "deployments",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    environmentId: integer("environment_id").notNull().references(() => environments.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    commitSha: text("commit_sha").notNull(),
    triggeredBy: text("triggered_by").notNull().default("studio-ci"),
    status: deploymentStatusEnum("status").notNull().default("running"),
    stages: jsonb("stages").$type<{ name: string; status: string; durationMs: number; detail: string }[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("deployments_tenant_id_idx").on(t.tenantId),
    index("deployments_project_id_idx").on(t.projectId),
    index("deployments_environment_id_idx").on(t.environmentId),
    index("deployments_tenant_status_idx").on(t.tenantId, t.status),
    index("deployments_commit_sha_idx").on(t.commitSha),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    rateLimit: integer("rate_limit").notNull().default(1000),
    status: apiKeyStatusEnum("status").notNull().default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("api_keys_tenant_id_idx").on(t.tenantId),
    index("api_keys_tenant_status_idx").on(t.tenantId, t.status),
    uniqueIndex("api_keys_key_hash_uidx").on(t.keyHash),
    uniqueIndex("api_keys_tenant_name_uidx").on(t.tenantId, t.name),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    description: text("description").notNull().default(""),
    enabled: boolean("enabled").notNull().default(false),
    rollout: integer("rollout").notNull().default(0),
    environments: jsonb("environments").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("feature_flags_tenant_id_idx").on(t.tenantId),
    uniqueIndex("feature_flags_tenant_key_uidx").on(t.tenantId, t.key),
    check("feature_flags_rollout_range", sql`${t.rollout} >= 0 AND ${t.rollout} <= 100`),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// VAULT SECRETS
// ─────────────────────────────────────────────────────────────────────────────

export const vaultSecrets = pgTable(
  "vault_secrets",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    maskedValue: text("masked_value").notNull(),
    environment: text("environment").notNull().default("all"),
    version: integer("version").notNull().default(1),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vault_secrets_tenant_id_idx").on(t.tenantId),
    uniqueIndex("vault_secrets_tenant_name_env_uidx").on(t.tenantId, t.name, t.environment),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    events: jsonb("events").$type<string[]>().notNull().default([]),
    signingSecretHash: text("signing_secret_hash").notNull().default(""),
    status: webhookStatusEnum("status").notNull().default("active"),
    deliveries: integer("deliveries").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("webhook_endpoints_tenant_id_idx").on(t.tenantId),
    index("webhook_endpoints_tenant_status_idx").on(t.tenantId, t.status),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENTS
// ─────────────────────────────────────────────────────────────────────────────

export const incidents = pgTable(
  "incidents",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    service: text("service").notNull().default("app-service"),
    severity: incidentSeverityEnum("severity").notNull().default("sev3"),
    status: incidentStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("incidents_tenant_id_idx").on(t.tenantId),
    index("incidents_tenant_status_idx").on(t.tenantId, t.status),
    index("incidents_tenant_severity_idx").on(t.tenantId, t.severity),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    actor: text("actor").notNull().default("system"),
    action: text("action").notNull(),
    target: text("target").notNull().default(""),
    severity: auditSeverityEnum("severity").notNull().default("info"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ipAddress: text("ip_address").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_tenant_id_idx").on(t.tenantId),
    index("audit_logs_tenant_created_idx").on(t.tenantId, t.createdAt),
    index("audit_logs_tenant_severity_idx").on(t.tenantId, t.severity),
    index("audit_logs_action_idx").on(t.action),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export const clientRequests = pgTable(
  "client_requests",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company").notNull().default(""),
    service: clientRequestServiceEnum("service").notNull(),
    preferredDate: text("preferred_date").notNull().default(""),
    preferredTime: text("preferred_time").notNull().default(""),
    notes: text("notes").notNull().default(""),
    status: clientRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("client_requests_status_idx").on(t.status),
    index("client_requests_email_idx").on(t.email),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// JOB APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const jobApplications = pgTable(
  "job_applications",
  {
    id: serial("id").primaryKey(),
    roleSlug: text("role_slug").notNull(),
    roleTitle: text("role_title").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    portfolio: text("portfolio").notNull().default(""),
    note: text("note").notNull().default(""),
    status: jobApplicationStatusEnum("status").notNull().default("received"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("job_applications_role_slug_idx").on(t.roleSlug),
    index("job_applications_status_idx").on(t.status),
    index("job_applications_email_idx").on(t.email),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type BuilderComponent = typeof builderComponents.$inferSelect;
export type NewBuilderComponent = typeof builderComponents.$inferInsert;
export type AiTask = typeof aiTasks.$inferSelect;
export type NewAiTask = typeof aiTasks.$inferInsert;
export type Environment = typeof environments.$inferSelect;
export type NewEnvironment = typeof environments.$inferInsert;
export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
export type VaultSecret = typeof vaultSecrets.$inferSelect;
export type NewVaultSecret = typeof vaultSecrets.$inferInsert;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type ClientRequest = typeof clientRequests.$inferSelect;
export type NewClientRequest = typeof clientRequests.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;

export { ROLE_HIERARCHY, type AppRole, hasMinimumRole } from "@/lib/roles";