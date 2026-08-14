/**
 * scripts/vercel-build.mjs
 *
 * Custom build wrapper for Vercel deployment.
 *
 * ROOT CAUSE:
 *   Vercel's modifyConfig injects a finalization step INSIDE next build that
 *   reads .next/server/middleware.js.nft.json. Next.js 16 Turbopack outputs
 *   middleware to .next/server/middleware/ (a directory) and never generates
 *   this file. The build fails with ENOENT at "Finalizing page optimization".
 *
 * SOLUTION:
 *   Run next build as a child process. Poll for .next/server/middleware/ to
 *   appear every 50ms. The moment it does, write middleware.js.nft.json from
 *   its contents. Vercel's finalization step finds the file and succeeds.
 *
 * NOTE: .mjs required — package.json has "type": "module".
 * Set in vercel.json: "buildCommand": "node scripts/vercel-build.mjs"
 */

import { spawn }    from 'child_process';
import fs           from 'fs';
import path         from 'path';

const cwd        = process.cwd();
const SERVER_DIR = path.join(cwd, '.next', 'server');
const MW_DIR     = path.join(SERVER_DIR, 'middleware');
const NFT_PATH   = path.join(SERVER_DIR, 'middleware.js.nft.json');
const POLL_MS    = 50;

// ── NFT file generator ────────────────────────────────────────────────────────

function generateNft() {
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        files.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
      }
    }
  }

  walk(MW_DIR);
  fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
  console.log(`\n[nft-shim] ✓ Created middleware.js.nft.json (${files.length} entries)\n`);
}

// ── Background watcher ────────────────────────────────────────────────────────
// Fires the moment Turbopack writes .next/server/middleware/ — before
// Vercel's "Finalizing page optimization" step attempts to read the NFT file.

const watcher = setInterval(() => {
  try {
    if (fs.existsSync(MW_DIR) && !fs.existsSync(NFT_PATH)) {
      generateNft();
      clearInterval(watcher);
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
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(watcher);
  console.error('[vercel-build] Spawn error:', err);
  process.exit(1);
});
