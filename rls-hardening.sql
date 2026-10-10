-- ============================================================
-- RLS Re-Hardening Script
-- Purpose: Re-apply FORCE RLS + tenant isolation policies +
--          REVOKE on immutable tables for ALL platform tables.
--          Run after any DROP SCHEMA / schema rebuild.
-- Apply: Neon console as neondb_owner
-- ADR: ADR-001 (Zero Trust RLS)
-- ============================================================

-- ─── CORE TABLES (from 0000-0018_green_thor_girl) ────────────

ALTER TABLE tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants        FORCE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       FORCE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     FORCE ROW LEVEL SECURITY;
ALTER TABLE api_keys       ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys       FORCE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets  FORCE ROW LEVEL SECURITY;
ALTER TABLE feature_flags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags  FORCE ROW LEVEL SECURITY;
ALTER TABLE deployments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments    FORCE ROW LEVEL SECURITY;
ALTER TABLE environments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments   FORCE ROW LEVEL SECURITY;
ALTER TABLE incidents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents      FORCE ROW LEVEL SECURITY;
ALTER TABLE client_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests        FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_documents          FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_ai_agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_ai_agents          FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_workflows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_workflows          FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_studio_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_studio_projects    FORCE ROW LEVEL SECURITY;
ALTER TABLE builder_pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_pages          FORCE ROW LEVEL SECURITY;
ALTER TABLE builder_blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_blocks         FORCE ROW LEVEL SECURITY;
ALTER TABLE builder_components     ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_components     FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks               FORCE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints      FORCE ROW LEVEL SECURITY;
ALTER TABLE job_applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications       FORCE ROW LEVEL SECURITY;

-- ─── 0019 TABLES (from 0019_final_platform_consolidation) ────

ALTER TABLE bms_tracks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_tracks             FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_labs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_labs               FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_lab_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_lab_runs           FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_cohorts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_cohorts            FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_cohort_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_cohort_members     FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_assessments        FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_assessment_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_delivery_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_delivery_sessions  FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_academies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_academies          FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_certificates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_certificates       FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_case_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_case_submissions   FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_executive_tools    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_executive_tools    FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_user_tool_saves    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_user_tool_saves    FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_masterclasses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_masterclasses      FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_media_programs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_media_programs     FORCE ROW LEVEL SECURITY;
ALTER TABLE bms_discussions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_discussions        FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_contacts         FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_user_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_workflow_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_workflow_blueprints FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_case_workspaces  ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_case_workspaces  FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_war_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_war_room_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_document_templates FORCE ROW LEVEL SECURITY;

-- ─── 0020 TABLES are handled in 0020_builder_supplement.sql ──

-- ─── IMMUTABLE TABLE REVOKES ─────────────────────────────────
-- Run AFTER applying 0020_builder_supplement.sql

-- Nidhivan financial ledger
REVOKE DELETE  ON nidhivan_journals FROM studio_app;
REVOKE TRUNCATE ON nidhivan_journals FROM studio_app;

-- BMS evidence chain
REVOKE DELETE  ON bms_release_evidence FROM studio_app;
REVOKE TRUNCATE ON bms_release_evidence FROM studio_app;

-- BMS certificates (from 0019)
REVOKE DELETE  ON bms_certificates FROM studio_app;
REVOKE TRUNCATE ON bms_certificates FROM studio_app;

-- War room messages (from 0019)
REVOKE DELETE  ON limsy_war_room_messages FROM studio_app;
REVOKE TRUNCATE ON limsy_war_room_messages FROM studio_app;

-- LIMSY legal records (from 0020)
REVOKE DELETE  ON limsy_documents FROM studio_app;
REVOKE TRUNCATE ON limsy_documents FROM studio_app;
REVOKE DELETE  ON limsy_trials FROM studio_app;
REVOKE TRUNCATE ON limsy_trials FROM studio_app;
REVOKE DELETE  ON limsy_counsel_sessions FROM studio_app;
REVOKE TRUNCATE ON limsy_counsel_sessions FROM studio_app;

-- ─── TENANT ISOLATION POLICIES ───────────────────────────────
-- Applies to all tables with a tenant_id column.
-- Skip tenants table (no self-referential policy needed).
-- Skip users (isolated by user_id, not tenant_id).

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'audit_logs','api_keys','vault_secrets','feature_flags',
    'deployments','environments','incidents','client_requests',
    'bms_documents','bms_ai_agents','bms_workflows','bms_studio_projects',
    'builder_pages','builder_blocks','builder_components','ai_tasks',
    'bms_tracks','bms_labs','bms_lab_runs','bms_cohorts','bms_cohort_members',
    'bms_assessments','bms_assessment_attempts','bms_delivery_sessions',
    'bms_academies','bms_certificates','bms_case_submissions',
    'bms_executive_tools','bms_user_tool_saves','bms_masterclasses',
    'bms_media_programs','bms_discussions',
    'limsy_contacts','limsy_user_preferences','limsy_workflow_blueprints',
    'limsy_case_workspaces','limsy_war_room_messages','limsy_document_templates',
    'bms_pendencies','bms_release_evidence',
    'nidhivan_entities','nidhivan_accounts','nidhivan_journals',
    'nidhivan_research','nidhivan_lab','nidhivan_counsel','nidhivan_closes',
    'limsy_parties','limsy_documents','limsy_authorities',
    'limsy_frameworks','limsy_trials','limsy_counsel_sessions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop if exists then recreate (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format($$
      CREATE POLICY tenant_isolation ON %I
        AS PERMISSIVE FOR ALL TO studio_app
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::integer)
    $$, t);
  END LOOP;
END $$;

-- ─── VERIFY ──────────────────────────────────────────────────
-- Run after applying to confirm all policies are in place:
--
-- SELECT tablename, rowsecurity, forcerowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
