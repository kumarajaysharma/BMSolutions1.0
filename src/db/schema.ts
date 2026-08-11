/**
 * src/db/schema.ts
 * BNLV Group Enterprise Schema — Core, Services, LIMSY Supreme Court Module & Nidhivan Track 2
 * Validated for CI/CD Pipeline Integration
 */

import { 
  pgTable, serial, text, timestamp, integer, boolean, jsonb, 
  pgEnum, uniqueIndex, numeric, index, bigint, doublePrecision, type AnyPgColumn 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS (Source of Truth mapped to SQL Migrations)
// ─────────────────────────────────────────────────────────────────────────────

export const tenantPlanEnum = pgEnum('tenant_plan', ['pilot', 'starter', 'professional', 'scale', 'enterprise']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected', 'onboarded']);

export const courtLevelEnum = pgEnum("court_level", [
  'supreme_court', 'high_court', 'district_court', 'tribunal',
  'consumer_forum', 'arbitration', 'nclt', 'nclat', 'ncdrc'
]);

export const limsyCaseStatusEnum = pgEnum("limsy_case_status", [
  'intake', 'diarised', 'admitted', 'pending_hearing', 'under_hearing',
  'reserved', 'disposed', 'withdrawn', 'abated', 'transferred'
]);

export const limsyCaseTypeEnum = pgEnum("limsy_case_type", [
  'slp', 'writ_petition', 'civil_appeal', 'criminal_appeal', 'review_petition',
  'curative_petition', 'original_suit', 'execution_petition', 'consumer_complaint',
  'arbitration_petition', 'ibc_petition', 'nclt_petition', 'other'
]);

export const limsyHearingStatusEnum = pgEnum("limsy_hearing_status", [
  'scheduled', 'listed', 'adjourned', 'part_heard', 'concluded', 'cancelled', 'orders_passed'
]);

export const limsyOrderTypeEnum = pgEnum("limsy_order_type", [
  'interim_stay', 'interim_injunction', 'direction', 'contempt_notice',
  'final_judgment', 'consent_order', 'dismissal', 'remand', 'cost_order', 'modification'
]);

export const limsyBenchTypeEnum = pgEnum("limsy_bench_type", [
  'single_judge', 'division_bench', 'full_bench', 'constitutional_bench', 'larger_bench'
]);

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION CONSTANTS (Matching API imports)
// ─────────────────────────────────────────────────────────────────────────────

export const VALID_COURT_LEVELS = [
  'supreme_court', 'high_court', 'district_court', 'tribunal',
  'consumer_forum', 'arbitration', 'nclt', 'nclat', 'ncdrc'
] as const;

export const VALID_LIMSY_CASE_STATUSES = [
  'intake', 'diarised', 'admitted', 'pending_hearing', 'under_hearing',
  'reserved', 'disposed', 'withdrawn', 'abated', 'transferred'
] as const;

export const VALID_LIMSY_CASE_TYPES = [
  'slp', 'writ_petition', 'civil_appeal', 'criminal_appeal', 'review_petition',
  'curative_petition', 'original_suit', 'execution_petition', 'consumer_complaint',
  'arbitration_petition', 'ibc_petition', 'nclt_petition', 'other'
] as const;

export const VALID_LIMSY_HEARING_STATUSES = [
  'scheduled', 'listed', 'adjourned', 'part_heard', 'concluded', 'cancelled', 'orders_passed'
] as const;

export const VALID_LIMSY_ORDER_TYPES = [
  'interim_stay', 'interim_injunction', 'direction', 'contempt_notice',
  'final_judgment', 'consent_order', 'dismissal', 'remand', 'cost_order', 'modification'
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CORE PLATFORM TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: tenantPlanEnum("plan").notNull().default("starter"),
  status: text("status").notNull().default("active"),
  region: text("region").notNull().default("ap-south-1"),
  
  // Stripe Billing Integration
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
// LIMSY SUPREME COURT STANDARD MODULE TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const limsyCases = pgTable("limsy_cases", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseNumber: text("case_number"),
  internalRef: text("internal_ref").notNull(),
  courtLevel: courtLevelEnum("court_level").notNull(),
  courtName: text("court_name").notNull(),
  courtLocation: text("court_location"),
  caseType: limsyCaseTypeEnum("case_type").notNull(),
  status: limsyCaseStatusEnum("status").notNull().default("intake"),
  petitioner: text("petitioner").notNull(),
  respondent: text("respondent").notNull(),
  petitionerAdv: text("petitioner_adv"),
  respondentAdv: text("respondent_adv"),
  filingDate: timestamp("filing_date", { withTimezone: true }),
  admissionDate: timestamp("admission_date", { withTimezone: true }),
  nextHearingDate: timestamp("next_hearing_date", { withTimezone: true }),
  disposalDate: timestamp("disposal_date", { withTimezone: true }),
  subjectMatter: text("subject_matter").notNull(),
  reliefSought: text("relief_sought"),
  actsSections: text("acts_sections"),
  tags: text("tags"),
  urgencyFlag: boolean("urgency_flag").notNull().default(false),
  priorityLevel: integer("priority_level").notNull().default(3),
  parentCaseId: integer("parent_case_id")
    .references((): AnyPgColumn => limsyCases.id, { onDelete: 'set null' }),
  relatedCases: jsonb("related_cases"),
  documentLinks: jsonb("document_links"),
  outcomeNotes: text("outcome_notes"),
  outcomeType: text("outcome_type"),
  estimatedFeesPaise: bigint("estimated_fees_paise", { mode: 'number' }),
  billedAmountPaise:  bigint("billed_amount_paise",  { mode: 'number' }),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const limsyBenchAssignments = pgTable("limsy_bench_assignments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => limsyCases.id, { onDelete: "cascade" }),
  benchType: limsyBenchTypeEnum("bench_type").notNull(),
  presiding: text("presiding").notNull(),
  members: jsonb("members"),
  constitutedOn: timestamp("constituted_on", { withTimezone: true }).notNull().defaultNow(),
  reconstitutedOn: timestamp("reconstituted_on", { withTimezone: true }),
  reconstitutionReason: text("reconstitution_reason"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const limsyHearings = pgTable("limsy_hearings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => limsyCases.id, { onDelete: "cascade" }),
  hearingNumber: integer("hearing_number").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  actualDate: timestamp("actual_date", { withTimezone: true }),
  status: limsyHearingStatusEnum("status").notNull().default("scheduled"),
  boardPosition: integer("board_position"),
  courtRoom: text("court_room"),
  sessionType: text("session_type").default("regular"),
  adjournedBy: text("adjourned_by"),
  adjournmentReason: text("adjournment_reason"),
  adjournmentCount: integer("adjournment_count").notNull().default(0),
  proceedingsSummary: text("proceedings_summary"),
  detailedMinutes: text("detailed_minutes"),
  appearances: jsonb("appearances"),
  argumentsSummary: text("arguments_summary"),
  nextHearingDate: timestamp("next_hearing_date", { withTimezone: true }),
  nextHearingPurpose: text("next_hearing_purpose"),
  documentLinks: jsonb("document_links"),
  complianceDeadline: timestamp("compliance_deadline", { withTimezone: true }),
  complianceNotes: text("compliance_notes"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const limsyOrders = pgTable("limsy_orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => limsyCases.id, { onDelete: "cascade" }),
  hearingId: integer("hearing_id").references(() => limsyHearings.id, { onDelete: "set null" }),
  orderType: limsyOrderTypeEnum("order_type").notNull(),
  orderDate: timestamp("order_date", { withTimezone: true }).notNull(),
  orderNumber: text("order_number"),
  orderTitle: text("order_title").notNull(),
  operative: text("operative").notNull(),
  fullText: text("full_text"),
  translationHindi: text("translation_hindi"),
  cryptoHash: text("crypto_hash"),
  hasStay: boolean("has_stay").notNull().default(false),
  stayScope: text("stay_scope"),
  stayExpiry: timestamp("stay_expiry", { withTimezone: true }),
  stayConditions: text("stay_conditions"),
  complianceRequired: boolean("compliance_required").notNull().default(false),
  complianceDeadline: timestamp("compliance_deadline", { withTimezone: true }),
  complianceParty: text("compliance_party"),
  complianceStatus: text("compliance_status").default("pending"),
  complianceNotes: text("compliance_notes"),
  costAwarded: boolean("cost_awarded").notNull().default(false),
  costAmountPaise: bigint("cost_amount_paise", { mode: 'number' }),
  costPayable: text("cost_payable"),
  documentLinks: jsonb("document_links"),
  externalLink: text("external_link"),
  appealed: boolean("appealed").notNull().default(false),
  appealCaseId: integer("appeal_case_id")
    .references((): AnyPgColumn => limsyCases.id, { onDelete: 'set null' }),
  reviewFiled: boolean("review_filed").notNull().default(false),
  isFinal: boolean("is_final").notNull().default(false),
  reportable: boolean("reportable").notNull().default(false),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// NIDHIVAN CONSULTING WORKSPACE (TRACK 2)
// DPR, BOQ & Financial Metrics Schema
// ─────────────────────────────────────────────────────────────────────────────

export const nidhivanProjectStatusEnum = pgEnum("nidhivan_project_status", [
  'conceptual', 'dpr_preparation', 'dpr_submitted', 'appraisal',
  'sanctioned', 'in_progress', 'completed', 'abandoned', 'archived'
]);

export const nidhivanProjectTypeEnum = pgEnum("nidhivan_project_type", [
  'infrastructure', 'housing', 'water_sanitation', 'energy', 'transport',
  'healthcare', 'education', 'agriculture', 'industrial', 'urban_development',
  'rural_development', 'digital', 'environment', 'other'
]);

export const nidhivanDprStatusEnum = pgEnum("nidhivan_dpr_status", [
  'draft', 'under_review', 'approved', 'submitted', 'returned', 'archived'
]);

export const nidhivanBoqStatusEnum = pgEnum("nidhivan_boq_status", [
  'draft', 'approved', 'revision_required', 'finalized'
]);

export const nidhivanPeriodTypeEnum = pgEnum("nidhivan_period_type", [
  'monthly', 'quarterly', 'annual'
]);

export const nidhivanProjects = pgTable('nidhivan_projects', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectCode: text('project_code').notNull(),
  projectTitle: text('project_title').notNull(),
  projectType: nidhivanProjectTypeEnum('project_type').notNull(),
  sector: text('sector').notNull(),
  subsector: text('subsector'),
  implementingAgency: text('implementing_agency').notNull(),
  sponsoringAuthority: text('sponsoring_authority'),
  projectState: text('project_state').notNull(),
  projectDistrict: text('project_district'),
  projectLocation: text('project_location'),
  totalCostPaise: bigint('total_cost_paise', { mode: 'number' }).notNull().default(0),
  centralSharePaise: bigint('central_share_paise', { mode: 'number' }).notNull().default(0),
  stateSharePaise: bigint('state_share_paise', { mode: 'number' }).notNull().default(0),
  beneficiarySharePaise: bigint('beneficiary_share_paise', { mode: 'number' }).notNull().default(0),
  loanPaise: bigint('loan_paise', { mode: 'number' }).notNull().default(0),
  fundingAgencies: jsonb('funding_agencies'),
  status: nidhivanProjectStatusEnum('status').notNull().default('conceptual'),
  urgencyFlag: boolean('urgency_flag').notNull().default(false),
  priorityLevel: integer('priority_level').notNull().default(3),
  appraisalDate: timestamp('appraisal_date', { withTimezone: true }),
  sanctionDate: timestamp('sanction_date', { withTimezone: true }),
  commencementDate: timestamp('commencement_date', { withTimezone: true }),
  targetCompletionDate: timestamp('target_completion_date', { withTimezone: true }),
  actualCompletionDate: timestamp('actual_completion_date', { withTimezone: true }),
  projectScope: text('project_scope'),
  objectives: text('objectives'),
  outcomes: text('outcomes'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantIdx: index('nidhivan_projects_tenant_idx').on(table.tenantId),
  };
});

export const nidhivanDprs = pgTable('nidhivan_dprs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  dprVersion: integer('dpr_version').notNull().default(1),
  dprNumber: text('dpr_number').notNull(),
  title: text('title').notNull(),
  financialYear: text('financial_year').notNull(),
  status: nidhivanDprStatusEnum('status').notNull().default('draft'),
  totalProjectCostPaise: bigint('total_project_cost_paise', { mode: 'number' }).notNull().default(0),
  centralSharePaise: bigint('central_share_paise', { mode: 'number' }).notNull().default(0),
  stateSharePaise: bigint('state_share_paise', { mode: 'number' }).notNull().default(0),
  beneficiarySharePaise: bigint('beneficiary_share_paise', { mode: 'number' }).notNull().default(0),
  loanPaise: bigint('loan_paise', { mode: 'number' }).notNull().default(0),
  costBasisYear: text('cost_basis_year'),
  contingencyPct: numeric('contingency_pct', { precision: 5, scale: 2 }).notNull().default('5.00'),
  overheadPct: numeric('overhead_pct', { precision: 5, scale: 2 }).notNull().default('0.00'),
  sections: jsonb('sections').default('{}'),
  consultantName: text('consultant_name'),
  preparedBy: text('prepared_by'),
  submittedTo: text('submitted_to'),
  approvalAuthority: text('approval_authority'),
  approvalRef: text('approval_ref'),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  documentLinks: jsonb('document_links'),
  cryptoHash: text('crypto_hash'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantProjectIdx: index('nidhivan_dprs_tenant_project_idx').on(table.tenantId, table.projectId),
  };
});

export const nidhivanBoqs = pgTable('nidhivan_boqs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  dprId: integer('dpr_id').notNull().references(() => nidhivanDprs.id, { onDelete: 'cascade' }),
  boqVersion: integer('boq_version').notNull().default(1),
  boqNumber: text('boq_number').notNull(),
  title: text('title').notNull(),
  status: nidhivanBoqStatusEnum('status').notNull().default('draft'),
  baseAmountPaise: bigint('base_amount_paise', { mode: 'number' }).notNull().default(0),
  contingencyPct: numeric('contingency_pct', { precision: 5, scale: 2 }).notNull().default('5.00'),
  contingencyAmountPaise: bigint('contingency_amount_paise', { mode: 'number' }).notNull().default(0),
  overheadPct: numeric('overhead_pct', { precision: 5, scale: 2 }).notNull().default('0.00'),
  overheadAmountPaise: bigint('overhead_amount_paise', { mode: 'number' }).notNull().default(0),
  gstPct: numeric('gst_pct', { precision: 5, scale: 2 }).notNull().default('18.00'),
  gstAmountPaise: bigint('gst_amount_paise', { mode: 'number' }).notNull().default(0),
  totalAmountPaise: bigint('total_amount_paise', { mode: 'number' }).notNull().default(0),
  baseYear: text('base_year'),
  rateScheduleRef: text('rate_schedule_ref'),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  documentLinks: jsonb('document_links'),
  cryptoHash: text('crypto_hash'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantDprIdx: index('nidhivan_boqs_tenant_dpr_idx').on(table.tenantId, table.dprId),
  };
});

export const nidhivanBoqItems = pgTable('nidhivan_boq_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  boqId: integer('boq_id').notNull().references(() => nidhivanBoqs.id, { onDelete: 'cascade' }),
  itemNumber: integer('item_number').notNull(),
  sectionCode: text('section_code'),
  isSectionHeader: boolean('is_section_header').notNull().default(false),
  description: text('description').notNull(),
  unit: text('unit'),
  quantity: doublePrecision('quantity').notNull().default(0),
  unitRatePaise: bigint('unit_rate_paise', { mode: 'number' }).notNull().default(0),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull().default(0),
  rateRef: text('rate_ref'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantBoqIdx: index('nidhivan_boq_items_tenant_boq_idx').on(table.tenantId, table.boqId),
  };
});

export const nidhivanFinancialMetrics = pgTable('nidhivan_financial_metrics', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  reportingPeriod: text('reporting_period').notNull(),
  periodType: nidhivanPeriodTypeEnum('period_type').notNull().default('monthly'),
  fundsReleasedCentralPaise: bigint('funds_released_central_paise', { mode: 'number' }).notNull().default(0),
  fundsReleasedStatePaise: bigint('funds_released_state_paise', { mode: 'number' }).notNull().default(0),
  fundsReleasedBeneficiaryPaise: bigint('funds_released_beneficiary_paise', { mode: 'number' }).notNull().default(0),
  expenditureCumulativePaise: bigint('expenditure_cumulative_paise', { mode: 'number' }).notNull().default(0),
  expenditureThisPeriodPaise: bigint('expenditure_this_period_paise', { mode: 'number' }).notNull().default(0),
  balanceAvailablePaise: bigint('balance_available_paise', { mode: 'number' }).notNull().default(0),
  physicalProgressPct: integer('physical_progress_pct').notNull().default(0),
  financialProgressPct: integer('financial_progress_pct').notNull().default(0),
  projectedIrrPercent: numeric('projected_irr_percent', { precision: 5, scale: 2 }),
  remarks: text('remarks'),
  reportedBy: integer('reported_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantProjectIdx: index('nidhivan_financial_metrics_tenant_project_idx').on(table.tenantId, table.projectId),
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS DEFINITIONS (Including LIMSY & Nidhivan)
// ─────────────────────────────────────────────────────────────────────────────

export const limsyCasesRelations = relations(limsyCases, ({ many }) => ({
  benchAssignments: many(limsyBenchAssignments),
  hearings: many(limsyHearings),
  orders: many(limsyOrders),
}));

export const limsyBenchAssignmentsRelations = relations(limsyBenchAssignments, ({ one }) => ({
  case: one(limsyCases, {
    fields: [limsyBenchAssignments.caseId],
    references: [limsyCases.id],
  }),
}));

export const limsyHearingsRelations = relations(limsyHearings, ({ one }) => ({
  case: one(limsyCases, { fields: [limsyHearings.caseId], references: [limsyCases.id] }),
}));

export const limsyOrdersRelations = relations(limsyOrders, ({ one }) => ({
  case: one(limsyCases, { fields: [limsyOrders.caseId], references: [limsyCases.id] }),
  hearing: one(limsyHearings, { fields: [limsyOrders.hearingId], references: [limsyHearings.id] }),
}));

export const nidhivanProjectsRelations = relations(nidhivanProjects, ({ many }) => ({
  dprs: many(nidhivanDprs),
  boqs: many(nidhivanBoqs),
  financialMetrics: many(nidhivanFinancialMetrics),
}));

export const nidhivanDprsRelations = relations(nidhivanDprs, ({ one, many }) => ({
  project: one(nidhivanProjects, {
    fields: [nidhivanDprs.projectId],
    references: [nidhivanProjects.id],
  }),
  boqs: many(nidhivanBoqs),
}));

export const nidhivanBoqsRelations = relations(nidhivanBoqs, ({ one, many }) => ({
  project: one(nidhivanProjects, {
    fields: [nidhivanBoqs.projectId],
    references: [nidhivanProjects.id],
  }),
  dpr: one(nidhivanDprs, {
    fields: [nidhivanBoqs.dprId],
    references: [nidhivanDprs.id],
  }),
  items: many(nidhivanBoqItems),
}));

export const nidhivanBoqItemsRelations = relations(nidhivanBoqItems, ({ one }) => ({
  boq: one(nidhivanBoqs, {
    fields: [nidhivanBoqItems.boqId],
    references: [nidhivanBoqs.id],
  }),
}));

export const nidhivanFinancialMetricsRelations = relations(nidhivanFinancialMetrics, ({ one }) => ({
  project: one(nidhivanProjects, {
    fields: [nidhivanFinancialMetrics.projectId],
    references: [nidhivanProjects.id],
  }),
  reporter: one(users, {
    fields: [nidhivanFinancialMetrics.reportedBy],
    references: [users.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES (Strict Type Safety)
// ─────────────────────────────────────────────────────────────────────────────
export type LimsyCase                = typeof limsyCases.$inferSelect;
export type NewLimsyCase             = typeof limsyCases.$inferInsert;
export type LimsyBenchAssignment     = typeof limsyBenchAssignments.$inferSelect;
export type NewLimsyBenchAssignment  = typeof limsyBenchAssignments.$inferInsert;
export type LimsyHearing             = typeof limsyHearings.$inferSelect;
export type NewLimsyHearing          = typeof limsyHearings.$inferInsert;
export type LimsyOrder               = typeof limsyOrders.$inferSelect;
export type NewLimsyOrder            = typeof limsyOrders.$inferInsert;

export type NidhivanProject = typeof nidhivanProjects.$inferSelect;
export type NewNidhivanProject = typeof nidhivanProjects.$inferInsert;

export type NidhivanDpr = typeof nidhivanDprs.$inferSelect;
export type NewNidhivanDpr = typeof nidhivanDprs.$inferInsert;

export type NidhivanBoq = typeof nidhivanBoqs.$inferSelect;
export type NewNidhivanBoq = typeof nidhivanBoqs.$inferInsert;

export type NidhivanBoqItem = typeof nidhivanBoqItems.$inferSelect;
export type NewNidhivanBoqItem = typeof nidhivanBoqItems.$inferInsert;

export type NidhivanFinancialMetric = typeof nidhivanFinancialMetrics.$inferSelect;
export type NewNidhivanFinancialMetric = typeof nidhivanFinancialMetrics.$inferInsert;