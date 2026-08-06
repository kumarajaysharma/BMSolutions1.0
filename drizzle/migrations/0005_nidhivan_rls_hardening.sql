-- ============================================================================
-- Migration: 0005_nidhivan_rls_hardening.sql
-- Nidhivan Consulting — Row-Level Security Isolation Policies
-- ============================================================================

-- 1. Enable RLS on all Track 2 Tables
ALTER TABLE nidhivan_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_dprs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_boqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_financial_metrics ENABLE ROW LEVEL SECURITY;

-- 2. Grant explicit DML permissions to the application role
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_projects TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_dprs TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_boqs TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_boq_items TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_financial_metrics TO studio_app;

-- 3. Grant sequence usages (Required for SERIAL primary keys)
GRANT USAGE ON SEQUENCE nidhivan_projects_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_dprs_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_boqs_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_boq_items_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_financial_metrics_id_seq TO studio_app;

-- 4. Create Isolation Policies binding tenant_id to current_tenant_id() context
DROP POLICY IF EXISTS "nidhivan_projects_app_all" ON nidhivan_projects;
CREATE POLICY "nidhivan_projects_app_all" ON nidhivan_projects 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_dprs_app_all" ON nidhivan_dprs;
CREATE POLICY "nidhivan_dprs_app_all" ON nidhivan_dprs 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_boqs_app_all" ON nidhivan_boqs;
CREATE POLICY "nidhivan_boqs_app_all" ON nidhivan_boqs 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_boq_items_app_all" ON nidhivan_boq_items;
CREATE POLICY "nidhivan_boq_items_app_all" ON nidhivan_boq_items 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_metrics_app_all" ON nidhivan_financial_metrics;
CREATE POLICY "nidhivan_metrics_app_all" ON nidhivan_financial_metrics 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());
  
-- 5. Studio Migrator Bypass
CREATE POLICY "nidhivan_projects_migrator" ON nidhivan_projects FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_dprs_migrator" ON nidhivan_dprs FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_boqs_migrator" ON nidhivan_boqs FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_boq_items_migrator" ON nidhivan_boq_items FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_metrics_migrator" ON nidhivan_financial_metrics FOR ALL TO studio_migrator USING (true) WITH CHECK (true);