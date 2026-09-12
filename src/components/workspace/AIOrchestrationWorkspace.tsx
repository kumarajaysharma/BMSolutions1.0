"use client";

/**
 * src/components/workspace/AIOrchestrationWorkspace.tsx
 *
 * BNLV Group — AI Orchestration Workspace UI Component
 * ==========================================================
 * TRACK C: Interactive console for multi-agent legal & financial tasks.
 */

import { useState, useEffect, useRef } from "react"

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#070910',
  surface: '#0A0D18',
  card:    '#0D1122',
  border:  '#141B2E',
  gold:    '#C9A84C',
  text:    '#DCE6F4',
  muted:   '#3A5070',
  sub:     '#7090B0',
  legal:   '#818CF8',   // indigo — judicial
  fin:     '#10B981',   // emerald — financial
  hybrid:  '#F59E0B',   // amber — both
  danger:  '#EF4444',
  mono:    "'JetBrains Mono','Courier New',monospace",
  serif:   "'Cormorant Garamond','Georgia',serif",
  sans:    "'Inter',system-ui,sans-serif",
}

// ── Preset tasks for immediate launch ─────────────────────────────────────────
const PRESETS = [
  {
    label: 'P01 — Article 356 SLP',
    domain: 'LEGAL',
    task: 'Analyse the urgency and legal strength of the Article 356 SLP (State of Maharashtra v. Union of India). Should we file for an immediate interim stay? What constitutional provisions support our position?',
  },
  {
    label: 'P02 — Environmental PIL',
    domain: 'LEGAL',
    task: 'Review the Environmental PIL against the State Pollution Control Board. Assess grounds for interim injunction under Article 21 and the NGT Act. What precedents from Vellore Citizens v. Union of India apply?',
  },
  {
    label: 'P03 — NCLT Oppression',
    domain: 'LEGAL',
    task: 'Draft strategic recommendations for the NCLT petition under §241/242 Companies Act 2013. Is an ex-parte ad-interim stay on the impugned board resolutions maintainable? Cite Cyrus Investments v. Tata Sons.',
  },
  {
    label: 'DPR-NH44 — Investor Narrative',
    domain: 'FINANCIAL',
    task: 'Generate a McKinsey-standard investor DPR narrative for the NH-44 highway project. Cover economic rationale, IRR vs benchmark, DSCR comfort, and a clear capital raising recommendation for NITI Aayog submission.',
  },
  {
    label: 'DPR — Sensitivity Analysis',
    domain: 'FINANCIAL',
    task: 'Analyse the financial sensitivity of the NH-44 DPR to a 10% construction cost overrun and 15% traffic shortfall. Does the project remain bankable? What restructuring levers are available?',
  },
  {
    label: 'NCLT + Escrow — Hybrid',
    domain: 'HYBRID',
    task: 'The NCLT oppression petition involves a disputed infrastructure escrow account worth ₹450 Crore. Provide combined legal strategy for the court matter AND financial exposure assessment for the escrow. Both perspectives needed for board presentation.',
  },
]

const DOMAIN_STYLE = {
  LEGAL:    { color: C.legal,  label: 'LEGAL AGENT',     icon: '⚖' },
  FINANCIAL:{ color: C.fin,    label: 'FINANCIAL AGENT', icon: '₹' },
  HYBRID:   { color: C.hybrid, label: 'DUAL AGENT',      icon: '⇄' },
  UNKNOWN:  { color: C.muted,  label: 'UNKNOWN',         icon: '?' },
}

const AGENT_STYLE = {
  legal:        { color: C.legal,  icon: '⚖', title: 'Senior Advocate · Supreme Court of India' },
  financial:    { color: C.fin,    icon: '₹', title: 'McKinsey Infrastructure Finance Partner'   },
  orchestrator: { color: C.hybrid, icon: '⇄', title: 'BNLV AI Orchestrator'                     },
}

function AgentCard({ output, index }: { output: any, index: number }) {
  const as = AGENT_STYLE[output.agentName as keyof typeof AGENT_STYLE] || AGENT_STYLE.orchestrator
  const sections = output.content.split(/\n(?=[A-Z ]+:)/g).filter(Boolean)

  return (
    <div style={{ background: C.card, border: `1px solid ${as.color}30`, borderRadius: 12,
      overflow: 'hidden', marginBottom: 14 }}>
      {/* Agent header */}
      <div style={{ background: `${as.color}12`, borderBottom: `1px solid ${as.color}25`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: `${as.color}20`, border: `1px solid ${as.color}40`,
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: as.color }}>
            {as.icon}
          </div>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: as.color, fontWeight: 700, letterSpacing: '0.12em' }}>
              AGENT {index + 1} — {output.agentName.toUpperCase()}
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>{as.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>{output.tokensUsed} tokens</div>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>{output.durationMs}ms</div>
          <div style={{ background: `${as.color}20`, border: `1px solid ${as.color}40`,
            borderRadius: 4, padding: '2px 8px', fontFamily: C.mono, fontSize: 8,
            color: as.color, fontWeight: 700, letterSpacing: '0.08em' }}>
            {output.confidence.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Output content */}
      <div style={{ padding: 16 }}>
        {sections.map((section: string, i: number) => {
          const colonIdx = section.indexOf(':')
          if (colonIdx === -1) {
            return (
              <div key={i} style={{ fontFamily: C.serif, fontSize: 13, lineHeight: 1.8,
                color: '#B8CDE0', whiteSpace: 'pre-wrap' }}>{section}</div>
            )
          }
          const heading = section.slice(0, colonIdx).trim()
          const body    = section.slice(colonIdx + 1).trim()
          return (
            <div key={i} style={{ marginBottom: i < sections.length - 1 ? 14 : 0 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: as.color, fontWeight: 700,
                letterSpacing: '0.14em', marginBottom: 6 }}>{heading}</div>
              <div style={{ fontFamily: C.serif, fontSize: 13, lineHeight: 1.85,
                color: '#B8CDE0', whiteSpace: 'pre-wrap', borderLeft: `2px solid ${as.color}30`,
                paddingLeft: 10 }}>{body}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AIOrchestrationWorkspace() {
  const [task, setTask]         = useState('')
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState<any>(null)
  const [error, setError]       = useState('')
  const [history, setHistory]   = useState<any[]>([])
  const [tab, setTab]           = useState('console')
  const outputRef               = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const lk = document.createElement('link')
    lk.rel   = 'stylesheet'
    lk.href  = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600&display=swap'
    document.head.appendChild(lk)
    return () => { document.head.removeChild(lk); }
  }, [])

  useEffect(() => {
    if (result && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const runOrchestration = async (taskText?: string) => {
    const t = taskText || task
    if (!t.trim() || t.trim().length < 10) { setError('Task must be at least 10 characters.'); return }
    setRunning(true); setResult(null); setError('')

    try {
      // Demo mode — calls Claude API directly with the orchestration logic
      const start = Date.now()

      // Classify task
      const classRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 300,
          messages: [{ role: 'user', content:
            `Classify this task into LEGAL, FINANCIAL, or HYBRID. Respond with JSON only:\n{"taskClass":"LEGAL"|"FINANCIAL"|"HYBRID","confidence":"high"|"medium"|"low","reasoning":"..."}\n\nTask: ${t}` }]
        })
      })
      const classData = await classRes.json()
      let classification = { taskClass: 'LEGAL', confidence: 'high', reasoning: 'Default classification' }
      try { classification = JSON.parse(classData.content?.[0]?.text?.replace(/```json|```/g,'').trim() || '{}') }
      catch {}

      const { taskClass } = classification
      const ds = DOMAIN_STYLE[taskClass as keyof typeof DOMAIN_STYLE] || DOMAIN_STYLE.UNKNOWN
      const outputs: any[] = []

      // Legal agent
      if (taskClass === 'LEGAL' || taskClass === 'HYBRID') {
        const t0 = Date.now()
        const lr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 900,
            system: `You are a Senior Advocate at the Supreme Court of India with 25 years of experience.
Draft a formal legal analysis using these EXACT headings:
CASE ANALYSIS:
APPLICABLE AUTHORITIES:
STRATEGIC RECOMMENDATIONS:
RISK ASSESSMENT:`,
            messages: [{ role: 'user', content:
              `Task: ${taskClass === 'HYBRID' ? '[LEGAL COMPONENT] ' : ''}${t}` }]
          })
        })
        const ld = await lr.json()
        outputs.push({
          agentName: 'legal', taskClass: 'LEGAL',
          content: ld.content?.[0]?.text || 'No output.',
          confidence: 'high', tokensUsed: ld.usage?.output_tokens || 0, durationMs: Date.now() - t0
        })
      }

      // Financial agent
      if (taskClass === 'FINANCIAL' || taskClass === 'HYBRID') {
        const t0 = Date.now()
        const fr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 900,
            system: `You are a Senior Partner at McKinsey & Company specialising in infrastructure finance.
Draft a formal financial analysis using these EXACT headings:
PROJECT OVERVIEW:
ECONOMIC RATIONALE:
FINANCIAL VIABILITY ASSESSMENT:
CAPITAL RAISING RECOMMENDATION:`,
            messages: [{ role: 'user', content:
              `Task: ${taskClass === 'HYBRID' ? '[FINANCIAL COMPONENT] ' : ''}${t}` }]
          })
        })
        const fd = await fr.json()
        outputs.push({
          agentName: 'financial', taskClass: 'FINANCIAL',
          content: fd.content?.[0]?.text || 'No output.',
          confidence: 'high', tokensUsed: fd.usage?.output_tokens || 0, durationMs: Date.now() - t0
        })
      }

      let merged = null
      if (taskClass === 'HYBRID' && outputs.length === 2) {
        const mr = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 600,
            messages: [{ role: 'user', content:
              `Merge these into a single executive brief with sections:\nEXECUTIVE BRIEF:\nLEGAL POSITION:\nFINANCIAL POSITION:\nINTEGRATED RECOMMENDATION:\n\nLegal:\n${outputs[0].content}\n\nFinancial:\n${outputs[1].content}` }]
          })
        })
        const md = await mr.json()
        merged = md.content?.[0]?.text || null
      }

      const r = {
        taskClass, agents: outputs.map(o => o.agentName), outputs, merged,
        totalTokens: outputs.reduce((s, o) => s + o.tokensUsed, 0),
        durationMs: Date.now() - start, task: t, timestamp: new Date().toISOString(),
      }
      setResult(r)
      setHistory(h => [r, ...h].slice(0, 10))
      setTask('')
    } catch (e: any) {
      setError(`Orchestration error: ${e?.message || 'Unknown error'}`)
    }
    setRunning(false)
  }

  const ds = result ? (DOMAIN_STYLE[result.taskClass as keyof typeof DOMAIN_STYLE] || DOMAIN_STYLE.UNKNOWN) : null

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, background: C.gold, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#080800', flexShrink: 0 }}>⇄</div>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 20, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>
              BNLV AI Orchestration
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, letterSpacing: '0.14em', marginTop: 1 }}>
              Track C · Legal Agent · Financial Agent · Hybrid Routing · claude-sonnet-4-6
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['legal','financial','hybrid'].map((d,i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%',
                background: [C.legal,C.fin,C.hybrid][i], boxShadow: `0 0 5px ${[C.legal,C.fin,C.hybrid][i]}` }}/>
              <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, textTransform: 'uppercase' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 20px', display: 'flex' }}>
        {[['console','CONSOLE'],['presets','PRESETS'],['history','HISTORY']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '11px 14px',
            borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent',
            color: tab === id ? C.gold : C.muted,
            fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>

        {/* CONSOLE */}
        {tab === 'console' && (
          <div>
            {/* Task input */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
                letterSpacing: '0.14em', marginBottom: 10 }}>⚡ TASK INPUT — Natural language · Auto-routed to Legal, Financial, or Hybrid agents</div>
              <textarea value={task} onChange={e => setTask(e.target.value)} rows={4}
                placeholder="Describe what you need. Examples:&#10;• Analyse the Article 356 SLP urgency and whether interim stay is warranted&#10;• Generate investor DPR narrative for the NH-44 highway project&#10;• NCLT oppression petition involves disputed infrastructure escrow — both legal and financial analysis needed"
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '10px 12px', color: C.text, fontSize: 12, fontFamily: C.sans,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
              {error && (
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.danger, marginTop: 8 }}>{error}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
                {task && (
                  <button onClick={() => { setTask(''); setResult(null); setError('') }}
                    style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
                      borderRadius: 7, padding: '8px 14px', fontFamily: C.mono, fontSize: 9,
                      fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em' }}>CLEAR</button>
                )}
                <button onClick={() => runOrchestration()} disabled={running || task.length < 10}
                  style={{ background: running || task.length < 10 ? C.border : C.gold,
                    color: running || task.length < 10 ? C.muted : '#080800',
                    border: 'none', borderRadius: 8, padding: '9px 20px',
                    fontFamily: C.mono, fontSize: 10, fontWeight: 700,
                    cursor: running || task.length < 10 ? 'not-allowed' : 'pointer', letterSpacing: '0.1em' }}>
                  {running ? '◌ ROUTING...' : '⇄ RUN AGENTS'}
                </button>
              </div>
            </div>

            {/* Running state */}
            {running && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: 24, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.gold, marginBottom: 12 }}>
                  ◌ ORCHESTRATING — Classifying task → Routing to agents → Generating output
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  {['Classification', 'Agent Dispatch', 'Output Generation'].map((s, i) => (
                    <div key={i} style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                      <span style={{ color: C.gold }}>◌</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {result && !running && (
              <div ref={outputRef}>
                {/* Classification banner */}
                <div style={{ background: `${ds?.color}15`,
                  border: `1px solid ${ds?.color}35`,
                  borderRadius: 10, padding: '10px 16px', marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{ds?.icon}</span>
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: ds?.color,
                        fontWeight: 700, letterSpacing: '0.12em' }}>
                        {ds?.label} — {result.taskClass} TASK
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 1 }}>
                        {result.agents.join(' + ')} · {result.totalTokens} tokens · {result.durationMs}ms
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                    {new Date(result.timestamp).toLocaleTimeString('en-IN')}
                  </div>
                </div>

                {/* Agent outputs */}
                {result.outputs.map((o: any, i: number) => <AgentCard key={i} output={o} index={i} />)}

                {/* Hybrid merged brief */}
                {result.merged && (
                  <div style={{ background: `${C.hybrid}10`, border: `1px solid ${C.hybrid}35`,
                    borderRadius: 12, padding: 18 }}>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.hybrid, fontWeight: 700,
                      letterSpacing: '0.14em', marginBottom: 12 }}>⇄ EXECUTIVE BRIEF — MERGED OUTPUT</div>
                    <div style={{ fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.85,
                      color: '#C0D4EA', whiteSpace: 'pre-wrap' }}>{result.merged}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRESETS */}
        {tab === 'presets' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Preset Tasks</div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
                Pre-configured tasks for the 3 pending legal cases and 5 DPR fundraising rounds
              </div>
            </div>
            {PRESETS.map((p, i) => {
              const ds = DOMAIN_STYLE[p.domain as keyof typeof DOMAIN_STYLE]
              return (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ background: `${ds.color}20`, border: `1px solid ${ds.color}40`,
                      borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 13, color: ds.color, flexShrink: 0, marginTop: 1 }}>
                      {ds.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 8, color: ds.color, fontWeight: 700,
                          background: `${ds.color}15`, padding: '2px 8px', borderRadius: 3 }}>{p.domain}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <div style={{ fontFamily: C.serif, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{p.task}</div>
                    </div>
                    <button onClick={() => { setTask(p.task); setTab('console'); runOrchestration(p.task) }}
                      style={{ flexShrink: 0, background: C.gold, color: '#080800', border: 'none',
                        borderRadius: 7, padding: '7px 14px', fontFamily: C.mono, fontSize: 9,
                        fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      RUN →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Agent Run History</div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>{history.length} run(s) this session</div>
            </div>
            {history.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: 40, textAlign: 'center' }}>
                <div style={{ fontFamily: C.serif, fontSize: 18, color: C.muted, marginBottom: 6 }}>No runs yet</div>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>Use the Console or Presets tab to run your first agent task</div>
              </div>
            ) : history.map((r, i) => {
              const ds = DOMAIN_STYLE[r.taskClass as keyof typeof DOMAIN_STYLE] || DOMAIN_STYLE.UNKNOWN
              return (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer' }}
                  onClick={() => { setResult(r); setTab('console') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: ds.color, fontWeight: 700,
                      background: `${ds.color}15`, padding: '2px 7px', borderRadius: 3 }}>{ds.label}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                      {r.totalTokens} tokens · {r.durationMs}ms · {new Date(r.timestamp).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontFamily: C.serif, fontSize: 13, color: C.sub, lineHeight: 1.4 }}>
                    {r.task.slice(0, 140)}{r.task.length > 140 ? '…' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}