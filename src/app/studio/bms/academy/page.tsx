'use client';

/**
 * src/app/studio/bms/academy/page.tsx
 *  — also replaces /studio/bms-academy (legacy route — add redirect)
 *
 * BMS Executive Academy
 * =====================
 * Consolidated from: E-LMS_BNLV-A.zip
 *
 * Features:
 *   — Executive Framework Tools (Porter's 5 Forces, MECE, BCG Matrix, McKinsey 7S, Pyramid Memo)
 *   — Verifiable Digital Certificates (SHA-256 credential hash)
 *   — Live Masterclasses scheduling
 *   — BNLV Broadcast Media Programs
 *
 * Shell nav entry (add to src/components/Shell.tsx — Build group):
 *   { href: '/studio/bms/academy', label: 'Academy', icon: '◈',
 *     hint: 'Executive tools · Certificates · Masterclasses' }
 */

import React, { useState, useCallback } from 'react';

const C = {
  bg: '#080D18', surface: '#0C1425', card: '#0F1B30',
  border: '#162340', gold: '#C9A84C', text: '#DDE5EF',
  sub: '#8DA0B8', muted: '#4A6080', success: '#0FA472',
  danger: '#DC2626', warn: '#D97706', info: '#6366F1',
  mono: "'JetBrains Mono', monospace",
  sans: "'Inter', system-ui, sans-serif",
} as const;

type AcademyTab = 'tools' | 'certificates' | 'masterclasses' | 'media';

const TABS: { id: AcademyTab; label: string; icon: string }[] = [
  { id: 'tools',          label: 'EXEC TOOLS',    icon: '◈' },
  { id: 'certificates',   label: 'CERTIFICATES',  icon: '◆' },
  { id: 'masterclasses',  label: 'MASTERCLASSES', icon: '◎' },
  { id: 'media',          label: 'BNLV BROADCAST',icon: '▣' },
];

// ── Executive Tool Definitions ────────────────────────────────────────────────
const TOOLS = [
  {
    key: 'porter5', name: "Porter's Five Forces", icon: '⬡', category: 'Strategy',
    academy: 'HBS', accentColor: '#1B4FBB',
    desc: "Analyse competitive intensity and industry attractiveness using Harvard Business School's classic framework.",
    fields: [
      { id: 'rivalry',      label: 'Competitive Rivalry',        force: 'High' },
      { id: 'new_entrants', label: 'Threat of New Entrants',     force: 'Medium' },
      { id: 'suppliers',    label: 'Bargaining Power of Suppliers', force: 'Low' },
      { id: 'buyers',       label: 'Bargaining Power of Buyers', force: 'High' },
      { id: 'substitutes',  label: 'Threat of Substitutes',      force: 'Medium' },
    ],
  },
  {
    key: 'mece', name: 'MECE Issue Tree', icon: '▤', category: 'Strategy',
    academy: 'McKinsey', accentColor: '#1B7745',
    desc: 'Structure problems using the Mutually Exclusive, Collectively Exhaustive (MECE) principle from McKinsey & Company.',
    fields: [
      { id: 'root',    label: 'Root Problem Statement',  force: '' },
      { id: 'branch1', label: 'Branch 1 — Revenue',      force: '' },
      { id: 'branch2', label: 'Branch 2 — Cost',         force: '' },
      { id: 'branch3', label: 'Branch 3 — Market Share', force: '' },
    ],
  },
  {
    key: 'bcg_matrix', name: 'BCG Growth-Share Matrix', icon: '◈', category: 'Strategy',
    academy: 'BCG', accentColor: '#1C5B9A',
    desc: 'Categorise business units or products by market growth rate and relative market share.',
    fields: [
      { id: 'stars',         label: 'Stars (High Growth · High Share)',     force: '' },
      { id: 'cash_cows',     label: 'Cash Cows (Low Growth · High Share)',  force: '' },
      { id: 'question_marks',label: 'Question Marks (High Growth · Low Share)', force: '' },
      { id: 'dogs',          label: 'Dogs (Low Growth · Low Share)',        force: '' },
    ],
  },
  {
    key: 'mckinsey_7s', name: 'McKinsey 7S Framework', icon: '◉', category: 'Operations',
    academy: 'McKinsey', accentColor: '#1B7745',
    desc: 'Align organisational elements across seven interdependent factors to drive effective change.',
    fields: [
      { id: 'strategy',  label: 'Strategy',  force: '' },
      { id: 'structure', label: 'Structure', force: '' },
      { id: 'systems',   label: 'Systems',   force: '' },
      { id: 'shared',    label: 'Shared Values', force: '' },
      { id: 'style',     label: 'Style',     force: '' },
      { id: 'staff',     label: 'Staff',     force: '' },
      { id: 'skills',    label: 'Skills',    force: '' },
    ],
  },
  {
    key: 'pyramid', name: 'Pyramid Memo (Minto)', icon: '▲', category: 'Communication',
    academy: 'HBS', accentColor: '#1B4FBB',
    desc: "Structure executive communications using Barbara Minto's top-down pyramid principle.",
    fields: [
      { id: 'conclusion', label: 'Governing Thought / Conclusion', force: '' },
      { id: 'key1',       label: 'Key Argument 1',                 force: '' },
      { id: 'key2',       label: 'Key Argument 2',                 force: '' },
      { id: 'key3',       label: 'Key Argument 3',                 force: '' },
      { id: 'situation',  label: 'Situation',                      force: '' },
      { id: 'complication', label: 'Complication',                 force: '' },
      { id: 'resolution', label: 'Resolution / Ask',               force: '' },
    ],
  },
] as const;

// Seed certificates
const SEED_CERTS = [
  { id: 1, credential_id: 'BNLV-2026-HBS-00001', title: 'AI Strategy for Enterprise Leaders',
    recipient_name: 'Ajay Kumar', academy: 'HBS', level: 'distinction',
    issued_at: '15 Sep 2026', expires_at: '15 Sep 2029',
    verification_hash: 'a8f3c1d2e9b7...4e5f6a7b8c9d0' },
  { id: 2, credential_id: 'BNLV-2026-MCK-00002', title: 'Problem Structuring & MECE Thinking',
    recipient_name: 'Ajay Kumar', academy: 'McKinsey', level: 'completion',
    issued_at: '22 Aug 2026', expires_at: null,
    verification_hash: 'b2c4d6e8f0a1...9d8c7b6a5e4f3' },
];

// Seed masterclasses
const SEED_MASTERCLASSES = [
  { id: 1, title: 'AI Governance for Board Directors', speaker: 'Dr. Priya Krishnan',
    status: 'upcoming', scheduled_at: 'Nov 12 2026 · 15:00 IST', duration_min: 90,
    max_seats: 200, registered: 143, academy: 'BNLV Executive' },
  { id: 2, title: 'Institutional Fundraising in India 2026–27', speaker: 'Rajiv Mehta, CFA',
    status: 'upcoming', scheduled_at: 'Nov 19 2026 · 11:00 IST', duration_min: 60,
    max_seats: 100, registered: 67, academy: 'Nidhivan Desk' },
  { id: 3, title: 'Supreme Court Advocacy — New Digital Workflows', speaker: 'Sr. Adv. Anupama Singh',
    status: 'replay_available', scheduled_at: '3 Oct 2026', duration_min: 120,
    max_seats: 500, registered: 489, academy: 'LIMSY Academy' },
];

// Seed media programs
const SEED_MEDIA = [
  { id: 1, title: 'AI at the Edge', series: 'BNLV Tech Talks', episode: 3, kind: 'show',
    status: 'published', synopsis: 'How Vercel edge functions and Claude AI combine for sub-100ms intelligent responses.',
    runtime_min: 28, hosts: 'Ajay Kumar', air_date: '18 Sep 2026' },
  { id: 2, title: 'The Zero-Trust Mandate', series: 'Security Unpacked', episode: 1, kind: 'documentary',
    status: 'in_production', synopsis: 'Why every enterprise must adopt database-layer row-level security.',
    runtime_min: 45, hosts: 'BMS Architecture Team', air_date: 'Oct 2026' },
  { id: 3, title: 'Nidhivan FinTech Lab — Q3 Showcase', series: 'Lab Reports', episode: 5, kind: 'case_study',
    status: 'published', synopsis: 'Reviewing five live fintech experiments: IRR calculator, BOQ engine, DPR automation, LTV:CAC modeler, burn multiple tracker.',
    runtime_min: 52, hosts: 'Nidhivan Research Desk', air_date: '25 Sep 2026' },
];

// ── Porter's Five Forces Interactive Builder ──────────────────────────────────
type ForceLevel = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
const FORCE_LEVELS: ForceLevel[] = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const FORCE_COLOR: Record<ForceLevel, string> = {
  'Very Low': C.success, 'Low': '#6EE7B7', 'Medium': C.warn,
  'High': '#F97316', 'Very High': C.danger,
};

function PorterBuilder() {
  const tool = TOOLS[0];
  const [values, setValues] = useState<Record<string, ForceLevel>>(
    Object.fromEntries(tool.fields.map(f => [f.id, f.force as ForceLevel || 'Medium']))
  );
  const [context, setContext] = useState('Enterprise SaaS market for mid-market Indian companies (INR 5–50 Cr revenue)');
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    setSaved(true);
    // POST /api/bms/academy/tools/saves with { toolKey: 'porter5', contentData: { values, context } }
    setTimeout(() => setSaved(false), 2500);
  }, [values, context]);

  return (
    <div>
      <div style={{ background: C.card, border: `1px solid #1B4FBB40`,
        borderRadius: 12, padding: '18px 22px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: '#1B4FBB20', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#4D8AFF', flexShrink: 0 }}>⬡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{tool.name}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{tool.desc}</div>
          </div>
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{ fontFamily: C.mono, fontSize: 7, color: '#4D8AFF',
              background: '#1B4FBB18', padding: '3px 8px', borderRadius: 3 }}>HBS</span>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
            letterSpacing: '0.1em', marginBottom: 6 }}>INDUSTRY CONTEXT</div>
          <input value={context} onChange={e => setContext(e.target.value)}
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '8px 12px', color: C.text,
              fontFamily: C.sans, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {tool.fields.map(field => (
            <div key={field.id} style={{ background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                marginBottom: 8, letterSpacing: '0.08em' }}>{field.label.toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {FORCE_LEVELS.map(level => (
                  <button key={level} onClick={() => setValues(v => ({ ...v, [field.id]: level }))}
                    style={{
                      background: values[field.id] === level ? `${FORCE_COLOR[level]}25` : 'none',
                      border: `1px solid ${values[field.id] === level ? FORCE_COLOR[level] : C.border}`,
                      color: values[field.id] === level ? FORCE_COLOR[level] : C.muted,
                      borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
                      fontFamily: C.mono, fontSize: 7, fontWeight: values[field.id] === level ? 700 : 400,
                    }}>{level}</button>
                ))}
              </div>
              <div style={{ marginTop: 6, fontFamily: C.mono, fontSize: 9,
                color: FORCE_COLOR[values[field.id]] ?? C.gold, fontWeight: 700 }}>
                {values[field.id]}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={save} style={{ background: saved ? C.success : C.gold,
            border: 'none', borderRadius: 7, padding: '8px 20px',
            fontFamily: C.mono, fontSize: 9, fontWeight: 700,
            color: '#080800', cursor: 'pointer' }}>
            {saved ? '✓ SAVED' : '⬇ SAVE ANALYSIS'}
          </button>
          <button style={{ background: 'none', border: `1px solid ${C.border}`,
            borderRadius: 7, padding: '8px 16px', fontFamily: C.mono, fontSize: 9,
            color: C.muted, cursor: 'pointer' }}>EXPORT PDF</button>
        </div>
      </div>

      {/* Other tools grid */}
      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
        letterSpacing: '0.14em', marginBottom: 12 }}>MORE EXECUTIVE FRAMEWORKS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {TOOLS.slice(1).map(t => (
          <div key={t.key} style={{ background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 16, cursor: 'pointer' }}>
            <div style={{ fontSize: 20, color: t.accentColor, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontFamily: C.mono, fontSize: 7, color: t.accentColor,
              background: `${t.accentColor}15`, padding: '2px 7px', borderRadius: 3,
              display: 'inline-block', marginBottom: 8 }}>{t.academy}</div>
            <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
              {t.desc.slice(0, 80)}…
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExecutiveAcademyPage() {
  const [tab, setTab] = useState<AcademyTab>('tools');

  const levelColor: Record<string, string> = {
    completion: C.sub, achievement: C.gold, distinction: C.info,
    excellence: C.warn, mastery: C.success,
  };
  const statusColor: Record<string, string> = {
    upcoming: C.gold, live: C.success, replay_available: C.info,
    published: C.success, in_production: C.warn,
  };
  const kindLabel: Record<string, string> = {
    show: 'Show', documentary: 'Documentary', case_study: 'Case Study',
    interview: 'Interview', panel: 'Panel', training_film: 'Training Film',
  };

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>

      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.text }}>
            BMS Executive Academy
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 2 }}>
            HBS · McKinsey · BCG · Stanford · Cambridge · Nidhivan · LIMSY · BNLV Broadcast
          </div>
        </div>
        <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
          Sample only — not accredited academic credentials
        </span>
      </div>

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

        {tab === 'tools' && <PorterBuilder />}

        {tab === 'certificates' && (
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.14em', marginBottom: 16 }}>YOUR CREDENTIALS</div>
            {SEED_CERTS.map(cert => (
              <div key={cert.id} style={{ background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px',
                marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12,
                    background: '#1B4FBB20', border: `2px solid ${C.gold}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0 }}>◆</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{cert.title}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                      marginBottom: 6 }}>{cert.credential_id}</div>
                    <div style={{ display: 'flex', gap: 12, fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                      <span>Issued: {cert.issued_at}</span>
                      {cert.expires_at && <span>Expires: {cert.expires_at}</span>}
                      <span>Academy: {cert.academy}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ background: `${levelColor[cert.level]}15`,
                      color: levelColor[cert.level], fontFamily: C.mono,
                      fontSize: 8, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {cert.level}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 14, background: C.bg, borderRadius: 8, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>SHA-256:</span>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                    wordBreak: 'break-all', flex: 1 }}>{cert.verification_hash}</span>
                  <button style={{ background: 'none', border: `1px solid ${C.border}`,
                    color: C.gold, borderRadius: 5, padding: '3px 10px',
                    fontFamily: C.mono, fontSize: 7, cursor: 'pointer',
                    flexShrink: 0 }}>VERIFY</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'masterclasses' && (
          <div>
            {SEED_MASTERCLASSES.map(mc => (
              <div key={mc.id} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '18px 22px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10,
                  background: '#162340', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>◎</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{mc.title}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>
                    {mc.speaker} · {mc.academy}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                    {mc.scheduled_at} · {mc.duration_min}min · {mc.registered}/{mc.max_seats} registered
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <span style={{ background: `${statusColor[mc.status]}18`,
                    color: statusColor[mc.status], fontFamily: C.mono, fontSize: 7,
                    fontWeight: 700, padding: '3px 9px', borderRadius: 3,
                    textTransform: 'uppercase' }}>{mc.status.replace(/_/g,' ')}</span>
                  <button style={{ background: mc.status === 'upcoming' ? C.gold : 'none',
                    border: `1px solid ${mc.status === 'upcoming' ? C.gold : C.border}`,
                    color: mc.status === 'upcoming' ? '#080800' : C.muted,
                    borderRadius: 6, padding: '5px 12px', fontFamily: C.mono,
                    fontSize: 8, cursor: 'pointer' }}>
                    {mc.status === 'upcoming' ? 'REGISTER' : mc.status === 'replay_available' ? 'WATCH REPLAY' : 'VIEW'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'media' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {SEED_MEDIA.map(p => (
              <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ height: 100, background: '#122038',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, color: C.gold }}>▣</div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontFamily: C.mono, fontSize: 7, color: statusColor[p.status],
                      background: `${statusColor[p.status]}15`, padding: '2px 7px',
                      borderRadius: 3, textTransform: 'uppercase' }}>{p.status.replace(/_/g,' ')}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 7, color: C.muted,
                      padding: '2px 7px', borderRadius: 3 }}>{kindLabel[p.kind]}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4,
                    lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                    marginBottom: 6 }}>{p.series} · S1E{p.episode}</div>
                  <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.5 }}>
                    {p.synopsis.slice(0, 90)}…
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 8 }}>
                    {p.runtime_min}min · {p.hosts} · {p.air_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
