/**
 * scripts/vercel-build.mjs
 * 
 * Custom build wrapper for Vercel deployment.
 * Generates only the required proxy.js.nft.json and middleware.js.nft.json trace manifests
 * while leaving native Next.js 16 runtime execution untouched.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SERVER_DIR = path.join(process.cwd(), '.next', 'server');
const PROXY_DIR = path.join(SERVER_DIR, 'proxy');
const MW_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH_PROXY = path.join(SERVER_DIR, 'proxy.js.nft.json');
const NFT_PATH_MW = path.join(SERVER_DIR, 'middleware.js.nft.json');

function generateNft() {
  try {
    const targetDir = fs.existsSync(PROXY_DIR) ? PROXY_DIR : (fs.existsSync(MW_DIR) ? MW_DIR : null);
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

    if (files.length > 0) {
      const nftPayload = JSON.stringify({ version: 1, files });
      
      if (!fs.existsSync(NFT_PATH_PROXY)) {
        fs.writeFileSync(NFT_PATH_PROXY, nftPayload);
        console.log(`\n[nft-shim] ✓ Created proxy.js.nft.json (${files.length} entries)\n`);
      }
      if (!fs.existsSync(NFT_PATH_MW)) {
        fs.writeFileSync(NFT_PATH_MW, nftPayload);
        console.log(`\n[nft-shim] ✓ Created middleware.js.nft.json (${files.length} entries)\n`);
      }
    }
  } catch (err) {
    console.error('[nft-shim] Error generating NFT manifests:', err);
  }
}

const watcher = setInterval(generateNft, 50);

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env },
});

child.on('exit', (code) => {
  clearInterval(watcher);
  generateNft();
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(watcher);
  console.error('[vercel-build] Fatal spawn error:', err);
  process.exit(1);
});