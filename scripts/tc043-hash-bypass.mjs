// TC-043: Plaintext password bypass / Pass-the-Hash prevention
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(2);
}

// Using the local superuser connection to intentionally bypass RLS and grab the raw hash
const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("TC-043 · BLOCKER · Plaintext password bypass removed");

  try {
    // 1. Retrieve the real password_hash from the DB
    const rows = await sql`
      SELECT email, password_hash 
      FROM users 
      WHERE email = 'admin@bms.bnlvconsulting.com' 
      LIMIT 1
    `;
    
    if (rows.length === 0) throw new Error("Target user not found in DB");

    const { email, password_hash } = rows[0];
    console.log(`  Target: ${email}`);
    console.log(`  Hash extracted: ${password_hash.substring(0, 25)}...`);

    // 2. Submit the raw hash string as the plaintext password
    console.log(`\n  Attacking POST https://bms.bnlvconsulting.com/api/auth/login...`);
    
    const response = await fetch("https://bms.bnlvconsulting.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password_hash, // <-- THE ATTACK: Submitting the hash itself
        tenantSlug: "bms"
      })
    });

    const status = response.status;
    console.log(`  Response Code: ${status}`);

    // 3. Evaluate the result
    if (status === 401) {
      console.log("\nRESULT: PASS — API safely rejected raw hash (401 Unauthorized)");
      process.exit(0);
    } else if (status === 200) {
      console.error("\nRESULT: FAIL — CRITICAL: API accepted raw hash as password! Bypass exists.");
      process.exit(1);
    } else {
      console.log(`\nRESULT: INCONCLUSIVE — Unexpected status code ${status}`);
      process.exit(2);
    }

  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(2);
  }
}

run();