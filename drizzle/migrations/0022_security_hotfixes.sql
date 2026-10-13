-- Migration 0022: Security hotfixes
-- 1. Schema drift fix: webhook_endpoints.active column missing from DB
-- 2. Assert immutability: REVOKE DELETE/TRUNCATE on bms_certificates (defensive re-assertion;
--    migration 0019 declared intent but execution cannot be guaranteed from journal)

-- ─── 1. webhook_endpoints — add missing 'active' column ──────────────────────
ALTER TABLE webhook_endpoints
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- ─── 2. bms_certificates — enforce immutability (re-assert from migration 0019) ─
-- Certificates are verifiable credentials and evidentiary records; no DELETE/TRUNCATE.
REVOKE DELETE   ON bms_certificates FROM studio_app;
REVOKE TRUNCATE ON bms_certificates FROM studio_app;
