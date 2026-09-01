"use client";

/**
 * src/components/workspace/AIOrchestrationWorkspace.tsx
 *
 * BNLV Group — AI Orchestration Workspace UI Component
 * ==========================================================
 * TRACK C: Interactive console for multi-agent legal & financial tasks.
 */

import { useState, useEffect, useRef } from "react"

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

const DOMAIN_STYLE: Record<string, { color: string; label: string; icon: string }> = {
  LEGAL:    { color: C.legal,  label: 'LEGAL AGENT',     icon: '⚖' },
  FINANCIAL:{ color: C.fin,    label: 'FINANCIAL AGENT',  icon: '₹' },
  HYBRID:   { color: C.hybrid, label: 'DUAL AGENT',       icon: '⇄' },
  UNKNOWN:  { color: C.muted,  label: 'UNKNOWN',           icon: '?' },
}

const AGENT_STYLE: Record<string, { color: string; icon: string; title: string }> = {
  legal:        { color: C.legal,  icon: '⚖', title: 'Senior Advocate · Supreme Court of India' },
  financial:    { color: C.fin,    icon: '₹', title: 'McKinsey Infrastructure Finance Partner'   },
  orchestrator: { color: C.hybrid, icon: '⇄', title: 'BNLV AI Orchestrator'                     },
}

function AgentCard({ output, index }: { output: any; index: number }) {
  const as = AGENT_STYLE[output.agentName] || AGENT_STYLE.orchestrator
  const sections = output.content.split(/\n(?=[A-Z ]+:)/g).filter(Boolean)

  return (
    <div style={{ background: C.card, border: `1px solid ${as.color}30`, borderRadius: 12,
      overflow: 'hidden', marginBottom: 14 }}>
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
            {output.confidence?.toUpperCase() || 'HIGH'}
          </div>
        </div>
      </div>

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
  const outputRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lk = document.createElement('link')
    lk.rel   = 'stylesheet'
    lk.href  = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600&display=swap'
    document.head.appendChild(lk)
    return () => { document.head.removeChild(lk) }
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
      const res = await fetch('/api/ai/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: t })
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Orchestration failed')
      }
      setResult(data)
      setHistory(h => [data, ...h].slice(0, 10))
      setTask('')
    } catch (e: any) {
      setError(`Orchestration error: ${e?.message || 'Unknown error'}`)
    }
    setRunning(false)
  }

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>
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
        {tab === 'console' && (
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
                letterSpacing: '0.14em', marginBottom: 10 }}>⚡ TASK INPUT — Natural language · Auto-routed to Legal, Financial, or Hybrid agents</div>
              <textarea value={task} onChange={e => setTask(e.target.value)} rows={4}
                placeholder="Describe what you need..."
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '10px 12px', color: C.text, fontSize: 12, fontFamily: C.sans,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
              {error && <div style={{ fontFamily: C.mono, fontSize: 9, color: C.danger, marginTop: 8 }}>{error}</div>}
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

            {running && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: 24, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.gold, marginBottom: 12 }}>
                  ◌ ORCHESTRATING — Classifying task → Routing to agents → Generating output
                </div>
              </div>
            )}

            {result && !running && (
              <div ref={outputRef}>
                <div style={{ background: `${DOMAIN_STYLE[result.taskClass]?.color}15`,
                  border: `1px solid ${DOMAIN_STYLE[result.taskClass]?.color}35`,
                  borderRadius: 10, padding: '10px 16px', marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{DOMAIN_STYLE[result.taskClass]?.icon}</span>
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: DOMAIN_STYLE[result.taskClass]?.color,
                        fontWeight: 700, letterSpacing: '0.12em' }}>
                        {DOMAIN_STYLE[result.taskClass]?.label} — {result.taskClass} TASK
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 1 }}>
                        {result.agents.join(' + ')} · {result.totalTokens} tokens · {result.durationMs}ms
                      </div>
                    </div>
                  </div>
                </div>
                {result.outputs.map((o: any, i: number) => <AgentCard key={i} output={o} index={i} />)}
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

        {tab === 'presets' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: C.serif, fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Preset Tasks</div>
            </div>
            {PRESETS.map((p, i) => {
              const ds = DOMAIN_STYLE[p.domain]
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
              </div>
            ) : history.map((r, i) => {
              const ds = DOMAIN_STYLE[r.taskClass] || DOMAIN_STYLE.UNKNOWN
              return (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer' }}
                  onClick={() => { setResult(r); setTab('console') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: ds.color, fontWeight: 700,
                      background: `${ds.color}15`, padding: '2px 7px', borderRadius: 3 }}>{ds.label}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                      {r.totalTokens} tokens · {r.durationMs}ms
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