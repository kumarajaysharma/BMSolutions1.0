// fix-0002-fn.cjs
'use strict';
const fs = require('fs');
const path = require('path');

const fp = path.join(process.cwd(), 'drizzle', 'migrations', '0002_enable_rls.sql');
let content = fs.readFileSync(fp, 'utf8');

const BROKEN  = "CREATE OR REPLACE FUNCTION current_setting('app.current_tenant_id', true)::INTEGER";
const CORRECT = "CREATE OR REPLACE FUNCTION current_tenant_id()";

if (!content.includes(BROKEN)) {
  console.error('Pattern not found — verify file manually.');
  process.exit(1);
}

content = content.replace(BROKEN, CORRECT);
fs.writeFileSync(fp, content, 'utf8');
console.log('FIXED: 0002_enable_rls.sql — function name restored.');
console.log('Run: node run-migrate.cjs');