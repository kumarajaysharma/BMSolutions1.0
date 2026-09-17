import { Client } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

async function forceMigrate() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false } // Required for Neon/Supabase remote connections
  });

  await client.connect();
  console.log("⚡ Executing BMS Migrations directly...\n");

  const files = [
    "0013_bms_academy_lms.sql",
    "0014_bms_studio_hosting.sql",
    "0015_bms_ops_intelligence.sql"
  ];

  for (const file of files) {
    const filePath = path.join(process.cwd(), "src", "db", "migrations", file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Running ${file}...`);
      const sql = fs.readFileSync(filePath, "utf-8");
      try {
        // Execute the raw SQL from the migration file
        await client.query(sql);
        console.log(`✅ Success: ${file}\n`);
      } catch (e: any) {
        console.error(`❌ Error in ${file}:`, e.message, "\n");
      }
    } else {
      console.error(`❌ File not found: ${filePath}\n`);
    }
  }

  await client.end();
  console.log("🏁 Direct migration execution complete.");
}

forceMigrate();