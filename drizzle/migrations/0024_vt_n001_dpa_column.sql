-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0024_vt_n001_dpa_column
-- Purpose:   Add DPDP Data Processing Agreement (DPA) tracking columns to
--            nidhivan_projects, completing the proper implementation of
--            VANTAI gate VT-N-001.
--
-- Previously VT-N-001 used taxProfileId as a proxy (non-null = DPA signed).
-- This migration adds a dedicated boolean flag plus audit columns, allowing
-- an administrator to explicitly record DPA execution per project.
--
-- DPDP Act (India), 2023, Section 4(1)(b): Data Fiduciary must obtain
-- verifiable consent / lawful basis before processing personal data.
-- BNLV-COUNCIL-002 VANTAI gate VT-N-001 enforces this at the API layer.
--
-- Post-migration action required:
--   UPDATE vantai-gates.ts gateVtN001Dpdp() to check vtN001DpaSigned
--   instead of the taxProfileId proxy. See implementation in that file.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE nidhivan_projects
  ADD COLUMN IF NOT EXISTS vt_n001_dpa_signed       BOOLEAN NOT NULL DEFAULT FALSE;
--> statement-breakpoint

ALTER TABLE nidhivan_projects
  ADD COLUMN IF NOT EXISTS vt_n001_dpa_signed_at    TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE nidhivan_projects
  ADD COLUMN IF NOT EXISTS vt_n001_dpa_reference    TEXT;
--> statement-breakpoint

-- Index: fast lookup of projects awaiting DPA sign-off (compliance dashboard query)
CREATE INDEX IF NOT EXISTS idx_nidhivan_projects_dpa_pending
  ON nidhivan_projects (tenant_id, vt_n001_dpa_signed)
  WHERE vt_n001_dpa_signed = FALSE;
--> statement-breakpoint

-- Comment block for audit trail
COMMENT ON COLUMN nidhivan_projects.vt_n001_dpa_signed IS
  'VANTAI VT-N-001 gate: TRUE when the Data Fiduciary DPA (DPDP Act 2023 S.4(1)(b)) '
  'has been executed for this project. Set by administrator via PATCH /api/nidhivan/projects/:id.';

COMMENT ON COLUMN nidhivan_projects.vt_n001_dpa_signed_at IS
  'Timestamp when vt_n001_dpa_signed was set TRUE. Null if DPA not yet executed.';

COMMENT ON COLUMN nidhivan_projects.vt_n001_dpa_reference IS
  'Reference number / identifier of the executed DPA document (e.g. contract ref, document URL). '
  'Required when vt_n001_dpa_signed is TRUE for audit trail.';
