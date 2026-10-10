// debug-all.cjs
'use strict';
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIG = path.join(process.cwd(), 'drizzle', 'migrations');
const ef  = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const get = k => (ef.match(new RegExp('^' + k + '=(.+)', 'm')) || [])[1]
  ?.replace(/^["']|["']$/g, '').trim();

const client = new Client({ connectionString: get('DATABASE_URL_UNPOOLED') || get('DATABASE_URL') });

const stmts = sql => sql.includes('--> statement-breakpoint')
  ? sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 3)
  : [sql.trim()];

async function run() {
  await client.connect();
  const { entries } = JSON.parse(fs.readFileSync(path.join(MIG, 'meta/_journal.json'), 'utf8'));
  entries.sort((a, b) => a.idx - b.idx);
  await client.query('BEGIN');

  for (const { tag } of entries) {
    const fp = path.join(MIG, tag + '.sql');
    if (!fs.existsSync(fp)) { console.log(`SKIP: ${tag}`); continue; }

    const ss = stmts(fs.readFileSync(fp, 'utf8'));
    let ok = true;
    for (let i = 0; i < ss.length; i++) {
      const s = ss[i].trim();
      if (!s || s.replace(/--[^\n]*/g, '').trim().length === 0) continue;
      try { await client.query(s); }
      catch (e) {
        console.error(`\n✗ ${tag}  [stmt ${i+1}/${ss.length}]`);
        console.error(`  sql:      ${s.replace(/\s+/g, ' ').slice(0, 110)}`);
        console.error(`  error:    ${e.message}`);
        if (e.code)   console.error(`  SQLSTATE: ${e.code}`);
        if (e.detail) console.error(`  detail:   ${e.detail}`);
        if (e.hint)   console.error(`  hint:     ${e.hint}`);
        ok = false; break;
      }
    }
    if (ok) console.log(`✓ ${tag}`);
    else break;
  }

  await client.query('ROLLBACK');
  console.log('\nRolled back — nothing committed.');
  await client.end();
}
run().catch(e => { console.error('Fatal:', e.message); client.end(); process.exit(1); });