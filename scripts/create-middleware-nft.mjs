/**
 * scripts/create-middleware-nft.mjs
 *
 * Bridges Next.js 16 Turbopack middleware directory output with
 * Vercel CLI 58.9.x legacy packaging expectation.
 *
 * Problem:
 *   Next.js 16 + Turbopack outputs middleware to:
 *     .next/server/middleware/  (directory)
 *   Vercel's build packager expects:
 *     .next/server/middleware.js.nft.json  (webpack-era single file)
 *
 * Solution:
 *   Post-build shim that walks the Turbopack middleware directory output
 *   and generates a compatible NFT manifest at the expected path.
 *
 * Note: .mjs extension is required — package.json has "type": "module".
 * Runs automatically via the "postbuild" hook in package.json.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const cwd            = process.cwd();
const SERVER_DIR     = path.join(cwd, '.next', 'server');
const MIDDLEWARE_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH       = path.join(SERVER_DIR, 'middleware.js.nft.json');

// No middleware directory — SSR project without middleware, skip cleanly
if (!fs.existsSync(MIDDLEWARE_DIR)) {
  console.log('[nft-shim] No .next/server/middleware/ directory found — skipping.');
  process.exit(0);
}

// Already exists (webpack build or previous run), do not overwrite
if (fs.existsSync(NFT_PATH)) {
  console.log('[nft-shim] middleware.js.nft.json already exists — skipping.');
  process.exit(0);
}

// ── Walk directory, collect relative paths ──────────────────────────────────

const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else {
      // Paths must be relative to .next/server/ — NFT manifest format
      files.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
    }
  }
}

walk(MIDDLEWARE_DIR);

// ── Include edge-runtime node_modules ───────────────────────────────────────
// jose is the only direct non-Next.js dependency in the middleware chain.
// Next.js edge runtime internals are already captured via the middleware dir.

const nodeModulesBase = path.join(cwd, 'node_modules');
const EDGE_DEPS = ['jose'];

for (const dep of EDGE_DEPS) {
  const depDir = path.join(nodeModulesBase, dep);
  if (fs.existsSync(depDir)) {
    walk(depDir);
  }
}

// ── Write NFT manifest ───────────────────────────────────────────────────────

const nft = { version: 1, files };
fs.writeFileSync(NFT_PATH, JSON.stringify(nft));

console.log(`[nft-shim] Created middleware.js.nft.json (${files.length} entries).`);
