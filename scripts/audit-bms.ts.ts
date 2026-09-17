import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function audit() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("🔍 Running BMS Module Database Audit...\n");

  const expectedTables = [
    "bms_courses", "bms_learning_paths", "bms_enrollments", "bms_ai_agents",
    "bms_studio_projects", "bms_host_containers", "bms_code_red_cases", "bms_gates"
  ];

  let allPassed = true;
  for (const table of expectedTables) {
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      );
    `, [table]);
    
    if (res.rows[0].exists) {
      console.log(`✅ Table '${table}' verified.`);
    } else {
      console.log(`❌ Table '${table}' MISSING.`);
      allPassed = false;
    }
  }
  
  console.log(allPassed ? "\n✅ ALL AUDITS PASSED. Safe to proceed to Step 6." : "\n❌ AUDIT FAILED.");
  await client.end();
}

audit();