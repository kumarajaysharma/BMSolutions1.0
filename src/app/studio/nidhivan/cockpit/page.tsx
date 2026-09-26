'use client';

/**
 * src/app/studio/nidhivan/cockpit/page.tsx
 *
 * Nidhivan Consulting — Executive Intelligence Cockpit
 * ====================================================
 * Ported from BI-Nidhivan/src/modules/Cockpit.tsx with BNLV adaptations:
 *   - Connected to live DB via /api/nidhivan/cockpit (not hardcoded seed data)
 *   - ADR-004: aumPaise / revenuePaise displayed via paiseToCrores() utility
 *   - BNLV dark brand theme (navy/gold) — not the BI-OS editorial light theme
 *   - AbortController for cleanup on unmount
 *
 * ROUTE: Add to Shell.tsx nav under "Nidhivan Finance" group:
 *   { href: '/studio/nidhivan/cockpit', label: 'Cockpit', icon: '◎',
 *     hint: 'Executive intelligence dashboard' }
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { paiseToCrores, fmtCr, fmtPct } from '@/lib/nidhivan-finance';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      '#080D18', surface: '#0C1425', card: '#0F1B30',
  border:  '#162340', gold:    '#C9A84C', goldDim: '#7A5E28',
  white:   '#FFFFFF', text:    '#DDE5EF', sub:     '#8DA0B8',
  muted:   '#4A6080', success: '#0FA472', danger:  '#DC2626',
  warn:    '#D97706', info:    '#6366F1',
  mono:    "'JetBrains Mono', monospace",
  sans:    "'Inter', system-ui, sans-serif",
} as const;

// ── Types mirroring /api/nidhivan/cockpit response ───────────────────────────
interface Entity {
  id: number; name: string; ticker: string; sector: string;
  status: string; relationship: string; aumPaise: number; currency: string;
}
interface ResearchItem {
  id: number; title: string; desk: string; rating: string;
  status: string; author: string; publishedOn: string; thesis: string;
}
interface LabItem { id: number; name: string; stage: string; domain: string; owner: string; }
interface CloseItem { id: number; period: string; status: string; owner: string; }
interface PipelineItem { status: string; cnt: number; }
interface CockpitData {
  entities: Entity[]; aumTotalPaise: number; entityCounts: { status: string; cnt: number }[];
  research: ResearchItem[]; openCloses: CloseItem[]; labItems: LabItem[];
  pipeline: PipelineItem[];
}

// ── Mini helpers ──────────────────────────────────────────────────────────────
const STAGE_COLOR: Record<string, string> = {
  ideation: '#4A6080', prototype: '#6366F1', sandbox: C.gold,
  pilot: C.warn, production: C.success, retired: C.danger,
};
const SECTOR_ICON: Record<string, string> = {
  Financials: '₹', Technology: '⚡', Healthcare: '⚕', Energy: '⚡', Infrastructure: '⬡',
};
const RATING_COLOR: Record<string, string> = {
  buy: C.success, overweight: C.success, hold: C.gold, underweight: C.warn, sell: C.danger,
};

function KpiCard({ label, value, sub, accent = C.gold }:
  { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '18px 20px', minWidth: 0 }}>
      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700,
        color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: C.sans, fontSize: 11,
        color: C.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NidhivanCockpit() {
  const [data,    setData]    = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const abortRef              = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/nidhivan/cockpit', { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!ctrl.signal.aborted) setData(await res.json());
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: C.mono, fontSize: 10, color: C.muted }}>
      LOADING COCKPIT DATA…
    </div>
  );

  if (error) return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: 32,
      fontFamily: C.mono, fontSize: 10, color: C.danger }}>
      ⚠ {error}
      <button onClick={load} style={{ marginLeft: 16, color: C.gold, background: 'none',
        border: `1px solid ${C.gold}`, borderRadius: 5, padding: '4px 12px',
        cursor: 'pointer', fontSize: 9 }}>RETRY</button>
    </div>
  );

  // ── Derived metrics ────────────────────────────────────────────────────────
  const totalAumCr   = paiseToCrores(data?.aumTotalPaise ?? 0);
  const activeCount  = data?.entityCounts.find(e => e.status === 'active')?.cnt  ?? 0;
  const prospectCount= data?.entityCounts.find(e => e.status === 'prospect')?.cnt ?? 0;
  const openCloseCount = data?.openCloses.length ?? 0;
  const pipelineTotal  = data?.pipeline.reduce((s, p) => s + Number(p.cnt), 0) ?? 0;
  const onboarded      = data?.pipeline.find(p => p.status === 'onboarded')?.cnt ?? 0;

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700,
            color: C.text, letterSpacing: '0.06em' }}>Nidhivan Intelligence Cockpit</div>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
            letterSpacing: '0.1em', marginTop: 2 }}>
            Live Portfolio · Research · Lab Pipeline · Period Close
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%',
            background: C.success, boxShadow: `0 0 7px ${C.success}` }} />
          <span style={{ fontFamily: C.mono, fontSize: 8, color: C.success,
            fontWeight: 700 }}>LIVE</span>
          <button onClick={load} style={{ background: 'none',
            border: `1px solid ${C.border}`, borderRadius: 5,
            padding: '4px 10px', color: C.muted, fontFamily: C.mono,
            fontSize: 8, cursor: 'pointer' }}>↻ REFRESH</button>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>

        {/* ── KPI cards ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14, marginBottom: 28 }}>
          <KpiCard label="AUM Under Advisory" value={fmtCr(totalAumCr)} sub="Active entities only" />
          <KpiCard label="Active Mandates"     value={String(activeCount)}  sub={`${prospectCount} in pipeline`} accent={C.success} />
          <KpiCard label="Deal Pipeline"       value={String(pipelineTotal)} sub={`${onboarded} onboarded`} accent={C.info} />
          <KpiCard label="Open Period Closes"  value={String(openCloseCount)} sub="Requires action" accent={openCloseCount > 0 ? C.warn : C.success} />
          <KpiCard label="Active Lab Streams"  value={String(data?.labItems.length ?? 0)} sub="Fintech R&D" accent={C.gold} />
          <KpiCard label="Research Published"  value={String(data?.research.length ?? 0)} sub="This period" accent={C.sub} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* ── Entity portfolio ─────────────────────────────────────────── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                fontWeight: 700, letterSpacing: '0.14em' }}>ADVISORY PORTFOLIO</div>
              <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                {data?.entities.length ?? 0} entities
              </span>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {!data?.entities.length ? (
                <div style={{ padding: 32, textAlign: 'center', color: C.muted,
                  fontFamily: C.mono, fontSize: 9 }}>
                  No entities on record. Add via /studio/nidhivan/books.
                </div>
              ) : data.entities.map(e => (
                <div key={e.id} style={{ padding: '12px 18px',
                  borderBottom: `1px solid ${C.border}20`,
                  display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8,
                    background: '#122038', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {SECTOR_ICON[e.sector] ?? '◈'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13,
                        color: C.text, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' }}>{e.name}</span>
                      {e.ticker && (
                        <span style={{ fontFamily: C.mono, fontSize: 7,
                          color: C.gold, background: '#1A1000',
                          padding: '1px 6px', borderRadius: 3 }}>{e.ticker}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 2 }}>
                      {e.sector} · {e.relationship} · {e.currency}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: C.mono, fontSize: 11,
                      fontWeight: 700, color: C.gold }}>
                      {e.aumPaise > 0 ? fmtCr(paiseToCrores(e.aumPaise), 1) : '—'}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 7,
                      color: e.status === 'active' ? C.success : C.muted,
                      textTransform: 'uppercase' }}>{e.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Research desk */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
                letterSpacing: '0.14em' }}>RESEARCH DESK</div>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {!data?.research.length ? (
                  <div style={{ padding: 20, textAlign: 'center', color: C.muted,
                    fontFamily: C.mono, fontSize: 9 }}>No published research.</div>
                ) : data.research.map(r => (
                  <div key={r.id} style={{ padding: '10px 16px',
                    borderBottom: `1px solid ${C.border}20`,
                    display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <span style={{ fontFamily: C.mono, fontSize: 7,
                        color: RATING_COLOR[r.rating] ?? C.muted,
                        background: `${RATING_COLOR[r.rating] ?? C.muted}15`,
                        padding: '2px 6px', borderRadius: 3,
                        textTransform: 'uppercase' }}>{r.rating}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                        marginTop: 2 }}>{r.desk} · {r.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab pipeline */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
                letterSpacing: '0.14em' }}>FINTECH LAB · ACTIVE</div>
              {!data?.labItems.length ? (
                <div style={{ padding: 20, textAlign: 'center', color: C.muted,
                  fontFamily: C.mono, fontSize: 9 }}>No active experiments.</div>
              ) : data.labItems.map(l => (
                <div key={l.id} style={{ padding: '9px 16px',
                  borderBottom: `1px solid ${C.border}20`,
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%',
                    background: STAGE_COLOR[l.stage] ?? C.muted, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 500,
                    color: C.text, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' }}>{l.name}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 7,
                    color: STAGE_COLOR[l.stage] ?? C.muted,
                    textTransform: 'uppercase' }}>{l.stage}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted }}>
                    {l.domain}
                  </div>
                </div>
              ))}
            </div>

            {/* Open closes */}
            {openCloseCount > 0 && (
              <div style={{ background: '#0E0800', border: `1px solid ${C.warn}40`,
                borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontFamily: C.mono, fontSize: 8, color: C.warn,
                  fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>
                  ⚠ {openCloseCount} OPEN PERIOD CLOSE{openCloseCount > 1 ? 'S' : ''}
                </div>
                {data?.openCloses.slice(0, 3).map(cl => (
                  <div key={cl.id} style={{ fontFamily: C.mono, fontSize: 9,
                    color: C.muted, marginBottom: 3 }}>
                    {cl.period} — Owner: {cl.owner || 'Unassigned'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline breakdown */}
        {(data?.pipeline.length ?? 0) > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
              fontWeight: 700, letterSpacing: '0.14em', marginBottom: 14 }}>
              INCOMING PIPELINE
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {data?.pipeline.map(p => (
                <div key={p.status} style={{ background: '#122038',
                  borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: C.mono, fontSize: 18,
                    fontWeight: 700, color: C.gold }}>{p.cnt}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                    textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
