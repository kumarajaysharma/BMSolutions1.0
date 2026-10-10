// debug-0005.cjs
'use strict';
const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const MIG = path.join(process.cwd(), 'drizzle', 'migrations');
const ef  = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const get = k => (ef.match(new RegExp('^' + k + '=(.+)', 'm')) || [])[1]
  ?.replace(/^["']|["']$/g, '').trim();

const client = new Client({ connectionString: get('DATABASE_URL_UNPOOLED') || get('DATABASE_URL') });

async function run() {
  await client.connect();
  const journal = JSON.parse(fs.readFileSync(path.join(MIG, 'meta/_journal.json'), 'utf8'));

  await client.query('BEGIN');

  // Run prerequisites 0000-0004 silently to establish state
  const prereqs = journal.entries.filter(e => e.idx < 5).sort((a,b) => a.idx - b.idx);
  process.stdout.write(`Running ${prereqs.length} prerequisites...`);
  for (const e of prereqs) {
    await client.query(fs.readFileSync(path.join(MIG, e.tag + '.sql'), 'utf8'))
      .catch(err => { console.error(`\nPREREQ FAILED: ${e.tag}\n  ${err.message}`); process.exit(1); });
    process.stdout.write(' ' + e.tag.split('_')[0]);
  }

  // Inventory check
  const tbls = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'nidhivan_%' ORDER BY 1`);
  const seqs = await client.query(`SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public' AND sequence_name LIKE 'nidhivan_%' ORDER BY 1`);
  console.log('\n\nNidhivan tables:   ', tbls.rows.map(r => r.table_name));
  console.log('Nidhivan sequences:', seqs.rows.map(r => r.sequence_name));

  // Run 0005 statement by statement
  console.log('\n--- 0005 statement-by-statement ---');
  const sql = fs.readFileSync(path.join(MIG, '0005_nidhivan_rls_hardening.sql'), 'utf8')
    .replace(/--[^\n]*/g, '').trim();

  // Split on ; at end of line (0005 has no $$ blocks)
  const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(s => s.length > 3);

  for (let i = 0; i < stmts.length; i++) {
    const preview = stmts[i].replace(/\s+/g, ' ').slice(0, 90);
    try {
      await client.query(stmts[i] + ';');
      console.log(`  ✓ [${i+1}] ${preview}`);
    } catch (e) {
      console.error(`\n  ✗ [${i+1}] ${preview}`);
      console.error(`     error:    ${e.message}`);
      if (e.code)     console.error(`     SQLSTATE: ${e.code}`);
      if (e.detail)   console.error(`     detail:   ${e.detail}`);
      if (e.hint)     console.error(`     hint:     ${e.hint}`);
      if (e.position) console.error(`     position: ${e.position}`);
      break;
    }
  }

  await client.query('ROLLBACK');
  console.log('\nRolled back — no changes persisted.');
  await client.end();
}

run().catch(e => { console.error('Fatal:', e.message); client.end(); process.exit(1); });