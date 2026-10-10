'use strict';
/**
 * fix-remaining-migrations.cjs
 *
 * Makes all drizzle-kit-generated migration files idempotent:
 *   CREATE TABLE "x"           → CREATE TABLE IF NOT EXISTS "x"
 *   CREATE UNIQUE INDEX "x"    → CREATE UNIQUE INDEX IF NOT EXISTS "x"
 *   CREATE INDEX "x"           → CREATE INDEX IF NOT EXISTS "x"
 *   CREATE SEQUENCE "x"        → CREATE SEQUENCE IF NOT EXISTS "x"
 *   ALTER TABLE ADD CONSTRAINT → wrapped in DO block w/ duplicate-object handler
 *
 * Only processes files that contain '--> statement-breakpoint' markers
 * (drizzle-kit generated). Hand-written scripts are left untouched.
 *
 * Run from project root: node fix-remaining-migrations.cjs
 */

const fs   = require('fs');
const path = require('path');

const MIG   = path.join(process.cwd(), 'drizzle', 'migrations');
const BREAK = '--> statement-breakpoint';

const { entries } = JSON.parse(
  fs.readFileSync(path.join(MIG, 'meta/_journal.json'), 'utf8')
);
entries.sort((a, b) => a.idx - b.idx);

let totalFiles = 0;

for (const { tag } of entries) {
  const fp = path.join(MIG, tag + '.sql');
  if (!fs.existsSync(fp)) { console.log(`SKIP (missing): ${tag}`); continue; }

  const original = fs.readFileSync(fp, 'utf8');
  if (!original.includes(BREAK)) continue; // hand-written — skip

  const parts = original.split(BREAK);
  let tables = 0, indexes = 0, constraints = 0, sequences = 0;

  const fixed = parts.map(part => {
    const trimmed = part.trim();
    // Skip empty or comment-only fragments
    if (!trimmed || trimmed.replace(/--[^\n]*/g, '').trim().length === 0) return part;

    // Preserve surrounding whitespace
    const leadCount  = part.length - part.trimStart().length;
    const prefix     = part.slice(0, leadCount);
    const trailCount = part.length - part.trimEnd().length;
    const suffix     = trailCount > 0 ? part.slice(-trailCount) : '';

    let modified = trimmed;

    // ── CREATE TABLE ───────────────────────────────────────────────────────────
    if (/^CREATE TABLE "/i.test(trimmed) && !/^CREATE TABLE IF NOT EXISTS/i.test(trimmed)) {
      tables++;
      modified = trimmed.replace(/^CREATE TABLE "/, 'CREATE TABLE IF NOT EXISTS "');
    }
    // ── CREATE UNIQUE INDEX ────────────────────────────────────────────────────
    else if (/^CREATE UNIQUE INDEX "/i.test(trimmed) &&
             !/^CREATE UNIQUE INDEX IF NOT EXISTS/i.test(trimmed)) {
      indexes++;
      modified = trimmed.replace(/^CREATE UNIQUE INDEX "/, 'CREATE UNIQUE INDEX IF NOT EXISTS "');
    }
    // ── CREATE INDEX (non-unique) ──────────────────────────────────────────────
    else if (/^CREATE INDEX "/i.test(trimmed) &&
             !/^CREATE INDEX IF NOT EXISTS/i.test(trimmed)) {
      indexes++;
      modified = trimmed.replace(/^CREATE INDEX "/, 'CREATE INDEX IF NOT EXISTS "');
    }
    // ── CREATE SEQUENCE ────────────────────────────────────────────────────────
    else if (/^CREATE SEQUENCE "/i.test(trimmed) &&
             !/^CREATE SEQUENCE IF NOT EXISTS/i.test(trimmed)) {
      sequences++;
      modified = trimmed.replace(/^CREATE SEQUENCE "/, 'CREATE SEQUENCE IF NOT EXISTS "');
    }
    // ── ALTER TABLE … ADD CONSTRAINT → idempotent DO block ────────────────────
    // SQLSTATE 42710 = duplicate_object (constraint already exists)
    // SQLSTATE 42P07 = duplicate_table  (safety net for index-backed constraints)
    else if (/^ALTER TABLE "[^"]+" ADD CONSTRAINT/i.test(trimmed)) {
      constraints++;
      modified = [
        'DO $idempotent$ BEGIN',
        '  ' + trimmed,
        'EXCEPTION',
        "  WHEN SQLSTATE '42710' THEN NULL;",
        "  WHEN SQLSTATE '42P07' THEN NULL;",
        'END $idempotent$;'
      ].join('\n');
    }

    if (modified === trimmed) return part;
    return prefix + modified + suffix;
  });

  const result = fixed.join(BREAK);
  if (result !== original) {
    fs.writeFileSync(fp, result, 'utf8');
    const changes = [];
    if (tables)      changes.push(`CREATE TABLE×${tables}`);
    if (indexes)     changes.push(`CREATE INDEX×${indexes}`);
    if (constraints) changes.push(`ADD CONSTRAINT×${constraints}`);
    if (sequences)   changes.push(`CREATE SEQUENCE×${sequences}`);
    console.log(`  PATCHED  ${tag}: ${changes.join(', ')}`);
    totalFiles++;
  } else {
    console.log(`  OK       ${tag}  (already idempotent)`);
  }
}

if (totalFiles === 0) {
  console.log('\nAll drizzle-kit migrations already idempotent — no changes made.');
} else {
  console.log(`\n${totalFiles} file(s) patched.`);
}

console.log('\nNext steps:');
console.log('  1. node debug-all.cjs          ← dry-run: verify all 18 entries pass');
console.log('  2. node run-migrate.cjs         ← commit migrations to Neon');
console.log('  3. Check table count in Neon console (~62 expected from public schema)');
