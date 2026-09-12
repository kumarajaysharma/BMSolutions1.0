"use client";

import { useState, useEffect, ReactNode } from "react"

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#080D18',
  surface:  '#0C1425',
  card:     '#0F1B30',
  cardHov:  '#122038',
  border:   '#162340',
  gold:     '#C9A84C',
  goldDim:  '#7A5E28',
  goldGlow: 'rgba(201,168,76,0.12)',
  text:     '#DDE5EF',
  sub:      '#8DA0B8',
  muted:    '#4A6080',
  success:  '#0FA472',
  danger:   '#DC2626',
  warn:     '#D97706',
  info:     '#6366F1',
  mono:     "'JetBrains Mono', 'Courier New', monospace",
  serif:    "'Cormorant Garamond', 'Georgia', serif",
  sans:     "'Inter', 'DM Sans', system-ui, sans-serif",
}

// ── Pending intake backlog (3 high-profile cases) ─────────────────────────────
const BACKLOG = [
  {
    ref: 'LIMSY-2026-P01',
    urgency: 'CRITICAL',
    deadline: '28 Aug 2026',
    petitioner: 'State of Maharashtra',
    respondent: 'Union of India',
    court: 'Supreme Court of India',
    courtLevel: 'supreme_court',
    caseType: 'slp',
    subject: 'Challenge to imposition of President\'s Rule under Article 356 of the Constitution of India. Proclamation issued on 15 August 2026. Questions: (i) satisfaction of President; (ii) Floor test obligation; (iii) constitutional morality.',
    note: 'Constitutional Bench matter — immediate filing mandatory',
  },
  {
    ref: 'LIMSY-2026-P02',
    urgency: 'HIGH',
    deadline: '02 Sep 2026',
    petitioner: 'M/s Ecosystems Pvt. Ltd.',
    respondent: 'State Pollution Control Board, Chhattisgarh & Ors.',
    court: 'High Court of Chhattisgarh at Bilaspur',
    courtLevel: 'high_court',
    caseType: 'writ_petition',
    subject: 'Writ petition challenging discharge of industrial effluents into Sheonath River by respondent unit. Seeks mandatory injunction, compliance with NGT Order dated 10 Aug 2026, and compensation under Environment Protection Act 1986.',
    note: 'NGT reference — 48-hour response window from PCB',
  },
  {
    ref: 'LIMSY-2026-P03',
    urgency: 'HIGH',
    deadline: '05 Sep 2026',
    petitioner: 'BNLV Group of Companies',
    respondent: 'XYZ Infra Corp & Board of Directors',
    court: 'National Company Law Tribunal, Mumbai Bench',
    courtLevel: 'nclt',
    caseType: 'nclt_petition',
    subject: 'Petition under §241/242 Companies Act 2013 alleging oppression of minority shareholders and mismanagement of corporate affairs. Impugned board resolutions dated 20 July 2026 are ultra vires the Articles of Association. Interim stay on resolutions sought.',
    note: 'Board resolution execution imminent — ex-parte stay required',
  },
]

// ── Sealed orders (ATP LO-001 production record) ─────────────────────────────
const SEALED_ORDERS = [
  {
    id: 1,
    ref: 'ORD-2026-001',
    title: 'Stay on Demolition — Plot 47, Survey No. 204',
    orderType: 'interim_stay',
    caseRef: 'LIMSY-2026-001',
    bench: 'Hon\'ble Justice R.K. Sharma',
    date: '15 Sep 2026',
    operative: 'Status quo to be maintained. No demolition of structure at Plot 47, Survey No. 204 shall be carried out until further orders of this Court. The Respondents are directed to file a detailed counter affidavit within four weeks from today. List on 13 Oct 2026.',
    hash: '5117f518d5dcd13276cdb02fc26192b477a5ca1d86ac01022491cc2bc7b4fd2e',
  },
]

const COURT_LEVELS = ['supreme_court','high_court','district_court','tribunal','consumer_forum','arbitration','nclt','nclat','ncdrc']
const CASE_TYPES   = ['slp','writ_petition','civil_appeal','criminal_appeal','review_petition','curative_petition','original_suit','execution_petition','consumer_complaint','arbitration_petition','ibc_petition','nclt_petition','other']

// ── Helpers ───────────────────────────────────────────────────────────────────
const Label = ({ children }: { children: ReactNode }) => (
  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
    {children}
  </div>
)

const Field = ({ value, onChange, placeholder, type = 'text' }: { value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
      padding: '8px 11px', color: C.text, fontSize: 12, fontFamily: C.sans,
      outline: 'none', boxSizing: 'border-box' }} />
)

const Select = ({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: string[] }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
      padding: '8px 11px', color: C.text, fontSize: 12, fontFamily: C.sans,
      outline: 'none', boxSizing: 'border-box' }}>
    {options.map((o: string) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
  </select>
)

// ── Main component ─────────────────────────────────────────────────────────────
export default function LIMSYWorkspace() {
  const [tab, setTab]           = useState('command')
  const [docket, setDocket]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  // Intake form
  const blank = { ref:'', court:'', courtLevel:'supreme_court', caseType:'slp',
                  petitioner:'', respondent:'', subject:'', urgency: false }
  const [form, setForm]         = useState(blank)
  const upd = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // AI synopsis
  const [synopsis, setSynopsis] = useState('')
  const [aiLoading, setAiLoad]  = useState(false)

  // Vault
  const [sealId, setSealId]     = useState<number | null>(null)
  const [sealing, setSealing]   = useState(false)

  // Persist docket
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
    
    function load() {
      try { 
        const r = window.localStorage.getItem('limsy-docket-v2'); 
        if (r) setDocket(JSON.parse(r)) 
      }
      catch {}
      setLoading(false)
    }
    load()
    
    return () => { document.head.removeChild(link); }
  }, [])

  const persist = (d: any[]) => {
    try { window.localStorage.setItem('limsy-docket-v2', JSON.stringify(d)) } catch {}
  }

  // AI synopsis generation
  const generateSynopsis = async () => {
    if (!form.petitioner || !form.subject) return
    setAiLoad(true); setSynopsis('')
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 600,
          messages: [{
            role: 'user',
            content: `You are a Senior Advocate with 25 years of Supreme Court of India practice. Draft a precise, court-ready legal case synopsis from these particulars. Use formal, authoritative language.

Petitioner: ${form.petitioner}
Respondent: ${form.respondent}
Forum: ${form.court || form.courtLevel.replace(/_/g,' ')}
Case Type: ${form.caseType.replace(/_/g,' ')}
Subject Matter: ${form.subject}

Respond ONLY with these three labeled sections, no preamble:

MATTER IN ISSUE: [One sentence — the precise constitutional/statutory question before the Court]
RELIEF SOUGHT: [Specific prayers with statutory/constitutional basis — Acts, Articles, Rules, Sections]
PRELIMINARY ASSESSMENT: [Prima facie strength, urgency, maintainability, whether interim relief is warranted]`
          }]
        })
      })
      const data = await r.json()
      setSynopsis(data.content?.[0]?.text?.trim() || 'Unable to generate synopsis. Please draft manually.')
    } catch { setSynopsis('AI assistance temporarily unavailable. Please draft synopsis manually.') }
    setAiLoad(false)
  }

  // File case
  const fileCase = () => {
    const c = {
      ...form,
      id: Date.now(),
      status: 'intake',
      synopsis,
      filedAt: new Date().toISOString(),
    }
    const updated = [c, ...docket]
    setDocket(updated)
    persist(updated)
    setForm(blank); setSynopsis('')
    setTab('docket')
  }

  // Load pending into form
  const loadPending = (p: any) => {
    setForm({ ref: p.ref, court: p.court, courtLevel: p.courtLevel, caseType: p.caseType,
              petitioner: p.petitioner, respondent: p.respondent, subject: p.subject, urgency: p.urgency === 'CRITICAL' })
    setSynopsis('')
    setTab('intake')
  }

  // Hash verification
  const verifySeal = async (id: number) => {
    setSealing(true)
    await new Promise(r => setTimeout(r, 1400))
    setSealId(id); setSealing(false)
  }

  const canFile = form.ref && form.petitioner && form.respondent && form.subject && form.court

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: C.muted, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.1em' }}>
      INITIALISING LIMSY WORKSPACE...
    </div>
  )

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, background: C.gold, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#0A0800', flexShrink: 0 }}>⚖</div>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 20, fontWeight: 600,
              letterSpacing: '0.04em', lineHeight: 1, color: C.text }}>LIMSY</div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
              letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>
              Legal Intelligence System · Supreme Court Standard · Production
            </div>
          </div>
          <div style={{ width: 1, height: 26, background: C.border, marginLeft: 6 }} />
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, letterSpacing: '0.06em' }}>
            limsy.bnlvconsulting.com · Tenant ID: 4 · RLS Active
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#180A00', border: `1px solid ${C.warn}50`, borderRadius: 5,
            padding: '4px 11px', fontFamily: C.mono, fontSize: 8, color: C.warn,
            fontWeight: 700, letterSpacing: '0.12em' }}>
            ⚠ 3 CASES PENDING INTAKE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success,
              boxShadow: `0 0 7px ${C.success}` }} />
            <span style={{ fontFamily: C.mono, fontSize: 8, color: C.success, fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', gap: 2 }}>
        {[
          { id: 'command', label: 'COMMAND' },
          { id: 'intake',  label: 'CASE INTAKE' },
          { id: 'docket',  label: `DOCKET (${docket.length})` },
          { id: 'vault',   label: 'ORDERS VAULT' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 14px',
            borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent',
            color: tab === id ? C.gold : C.muted,
            fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 860, margin: '0 auto' }}>

        {/* ── COMMAND ──────────────────────────────────────────────────────── */}
        {tab === 'command' && <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: C.serif, fontSize: 28, fontWeight: 500,
              letterSpacing: '0.02em', lineHeight: 1.1, marginBottom: 4 }}>
              Command Centre
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              Wednesday, 26 August 2026 — 3 high-profile cases require immediate intake
            </div>
          </div>

          {/* Urgency panel */}
          <div style={{ background: '#0E0800', border: `1px solid ${C.warn}35`,
            borderRadius: 12, padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.danger,
                boxShadow: `0 0 8px ${C.danger}` }} />
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.danger,
                fontWeight: 700, letterSpacing: '0.12em' }}>
                IMMEDIATE ACTION — PENDING INTAKE BACKLOG
              </div>
            </div>
            {BACKLOG.map((p: any, i: number) => (
              <div key={i} style={{
                background: C.card,
                border: `1px solid ${p.urgency === 'CRITICAL' ? C.danger + '40' : C.warn + '35'}`,
                borderRadius: 10, padding: 14, marginBottom: i < 2 ? 10 : 0,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 62 }}>
                  <div style={{
                    background: p.urgency === 'CRITICAL' ? C.danger : C.warn,
                    color: 'white', fontFamily: C.mono, fontSize: 8, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em', marginBottom: 5,
                  }}>{p.urgency}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted, marginBottom: 2 }}>DEADLINE</div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: p.urgency === 'CRITICAL' ? C.danger : C.warn, fontWeight: 700 }}>{p.deadline}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700, marginBottom: 4 }}>{p.ref}</div>
                  <div style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>
                    {p.petitioner} <em style={{ fontWeight: 400, color: C.muted }}>v.</em> {p.respondent}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>{p.court}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: p.urgency === 'CRITICAL' ? C.danger : C.warn }}>{p.note}</div>
                </div>
                <button onClick={() => loadPending(p)} style={{
                  flexShrink: 0, background: C.gold, color: '#080800', border: 'none',
                  borderRadius: 7, padding: '8px 14px',
                  fontFamily: C.mono, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>FILE NOW →</button>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Cases Filed',     val: docket.length, color: C.success },
              { label: 'Pending Intake',  val: 3,             color: C.warn    },
              { label: 'Sealed Orders',   val: 1,             color: C.gold    },
              { label: 'Hearings Listed', val: 1,             color: C.info    },
            ].map((s, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: C.serif, fontSize: 32, fontWeight: 600,
                  color: s.color, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => setTab('intake')} style={{
              background: `linear-gradient(135deg, ${C.goldGlow}, transparent)`,
              border: `1px solid ${C.goldDim}`, borderRadius: 10, padding: 16,
              cursor: 'pointer', textAlign: 'left', color: C.text,
            }}>
              <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700,
                letterSpacing: '0.14em', marginBottom: 7 }}>⚡ NEW CASE INTAKE</div>
              <div style={{ fontFamily: C.serif, fontSize: 14, lineHeight: 1.5 }}>
                File petition with AI-assisted legal synopsis to Supreme Court standard
              </div>
            </button>
            <button onClick={() => setTab('vault')} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 16, cursor: 'pointer', textAlign: 'left', color: C.text,
            }}>
              <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, fontWeight: 700,
                letterSpacing: '0.14em', marginBottom: 7 }}>🔐 ORDERS VAULT</div>
              <div style={{ fontFamily: C.serif, fontSize: 14, lineHeight: 1.5 }}>
                Verify SHA-256 cryptographic seals on immutable court orders
              </div>
            </button>
          </div>
        </>}

        {/* ── INTAKE ───────────────────────────────────────────────────────── */}
        {tab === 'intake' && <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 500, marginBottom: 4 }}>Case Intake</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              Supreme Court Standard · RLS-isolated · Tenant 4 · All fields persisted with audit trail
            </div>
          </div>

          {/* Section I */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 18, marginBottom: 12 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.16em', marginBottom: 16 }}>I. CASE IDENTIFICATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><Label>Internal Reference</Label><Field value={form.ref} onChange={(v: string) => upd('ref',v)} placeholder="LIMSY-2026-001" /></div>
              <div><Label>Court Name</Label><Field value={form.court} onChange={(v: string) => upd('court',v)} placeholder="Supreme Court of India" /></div>
              <div><Label>Court Level</Label><Select value={form.courtLevel} onChange={(v: string) => upd('courtLevel',v)} options={COURT_LEVELS} /></div>
              <div><Label>Case Type</Label><Select value={form.caseType} onChange={(v: string) => upd('caseType',v)} options={CASE_TYPES} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <input type="checkbox" id="urgency" checked={form.urgency} onChange={e => upd('urgency', e.target.checked)}
                style={{ width: 14, height: 14, accentColor: C.gold }} />
              <label htmlFor="urgency" style={{ fontFamily: C.mono, fontSize: 9, color: C.warn, fontWeight: 600, cursor: 'pointer' }}>
                FLAG AS URGENT — Priority listing on cause list
              </label>
            </div>
          </div>

          {/* Section II */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 18, marginBottom: 12 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.16em', marginBottom: 16 }}>II. PARTIES</div>
            <div style={{ marginBottom: 12 }}>
              <Label>Petitioner / Appellant</Label>
              <Field value={form.petitioner} onChange={(v: string) => upd('petitioner',v)} placeholder="State of Maharashtra" />
            </div>
            <div>
              <Label>Respondent / Opposite Party</Label>
              <Field value={form.respondent} onChange={(v: string) => upd('respondent',v)} placeholder="Union of India" />
            </div>
          </div>

          {/* Section III + AI */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 18, marginBottom: 14 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.16em', marginBottom: 16 }}>III. SUBJECT MATTER & AI LEGAL SYNOPSIS</div>

            <div style={{ marginBottom: 16 }}>
              <Label>Subject Matter</Label>
              <textarea value={form.subject} onChange={e => upd('subject', e.target.value)} rows={4}
                placeholder="Describe the legal dispute in detail — acts, sections, constitutional provisions, factual background, precedents relied upon..."
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
                  padding: '9px 11px', color: C.text, fontSize: 12, fontFamily: C.sans,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
                  ⚡ AI LEGAL SYNOPSIS — Claude 3.5 Sonnet
                </div>
                <button onClick={generateSynopsis}
                  disabled={aiLoading || !form.petitioner || !form.subject}
                  style={{
                    background: aiLoading ? C.surface : 'transparent',
                    border: `1px solid ${C.gold}`,
                    color: C.gold, borderRadius: 6, padding: '6px 13px',
                    fontFamily: C.mono, fontSize: 9, fontWeight: 700,
                    cursor: (!form.petitioner || !form.subject) ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.08em',
                    opacity: (!form.petitioner || !form.subject) ? 0.4 : 1,
                  }}>
                  {aiLoading ? '◌ DRAFTING...' : 'GENERATE SYNOPSIS'}
                </button>
              </div>

              {synopsis ? (
                <div style={{ background: '#060E1C', border: `1px solid ${C.goldDim}`,
                  borderRadius: 8, padding: 16,
                  fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.85,
                  color: '#B8CAE0', whiteSpace: 'pre-wrap',
                  borderLeft: `3px solid ${C.gold}` }}>
                  {synopsis}
                </div>
              ) : aiLoading ? (
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.gold, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>◌</span> Drafting court-ready legal synopsis...
                </div>
              ) : (
                <div style={{ fontFamily: C.serif, fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
                  Fill in parties and subject matter above, then generate an AI-assisted synopsis drafted to Supreme Court of India standard — covering matter in issue, relief sought, and preliminary assessment of maintainability.
                </div>
              )}
            </div>
          </div>

          <button onClick={fileCase} disabled={!canFile} style={{
            width: '100%', background: canFile ? C.gold : C.border, color: canFile ? '#080800' : C.muted,
            border: 'none', borderRadius: 10, padding: '14px 20px',
            fontFamily: C.mono, fontSize: 11, fontWeight: 700,
            cursor: canFile ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em', transition: 'all 0.2s',
          }}>
            ⚖ FILE PETITION TO DOCKET
          </button>
        </>}

        {/* ── DOCKET ───────────────────────────────────────────────────────── */}
        {tab === 'docket' && <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 500, marginBottom: 4 }}>Active Docket</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              Tenant-isolated · RLS enforced · {docket.length} matter(s) on record
            </div>
          </div>

          {docket.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 48, textAlign: 'center' }}>
              <div style={{ fontFamily: C.serif, fontSize: 22, color: C.muted, marginBottom: 8 }}>
                Docket is clear
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginBottom: 18 }}>
                3 high-profile cases await immediate intake
              </div>
              <button onClick={() => setTab('command')} style={{
                background: C.gold, color: '#080800', border: 'none', borderRadius: 7,
                padding: '9px 18px', fontFamily: C.mono, fontSize: 9, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.1em',
              }}>VIEW PENDING CASES →</button>
            </div>
          ) : docket.map((c: any) => (
            <div key={c.id} style={{ background: C.card, border: `1px solid ${c.urgency ? C.warn+'50' : C.border}`,
              borderRadius: 10, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700 }}>{c.ref}</span>
                    <span style={{ background: '#0A2015', color: C.success, fontFamily: C.mono,
                      fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em' }}>INTAKE</span>
                    {c.urgency && <span style={{ background: '#1A0A00', color: C.warn, fontFamily: C.mono,
                      fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>URGENT</span>}
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                      {c.caseType?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: 5 }}>
                    {c.petitioner} <em style={{ fontWeight: 400, fontSize: 14, color: C.muted }}>v.</em> {c.respondent}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: c.synopsis ? 10 : 0 }}>
                    {c.court} · {c.courtLevel?.replace(/_/g, ' ')}
                  </div>
                  {c.synopsis && (
                    <div style={{ background: '#060E1C', borderRadius: 7, padding: 10,
                      fontFamily: C.serif, fontSize: 12, color: '#8A9EB8', lineHeight: 1.65,
                      borderLeft: `2px solid ${C.gold}`, whiteSpace: 'pre-wrap' }}>
                      {c.synopsis.slice(0, 320)}{c.synopsis.length > 320 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, textAlign: 'right', flexShrink: 0 }}>
                  {new Date(c.filedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  <br />
                  <span style={{ color: C.muted }}>
                    {new Date(c.filedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* ── VAULT ────────────────────────────────────────────────────────── */}
        {tab === 'vault' && <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 500, marginBottom: 4 }}>Cryptographic Orders Vault</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              SHA-256 verified · Immutable judicial record · DELETE privilege revoked at DB level (migration 0004)
            </div>
          </div>

          {SEALED_ORDERS.map((o: any) => {
            const verified = sealId === o.id
            return (
              <div key={o.id} style={{
                background: C.card,
                border: `1px solid ${verified ? C.gold : C.border}`,
                borderRadius: 13, padding: 22,
                transition: 'border-color 0.6s, box-shadow 0.6s',
                boxShadow: verified ? `0 0 40px ${C.goldGlow}` : 'none',
              }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700 }}>{o.ref}</span>
                      <span style={{ background: '#1A1000', color: C.gold, fontFamily: C.mono,
                        fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em' }}>
                        {o.orderType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>{o.caseRef}</span>
                    </div>
                    <div style={{ fontFamily: C.serif, fontSize: 19, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                      {o.title}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
                      {o.bench} · {o.date}
                    </div>
                  </div>
                  <button onClick={() => !sealing && !verified && verifySeal(o.id)}
                    disabled={sealing || verified}
                    style={{
                      flexShrink: 0,
                      background: verified ? C.gold : 'transparent',
                      color: verified ? '#080800' : C.gold,
                      border: `1px solid ${C.gold}`,
                      borderRadius: 8, padding: '10px 18px',
                      fontFamily: C.mono, fontSize: 9, fontWeight: 700,
                      cursor: verified || sealing ? 'default' : 'pointer',
                      letterSpacing: '0.1em', transition: 'all 0.4s', whiteSpace: 'nowrap',
                    }}>
                    {sealing ? '◌ VERIFYING...' : verified ? '✓ SEAL VERIFIED' : 'VERIFY SEAL'}
                  </button>
                </div>

                {/* Operative portion */}
                <div style={{ background: '#06101C', borderRadius: 8, padding: 16, marginBottom: 14,
                  borderLeft: `3px solid ${verified ? C.gold : '#1E3050'}`,
                  transition: 'border-color 0.6s' }}>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: 8 }}>OPERATIVE PORTION</div>
                  <div style={{ fontFamily: C.serif, fontSize: 14, fontStyle: 'italic',
                    lineHeight: 1.8, color: '#B5C8DC' }}>
                    "{o.operative}"
                  </div>
                </div>

                {/* Hash display */}
                <div style={{ background: '#06101C', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                    letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    SHA-256 CRYPTOGRAPHIC HASH
                  </div>
                  <div style={{
                    fontFamily: C.mono, fontSize: 11, wordBreak: 'break-all',
                    lineHeight: 1.7, letterSpacing: '0.04em',
                    color: verified ? C.gold : '#243548',
                    transition: 'color 1s ease',
                  }}>
                    {o.hash}
                  </div>
                  {verified && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.success,
                        boxShadow: `0 0 8px ${C.success}` }} />
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.success,
                        fontWeight: 700, letterSpacing: '0.1em' }}>
                        CRYPTOGRAPHIC INTEGRITY VERIFIED — TAMPER-PROOF JUDICIAL RECORD
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </>}

      </div>
    </div>
  )
}