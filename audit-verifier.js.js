// audit-verifier.js
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function runAudit() {
  console.log("=== BNLV GROUP ENTERPRISE AUDIT VERIFIER ===");
  
  // 1. Test Authentication & Session Generation
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: "dev@limsy.bnlvconsulting.com", 
      password: "LimsyArch@2026", 
      tenantSlug: "limsy" 
    })
  });
  
  console.log(`[AUTH] Login Status: ${loginRes.status}`);
  
  // Capture session cookie from response headers
  const setCookie = loginRes.headers.get("set-cookie");
  let cookieHeader = "";
  if (setCookie) {
    const match = setCookie.match(/bms_session=([^;]+)/);
    if (match) {
      cookieHeader = `bms_session=${match[1]}`;
    }
  }
  console.log(`[AUTH] Session Cookie Captured: ${cookieHeader ? "YES" : "NO"}`);

  // 2. Test LIMSY Cases Endpoint with Cookie
  const casesRes = await fetch(`${BASE_URL}/api/limsy/cases`, {
    headers: { "Cookie": cookieHeader }
  });
  console.log(`[LIMSY] Cases Endpoint Status: ${casesRes.status}`);

  // 3. Test Multi-Agent AI Orchestration Engine with Cookie
  const aiRes = await fetch(`${BASE_URL}/api/ai/orchestrate`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookieHeader
    },
    body: JSON.stringify({ 
      task: "Analyse the urgency and preliminary strength of the Article 356 SLP. Should we file for an immediate interim stay?" 
    })
  });
  
  const aiData = await aiRes.json();
  console.log(`[TRACK C] AI Orchestration Status: ${aiRes.status}`, aiData.success ? "SUCCESS" : aiData);
}

runAudit().catch(console.error);