'use strict';
const { Client } = require('pg');
const { readFileSync } = require('fs');
const path = require('path');

const ef = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const get = k => (ef.match(new RegExp('^' + k + '=(.+)', 'm')) || [])[1]
  ?.replace(/^["']|["']$/g, '').trim();

const url = get('DATABASE_URL_UNPOOLED') || get('DATABASE_URL');
console.log('URL:', url?.replace(/:([^:@]+)@/, ':***@'));

const client = new Client({ connectionString: url });
(async () => {
  try {
    await client.connect();
    console.log('CONNECTED OK');
    const r1 = await client.query("SELECT version()");
    console.log('PG version:', r1.rows[0].version.split(' ').slice(0,2).join(' '));
    const r2 = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'");
    console.log('Public tables:', r2.rows[0].count);
    const r3 = await client.query("SELECT count(*) FROM drizzle.\"__drizzle_migrations\"");
    console.log('Migration rows:', r3.rows[0].count);
    await client.end();
  } catch(e) {
    console.error('ERROR:', e.message);
    if (e.code) console.error('code:', e.code);
    try { await client.end(); } catch(_) {}
    process.exit(1);
  }
})();
