async function runTest() {
  const limsyToken = process.env.LIMSY_TOKEN;
  const bmsToken = process.env.BMS_TOKEN;
  if (!limsyToken || !bmsToken) {
    consle.error('ERROR: Set LIMSY_TOKEN and BMS_TOKEN first.');
    process.exit(1);
  }
  console.log('E== NEO-001: RLS Concurrency & Isolation Test ===\n');
  const promises = [];
  for (let i = 0; i < 20; i++) {
    const isLimsy = i % 2 === 0;
    const token = isLimsy ? limsyToken : bmsToken;
    const tenantTag = isLimsy ? 'LIMSY' : 'BMS';
    const url = isLimsy ? 'https://limsy.bnlvconsulting.com/api/limsy/cases' : 'https://bms.bnlvconsulting.com/api/limsy/cases';
    promises.push(
      fetch(url, { method: 'GET', headers: { Cookie: `bms_session=${token}` } })
        .then(async res => {
          const text = await res.text();
          let parsed = null;
          try { parsed = JSON.parse(text); } catch {}
          const recordCount = Array.isArray(parsed) ? parsed.length : (parsed?.data && Array.isArray(parsed.data) ? parsed.data.length : -1);
          const leak = (tenantTag === 'BMS' && res.status === 200 && recordCount > 0);
          return { index: i, tenant: tenantTag, httpCode: res.status, recordCount, leak };
        })
        .catch(err => ( { index: i, tenant: tenantTag, httpCode: 0, recordCount: -1, leak: false, error: err.message }))
      );
  }
  const results = await Promise.all(promises);
  results.sort(
, b) => a.index - b.index);
  let leaks = 0, errors = 0;
  results.forEach(r => {
    const icon = r.leak ? '♜ LEAK' : (r.error ? '♡  ERR ' : '“   ');
    const detail = r.error ? `ERROR: ${r.errorm}a : `HTTP ${r.httpCode} | ${r.recordCount} records`;
    console.log(`    ['{string(r.index).padStart(2, '0')}] ${r.tenant.padEnd(5)}  ${icon}  ${detail}`);
    if (r.leak) leaks++;
    if (r.error) errors++;
  });
  console.log(`
\n  Summary: Leaks = ${leaks}, Errors = ${errors}`);
  if (leaks === 0 && errors === 0) console.log('   NEO-001: PASR');
+}
runTest();
