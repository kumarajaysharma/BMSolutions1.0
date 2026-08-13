/**
 * scripts/vercel-build.mjs
 *
 * Custom build wrapper for Vercel deployment.
 * Automatically provisions both middleware.js.nft.json and middleware.js
 * to satisfy Vercel's legacy packaging expectations under Next.js 16 Turbopack.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const SERVER_DIR = path.join(cwd, '.next', 'server');
const MW_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH = path.join(SERVER_DIR, 'middleware.js.nft.json');
const MW_JS_PATH = path.join(SERVER_DIR, 'middleware.js');
const POLL_MS = 50;

function generateArtifacts() {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
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

  // 1. Write NFT file if missing
  if (!fs.existsSync(NFT_PATH) && files.length > 0) {
    fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
    console.log(`\n[nft-shim] ✓ Created middleware.js.nft.json (${files.length} entries)\n`);
  }

  // 2. Ensure middleware.js exists for Vercel's lstat checker
  if (!fs.existsSync(MW_JS_PATH)) {
    const candidateIndex = path.join(MW_DIR, 'index.js');
    if (fs.existsSync(candidateIndex)) {
      fs.copyFileSync(candidateIndex, MW_JS_PATH);
      console.log(`[nft-shim] ✓ Copied middleware/index.js to middleware.js`);
    } else if (files.length > 0) {
      const firstFile = path.join(SERVER_DIR, files[0]);
      if (fs.existsSync(firstFile)) {
        fs.copyFileSync(firstFile, MW_JS_PATH);
        console.log(`[nft-shim] ✓ Copied ${files[0]} to middleware.js`);
      }
    }

    // Fallback stub if still not present
    if (!fs.existsSync(MW_JS_PATH)) {
      fs.writeFileSync(MW_JS_PATH, 'module.exports = {};');
      console.log(`[nft-shim] ✓ Created fallback middleware.js stub`);
    }
  }
}

const watcher = setInterval(() => {
  try {
    if (fs.existsSync(MW_DIR)) {
      generateArtifacts();
    }
  } catch {
    // Retry on next poll if files are still being written
  }
}, POLL_MS);

const child = spawn('next', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

child.on('exit', (code) => {
  clearInterval(watcher);
  try {
    generateArtifacts();
  } catch (e) {
    console.error('[nft-shim] Final generation error:', e);
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(watcher);
  console.error('[vercel-build] Spawn error:', err);
  process.exit(1);
});