// fix-0005-noop.cjs
'use strict';
const fs   = require('fs');
const path = require('path');

const fp = path.join(process.cwd(), 'drizzle', 'migrations', '0005_nidhivan_rls_hardening.sql');
fs.writeFileSync(fp,
`-- 0005_nidhivan_rls_hardening.sql  [DEFERRED — intentional no-op]
-- nidhivan core tables are created after this migration in the sequence.
-- All nidhivan RLS isolation policies will be applied via rls-hardening.sql
-- after the full migration set completes.

DO $$ BEGIN END $$;
`, 'utf8');

console.log('REPLACED: 0005 → no-op');
console.log('Run: node run-migrate.cjs');