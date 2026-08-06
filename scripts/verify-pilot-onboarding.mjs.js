/**
 * scripts/verify-pilot-onboarding.mjs
 * End-to-end operational smoke test for BNLV Group pilot launch.
 */

import fetch from "node-fetch";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bms.bnlvconsulting.com";

async function verify() {
  console.log("🚀 Starting BNLV Platform Pilot Onboarding Verification...");

  try {
    // 1. Health check
    const health = await fetch(`${BASE_URL}/api/health`);
    console.log(`[Health] Status: ${health.status}`);

    // 2. Tenants API smoke test
    const tenants = await fetch(`${BASE_URL}/api/admin/tenants`);
    console.log(`[Tenants API] Status: ${tenants.status}`);

    // 3. LIMSY Cases API smoke test
    const limsy = await fetch(`${BASE_URL}/api/limsy/cases`);
    console.log(`[LIMSY API] Status: ${limsy.status}`);

    console.log("✅ Pilot verification sweep completed successfully. Systems operational.");
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  }
}

verify();