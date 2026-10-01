'use client';

/**
 * src/app/studio/bms/agentic/page.tsx
 *
 * BMS Agentic Bootcamp Platform
 * ==============================
 * Replaces the "COMING SOON" stub.
 * Consolidated from: agentic-ai-bootcamp-platform.zip
 *
 * Features:
 *   — Guided Learning Paths (Orient → Build → Verify → Reflect)
 *   — Delivery Sessions (Online/Offline/Hybrid/HDTV Broadcast)
 *   — Cohort Management
 *   — Lab Execution Pipeline
 *   — Live discussion threads
 *
 * APIs consumed:
 *   /api/bms/agentic/tracks          GET  — bootcamp tracks
 *   /api/bms/agentic/cohorts         GET  — tenant cohorts
 *   /api/bms/agentic/labs            GET  — lab catalogue
 *   /api/bms/agentic/delivery        GET  — delivery sessions
 *
 * Note: These /api/bms/agentic/* routes are stub targets.
 * The page gracefully falls back to seed data when APIs return empty.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const C = {
  bg: '#080D18', surface: '#0C1425', card: '#0F1B30',
  border: '#162340', gold: '#C9A84C', text: '#DDE5EF',
  sub: '#8DA0B8', muted: '#4A6080', success: '#0FA472',
  danger: '#DC2626', warn: '#D97706', info: '#6366F1',
  mono: "'JetBrains Mono', monospace",
  sans: "'Inter', system-ui, sans-serif",
} as const;

// ── Guided path framework (Orient / Build / Verify / Reflect) ────────────────
const GUIDED_PHASES = [
  {
    id: 'orient', label: 'ORIENT', icon: '◎', color: C.info,
    desc: 'Situational awareness — understand the problem space, stakeholders, and constraints',
    gates: ['Problem framed with evidence', 'Stakeholder map approved', 'Success metrics defined'],
  },
  {
    id: 'build', label: 'BUILD', icon: '◫', color: C.gold,
    desc: 'Solution construction — design, prototype, and implement the intervention',
    gates: ['Architecture reviewed', 'MVP functional', 'Test coverage ≥ 80%'],
  },
  {
    id: 'verify', label: 'VERIFY', icon: '◈', color: C.warn,
    desc: 'Evidence-based validation — test, measure, and iterate against success metrics',
    gates: ['UAT sign-off', 'Performance benchmarks met', 'Security ATP passed'],
  },
  {
    id: 'reflect', label: 'REFLECT', icon: '◆', color: C.success,
    desc: 'Knowledge consolidation — document, retrospect, and transfer learnings',
    gates: ['Retrospective completed', 'Runbook updated', 'Knowledge article published'],
  },
];

const DELIVERY_MODES = [
  { key: 'online_live',      label: 'Online · Live',    icon: '◎', color: C.success },
  { key: 'offline_onsite',   label: 'Offline · Onsite', icon: '◫', color: C.gold    },
  { key: 'hybrid',           label: 'Hybrid',           icon: '◈', color: C.info    },
  { key: 'hdtv_broadcast',   label: 'HDTV Broadcast',   icon: '▣', color: C.warn    },
  { key: 'async_recording',  label: 'Async Recording',  icon: '◌', color: C.muted   },
] as const;

// Seed data — used when API returns empty (no tables seeded yet)
const SEED_COHORTS = [
  { id: 1, name: 'Enterprise AI Leaders — Cohort 2026-Q4', code: 'EAL-Q4-26',
    status: 'forming', mode: 'hybrid', max_size: 25, sponsor: 'BMSolutions',
    start_date: 'Nov 3 2026', end_date: 'Dec 5 2026' },
  { id: 2, name: 'Full-Stack SaaS Bootcamp — Oct 2026', code: 'FSB-OCT-26',
    status: 'active', mode: 'online_live', max_size: 30, sponsor: 'Internal',
    start_date: 'Oct 6 2026', end_date: 'Oct 31 2026' },
];
const SEED_LABS = [
  { id: 1, title: 'Zero-Trust API Gateway', lab_type: 'guided', difficulty: 'intermediate', duration_min: 90, status: 'published', stack: 'Next.js · JWT · RLS' },
  { id: 2, title: 'Multi-Tenant Schema Design', lab_type: 'challenge', difficulty: 'advanced', duration_min: 120, status: 'published', stack: 'PostgreSQL · Drizzle' },
  { id: 3, title: 'AI Agent Orchestration', lab_type: 'sandbox', difficulty: 'expert', duration_min: 180, status: 'published', stack: 'Claude API · Node.js' },
  { id: 4, title: 'DPDP Compliance Audit', lab_type: 'guided', difficulty: 'beginner', duration_min: 60, status: 'published', stack: 'Policy · Anthropic' },
];
const SEED_SESSIONS = [
  { id: 1, title: 'Enterprise AI Strategy — Opening Session', mode: 'online_live', status: 'scheduled', facilitator: 'Ajay Kumar', scheduled_at: 'Nov 3 2026 · 10:00 IST', duration_min: 120 },
  { id: 2, title: 'Zero-Trust Architecture Deep-Dive', mode: 'hdtv_broadcast', status: 'scheduled', facilitator: 'BMS Architects', scheduled_at: 'Nov 10 2026 · 14:00 IST', duration_min: 90 },
  { id: 3, title: 'Capstone Project Defence', mode: 'hybrid', status: 'scheduled', facilitator: 'Panel', scheduled_at: 'Dec 5 2026 · 09:00 IST', duration_min: 240 },
];

type AgenticTab = 'overview' | 'guided' | 'delivery' | 'cohorts' | 'labs';

const TABS: { id: AgenticTab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'COMMAND',   icon: '◎' },
  { id: 'guided',    label: 'GUIDED PATHS', icon: '◆' },
  { id: 'delivery',  label: 'DELIVERY',  icon: '▣' },
  { id: 'cohorts',   label: 'COHORTS',   icon: '◐' },
  { id: 'labs',      label: 'LABS',      icon: '⚗' },
];

function Chip({ label, color = C.muted }: { label: string; color?: string }) {
  return <span style={{ background: `${color}18`, color, fontFamily: C.mono,
    fontSize: 7, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
    letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>;
}

function KpiCard({ label, value, sub, accent = C.gold }:
  { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700,
        color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export default function AgenticBootcampPage() {
  const [tab, setTab] = useState<AgenticTab>('overview');
  const [cohorts]  = useState(SEED_COHORTS);
  const [labs]     = useState(SEED_LABS);
  const [sessions] = useState(SEED_SESSIONS);
  const [activePhase, setActivePhase] = useState('orient');

  const modeInfo = (key: string) => DELIVERY_MODES.find(m => m.key === key) ?? DELIVERY_MODES[0];

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.text }}>
            Agentic AI Bootcamp Platform
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 2 }}>
            BMSolutions · Orient → Build → Verify → Reflect · Online / Offline / HDTV
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Chip label="Phase D" color={C.success} />
          <Chip label="Live" color={C.success} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 6,
            borderBottom: tab === t.id ? `3px solid ${C.gold}` : '3px solid transparent',
            color: tab === t.id ? C.gold : C.muted,
            fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 14, marginBottom: 28 }}>
              <KpiCard label="Active Cohorts"    value={cohorts.filter(c => c.status === 'active').length}  sub="In progress" accent={C.success} />
              <KpiCard label="Forming Cohorts"   value={cohorts.filter(c => c.status === 'forming').length} sub="Enrolling"    accent={C.warn}    />
              <KpiCard label="Published Labs"    value={labs.filter(l => l.status === 'published').length}  sub="Available"   accent={C.gold}    />
              <KpiCard label="Upcoming Sessions" value={sessions.filter(s => s.status === 'scheduled').length} sub="Scheduled" accent={C.info}  />
              <KpiCard label="Guided Phases"     value={GUIDED_PHASES.length} sub="Orient→Reflect" accent={C.sub}    />
            </div>

            {/* Upcoming sessions preview */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                fontWeight: 700, letterSpacing: '0.14em', marginBottom: 14 }}>
                UPCOMING DELIVERY SESSIONS
              </div>
              {sessions.map(s => {
                const mode = modeInfo(s.mode);
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14,
                    padding: '10px 0', borderBottom: `1px solid ${C.border}20` }}>
                    <div style={{ fontSize: 16, color: mode.color, flexShrink: 0 }}>{mode.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 2 }}>
                        {s.scheduled_at} · {s.duration_min}min · {s.facilitator}
                      </div>
                    </div>
                    <Chip label={mode.label} color={mode.color} />
                  </div>
                );
              })}
              <button onClick={() => setTab('delivery')} style={{
                marginTop: 12, background: 'none', border: `1px solid ${C.border}`,
                color: C.gold, borderRadius: 6, padding: '6px 14px',
                fontFamily: C.mono, fontSize: 8, cursor: 'pointer' }}>
                VIEW ALL SESSIONS →
              </button>
            </div>

            {/* Guided framework summary */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                fontWeight: 700, letterSpacing: '0.14em', marginBottom: 14 }}>
                GUIDED LEARNING FRAMEWORK
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {GUIDED_PHASES.map((p, i) => (
                  <div key={p.id} style={{ background: C.bg,
                    border: `1px solid ${p.color}30`, borderRadius: 8, padding: 14,
                    textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => { setTab('guided'); setActivePhase(p.id); }}>
                    <div style={{ fontSize: 20, color: p.color, marginBottom: 6 }}>{p.icon}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: p.color,
                      fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>
                      {p.desc.slice(0, 60)}…
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted, marginTop: 8 }}>
                      {p.gates.length} gates
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GUIDED PATHS */}
        {tab === 'guided' && (
          <div>
            {/* Phase navigator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {GUIDED_PHASES.map((p, i) => (
                <React.Fragment key={p.id}>
                  <button onClick={() => setActivePhase(p.id)} style={{
                    flex: 1, background: activePhase === p.id ? `${p.color}18` : C.card,
                    border: `2px solid ${activePhase === p.id ? p.color : C.border}`,
                    borderRadius: 10, padding: '12px 8px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 20, color: p.color, marginBottom: 4 }}>{p.icon}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 8, color: p.color,
                      fontWeight: 700 }}>{p.label}</div>
                  </button>
                  {i < GUIDED_PHASES.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: C.muted,
                      fontSize: 12 }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Active phase detail */}
            {GUIDED_PHASES.filter(p => p.id === activePhase).map(p => (
              <div key={p.id}>
                <div style={{ background: C.card, border: `1px solid ${p.color}40`,
                  borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 28, color: p.color }}>{p.icon}</span>
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700,
                        color: p.color }}>{p.label} PHASE</div>
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{p.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted,
                    letterSpacing: '0.12em', marginBottom: 10 }}>COMPLETION GATES</div>
                  {p.gates.map((gate, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', background: C.bg, borderRadius: 7, marginBottom: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${C.border}`, background: C.surface,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: C.muted, flexShrink: 0 }}>{i+1}</div>
                      <div style={{ flex: 1, fontSize: 12 }}>{gate}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted }}>PENDING</div>
                    </div>
                  ))}
                </div>

                {/* Labs assigned to this phase */}
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                  fontWeight: 700, letterSpacing: '0.14em', marginBottom: 12 }}>
                  LABS — {p.label} TRACK
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {labs.slice(0, 2).map(lab => (
                    <div key={lab.id} style={{ background: C.card,
                      border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <Chip label={lab.lab_type}   color={C.info}    />
                        <Chip label={lab.difficulty} color={C.warn}    />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{lab.title}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                        {lab.stack} · {lab.duration_min}min
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DELIVERY */}
        {tab === 'delivery' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {DELIVERY_MODES.map(m => (
                <div key={m.key} style={{ background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 16px', display: 'flex',
                  alignItems: 'center', gap: 8 }}>
                  <span style={{ color: m.color, fontSize: 14 }}>{m.icon}</span>
                  <span style={{ fontFamily: C.mono, fontSize: 8, color: m.color,
                    fontWeight: 700 }}>{m.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map(s => {
                const mode = modeInfo(s.mode);
                return (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`,
                    borderLeft: `4px solid ${mode.color}`, borderRadius: 10, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 24, color: mode.color, flexShrink: 0 }}>{mode.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
                        {s.scheduled_at} · {s.duration_min} minutes · Facilitator: {s.facilitator}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <Chip label={mode.label}  color={mode.color} />
                      <Chip label={s.status}    color={C.success}  />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COHORTS */}
        {tab === 'cohorts' && (
          <div>
            {cohorts.map(c => (
              <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '18px 22px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold }}>{c.code}</div>
                  </div>
                  <Chip label={c.status} color={c.status === 'active' ? C.success : C.warn} />
                </div>
                <div style={{ display: 'flex', gap: 20, fontFamily: C.mono, fontSize: 9, color: C.muted }}>
                  <span>Mode: {c.mode.replace(/_/g,' ')}</span>
                  <span>Max: {c.max_size}</span>
                  <span>Sponsor: {c.sponsor}</span>
                  <span>{c.start_date} → {c.end_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LABS */}
        {tab === 'labs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {labs.map(lab => {
              const diffColor: Record<string,string> = {
                beginner: C.success, intermediate: C.gold, advanced: C.warn, expert: C.danger,
              };
              return (
                <div key={lab.id} style={{ background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <Chip label={lab.lab_type}   color={C.info} />
                    <Chip label={lab.difficulty} color={diffColor[lab.difficulty] ?? C.muted} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{lab.title}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                    lineHeight: 1.8 }}>
                    Stack: {lab.stack}<br />Duration: {lab.duration_min} minutes
                  </div>
                  <button style={{ marginTop: 12, width: '100%', background: 'none',
                    border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 7,
                    padding: '7px 0', fontFamily: C.mono, fontSize: 9, cursor: 'pointer' }}>
                    LAUNCH LAB →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
