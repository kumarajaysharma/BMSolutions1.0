#!/usr/bin/env node
/**
 * fix-artifact-backticks.cjs
 * Escapes unescaped markdown backticks inside `content:` template literals
 * in src/lib/bms-artifacts.ts.
 *
 * Root cause: template literals containing markdown inline-code spans
 *   `as any`, `injectScope(...)`, etc. prematurely terminate the TS template.
 *
 * Heuristic: Inside a `content:` template literal, a backtick that is
 *   INLINE (preceded on the same line by non-whitespace) is a markdown code
 *   span → escape as \`. A backtick at the START of a line (preceded only by
 *   whitespace / newline) is the CLOSING backtick → do not escape.
 *
 * Usage (run from project root D:\BMS-Final\saas-studio):
 *   node fix-artifact-backticks.cjs
 *
 * Safe to run multiple times — already-escaped \` are left untouched.
 */

const fs   = require('fs');
const path = require('path');

const TARGET = path.resolve('src', 'lib', 'bms-artifacts.ts');

if (!fs.existsSync(TARGET)) {
  console.error('ERROR: File not found:', TARGET);
  console.error('Run this script from the project root (D:\\BMS-Final\\saas-studio).');
  process.exit(1);
}

const src = fs.readFileSync(TARGET, 'utf8');
let out = '';
let i   = 0;
const n = src.length;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Is the character at position p the FIRST non-whitespace char on its line? */
function isLineStart(p) {
  // Walk left; if we hit a non-whitespace before a newline → not line-start
  let j = p - 1;
  while (j >= 0) {
    const c = src[j];
    if (c === '\n') return true;   // only whitespace between newline and p
    if (c !== ' ' && c !== '\t') return false;
    j--;
  }
  return true; // beginning of file
}

// ── state machine ────────────────────────────────────────────────────────────

let inContentLiteral = false; // true when inside a content:` ... ` block
let interpDepth = 0;          // tracks ${...} nesting inside the template

while (i < n) {
  // ── Outside a content template literal ───────────────────────────────────
  if (!inContentLiteral) {
    // Detect:  content:` or content : ` (with optional whitespace)
    const slice = src.slice(i, i + 24);
    const m = slice.match(/^(content\s*:\s*)`/);
    if (m) {
      // m[1] is "content:" or "content :" etc.; the backtick is right after
      const prefix = m[1];
      out += prefix + '`';
      i   += prefix.length + 1; // advance past prefix + opening backtick
      inContentLiteral = true;
      interpDepth = 0;
    } else {
      out += src[i];
      i++;
    }
    continue;
  }

  // ── Inside a content template literal ────────────────────────────────────
  const c = src[i];

  // Already-escaped character — pass through verbatim
  if (c === '\\' && i + 1 < n) {
    out += c + src[i + 1];
    i   += 2;
    continue;
  }

  // Template interpolation start: ${
  if (c === '$' && i + 1 < n && src[i + 1] === '{') {
    out += '${';
    i   += 2;
    interpDepth++;
    continue;
  }

  // Closing brace of an interpolation
  if (c === '}' && interpDepth > 0) {
    out += '}';
    i++;
    interpDepth--;
    continue;
  }

  // Backtick encountered
  if (c === '`') {
    if (interpDepth > 0) {
      // Inside ${...}, a backtick opens a nested template literal.
      // Our content templates don't use nested templates — pass through.
      out += '`';
      i++;
    } else {
      // At the top level of the content template literal.
      // HEURISTIC: closing backtick is at the start of a line; inline backtick is not.
      if (isLineStart(i)) {
        // This is the closing backtick — end the template, don't escape
        out += '`';
        i++;
        inContentLiteral = false;
      } else {
        // Inline backtick → markdown code span → escape it
        out += '\\`';
        i++;
      }
    }
    continue;
  }

  // Default: copy character verbatim
  out += c;
  i++;
}

if (inContentLiteral) {
  console.warn('WARNING: File ended while still inside a content template literal.');
  console.warn('The last content block may be missing its closing backtick.');
}

// ── Write output ─────────────────────────────────────────────────────────────
const backup = TARGET + '.bak';
fs.copyFileSync(TARGET, backup);
fs.writeFileSync(TARGET, out, 'utf8');

// Count escapes added
const added = (out.match(/\\`/g) || []).length - (src.match(/\\`/g) || []).length;
console.log(`✓ Fixed: ${TARGET}`);
console.log(`  Backup : ${backup}`);
console.log(`  Backtick escapes added: ${added}`);
console.log('');
console.log('Run "npx tsc --noEmit" to verify zero errors remain.');
