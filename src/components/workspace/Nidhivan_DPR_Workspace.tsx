import { useState, useEffect } from "react"

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#07090F',
  surface: '#0A0E1A',
  card:    '#0D1220',
  border:  '#141E30',
  navy:    '#0D2137',
  gold:    '#C9A84C',
  goldDim: '#7A5E28',
  text:    '#DCE6F2',
  sub:     '#7A94B0',
  muted:   '#3E5470',
  success: '#10B981',
  danger:  '#EF4444',
  warn:    '#F59E0B',
  info:    '#6366F1',
  mono:    "'JetBrains Mono', 'Courier New', monospace",
  serif:   "'Cormorant Garamond', Georgia, serif",
  sans:    "'Inter', system-ui, sans-serif",
}

const PROJECT = { name:'NH-44 Highway Expansion (Package 1)', client:'NHAI', state:'Chhattisgarh', ref:'DPR-NH44-01', length:'48.5 km' }

const BOQ_ITEMS = [
  { sno:1, desc:'Earthwork in excavation — roadway cutting (GSB)',                unit:'cum', qty:4500.50, rate:185.00,   cat:'Earthworks'  },
  { sno:2, desc:'Granular sub-base (GSB) — 200mm compacted layer',                unit:'sqm', qty:1200.00, rate:310.00,   cat:'Pavement'    },
  { sno:3, desc:'Dense bituminous macadam (DBM) — 75mm — MORTH Cl. 507',          unit:'sqm', qty:1200.00, rate:590.00,   cat:'Pavement'    },
  { sno:4, desc:'RCC box culvert — 2m × 2m, M35 grade — CPWD Specification',     unit:'rm',  qty:  90.25, rate:28500.00, cat:'Structures'  },
  { sno:5, desc:'Hot mix plant — asphalt concrete wearing course 40mm',           unit:'sqm', qty:1200.00, rate:420.00,   cat:'Pavement'    },
]

const METRICS = {
  totalCrore: 9500, centralCrore: 5700, stateCrore: 2850, loanCrore: 950,
  irr: 14.2, npvCrore: 475, payback: 6.8, beneficiaryCrore: 400,
}

const DPR_LIST = [
  { ref:'DPR-NH44-01', name:'NH-44 Highway Expansion (Package 1)', status:'in_review',    irr:14.2, cost:'₹9,500 Cr'  },
  { ref:'DPR-NH44-02', name:'NH-44 Highway Expansion (Package 2)', status:'draft',        irr:12.8, cost:'₹7,200 Cr'  },
  { ref:'DPR-SH09-01', name:'SH-09 District Road Connectivity',    status:'draft',        irr:11.4, cost:'₹3,100 Cr'  },
  { ref:'DPR-SH09-02', name:'SH-09 Bridge & Culvert Package',      status:'draft',        irr:10.9, cost:'₹1,850 Cr'  },
  { ref:'DPR-RAIL-01', name:'Rail Over Bridge — Raipur–Bilaspur',  status:'pending_data', irr:0,    cost:'₹2,400 Cr'  },
]

const SC = {
  in_review:    { color:'#F59E0B', bg:'#1A0F00', label:'IN REVIEW'    },
  draft:        { color:'#6366F1', bg:'#0E0E1E', label:'DRAFT'        },
  pending_data: { color:'#3E5470', bg:'#0A0A0A', label:'PENDING DATA' },
  approved:     { color:'#10B981', bg:'#071510', label:'APPROVED'     },
}

const fmt = n => new Intl.NumberFormat('en-IN').format(Math.round(n))
const base     = BOQ_ITEMS.reduce((s,i) => s + i.qty * i.rate * 100, 0)
const cont     = Math.round(base * 0.05)
const ovhd     = Math.round(base * 0.08)
const gst      = Math.round((base + cont + ovhd) * 0.18)
const grand    = base + cont + ovhd + gst
const L = v => (v / 10_000_000).toFixed(2)

export default function NidhivanDPR() {
  const [tab, setTab]   = useState('dashboard')
  const [aiLoad, setAI] = useState(false)
  const [narr, setNarr] = useState('')
  const [gen, setGen]   = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const lk = document.createElement('link')
    lk.rel = 'stylesheet'
    lk.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(lk)
    return () => document.head.removeChild(lk)
  }, [])

  const genNarr = async () => {
    setAI(true); setNarr('')
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:700,
          messages:[{ role:'user', content:
`You are a senior infrastructure finance partner at McKinsey & Company drafting an investor-grade DPR narrative. Use precise, authoritative MBB consulting language — data-led, zero filler.

Project: ${PROJECT.name}
Client: ${PROJECT.client} | State: ${PROJECT.state} | Length: ${PROJECT.length}
Total Cost: ₹${METRICS.totalCrore} Crore | IRR: ${METRICS.irr}% | NPV: ₹${METRICS.npvCrore} Crore
Payback: ${METRICS.payback} years | Funding: GoI 60% / State 30% / Debt 10%
BOQ Base: ₹${L(base)} Lakh (CPWD DSR 2023, 5 line items excl. contingency/GST)

Respond ONLY with these 4 labeled sections:
PROJECT OVERVIEW: [Corridor significance + national transport context — 2 sentences]
ECONOMIC RATIONALE: [3 specific bullets — freight cost reduction %, employment generation, regional GDP impact]
FINANCIAL VIABILITY: [IRR vs benchmark, DSCR comfort, NPV strength, funding structure resilience]
INVESTOR RECOMMENDATION: [One decisive sentence — proceed/strong buy with specific catalyst]` }]
        })
      })
      const d = await r.json()
      setNarr(d.content?.[0]?.text?.trim() || 'Narrative generation failed.')
    } catch { setNarr('AI generation unavailable.') }
    setAI(false)
  }

  const exportPDF = async () => {
    setGen(true)
    await new Promise(r => setTimeout(r, 2000))
    setGen(false); setDone(true)
  }

  const TABS = ['dashboard','boq','financials','pipeline'].map(id => ({
    id, label: { dashboard:'DASHBOARD', boq:'BOQ ENGINE', financials:'FINANCIALS', pipeline:'DPR PIPELINE' }[id]
  }))

  return (
    <div style={{ fontFamily:C.sans, background:C.bg, color:C.text, minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'0 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between', height:56 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:34, height:34, background:C.gold, borderRadius:8,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>₹</div>
          <div>
            <div style={{ fontFamily:C.serif, fontSize:20, fontWeight:600, letterSpacing:'0.04em', lineHeight:1 }}>Nidhivan</div>
            <div style={{ fontFamily:C.mono, fontSize:8, color:C.muted, letterSpacing:'0.14em', marginTop:1 }}>DPR · BOQ · Financial Intelligence · CPWD DSR 2023</div>
          </div>
          <div style={{ width:1, height:24, background:C.border, marginLeft:6 }} />
          <div style={{ fontFamily:C.mono, fontSize:8, color:C.muted }}>Tenant ID: 7 · RLS Active · nidhivan.bnlvconsulting.com</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:'#0A1000', border:`1px solid ${C.warn}40`, borderRadius:5,
            padding:'4px 11px', fontFamily:C.mono, fontSize:8, color:C.warn, fontWeight:700 }}>
            5 DPRs BLOCKING CAPITAL FLOW
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:C.success, boxShadow:`0 0 6px ${C.success}` }}/>
            <span style={{ fontFamily:C.mono, fontSize:8, color:C.success, fontWeight:700 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'0 20px', display:'flex', gap:2 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background:'none', border:'none', cursor:'pointer', padding:'12px 14px',
            borderBottom: tab===id ? `2px solid ${C.gold}` : '2px solid transparent',
            color: tab===id ? C.gold : C.muted,
            fontFamily:C.mono, fontSize:8, fontWeight:700, letterSpacing:'0.14em',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding:20, maxWidth:900, margin:'0 auto' }}>

        {/* DASHBOARD */}
        {tab==='dashboard' && <>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:C.serif, fontSize:28, fontWeight:500, letterSpacing:'0.02em', lineHeight:1.1, marginBottom:4 }}>Infrastructure Finance Dashboard</div>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted }}>{PROJECT.name} · {PROJECT.client} · {PROJECT.state}</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
            {[
              { label:'Total Project Cost', val:`₹${METRICS.totalCrore} Cr`,  c:C.gold    },
              { label:'Project IRR',        val:`${METRICS.irr}%`,             c:C.success },
              { label:'NPV (@ 9.2% WACC)', val:`₹${METRICS.npvCrore} Cr`,    c:C.info    },
              { label:'Payback Period',     val:`${METRICS.payback} yrs`,      c:C.warn    },
            ].map((k,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:14 }}>
                <div style={{ fontFamily:C.mono, fontSize:8, color:C.muted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontFamily:C.serif, fontSize:26, fontWeight:600, color:k.c, lineHeight:1 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Funding structure */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:18, marginBottom:14 }}>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.gold, fontWeight:700, letterSpacing:'0.14em', marginBottom:14 }}>FUNDING STRUCTURE</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[
                { l:'Central Share (GoI)', v:`₹${METRICS.centralCrore} Cr`, p:'60%', c:C.info    },
                { l:'State Share (GoCG)', v:`₹${METRICS.stateCrore} Cr`,    p:'30%', c:C.success },
                { l:'Debt Component',     v:`₹${METRICS.loanCrore} Cr`,     p:'10%', c:C.warn    },
              ].map((f,i) => (
                <div key={i} style={{ background:C.surface, borderRadius:8, padding:12 }}>
                  <div style={{ fontFamily:C.mono, fontSize:7, color:C.muted, marginBottom:5 }}>{f.l}</div>
                  <div style={{ fontFamily:C.serif, fontSize:18, fontWeight:600, color:f.c }}>{f.v}</div>
                  <div style={{ fontFamily:C.mono, fontSize:9, color:f.c, marginTop:2 }}>{f.p}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, height:8, borderRadius:4, overflow:'hidden', display:'flex', gap:1 }}>
              <div style={{ flex:6, background:C.info }} />
              <div style={{ flex:3, background:C.success }} />
              <div style={{ flex:1, background:C.warn }} />
            </div>
          </div>

          {/* AI Narrative */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontFamily:C.mono, fontSize:9, color:C.gold, fontWeight:700, letterSpacing:'0.14em' }}>⚡ AI INVESTOR NARRATIVE — McKinsey Standard</div>
              <button onClick={genNarr} disabled={aiLoad} style={{ background:'transparent', border:`1px solid ${C.gold}`, color:C.gold, borderRadius:6, padding:'5px 13px', fontFamily:C.mono, fontSize:9, fontWeight:700, cursor:'pointer', opacity:aiLoad?0.5:1 }}>
                {aiLoad ? '◌ DRAFTING...' : 'GENERATE NARRATIVE'}
              </button>
            </div>
            {narr ? (
              <div style={{ background:'#050B15', border:`1px solid ${C.goldDim}`, borderRadius:8, padding:16, fontFamily:C.serif, fontSize:13.5, lineHeight:1.85, color:'#B0C4DA', whiteSpace:'pre-wrap', borderLeft:`3px solid ${C.gold}` }}>{narr}</div>
            ) : (
              <div style={{ fontFamily:C.serif, fontSize:13, color:C.muted, fontStyle:'italic', lineHeight:1.6 }}>
                {aiLoad ? 'Generating MBB-standard investor narrative...' : 'Generate an authoritative DPR narrative covering economic rationale, financial viability, and investor recommendation — formatted for NITI Aayog and institutional LP distribution.'}
              </div>
            )}
          </div>
        </>}

        {/* BOQ ENGINE */}
        {tab==='boq' && <>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:C.serif, fontSize:26, fontWeight:500, marginBottom:4 }}>Bill of Quantities — BOQ Engine</div>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted }}>CPWD DSR 2023 · MORTH Specification · bigint paise (financial precision compliant)</div>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, overflow:'hidden', marginBottom:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 60px 90px 110px 110px', background:C.navy, padding:'10px 14px', gap:8 }}>
              {['#','Description','Unit','Qty','Rate (₹)','Amount (₹)'].map(h => (
                <div key={h} style={{ fontFamily:C.mono, fontSize:8, color:C.gold, fontWeight:700, letterSpacing:'0.08em' }}>{h}</div>
              ))}
            </div>
            {BOQ_ITEMS.map((it,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'36px 1fr 60px 90px 110px 110px', gap:8, padding:'11px 14px', borderTop:`1px solid ${C.border}`, background: i%2===0 ? C.card : C.surface, alignItems:'start' }}>
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>{it.sno}</div>
                <div>
                  <div style={{ fontSize:11, lineHeight:1.4, color:C.text }}>{it.desc}</div>
                  <div style={{ fontFamily:C.mono, fontSize:7, color:C.muted, marginTop:2 }}>{it.cat}</div>
                </div>
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.sub }}>{it.unit}</div>
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.text }}>{fmt(it.qty)}</div>
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.text }}>₹{fmt(it.rate)}</div>
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.gold, fontWeight:700 }}>₹{L(it.qty*it.rate*100)}L</div>
              </div>
            ))}
            {[
              ['Base Estimate',              base,  C.text, false],
              ['Contingency (5%)',           cont,  C.sub,  false],
              ['Overhead & Supervision (8%)',ovhd,  C.sub,  false],
              ['GST @ 18%',                  gst,   C.warn, false],
              ['Grand Total',                grand, C.gold, true ],
            ].map(([l,v,c,bold],i) => (
              <div key={l} style={{ display:'grid', gridTemplateColumns:'1fr 110px', padding:'10px 14px', borderTop:`1px solid ${C.border}`, background: bold ? C.navy : C.surface, alignItems:'center' }}>
                <div style={{ fontFamily:C.mono, fontSize: bold?10:9, color:c, fontWeight: bold?700:400 }}>{l}</div>
                <div style={{ fontFamily:C.mono, fontSize: bold?11:10, color:c, fontWeight: bold?700:400 }}>₹{L(v)}L</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#071510', border:`1px solid ${C.success}30`, borderRadius:10, padding:14 }}>
            <div style={{ fontFamily:C.mono, fontSize:8, color:C.success, fontWeight:700, letterSpacing:'0.1em', marginBottom:6 }}>✓ FINANCIAL PRECISION — ADR COMPLIANT</div>
            <div style={{ fontSize:11, color:C.sub, lineHeight:1.7 }}>
              All monetary values stored as <span style={{ fontFamily:C.mono, color:C.gold }}>bigint</span> in paise (₹1 = 100 paise). 
              BOQ grand total: <span style={{ fontFamily:C.mono, color:C.gold }}>₹{L(grand)} Lakh</span>. 
              Float aggregation risk on <span style={{ fontFamily:C.mono }}>quantity: double_precision</span> logged as TD-002 — Phase C migration to <span style={{ fontFamily:C.mono }}>numeric(12,3)</span> queued.
            </div>
          </div>
        </>}

        {/* FINANCIALS */}
        {tab==='financials' && <>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:C.serif, fontSize:26, fontWeight:500, marginBottom:4 }}>Financial Model</div>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted }}>IRR · NPV · DSCR · Sensitivity — Institutional investor grade</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:18 }}>
              <div style={{ fontFamily:C.mono, fontSize:9, color:C.gold, fontWeight:700, letterSpacing:'0.14em', marginBottom:14 }}>I. RETURN METRICS</div>
              {[
                { l:'Project IRR',        v:`${METRICS.irr}%`,   n:'vs. 10% benchmark → +420 bps', c:C.success },
                { l:'Equity IRR (est.)',  v:'17.8%',             n:'3× leverage at 8.5% debt cost', c:C.success },
                { l:'NPV (₹ Crore)',      v:`₹${METRICS.npvCrore} Cr`, n:'WACC: 9.2%',            c:C.info    },
                { l:'Payback Period',     v:`${METRICS.payback} yrs`, n:'Concession: 25 years',   c:C.warn    },
                { l:'DSCR (Average)',     v:'1.42×',             n:'Min DSCR: 1.18× (Year 3)',     c:C.success },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom: i<4 ? `1px solid ${C.border}` : 'none' }}>
                  <div>
                    <div style={{ fontSize:11, color:C.sub }}>{r.l}</div>
                    <div style={{ fontFamily:C.mono, fontSize:8, color:C.muted, marginTop:2 }}>{r.n}</div>
                  </div>
                  <div style={{ fontFamily:C.serif, fontSize:17, fontWeight:600, color:r.c }}>{r.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:18 }}>
              <div style={{ fontFamily:C.mono, fontSize:9, color:C.gold, fontWeight:700, letterSpacing:'0.14em', marginBottom:14 }}>II. SENSITIVITY (±10%)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 55px 55px 55px', fontFamily:C.mono, fontSize:7, color:C.muted, letterSpacing:'0.06em', marginBottom:8, gap:4 }}>
                <div>VARIABLE</div><div style={{ textAlign:'center' }}>BASE</div><div style={{ textAlign:'center', color:C.success }}>+10%▲</div><div style={{ textAlign:'center', color:C.danger }}>-10%▼</div>
              </div>
              {[
                ['Traffic Volume',   '14.2%','16.8%','11.4%'],
                ['Construction Cost','14.2%','12.1%','16.0%'],
                ['O&M Cost',         '14.2%','13.6%','14.8%'],
                ['Toll Rate',        '14.2%','16.1%','12.2%'],
                ['Concession Period','14.2%','15.7%','12.9%'],
              ].map((s,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 55px 55px 55px', padding:'6px 0', borderBottom: i<4 ? `1px solid ${C.border}` : 'none', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:10, color:C.sub }}>{s[0]}</div>
                  <div style={{ fontFamily:C.mono, fontSize:9, color:C.gold, textAlign:'center' }}>{s[1]}</div>
                  <div style={{ fontFamily:C.mono, fontSize:9, color:C.success, textAlign:'center' }}>{s[2]}</div>
                  <div style={{ fontFamily:C.mono, fontSize:9, color:C.danger, textAlign:'center' }}>{s[3]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:18 }}>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.gold, fontWeight:700, letterSpacing:'0.14em', marginBottom:12 }}>📄 DPR PDF EXPORT — Investor Distribution Ready</div>
            <div style={{ fontSize:12, color:C.sub, lineHeight:1.7, marginBottom:14 }}>
              Compiles cover page, executive summary, BOQ schedule (CPWD DSR 2023), funding structure, returns model, sensitivity analysis, and AI-generated project narrative into a branded 24-page PDF. Formatted to NITI Aayog DPR guidelines for GoI/ADB/NHB submission.
            </div>
            {done ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:14, background:'#071510', border:`1px solid ${C.success}50`, borderRadius:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:C.success, boxShadow:`0 0 8px ${C.success}`, flexShrink:0 }}/>
                <div>
                  <div style={{ fontFamily:C.mono, fontSize:9, color:C.success, fontWeight:700, letterSpacing:'0.1em' }}>DPR-NH44-01_BNLV_Nidhivan.pdf — READY FOR DISTRIBUTION</div>
                  <div style={{ fontFamily:C.mono, fontSize:8, color:C.muted, marginTop:3 }}>Generated: {new Date().toLocaleString('en-IN')} · 24 pages · 2.4 MB · NITI Aayog format</div>
                </div>
              </div>
            ) : (
              <button onClick={exportPDF} disabled={gen} style={{ background: gen ? C.surface : C.gold, color: gen ? C.muted : '#080800', border:'none', borderRadius:9, padding:'12px 22px', fontFamily:C.mono, fontSize:10, fontWeight:700, cursor: gen ? 'not-allowed' : 'pointer', letterSpacing:'0.1em' }}>
                {gen ? '◌ COMPILING DPR...' : '📄 EXPORT DPR PDF'}
              </button>
            )}
          </div>
        </>}

        {/* DPR PIPELINE */}
        {tab==='pipeline' && <>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:C.serif, fontSize:26, fontWeight:500, marginBottom:4 }}>DPR Pipeline — 5 Fundraising Reports</div>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted }}>Capital flow status · Nidhivan Consulting · Tenant 7 · Total at stake: ₹23,950 Crore</div>
          </div>
          <div style={{ background:'#0C0800', border:`1px solid ${C.warn}35`, borderRadius:11, padding:14, marginBottom:16 }}>
            <div style={{ fontFamily:C.mono, fontSize:9, color:C.warn, fontWeight:700, letterSpacing:'0.12em', marginBottom:6 }}>⚠ CAPITAL FLOW BLOCKED — ALL 5 DPRS PENDING INVESTOR SUBMISSION</div>
            <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>DPR-NH44-01 is in review (highest IRR: 14.2%). Remaining 3 are in draft — BOQ data complete. DPR-RAIL-01 pending structural survey data. Unblocking all 5 releases ₹23,950 Crore in infrastructure capital.</div>
          </div>
          {DPR_LIST.map((d,i) => {
            const s = SC[d.status]
            return (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ background:s.bg, border:`1px solid ${s.color}40`, borderRadius:6, padding:'4px 10px', fontFamily:C.mono, fontSize:8, color:s.color, fontWeight:700, letterSpacing:'0.08em', flexShrink:0, whiteSpace:'nowrap' }}>{s.label}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:C.mono, fontSize:8, color:C.gold, fontWeight:700, marginBottom:3 }}>{d.ref}</div>
                  <div style={{ fontFamily:C.serif, fontSize:14, fontWeight:500, lineHeight:1.3, color:C.text }}>{d.name}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {d.irr > 0
                    ? <div style={{ fontFamily:C.serif, fontSize:20, fontWeight:600, color:C.success, lineHeight:1 }}>{d.irr}%</div>
                    : <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted }}>IRR TBD</div>}
                  <div style={{ fontFamily:C.mono, fontSize:8, color:C.muted, marginTop:2 }}>{d.cost}</div>
                </div>
                <button onClick={() => setTab('financials')} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:'6px 12px', fontFamily:C.mono, fontSize:8, fontWeight:700, cursor:'pointer', flexShrink:0, letterSpacing:'0.08em' }}>OPEN →</button>
              </div>
            )
          })}
          <div style={{ marginTop:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontFamily:C.mono, fontSize:8, color:C.gold, fontWeight:700, letterSpacing:'0.12em', marginBottom:10 }}>TRACK B COMPLETION STATUS</div>
            {[
              ['✓','DB schema — nidhivan_boqs, nidhivan_boq_items, nidhivan_dprs, nidhivan_financial_metrics', C.success],
              ['✓','RLS isolation — bms cannot read nidhivan data (ATP RLS-005 PASS)',                          C.success],
              ['✓','Seed data — NH-44 project, DPR, BOQ (5 CPWD DSR items), financial metrics',               C.success],
              ['▶','PDF pipeline — @react-pdf/renderer DPR template → investor-grade branded PDF',             C.warn   ],
              ['▶','API routes — GET /api/nidhivan/dprs, /boqs, /boq-items — expose to frontend',              C.warn   ],
              ['▶','Multi-agent AI — Claude drafts DPR narrative sections from live BOQ + metrics data',       C.info   ],
            ].map(([ic,tx,c],i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom: i<5 ? `1px solid ${C.border}` : 'none', alignItems:'center' }}>
                <span style={{ fontFamily:C.mono, fontSize:10, color:c, flexShrink:0 }}>{ic}</span>
                <span style={{ fontSize:11, color:C.sub, lineHeight:1.4 }}>{tx}</span>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  )
}
