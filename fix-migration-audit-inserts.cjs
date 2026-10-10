'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.cwd(), 'drizzle', 'migrations');

function fixFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const out = [];
  let i = 0, changed = false;

  while (i < lines.length) {
    const l = lines[i];

    // Skip AUDIT LOG ENTRY comment blocks + INSERT INTO audit_logs ... ;
    if (/--\s*─+\s*AUDIT LOG ENTRY/i.test(l)) {
      changed = true;
      // advance past comment lines to the INSERT
      while (i < lines.length && !/^\s*INSERT INTO audit_logs/i.test(lines[i])) i++;
      // advance past INSERT block to closing semicolon
      while (i < lines.length && !/;\s*$/.test(lines[i].trim())) i++;
      i++; // skip semicolon line
      continue;
    }

    // Bare INSERT INTO audit_logs with no preceding comment header
    if (/^\s*INSERT INTO audit_logs\s*\(/i.test(l)) {
      changed = true;
      while (i < lines.length && !/ON CONFLICT DO NOTHING;\s*$/i.test(lines[i])) i++;
      i++;
      continue;
    }

    // 0002: guard REVOKE on audit_logs with IF EXISTS
    if (/REVOKE UPDATE, DELETE ON TABLE audit_logs FROM studio_app/i.test(l)) {
      changed = true;
      out.push('DO $$ BEGIN');
      out.push("  IF EXISTS (SELECT FROM information_schema.tables");
      out.push("             WHERE table_schema='public' AND table_name='audit_logs') THEN");
      out.push('    REVOKE UPDATE, DELETE ON audit_logs FROM studio_app;');
      out.push('  END IF;');
      out.push('END $$;');
      i++; continue;
    }

    out.push(l);
    i++;
  }

  if (changed) {
    fs.writeFileSync(filePath, out.join('\n'), 'utf8');
    return true;
  }
  return false;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();
let n = 0;
for (const f of files) {
  if (fixFile(path.join(DIR, f))) { console.log('FIXED:', f); n++; }
}
console.log(`\nPatched ${n} file(s). Run: node run-migrate.cjs`);