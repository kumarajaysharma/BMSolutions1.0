/**
 * scripts/vercel-build.mjs
 * 
 * Robust build wrapper using require.resolve for binary pathing.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SERVER_DIR = path.join(process.cwd(), '.next', 'server');
const MW_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH = path.join(SERVER_DIR, 'middleware.js.nft.json');

function generateNft() {
  try {
    if (!fs.existsSync(MW_DIR) || fs.existsSync(NFT_PATH)) return;

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
    if (files.length > 0) {
      fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
      console.log(`\n[nft-shim] ✓ Created middleware.js.nft.json (${files.length} entries)\n`);
    }
  } catch (err) {
    console.error('[nft-shim] Error generating NFT:', err);
  }
}

const watcher = setInterval(generateNft, 50);

// Resolve next binary path dynamically
const nextBin = require.resolve('next/dist/bin/next');

console.log(`[vercel-build] Spawning: node ${nextBin} build`);

const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env },
});

child.on('exit', (code) => {
  clearInterval(watcher);
  generateNft();
  console.log(`[vercel-build] Process exited with code ${code}`);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  clearInterval(watcher);
  console.error('[vercel-build] Fatal spawn error:', err);
  process.exit(1);
});