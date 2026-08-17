/**
 * scripts/create-middleware-nft.mjs
 *
 * Local postbuild shim — runs after npm run build for local verification.
 * Vercel deployments use scripts/vercel-build.mjs which handles NFT during build.
 *
 * Walks BOTH middleware/ and edge/ directories — edge/chunks/ contains the
 * actual compiled middleware JavaScript bundle (Turbopack output).
 * Never creates proxy.js.nft.json — that file is invalid and interferes
 * with Vercel's serverless function packaging.
 *
 * NOTE: .mjs required — package.json has "type": "module".
 */

import fs   from 'fs';
import path from 'path';

const cwd        = process.cwd();
const SERVER_DIR = path.join(cwd, '.next', 'server');
const MW_DIR     = path.join(SERVER_DIR, 'middleware');
const EDGE_DIR   = path.join(SERVER_DIR, 'edge');
const NFT_PATH   = path.join(SERVER_DIR, 'middleware.js.nft.json');

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
  }
}

const files = [];
walk(MW_DIR,   files);  // middleware manifest
walk(EDGE_DIR, files);  // actual compiled middleware bundle (edge chunks)

fs.mkdirSync(path.dirname(NFT_PATH), { recursive: true });
fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
console.log(`[nft-shim] Created middleware.js.nft.json (${files.length} entries)`);
