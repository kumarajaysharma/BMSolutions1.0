async function run() {
  const bms = await fetch('https://bms.bnlvconsulting.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bms.bnlvconsulting.com', password: 'Admin123!', tenantSlug: 'bms' })
  });
  const bmsC = bms.headers.get('set-cookie')?.split(';')[0];
  const lim = await fetch('https://limsy.bnlvconsulting.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'architect@limsy.bnlvconsulting.com', password: 'LimsyArch@2026', tenantSlug: 'limsy' })
  });
  const limC = lim.headers.get('set-cookie')?.split(';')[0];
  if (!bmsC || !limC) { console.error('Auth failed'); return; }
  const bT = bmsC.replace('bms_session=', '');
  const lT = limC.replace('bms_session=', '');
  console.log('Authenticated both tenants. Running NEO-001...');
  const p = [];
  for (let i = 0; i < 20; i++) {
    const isL = i % 2 === 0;
    const t = isL ? lT : bT;
    const tag = isL ? 'LIMSY' : 'BMS';
    const u = isL ? 'https://limsy.bnlvconsulting.com/api/limsy/cases' : 'https://bms.bnlvconsulting.com/api/limsy/cases';
    p.push(fetch(u, { method: 'GET', headers: { Cookie: 'bms_session=' + t } })
      .then(async r => {
        const txt = await r.text();
        let d = null; try { d = JSON.parse(txt); } catch {}
        const cnt = Array.isArray(d) ? d.length : (d?.data && Array.isArray(d.data) ? d.data.length : -1);
        const l = (tag === 'BMS' && r.status === 200 && cnt > 0);
        return { index: i, tenant: tag, status: r.status, count: cnt, leak: l };
      })
      .catch(e => ({ index: i, tenant: tag, status: 0, count: -1, leak: false, error: e.message })));
  }
  const res = await Promise.all(p);
  res.sort((a, b) => a.index - b.index);
  let lks = 0, errs = 0;
  res.forEach(r => {
    const ic = r.leak ? 'LEAK' : (r.error ? 'ERR' : 'OK');
    console.log('[' + String(r.index).padStart(2, '0') + '] ' + r.tenant + ' ' + ic + ' HTTP ' + r.status + ' | ' + r.count + ' records');
    if (r.leak) lks++; if (r.error) errs++;
  });
  console.log('Leaks=' + lks + ', Errors=' + errs);
  if (lks === 0 && errs === 0) console.log('NEO-001: PASS');
}
run();
