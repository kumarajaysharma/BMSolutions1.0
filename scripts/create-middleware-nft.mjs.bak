/**
 * scripts/create-proxy-nft.mjs
 * 
 * Automatically generates middleware.js.nft.json and proxy.js.nft.json 
 * post-build to satisfy Vercel's deployment output requirements for Next.js 16.
 */

import fs from 'fs';
import path from 'path';

const SERVER_DIR = path.join(process.cwd(), '.next', 'server');
const PROXY_DIR = path.join(SERVER_DIR, 'proxy');
const MW_DIR = path.join(SERVER_DIR, 'middleware');

const targetDir = fs.existsSync(PROXY_DIR) ? PROXY_DIR : (fs.existsSync(MW_DIR) ? MW_DIR : null);

const files = [];
if (targetDir) {
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
  walk(targetDir);
}

if (files.length === 0) {
  files.push('proxy/index.js');
}

const nftPayload = JSON.stringify({ version: 1, files });

const nftPaths = [
  path.join(SERVER_DIR, 'middleware.js.nft.json'),
  path.join(SERVER_DIR, 'proxy.js.nft.json')
];

for (const p of nftPaths) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, nftPayload);
  console.log(`[nft-generator] ✓ Created ${path.basename(p)} (${files.length} tracked entries)`);
}