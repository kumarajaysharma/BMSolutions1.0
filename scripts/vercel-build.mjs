/**
 * scripts/vercel-build.mjs
 * 
 * Custom build wrapper for Vercel deployment.
 * Spawns Next.js via direct node binary invocation for absolute path reliability.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

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

// Use direct Node invocation to next binary to prevent spawn ENOENT on Linux runners
const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
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
  console.error('[vercel-build] Spawn execution error:', err);
  process.exit(1);
});