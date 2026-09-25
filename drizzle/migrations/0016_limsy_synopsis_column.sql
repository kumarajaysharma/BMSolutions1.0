-- =============================================================================
-- Migration 0016: LIMSY Synopsis Column Infrastructure
-- File: drizzle/migrations/0016_limsy_synopsis_column.sql
-- Executed via: npm run db:migrate (DATABASE_URL_UNPOOLED — ADR-002)
-- =============================================================================
--
-- RESOLVES: TODO-001 from src/app/api/limsy/synopsis/route.ts
--
-- PROBLEM:
--   AI-generated legal synopses are currently embedded inside `subject_matter`
--   using the text delimiter '\n\n=== AI SYNOPSIS ===\n'. This pattern:
--     (a) prevents structured querying of synopsis content
--     (b) cannot be indexed, filtered, or aggregated independently
--     (c) makes synopsis_generated_at / synopsis_generated_by untraceable
--     (d) is fragile — any subject_matter edit can corrupt the delimiter
--
-- SOLUTION:
--   Three dedicated columns on limsy_cases:
--     synopsis              TEXT          — AI-generated legal synopsis text
--     synopsis_generated_at TIMESTAMPTZ   — when the synopsis was generated
--     synopsis_generated_by INTEGER       — user ID of the generating advocate
--
-- DATA MIGRATION:
--   Extracts existing embedded synopses from subject_matter into the new column
--   and strips the delimiter from subject_matter. Uses SPLIT_PART (PostgreSQL
--   native) which returns '' on no-match, making the UPDATE idempotent and safe
--   on all rows regardless of delimiter presence.
--
-- ROLLBACK PLAN:
--   Step 1: Run verification query below before cleanup commit.
--   Step 2: DROP COLUMN synopsis, synopsis_generated_at, synopsis_generated_by.
--   Step 3: The embedded delimiter content is preserved in subject_matter
--           because this migration only modifies rows WHERE LIKE '%AI SYNOPSIS%'.
--   NOTE:   After synopsis-route-v2.ts is deployed, new synopses write ONLY to
--           the synopsis column — they will NOT appear in subject_matter.
--           Rollback after first production synopsis generation requires
--           a manual reverse-backfill script.
--
-- SEQUENCE NOTE:
--   There is no 0011_*.sql file in the drizzle/ folder. Migration 0011 was
--   applied directly to Neon via console (registered outside drizzle-kit).
--   This migration is 0016, the next sequential file after 0015.
-- =============================================================================

-- ── Step 1: Add synopsis columns ─────────────────────────────────────────────

ALTER TABLE limsy_cases
  ADD COLUMN IF NOT EXISTS synopsis              TEXT,
  ADD COLUMN IF NOT EXISTS synopsis_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS synopsis_generated_by INTEGER
    REFERENCES users(id) ON DELETE SET NULL;

-- ── Step 2: Backfill from embedded delimiter pattern ─────────────────────────
--
-- Canonical delimiter written by synopsis-route.ts (v1):
--   '\n\n=== AI SYNOPSIS ===\n'
--
-- SPLIT_PART behaviour (PostgreSQL):
--   SPLIT_PART(str, delimiter, 1) → text BEFORE first delimiter occurrence
--   SPLIT_PART(str, delimiter, 2) → text AFTER first delimiter occurrence
--   SPLIT_PART(str, delimiter, N) → '' (empty) if N-th part does not exist
--
-- NULLIF converts '' (empty string) to NULL so we don't store blank synopses.
-- TRIM removes any leading/trailing whitespace from both columns.
-- The WHERE clause ensures we only touch rows that actually contain the delimiter.

UPDATE limsy_cases
SET
  synopsis = NULLIF(
    TRIM(SPLIT_PART(subject_matter, E'\n\n=== AI SYNOPSIS ===\n', 2)),
    ''
  ),
  subject_matter = TRIM(
    SPLIT_PART(subject_matter, E'\n\n=== AI SYNOPSIS ===\n', 1)
  )
WHERE subject_matter LIKE '%=== AI SYNOPSIS ===%'
  AND subject_matter IS NOT NULL;

-- ── Step 3: Verification queries (run manually after migration, before deploy) ──
--
-- 1. Confirm backfill row count:
--    SELECT COUNT(*) FROM limsy_cases WHERE synopsis IS NOT NULL;
--
-- 2. Spot-check content integrity (no residual delimiter in subject_matter):
--    SELECT COUNT(*) FROM limsy_cases WHERE subject_matter LIKE '%AI SYNOPSIS%';
--    -- Expected: 0
--
-- 3. Confirm subject_matter is NOT NULL after migration (schema constraint):
--    SELECT COUNT(*) FROM limsy_cases WHERE subject_matter IS NULL;
--    -- Expected: 0
--
-- 4. Sample check on a backfilled row:
--    SELECT id, internal_ref,
--           length(synopsis)       AS synopsis_len,
--           length(subject_matter) AS subject_len,
--           LEFT(synopsis, 120)    AS synopsis_preview
--    FROM limsy_cases
--    WHERE synopsis IS NOT NULL
--    LIMIT 5;
