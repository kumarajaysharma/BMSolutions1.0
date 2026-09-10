/**
 * neo001-test.js — Native Node.js RLS Concurrency & Isolation Test
 */
require('dotenv').config({ path: '.env.local' });

async function runTest() {
  const limsyToken = process.env.LIMSY_TOKEN;
  const bmsToken = process.env.BMS_TOKEN;

  if (!limsyToken || !bmsToken) {
    console.error("ERROR: Set LIMSY_TOKEN and BMS_TOKEN environment variables first using 'set LIMSY_TOKEN=...'");
    process.exit(1);
  }

  console.log("===========================================================");
  console.log("  NEO-001: RLS Concurrency & Isolation Test (Node.js)");
  console.log("  20 concurrent requests — bms vs limsy tenants");
  console.log("===========================================================\n");

  const totalRequests = 20;
  const promises = [];

  for (let i = 0; i < totalRequests; i++) {
    const isLimsy = i % 2 === 0;
    const token = isLimsy ? limsyToken : bmsToken;
    const tenantTag = isLimsy ? "LIMSY" : "BMS";
    const url = isLimsy 
      ? "https://limsy.bnlvconsulting.com/api/limsy/cases"
      : "https://bms.bnlvconsulting.com/api/limsy/cases";

    promises.push(
      fetch(url, {
        method: "GET",
        headers: { Cookie: `bms_session=${token}` }
      }).then(async res => {
        const text = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch {}
        
        let leak = false;
        let recordCount = Array.isArray(parsed) ? parsed.length : (parsed?.data && Array.isArray(parsed.data) ? parsed.data.length : -1);
        
        if (tenantTag === "BMS" && res.status === 200 && recordCount > 0) {
          leak = true;
        }

        return { index: i, tenant: tenantTag, httpCode: res.status, recordCount, leak };
      }).catch(err => ({
        index: i, tenant: tenantTag, httpCode: 0, recordCount: -1, leak: false, error: err.message
      }))
    );
  }

  const results = await Promise.all(promises);
  results.sort((a, b) => a.index - b.index);

  let leaks = 0;
  let errors = 0;

  results.forEach(r => {
    let icon = r.leak ? "❌ LEAK" : (r.error ? "⚠️  ERR " : "✅     ");
    let detail = r.error ? `ERROR: ${r.error}` : `HTTP ${r.httpCode} | ${r.recordCount} records`;
    console.log(`    [${String(r.index).padStart(2, '0')}] ${r.tenant.padEnd(5)}  ${icon}  ${detail}`);
    if (r.leak) leaks++;
    if (r.error) errors++;
  });

  console.log("\n  ─────────────────────────────────────────────────────────");
  console.log(`  SUMMARY:`);
  console.log(`    Total requests    : ${totalRequests}`);
  console.log(`    Cross-tenant leaks: ${leaks}`);
  console.log(`    Errors            : ${errors}`);
  console.log("  ─────────────────────────────────────────────────────────\n");

  if (leaks === 0 && errors === 0) {
    console.log("  ✅ NEO-001: PASS — Zero cross-tenant leaks.");
  } else if (leaks > 0) {
    console.log("  ❌ NEO-001: FAIL — Cross-tenant leakage detected!");
  } else {
    console.log("  ⚠️  NEO-001: PARTIAL — Completed with network/token errors.");
  }
}

runTest();