import { execSync } from 'child_process';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ ERROR: DATABASE_URL is not set in environment.");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  console.log("🚀 Starting Phase C ATP Test Execution...\n");
  let passed = 0;
  let failed = 0;

  const pass = (id, msg) => { console.log(`✅ [PASS] ${id}: ${msg}`); passed++; };
  const fail = (id, msg) => { console.error(`❌ [FAIL] ${id}: ${msg}`); failed++; };

  // ==========================================
  // CLI & BUILD TESTS (TC-059, TC-060)
  // ==========================================
  console.log("--- CLI & Build Verifications ---");
  try {
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
    pass('TC-060', 'TypeScript compiler returned 0 errors.');
  } catch (e) {
    fail('TC-060', 'TypeScript compiler found errors.');
  }

  try {
    const drift = execSync('npx drizzle-kit check', { encoding: 'utf8' });
    if (drift.includes('No schema changes')) {
      pass('TC-059', 'drizzle-kit check found zero schema drift.');
    } else {
      fail('TC-059', 'Schema drift detected.');
    }
  } catch (e) {
    fail('TC-059', 'drizzle-kit check execution failed.');
  }

  // ==========================================
  // DATABASE RLS & POLICY TESTS
  // ==========================================
  console.log("\n--- Database RLS & Immutable Tests ---");
  await client.connect();

  try {
    // TC-047: tmp_studio_app_bypass removal
    const policyCheck = await client.query(`
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND policyname = 'tmp_studio_app_bypass';
    `);
    if (policyCheck.rowCount === 0) pass('TC-047', 'tmp_studio_app_bypass is confirmed absent.');
    else fail('TC-047', 'tmp_studio_app_bypass policy still exists!');

    // Initialize RLS context as tenant 10 (bms)
    await client.query("BEGIN;");
    await client.query("SET LOCAL role = 'studio_app';");
    await client.query("SET LOCAL app.current_tenant_id = '10';");

    // Helper to check cross-tenant counts
    const checkIsolation = async (id, table, query, expected = 0) => {
      try {
        const res = await client.query(query);
        if (parseInt(res.rows[0].count, 10) === expected) {
          pass(id, `${table} isolated correctly (0 rows visible).`);
        } else {
          fail(id, `${table} isolation failure! Found ${res.rows[0].count} rows.`);
        }
      } catch (err) {
        if (err.message.includes('permission denied')) {
           pass(id, `${table} isolated correctly (permission denied).`);
        } else {
           fail(id, `${table} query failed: ${err.message}`);
        }
      }
    };

    // Execute Isolation Tests
    await checkIsolation('TC-042', 'sessions', "SELECT COUNT(*) FROM sessions WHERE tenant_id = 4;");
    await checkIsolation('TC-046', 'limsy_cases', "SELECT COUNT(*) FROM limsy_cases;");
    await checkIsolation('TC-054', 'vault_secrets', "SELECT COUNT(*) FROM vault_secrets WHERE tenant_id != 10;");
    await checkIsolation('TC-055', 'limsy_documents', "SELECT COUNT(*) FROM limsy_documents;");
    await checkIsolation('TC-056', 'nidhivan_metrics', "SELECT COUNT(*) FROM nidhivan_financial_metrics;");
    await checkIsolation('BMS-001', 'bms_courses', "SELECT COUNT(*) FROM bms_courses WHERE tenant_id = 7;");
    await checkIsolation('BMS-004', 'bms_cohort_members', "SELECT COUNT(*) FROM bms_cohort_members WHERE tenant_id = 7;");
    await checkIsolation('BMS-007', 'bms_studio_projects', "SELECT COUNT(*) FROM bms_studio_projects WHERE tenant_id = 4;");
    await checkIsolation('BMS-010', 'bms_ai_agents', "SELECT COUNT(*) FROM bms_ai_agents WHERE tenant_id = 7;");
    await checkIsolation('BMS-011', 'bms_host_containers', "SELECT COUNT(*) FROM bms_host_containers WHERE tenant_id = 7;");
    await checkIsolation('BMS-012', 'bms_dns_records', "SELECT COUNT(*) FROM bms_dns_records WHERE tenant_id = 7;");
    await checkIsolation('BMS-014', 'bms_discussions', "SELECT COUNT(*) FROM bms_discussions WHERE tenant_id = 7;");

    // TC-057 & TC-058: Immutable Table Tests (DELETE & TRUNCATE blocks)
    const checkImmutable = async (id, cmd, table) => {
      try {
        await client.query(`${cmd} ${table}`);
        fail(id, `${cmd} succeeded on ${table} - IMMUTABILITY BROKEN!`);
      } catch (err) {
        if (err.message.includes('permission denied')) {
          pass(id, `${cmd} blocked on ${table} as expected.`);
        } else {
          fail(id, `Unexpected error on ${cmd} ${table}: ${err.message}`);
        }
      }
    };

    await checkImmutable('TC-057', 'DELETE FROM', 'nidhivan_journals');
    await checkImmutable('TC-057', 'DELETE FROM', 'bms_certificates');
    await checkImmutable('TC-057', 'DELETE FROM', 'limsy_documents');
    await checkImmutable('TC-058', 'TRUNCATE', 'nidhivan_journals');

    await client.query("ROLLBACK;");
  } catch (err) {
    console.error("Database test execution failed:", err);
  } finally {
    await client.end();
  }

  console.log("\n==========================================");
  console.log(`🏁 ATP Execution Complete. PASS: ${passed} | FAIL: ${failed}`);
  
  if (failed > 0) {
    console.log("⚠️ BLOCKER / CRITICAL failures detected. NO-GO for launch.");
    process.exit(1);
  } else {
    console.log("✅ All automated DB & Build gates cleared. Proceed to API/Auth manual testing.");
  }
}

runTests();