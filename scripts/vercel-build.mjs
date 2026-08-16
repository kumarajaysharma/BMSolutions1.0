/**
 * scripts/vercel-build.mjs
 *
 * Async build wrapper — fixes Next.js 16 Turbopack + Vercel CLI NFT incompatibility.
 *
 * PROBLEM:
 *   Vercel's modifyConfig injects a finalization step inside next build that reads
 *   .next/server/middleware.js.nft.json. Next.js 16 Turbopack outputs middleware to
 *   .next/server/middleware/ (manifest only) and .next/server/edge/chunks/ (actual code).
 *   The NFT file is never generated → ENOENT → MIDDLEWARE_INVOCATION_FAILED at runtime.
 *
 * SOLUTION:
 *   Phase 1 (during build): Poll every 100ms. The moment .next/server/middleware/ or
 *   .next/server/edge/ appears, write a minimal NFT so next build's finalization step
 *   finds the file and does not throw ENOENT.
 *
 *   Phase 2 (after build): Once next build exits 0, rewrite the NFT with the FULL
 *   content of both middleware/ and edge/chunks/ directories. This gives Vercel the
 *   complete file list needed to correctly deploy the middleware edge function.
 */

import { spawn }  from 'child_process';
import fs         from 'fs';
import path       from 'path';

const cwd        = process.cwd();
const SERVER_DIR = path.join(cwd, '.next', 'server');
const MW_DIR     = path.join(SERVER_DIR, 'middleware');
const EDGE_DIR   = path.join(SERVER_DIR, 'edge');
const NFT_PATH   = path.join(SERVER_DIR, 'middleware.js.nft.json');
const POLL_MS    = 100;

// ── File walker ───────────────────────────────────────────────────────────────

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
  }
}

function buildNft(label) {
  const files = [];
  walk(MW_DIR, files);    // middleware manifest + any middleware-specific files
  walk(EDGE_DIR, files);  // CRITICAL: actual compiled middleware bundle (edge chunks)
  fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
  console.log(`\n[nft-shim] ${label} middleware.js.nft.json (${files.length} entries)\n`);
  return files.length;
}

// ── Phase 1: Poll during build to prevent ENOENT in finalization ──────────────

const watcher = setInterval(() => {
  try {
    if ((fs.existsSync(MW_DIR) || fs.existsSync(EDGE_DIR)) && !fs.existsSync(NFT_PATH)) {
      buildNft('Created (phase 1)');
      // Do NOT clear watcher — Phase 2 will run after build exits
    }
  } catch {
    // Directory may be partially written — retry on next poll
  }
}, POLL_MS);

// ── Spawn next build ──────────────────────────────────────────────────────────

const child = spawn('next', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

child.on('exit', (code) => {
  clearInterval(watcher);

  // ── Phase 2: Rewrite NFT with complete edge bundle after build completes ────
  if (code === 0) {
    const count = buildNft('✓ Final (phase 2)');
    if (count < 3) {
      console.warn('[nft-shim] WARNING: Low entry count — edge chunks may not have been included.');
    }
  }

  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(watcher);
  console.error('[vercel-build] Spawn error:', err);
  process.exit(1);
});
