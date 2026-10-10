-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0021: Add missing columns — LIMSY / BMS LMS / BMS Hosting / Nidhivan
-- Database : Neon PostgreSQL (neondb)
-- Apply via: DATABASE_URL_UNPOOLED only (ADR-002)
-- Idempotent: every statement uses IF NOT EXISTS / DROP … IF EXISTS
-- Generated : 2026-10-08
-- Resolves  : 78 tsc errors across 19 files (npx tsc --noEmit)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. LIMSY — limsy_cases
--    Missing: case_number, internal_ref, case_type, status, court_level,
--             court_name, court_location, petitioner, respondent, urgency_flag,
--             next_hearing_date, filing_date, admission_date, priority_level,
--             parent_case_id, updated_by
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE limsy_cases
  ADD COLUMN IF NOT EXISTS case_number       TEXT,
  ADD COLUMN IF NOT EXISTS internal_ref      TEXT,
  ADD COLUMN IF NOT EXISTS case_type         TEXT NOT NULL DEFAULT 'civil',
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'intake',
  ADD COLUMN IF NOT EXISTS court_level       TEXT,
  ADD COLUMN IF NOT EXISTS court_name        TEXT,
  ADD COLUMN IF NOT EXISTS court_location    TEXT,
  ADD COLUMN IF NOT EXISTS petitioner        TEXT,
  ADD COLUMN IF NOT EXISTS respondent        TEXT,
  ADD COLUMN IF NOT EXISTS urgency_flag      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS next_hearing_date DATE,
  ADD COLUMN IF NOT EXISTS filing_date       DATE,
  ADD COLUMN IF NOT EXISTS admission_date    DATE,
  ADD COLUMN IF NOT EXISTS priority_level    TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS parent_case_id    INTEGER REFERENCES limsy_cases(id),
  ADD COLUMN IF NOT EXISTS updated_by        INTEGER;

-- Rebuild status CHECK constraint to include 'intake'
ALTER TABLE limsy_cases
  DROP CONSTRAINT IF EXISTS limsy_cases_status_check;
ALTER TABLE limsy_cases
  ADD CONSTRAINT limsy_cases_status_check
  CHECK (status IN ('intake','active','pending','adjourned','closed','on_hold','archived'));

-- Rebuild case_type CHECK constraint
ALTER TABLE limsy_cases
  DROP CONSTRAINT IF EXISTS limsy_cases_case_type_check;
ALTER TABLE limsy_cases
  ADD CONSTRAINT limsy_cases_case_type_check
  CHECK (case_type IN ('civil','criminal','arbitration','tribunal','consumer','labour','other'));

-- Rebuild priority_level CHECK constraint
ALTER TABLE limsy_cases
  DROP CONSTRAINT IF EXISTS limsy_cases_priority_level_check;
ALTER TABLE limsy_cases
  ADD CONSTRAINT limsy_cases_priority_level_check
  CHECK (priority_level IN ('critical','high','normal','low'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. LIMSY — limsy_hearings
--    Missing: hearing_number, scheduled_date, actual_date, court_room,
--             adjournment_count, adjournment_reason, adjourned_by,
--             updated_by, updated_at
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE limsy_hearings
  ADD COLUMN IF NOT EXISTS hearing_number     TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date     DATE,
  ADD COLUMN IF NOT EXISTS actual_date        DATE,
  ADD COLUMN IF NOT EXISTS court_room         TEXT,
  ADD COLUMN IF NOT EXISTS adjournment_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjournment_reason TEXT,
  ADD COLUMN IF NOT EXISTS adjourned_by       TEXT,
  ADD COLUMN IF NOT EXISTS updated_by         INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. LIMSY — limsy_orders
--    Missing: order_title, crypto_hash
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE limsy_orders
  ADD COLUMN IF NOT EXISTS order_title TEXT,
  ADD COLUMN IF NOT EXISTS crypto_hash TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. BMS Hosting — bms_dns_records
--    Missing: site_slug
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE bms_dns_records
  ADD COLUMN IF NOT EXISTS site_slug TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. BMS LMS — bms_enrollments
--    Missing: last_accessed_at
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE bms_enrollments
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. BMS LMS — bms_lessons
--    Missing: order_index
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE bms_lessons
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. BMS LMS — bms_modules
--    Missing: order_index
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE bms_modules
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. BMS LMS — bms_courses
--    Missing: thumbnail_gradient, rating
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE bms_courses
  ADD COLUMN IF NOT EXISTS thumbnail_gradient TEXT,
  ADD COLUMN IF NOT EXISTS rating             NUMERIC(3,2)
                                              CONSTRAINT bms_courses_rating_check
                                              CHECK (rating BETWEEN 0 AND 10);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. BMS Studio — bms_studio_addons
--    Missing: addon_id (FK to addon catalog; constraint added post-catalog creation)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE bms_studio_addons
  ADD COLUMN IF NOT EXISTS addon_id INTEGER;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Nidhivan — nidhivan_boq_items
--     Missing: item_number, section_code, is_section_header, rate_ref
--     Note: existing column is rate_paise (not unit_rate_paise) — routes must use rate_paise
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nidhivan_boq_items
  ADD COLUMN IF NOT EXISTS item_number       TEXT,
  ADD COLUMN IF NOT EXISTS section_code      TEXT,
  ADD COLUMN IF NOT EXISTS is_section_header BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rate_ref          TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Nidhivan — nidhivan_boqs
--     Missing: dpr_id FK (BOQ ↔ DPR linkage)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nidhivan_boqs
  ADD COLUMN IF NOT EXISTS dpr_id INTEGER REFERENCES nidhivan_dprs(id) ON DELETE SET NULL;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY (run after COMMIT to confirm all columns landed)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM   information_schema.columns
-- WHERE  table_name IN (
--          'limsy_cases','limsy_hearings','limsy_orders',
--          'bms_dns_records','bms_enrollments','bms_lessons','bms_modules',
--          'bms_courses','bms_studio_addons',
--          'nidhivan_boq_items','nidhivan_boqs'
--        )
-- ORDER  BY table_name, ordinal_position;
