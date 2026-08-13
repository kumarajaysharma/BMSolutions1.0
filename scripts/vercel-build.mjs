/**
 * scripts/vercel-build.mjs
 * 
 * Only generates the .nft.json file to satisfy Vercel's legacy build expectation.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SERVER_DIR = path.join(process.cwd(), '.next', 'server');
const MW_DIR = path.join(SERVER_DIR, 'middleware');
const NFT_PATH = path.join(SERVER_DIR, 'middleware.js.nft.json');

function generateNft() {
  if (!fs.existsSync(MW_DIR) || fs.existsSync(NFT_PATH)) return;

  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
    }
  }
  walk(MW_DIR);
  if (files.length > 0) {
    fs.writeFileSync(NFT_PATH, JSON.stringify({ version: 1, files }));
    console.log(`\n[nft-shim] ✓ Created middleware.js.nft.json\n`);
  }
}

const watcher = setInterval(generateNft, 50);

const child = spawn('next', ['build'], { stdio: 'inherit', shell: true });

child.on('exit', (code) => {
  clearInterval(watcher);
  generateNft();
  process.exit(code ?? 0);
});