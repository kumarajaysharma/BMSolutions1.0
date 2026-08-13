/**
 * scripts/vercel-build.mjs
 * 
 * Custom build wrapper for Vercel deployment under Next.js 16 + Turbopack.
 * Traces compiled assets AND required external node_modules (next, jose, @swc/helpers).
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cwd = process.cwd();
const SERVER_DIR = path.join(cwd, '.next', 'server');
const PROXY_DIR = path.join(SERVER_DIR, 'proxy');
const MW_DIR = path.join(SERVER_DIR, 'middleware');

function generateArtifacts() {
  try {
    const targetDir = fs.existsSync(PROXY_DIR) ? PROXY_DIR : (fs.existsSync(MW_DIR) ? MW_DIR : null);
    if (!targetDir) return;

    const files = [];

    // 1. Walk compiled output directory
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
    walk(targetDir);

    // 2. Walk required runtime packages so Vercel's NFT tracer includes SWC helpers and server modules
    const includePkgs = ['next', 'jose', '@swc/helpers'];
    for (const pkg of includePkgs) {
      const pkgDir = path.join(cwd, 'node_modules', pkg);
      if (fs.existsSync(pkgDir)) {
        function walkExternal(dir) {
          if (!fs.existsSync(dir)) return;
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              walkExternal(full);
            } else {
              files.push(path.relative(SERVER_DIR, full).replace(/\\/g, '/'));
            }
          }
        }
        walkExternal(pkgDir);
      }
    }

    const uniqueFiles = [...new Set(files)];
    const nftPayload = JSON.stringify({ version: 1, files: uniqueFiles });

    // Write NFT manifests for both proxy and middleware paths
    const nftPaths = [
      path.join(SERVER_DIR, 'proxy.js.nft.json'),
      path.join(SERVER_DIR, 'middleware.js.nft.json')
    ];
    for (const nftPath of nftPaths) {
      fs.writeFileSync(nftPath, nftPayload);
    }
    console.log(`[nft-shim] ✓ Created NFT manifests with ${uniqueFiles.length} traced entries.`);

    // 3. Write physical JS stubs for Vercel lstat check & execution
    const stubCode = `module.exports = require('./proxy/index.js');`;
    const jsPaths = [
      path.join(SERVER_DIR, 'proxy.js'),
      path.join(SERVER_DIR, 'middleware.js')
    ];
    for (const jsPath of jsPaths) {
      if (!fs.existsSync(jsPath)) {
        fs.writeFileSync(jsPath, stubCode);
      }
    }
    console.log(`[nft-shim] ✓ Created proxy.js and middleware.js stubs.`);

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