/**
 * scripts/vercel-build.mjs
 * 
 * Custom build wrapper for Vercel deployment.
 * Bridges Next.js 16 proxy output (.next/server/proxy/) to Vercel's
 * expected proxy.js.nft.json and proxy.js build artifacts.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SERVER_DIR = path.join(process.cwd(), '.next', 'server');
const PROXY_DIR = path.join(SERVER_DIR, 'proxy');
const MW_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH = path.join(SERVER_DIR, 'proxy.js.nft.json');
const PROXY_JS_PATH = path.join(SERVER_DIR, 'proxy.js');

function generateArtifacts() {
  try {
    const targetDir = fs.existsSync(PROXY_DIR) ? PROXY_DIR : (fs.existsSync(MW_DIR) ? mwDir : null);
    if (!targetDir) return;

    const files = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else files.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
      }
    }
    walk(targetDir);

    // 1. Create proxy.js.nft.json manifest (and legacy middleware equivalent for safety)
    if (!fs.existsSync(NFT_PATH) && files.length > 0) {
      fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
      console.log(`\n[nft-shim] ✓ Created proxy.js.nft.json (${files.length} entries)\n`);
    }
    const legacyNftPath = path.join(SERVER_DIR, 'middleware.js.nft.json');
    if (!fs.existsSync(legacyNftPath) && files.length > 0) {
      fs.writeFileSync(legacyNftPath, JSON.stringify({ version: 1, files }));
    }

    // 2. Create proxy.js lstat stub for Vercel validator
    if (!fs.existsSync(PROXY_JS_PATH)) {
      const candidate = path.join(targetDir, 'index.js');
      if (fs.existsSync(candidate)) {
        fs.writeFileSync(PROXY_JS_PATH, `module.exports = require('./proxy/index.js');`);
      } else {
        fs.writeFileSync(PROXY_JS_PATH, `module.exports = {};`);
      }
      console.log(`[nft-shim] ✓ Created proxy.js lstat stub`);
    }
    const legacyJsPath = path.join(SERVER_DIR, 'middleware.js');
    if (!fs.existsSync(legacyJsPath)) {
      fs.writeFileSync(legacyJsPath, `module.exports = {};`);
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