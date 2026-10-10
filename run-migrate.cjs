'use strict';
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { readFileSync } = require('fs');
const path = require('path');

// Load env without dotenvx
const ef = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const get = k => (ef.match(new RegExp('^' + k + '=(.+)', 'm')) || [])[1]
  ?.replace(/^["']|["']$/g, '').trim();

const url = get('DATABASE_URL_UNPOOLED') || get('DATABASE_URL');
if (!url) { console.error('No DATABASE_URL found in .env.local'); process.exit(1); }
console.log('URL:', url.replace(/:([^:@]+)@/, ':***@'));

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

console.log('Starting programmatic migrate...');

migrate(db, {
  migrationsFolder: './drizzle/migrations',
  migrationsSchema: 'drizzle',
  migrationsTable: '__drizzle_migrations'
}).then(() => {
  console.log('\nSUCCESS: All migrations applied.');
  return pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'");
}).then(r => {
  console.log('Public tables now:', r.rows[0].count);
  pool.end();
}).catch(err => {
  console.error('\nFAILED:');
  console.error('  message:', err.message);
  if (err.code)    console.error('  code:   ', err.code);
  if (err.detail)  console.error('  detail: ', err.detail);
  if (err.hint)    console.error('  hint:   ', err.hint);
  if (err.where)   console.error('  where:  ', err.where);
  if (err.routine) console.error('  routine:', err.routine);
  pool.end();
  process.exit(1);
});
