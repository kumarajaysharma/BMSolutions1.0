/**
 * scripts/vercel-build.mjs
 * 
 * Custom build wrapper for Vercel deployment.
 * Generates middleware.js.nft.json and a lightweight middleware.js lstat stub
 * to satisfy Vercel's build packaging under Next.js 16 Turbopack.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SERVER_DIR = path.join(process.cwd(), '.next', 'server');
const MW_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH = path.join(SERVER_DIR, 'middleware.js.nft.json');
const MW_JS_PATH = path.join(SERVER_DIR, 'middleware.js');

function generateArtifacts() {
  try {
    if (!fs.existsSync(MW_DIR)) return;

    const files = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else files.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
      }
    }
    walk(MW_DIR);

    // 1. Create NFT manifest if missing
    if (!fs.existsSync(NFT_PATH) && files.length > 0) {
      fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
      console.log(`\n[nft-shim] ✓ Created middleware.js.nft.json (${files.length} entries)\n`);
    }

    // 2. Create middleware.js stub for Vercel lstat check if missing
    if (!fs.existsSync(MW_JS_PATH)) {
      const candidate = path.join(MW_DIR, 'index.js');
      if (fs.existsSync(candidate)) {
        fs.writeFileSync(MW_JS_PATH, `module.exports = require('./middleware/index.js');`);
      } else {
        fs.writeFileSync(MW_JS_PATH, `module.exports = {};`);
      }
      console.log(`[nft-shim] ✓ Created middleware.js lstat stub`);
    }
  } catch (err) {
    console.error('[nft-shim] Error generating artifacts:', err);
  }
}

const watcher = setInterval(generateArtifacts, 50);

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env },
});

child.on('exit', (code) => {
  clearInterval(watcher);
  generateArtifacts();
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(watcher);
  console.error('[vercel-build] Fatal spawn error:', err);
  process.exit(1);
});