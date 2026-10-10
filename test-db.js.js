// test-db.js
const { Client } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const get = n => { const m = env.match(new RegExp(`^${n}=["']?([^\\n"']+)`, 'm')); return m?.[1]?.trim(); };

const url = get('DATABASE_URL_UNPOOLED') || get('DATABASE_URL');
console.log('URL:', url?.replace(/:[^@:]+@/, ':***@'));

const client = new Client({ connectionString: url });
client.connect()
  .then(() => client.query('SELECT current_database() db, current_user usr, version()'))
  .then(r => { console.log('CONNECTED:', r.rows[0].db, '|', r.rows[0].usr); return client.query('CREATE TABLE _test_drizzle (id int)'); })
  .then(() => { console.log('CREATE: OK'); return client.query('DROP TABLE _test_drizzle'); })
  .then(() => { console.log('DROP: OK — connection fully functional'); client.end(); })
  .catch(e => { console.error('FAIL:', e.message, '| code:', e.code); client.end(); });