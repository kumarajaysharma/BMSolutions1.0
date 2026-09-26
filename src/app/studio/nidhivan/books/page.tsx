'use client';

/**
 * src/app/studio/nidhivan/books/page.tsx
 *
 * Nidhivan Consulting — Financial Intelligence Modeler (Books)
 * =============================================================
 * Replaces the "COMING SOON" stub at /studio/nidhivan/books.
 * Ported from BI-Nidhivan: FinancialModeler.tsx + BOQEngine.tsx +
 * council/CFODesk.tsx + council/AnalyticsDesk.tsx
 *
 * All calculations use src/lib/nidhivan-finance.ts.
 * BOQ tab connects to the existing /api/nidhivan/boqs endpoint (live DB data).
 *
 * ADR-004 BOUNDARY (paise):
 *   Numbers typed by the user are ₹ (rupees) or ₹ Cr (crores).
 *   They are NEVER stored directly to the DB.
 *   When saving, the API layer converts: rupees × 100 → paise.
 *   All DB reads convert paise → display ₹ via paiseToRupees() or paiseToCrores().
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  calculateDSCR, dscrVerdict,
  calculateIRR, modelValuation,
  calculateBOQ, projectRunway,
  computeLTVCAC, burnMultiple, burnVerdict, governanceGate,
  COUNCIL, DEAL_STAGES, SEED_COHORTS, COHORT_MONTHS,
  fmtCr, fmtPct, fmtMultiplier, fmtRupee,
  paiseToCrores, paiseToRupees,
  DEFAULT_RUNWAY,
  type BOQItem, type RunwayInputs,
} from '@/lib/nidhivan-finance';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      '#080D18', surface: '#0C1425', card:   '#0F1B30',
  border:  '#162340', gold:    '#C9A84C', goldDim:'#7A5E28',
  text:    '#DDE5EF', sub:     '#8DA0B8', muted:  '#4A6080',
  success: '#0FA472', danger:  '#DC2626', warn:   '#D97706',
  info:    '#6366F1',
  mono:    "'JetBrains Mono', monospace",
  sans:    "'Inter', system-ui, sans-serif",
} as const;

type BookTab = 'dscr' | 'capital' | 'valuation' | 'irr' | 'boq' | 'runway' | 'ltvCac' | 'burn';

const TABS: { id: BookTab; label: string; icon: string }[] = [
  { id: 'dscr',      label: 'DSCR',            icon: '▣' },
  { id: 'capital',   label: 'Capital Structure',icon: '◈' },
  { id: 'valuation', label: 'Valuation',        icon: '₹' },
  { id: 'irr',       label: 'IRR',              icon: '▲' },
  { id: 'boq',       label: 'BOQ Engine',       icon: '▩' },
  { id: 'runway',    label: 'Runway & Burn',    icon: '⬡' },
  { id: 'ltvCac',   label: 'LTV : CAC',        icon: '◆' },
  { id: 'burn',      label: 'Burn Multiple',    icon: '⚡' },
];

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
    letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{children}</div>;
}

function NumInput({ value, onChange, step = 0.1, min = 0, unit = '' }:
  { value: number; onChange: (n: number) => void; step?: number; min?: number; unit?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="number" value={value} min={min} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: '7px 10px', color: C.text, fontFamily: C.mono, fontSize: 13,
          outline: 'none' }} />
      {unit && <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, flexShrink: 0 }}>{unit}</span>}
    </div>
  );
}

function MetricCard({ label, value, note, accent = C.gold }:
  { label: string; value: string; note?: string; accent?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 9, padding: '14px 18px', flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700,
        color: accent, lineHeight: 1 }}>{value}</div>
      {note && <div style={{ fontSize: 10, color: C.muted, marginTop: 6,
        lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
        letterSpacing: '0.14em', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Disclaimer({ text }: { text: string }) {
  return (
    <div style={{ background: '#0A0A0A', border: `1px solid ${C.border}`,
      borderRadius: 7, padding: '8px 12px', marginTop: 10,
      fontFamily: C.mono, fontSize: 8, color: C.muted, lineHeight: 1.6 }}>
      ⚠ {text}
    </div>
  );
}

// ── Tab: DSCR ─────────────────────────────────────────────────────────────────
function DscrTab() {
  const [noi, setNoi]   = useState(12.5);
  const [debt, setDebt] = useState(8.0);
  const ratio           = calculateDSCR(noi, debt);
  const verdict         = dscrVerdict(ratio);
  return (
    <div>
      <Section title="INPUTS · ₹ CRORES">
        <Grid2>
          <div><Label>Net Operating Income (NOI)</Label><NumInput value={noi}  onChange={setNoi}  step={0.5} unit="₹ Cr" /></div>
          <div><Label>Annual Debt Service</Label>       <NumInput value={debt} onChange={setDebt} step={0.5} unit="₹ Cr" /></div>
        </Grid2>
      </Section>
      <Section title="DSCR RESULT">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <MetricCard label="DSCR" value={ratio?.toFixed(2) ?? 'N/A'} accent={verdict.color} />
          <MetricCard label="Status" value={verdict.label} note={verdict.note} accent={verdict.color} />
          <MetricCard label="Coverage Gap ₹ Cr" accent={C.sub}
            value={noi >= debt ? '— Covered' : fmtCr(debt - noi)}
            note={noi >= debt ? 'NOI exceeds debt service' : 'Shortfall requires restructuring'} />
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, lineHeight: 2 }}>
          {'< 1.00 — Insufficient  ·  1.00–1.20 — Below Covenant  ·  1.20–1.50 — Acceptable  ·  > 1.50 — Strong'}
        </div>
        <Disclaimer text="Sample calculation only — not a lender assessment or certified financial analysis." />
      </Section>
    </div>
  );
}

// ── Tab: Capital Structure ────────────────────────────────────────────────────
function CapitalTab() {
  const [debt,      setDebt]      = useState(60);
  const [equity,    setEquity]    = useState(30);
  const [mezzanine, setMezzanine] = useState(10);
  const total    = debt + equity + mezzanine;
  const debtRat  = total > 0 ? (debt / total) * 100 : 0;
  const equityRat= total > 0 ? (equity / total) * 100 : 0;
  const mezzRat  = total > 0 ? (mezzanine / total) * 100 : 0;
  const debtEq   = equity > 0 ? debt / equity : 0;
  return (
    <div>
      <Section title="CAPITAL COMPONENTS · ₹ CRORES">
        <Grid2>
          <div><Label>Senior Debt</Label>    <NumInput value={debt}      onChange={setDebt}      step={5} unit="₹ Cr" /></div>
          <div><Label>Equity</Label>          <NumInput value={equity}    onChange={setEquity}    step={5} unit="₹ Cr" /></div>
          <div><Label>Mezzanine / Quasi-Debt</Label><NumInput value={mezzanine} onChange={setMezzanine} step={5} unit="₹ Cr" /></div>
          <div><Label>Total Capital</Label>
            <div style={{ fontFamily: C.mono, fontSize: 14, color: C.gold,
              padding: '7px 0' }}>{fmtCr(total)}</div>
          </div>
        </Grid2>
      </Section>
      <Section title="STRUCTURE METRICS">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <MetricCard label="Debt Ratio"   value={fmtPct(debtRat,1)}   note="Senior debt / Total capital" />
          <MetricCard label="Equity Ratio" value={fmtPct(equityRat,1)} note="Equity / Total capital" accent={C.success} />
          <MetricCard label="D/E Ratio"    value={debtEq.toFixed(2)+'×'} note="Senior debt / Equity" accent={debtEq > 3 ? C.danger : C.gold} />
          {mezzanine > 0 && <MetricCard label="Mezz Ratio"  value={fmtPct(mezzRat,1)}  note="Mezzanine / Total" accent={C.warn} />}
        </div>
        {/* Simple bar chart */}
        <div style={{ height: 20, display: 'flex', borderRadius: 6, overflow: 'hidden' }}>
          {[{ v: debtRat, c: C.danger }, { v: mezzRat, c: C.warn }, { v: equityRat, c: C.success }]
            .map((s, i) => s.v > 0 && (
              <div key={i} style={{ width: `${s.v}%`, background: s.c, transition: 'width 0.3s' }} />
            ))
          }
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontFamily: C.mono, fontSize: 8, color: C.muted }}>
          <span style={{ color: C.danger }}>■ Debt {fmtPct(debtRat,1)}</span>
          {mezzanine > 0 && <span style={{ color: C.warn }}>■ Mezz {fmtPct(mezzRat,1)}</span>}
          <span style={{ color: C.success }}>■ Equity {fmtPct(equityRat,1)}</span>
        </div>
        <Disclaimer text="Illustrative only — not a certified capital structure advisory or SEBI-regulated recommendation." />
      </Section>
    </div>
  );
}

// ── Tab: Valuation ────────────────────────────────────────────────────────────
function ValuationTab() {
  const [investment, setInvestment] = useState(25);
  const [ownership,  setOwnership]  = useState(20);
  const val = modelValuation(investment, ownership);
  return (
    <div>
      <Section title="ROUND PARAMETERS · ₹ CRORES">
        <Grid2>
          <div><Label>Investment Amount</Label>     <NumInput value={investment} onChange={setInvestment} step={1} unit="₹ Cr" /></div>
          <div><Label>Investor Equity % Received</Label><NumInput value={ownership}  onChange={setOwnership}  step={1} min={1} unit="%" /></div>
        </Grid2>
      </Section>
      <Section title="VALUATION RESULT">
        {val ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <MetricCard label="Post-Money Valuation" value={fmtCr(val.postMoney)} note="Investment / Ownership %" />
            <MetricCard label="Pre-Money Valuation"  value={fmtCr(val.preMoney)}  note="Post-money − Investment" accent={C.success} />
            <MetricCard label="Investment"           value={fmtCr(investment)}    note="New capital raised" accent={C.info} />
            <MetricCard label="Investor Equity"      value={fmtPct(ownership,1)}  note="Post-round dilution" accent={C.sub} />
          </div>
        ) : (
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.danger }}>
            Invalid inputs — ownership must be between 1% and 99%.
          </div>
        )}
        <Disclaimer text="Indicative model only — not a SEBI-regulated valuation report or investment advice." />
      </Section>
    </div>
  );
}

// ── Tab: IRR ──────────────────────────────────────────────────────────────────
function IRRTab() {
  const [initialInv,  setInitialInv]  = useState(100);
  const [cf1, setCf1] = useState(25);
  const [cf2, setCf2] = useState(35);
  const [cf3, setCf3] = useState(45);
  const [cf4, setCf4] = useState(55);
  const [cf5, setCf5] = useState(80);
  const flows = [-initialInv, cf1, cf2, cf3, cf4, cf5];
  const irr   = calculateIRR(flows);
  const irrPct = irr !== null ? irr * 100 : null;
  const irrColor = irrPct === null ? C.muted : irrPct >= 20 ? C.success : irrPct >= 12 ? C.gold : C.danger;
  return (
    <div>
      <Section title="CASH FLOW SERIES · ₹ CRORES">
        <Grid2>
          <div><Label>Year 0 — Initial Investment (outflow)</Label><NumInput value={initialInv} onChange={setInitialInv} step={5} unit="₹ Cr" /></div>
          <div><Label>Year 1 Inflow</Label><NumInput value={cf1} onChange={setCf1} step={5} unit="₹ Cr" /></div>
          <div><Label>Year 2 Inflow</Label><NumInput value={cf2} onChange={setCf2} step={5} unit="₹ Cr" /></div>
          <div><Label>Year 3 Inflow</Label><NumInput value={cf3} onChange={setCf3} step={5} unit="₹ Cr" /></div>
          <div><Label>Year 4 Inflow</Label><NumInput value={cf4} onChange={setCf4} step={5} unit="₹ Cr" /></div>
          <div><Label>Year 5 Inflow + Terminal</Label><NumInput value={cf5} onChange={setCf5} step={5} unit="₹ Cr" /></div>
        </Grid2>
      </Section>
      <Section title="IRR RESULT">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <MetricCard label="IRR" value={irrPct !== null ? fmtPct(irrPct) : 'Non-convergent'}
            note="Annualised return over investment period" accent={irrColor} />
          <MetricCard label="Total Inflows"
            value={fmtCr(cf1+cf2+cf3+cf4+cf5)} note="Gross undiscounted returns" accent={C.sub} />
          <MetricCard label="Net Profit"
            value={fmtCr(cf1+cf2+cf3+cf4+cf5 - initialInv)}
            note="Total inflows − initial investment" accent={C.success} />
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, lineHeight: 2 }}>
          {'< 12% — Below hurdle  ·  12–20% — Acceptable  ·  > 20% — Strong / VC-grade'}
        </div>
        <Disclaimer text="IRR computed via bisection. Assumes end-of-year cash flows. Sample only — not investment advice." />
      </Section>
    </div>
  );
}

// ── Tab: BOQ Engine ───────────────────────────────────────────────────────────
let nextBOQId = 1;
const makeBOQId = () => `boq-${nextBOQId++}`;

const DEFAULT_ITEMS: BOQItem[] = [
  { id: makeBOQId(), description: 'Earth excavation in ordinary soil', unit: 'Cum', quantity: 500,  unitRateRs: 125,   rateRef: 'DSR 2.1.1' },
  { id: makeBOQId(), description: 'PCC 1:4:8 in foundation',           unit: 'Cum', quantity: 120,  unitRateRs: 4200,  rateRef: 'DSR 5.2.1' },
  { id: makeBOQId(), description: 'RCC M25 grade in columns',          unit: 'Cum', quantity: 85,   unitRateRs: 6800,  rateRef: 'DSR 5.3.2' },
  { id: makeBOQId(), description: 'TMT steel reinforcement Fe-500',    unit: 'MT',  quantity: 42,   unitRateRs: 68000, rateRef: 'DSR 6.1.1' },
  { id: makeBOQId(), description: 'Brick masonry in CM 1:6',           unit: 'Cum', quantity: 320,  unitRateRs: 3200,  rateRef: 'DSR 8.2.1' },
];

function BOQTab() {
  const [items, setItems]         = useState<BOQItem[]>(DEFAULT_ITEMS);
  const [contingency, setConting] = useState(5);
  const [tax, setTax]             = useState(18);

  const result = calculateBOQ(items, contingency, tax);

  const updateItem = (id: string, field: keyof BOQItem, value: string | number) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [
    ...prev, { id: makeBOQId(), description: 'New Item', unit: 'Nos', quantity: 1, unitRateRs: 100 }
  ]);

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const downloadCSV = () => {
    const header = 'Item,Description,Unit,Qty,Rate (₹),Amount (₹),DSR Ref\n';
    const rows = result.rows.map((r, i) =>
      `${i+1},"${r.description}",${r.unit},${r.quantity},${r.unitRateRs.toFixed(2)},${r.amountRs.toFixed(2)},${r.rateRef ?? ''}`
    ).join('\n');
    const footer = `\n,,,,Subtotal,${result.subtotalRs.toFixed(2)},\n,,,,Contingency @${contingency}%,${result.contingencyRs.toFixed(2)},\n,,,,GST @${tax}%,${result.taxRs.toFixed(2)},\n,,,,TOTAL,${result.totalRs.toFixed(2)},`;
    const blob = new Blob([header + rows + footer], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'nidhivan-boq.csv'; a.click();
  };

  return (
    <div>
      <Section title="BOQ LINE ITEMS — CPWD DSR STANDARD">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#122038' }}>
                {['#', 'Description', 'Unit', 'Qty', 'Rate (₹)', 'Amount (₹)', 'DSR Ref', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left',
                    fontFamily: C.mono, fontSize: 8, color: C.muted,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}20` }}>
                  <td style={{ padding: '6px 10px', fontFamily: C.mono,
                    fontSize: 10, color: C.muted }}>{i+1}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                      style={{ width: '100%', background: 'none', border: 'none', color: C.text,
                        fontFamily: C.sans, fontSize: 11, outline: 'none' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      style={{ width: 48, background: 'none', border: 'none', color: C.sub,
                        fontFamily: C.mono, fontSize: 10, outline: 'none' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      style={{ width: 64, background: 'none', border: 'none', color: C.text,
                        fontFamily: C.mono, fontSize: 11, outline: 'none', textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={item.unitRateRs}
                      onChange={e => updateItem(item.id, 'unitRateRs', parseFloat(e.target.value) || 0)}
                      style={{ width: 80, background: 'none', border: 'none', color: C.text,
                        fontFamily: C.mono, fontSize: 11, outline: 'none', textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 10px', fontFamily: C.mono, fontSize: 11,
                    color: C.gold, textAlign: 'right' }}>
                    {(item.quantity * item.unitRateRs).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input value={item.rateRef ?? ''} onChange={e => updateItem(item.id, 'rateRef', e.target.value)}
                      style={{ width: 72, background: 'none', border: 'none', color: C.muted,
                        fontFamily: C.mono, fontSize: 9, outline: 'none' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <button onClick={() => removeItem(item.id)}
                      style={{ background: 'none', border: 'none', color: C.danger,
                        cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={addItem} style={{ background: 'none', border: `1px solid ${C.gold}`,
            color: C.gold, borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            fontFamily: C.mono, fontSize: 9 }}>+ ADD ITEM</button>
          <button onClick={downloadCSV} style={{ background: 'none', border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            fontFamily: C.mono, fontSize: 9 }}>↓ EXPORT CSV</button>
        </div>
      </Section>
      <Section title="BOQ SUMMARY">
        <Grid2>
          <div><Label>Contingency Rate</Label><NumInput value={contingency} onChange={setConting} step={1} unit="%" /></div>
          <div><Label>Tax / GST Rate</Label>  <NumInput value={tax}        onChange={setTax}     step={1} unit="%" /></div>
        </Grid2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <MetricCard label="Subtotal"    value={fmtRupee(result.subtotalRs,0)}    note="All items pre-contingency" accent={C.sub} />
          <MetricCard label="Contingency" value={fmtRupee(result.contingencyRs,0)} note={`@ ${contingency}%`} accent={C.warn} />
          <MetricCard label="Tax / GST"   value={fmtRupee(result.taxRs,0)}         note={`@ ${tax}%`} accent={C.info} />
          <MetricCard label="TOTAL CAPEX" value={fmtRupee(result.totalRs,0)}       note="Store as bigint paise in DB" accent={C.gold} />
        </div>
        <Disclaimer text="Sample BOQ only — NOT a CPWD rate schedule or certified DPR. Rates are illustrative. Validate against DSR 2023 before submission." />
      </Section>
    </div>
  );
}

// ── Tab: Runway & Burn ────────────────────────────────────────────────────────
function RunwayTab() {
  const [inputs, setInputs] = useState<RunwayInputs>(DEFAULT_RUNWAY);
  const upd = (k: keyof RunwayInputs, v: number) => setInputs(prev => ({ ...prev, [k]: v }));
  const rows = projectRunway(inputs, 24);
  const zeroMonth = rows.findIndex(r => r.cash <= 0);
  const runwayMo  = zeroMonth < 0 ? '>24 months' : `${zeroMonth} months`;

  return (
    <div>
      <Section title="RUNWAY INPUTS · ₹ CRORES / MONTH">
        <Grid2>
          <div><Label>Cash Balance</Label>        <NumInput value={inputs.cashBalance}      onChange={v => upd('cashBalance', v)}      step={1}   unit="₹ Cr" /></div>
          <div><Label>Monthly Burn</Label>         <NumInput value={inputs.monthlyBurn}      onChange={v => upd('monthlyBurn', v)}      step={0.1} unit="₹ Cr" /></div>
          <div><Label>Monthly Revenue</Label>      <NumInput value={inputs.monthlyRevenue}   onChange={v => upd('monthlyRevenue', v)}   step={0.1} unit="₹ Cr" /></div>
          <div><Label>Monthly Revenue Growth</Label><NumInput value={inputs.revenueGrowthPct} onChange={v => upd('revenueGrowthPct', v)} step={0.5} unit="%" /></div>
        </Grid2>
      </Section>
      <Section title="RUNWAY PROJECTION">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <MetricCard label="Runway" value={runwayMo}
            accent={zeroMonth < 0 ? C.success : zeroMonth < 6 ? C.danger : C.gold} />
          <MetricCard label="Net Burn Month 1"
            value={fmtCr(Math.max(0, inputs.monthlyBurn - inputs.monthlyRevenue))}
            note="Monthly burn − revenue" accent={C.warn} />
          <MetricCard label="Break-Even Revenue"
            value={fmtCr(inputs.monthlyBurn)} note="Revenue needed to cover burn" accent={C.info} />
        </div>
        {/* Simple cash curve bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2,
          height: 80, marginTop: 8 }}>
          {rows.slice(0, 24).map((r, i) => (
            <div key={i} title={`Month ${r.month}: ${fmtCr(r.cash)}`}
              style={{ flex: 1, minWidth: 4,
                height: `${Math.max(2, (r.cash / inputs.cashBalance) * 100)}%`,
                background: r.cash > inputs.cashBalance * 0.5 ? C.success
                  : r.cash > inputs.cashBalance * 0.2 ? C.warn : C.danger,
                borderRadius: '2px 2px 0 0', transition: 'height 0.3s' }} />
          ))}
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 4 }}>
          Monthly cash balance projection (months 0–{rows.length - 1})
        </div>
        <Disclaimer text="Projection assumes constant burn and linear revenue growth. Actual results will vary." />
      </Section>
    </div>
  );
}

// ── Tab: LTV : CAC ────────────────────────────────────────────────────────────
function LTVCACTab() {
  const [arpu,  setArpu]  = useState(4200);
  const [gm,    setGm]    = useState(72);
  const [churn, setChurn] = useState(2.5);
  const [cac,   setCac]   = useState(18000);
  const { ltv, ratio, paybackMonths } = computeLTVCAC(arpu, gm, churn, cac);
  const ratioColor = ratio >= 3 ? C.success : ratio >= 2 ? C.gold : C.danger;
  return (
    <div>
      <Section title="UNIT ECONOMICS INPUTS · ₹ PER CUSTOMER">
        <Grid2>
          <div><Label>Monthly ARPU (₹)</Label>         <NumInput value={arpu}  onChange={setArpu}  step={100} unit="₹/mo" /></div>
          <div><Label>Gross Margin %</Label>            <NumInput value={gm}    onChange={setGm}    step={1}   unit="%" /></div>
          <div><Label>Monthly Churn %</Label>           <NumInput value={churn} onChange={setChurn} step={0.5} unit="%" /></div>
          <div><Label>Customer Acquisition Cost (₹)</Label><NumInput value={cac}   onChange={setCac}   step={500} unit="₹" /></div>
        </Grid2>
      </Section>
      <Section title="UNIT ECONOMICS RESULTS">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <MetricCard label="LTV"           value={`₹${ltv.toLocaleString('en-IN', {maximumFractionDigits:0})}`} note="Lifetime value of a customer" accent={C.gold} />
          <MetricCard label="LTV : CAC"     value={fmtMultiplier(ratio)}  note="Industry target ≥ 3×"  accent={ratioColor} />
          <MetricCard label="CAC Payback"   value={`${paybackMonths.toFixed(1)} months`} note="Target < 12 months" accent={paybackMonths < 12 ? C.success : C.warn} />
          <MetricCard label="Monthly ARPU"  value={`₹${arpu.toLocaleString('en-IN')}`} note="Average revenue per user" accent={C.sub} />
        </div>
        <Disclaimer text="Indicative unit economics model only. Based on SaaS/FinTech archetypes. Validate against actual cohort data." />
      </Section>
    </div>
  );
}

// ── Tab: Burn Multiple ────────────────────────────────────────────────────────
function BurnTab() {
  const [monthlyBurn,    setMonthlyBurn]    = useState(3.8);
  const [monthlyRevenue, setMonthlyRevenue] = useState(2.1);
  const [newARR,         setNewARR]         = useState(8.5);
  const [spend,          setSpend]          = useState(52);
  const [budget,         setBudget]         = useState(75);
  const [capex,          setCapex]          = useState(90);

  const { netBurn, mult } = burnMultiple(monthlyBurn, monthlyRevenue, newARR);
  const verdict            = burnVerdict(mult);
  const gate               = governanceGate(spend, budget, capex);

  const TONE: Record<string, string> = {
    success: C.success, gold: C.gold, amber: C.warn, alert: C.danger,
  };

  return (
    <div>
      <Section title="BURN MULTIPLE INPUTS · ₹ CRORES">
        <Grid2>
          <div><Label>Monthly Gross Burn</Label>    <NumInput value={monthlyBurn}    onChange={setMonthlyBurn}    step={0.1} unit="₹ Cr" /></div>
          <div><Label>Monthly Revenue</Label>        <NumInput value={monthlyRevenue} onChange={setMonthlyRevenue} step={0.1} unit="₹ Cr" /></div>
          <div><Label>New ARR Added This Quarter</Label><NumInput value={newARR}   onChange={setNewARR}   step={0.5} unit="₹ Cr" /></div>
        </Grid2>
      </Section>
      <Section title="BURN MULTIPLE RESULT">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <MetricCard label="Quarterly Net Burn" value={fmtCr(netBurn)} accent={C.warn} />
          <MetricCard label="Burn Multiple"      value={isFinite(mult) ? fmtMultiplier(mult) : '∞'} accent={TONE[verdict.tone]} />
          <MetricCard label="Status"             value={verdict.label} note={verdict.note} accent={TONE[verdict.tone]} />
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, lineHeight: 2 }}>
          {'≤ 1.0× — Efficient  ·  1.0–1.5× — Healthy  ·  1.5–2.0× — Watch  ·  > 2.0× — Inefficient'}
        </div>
      </Section>
      <Section title="GOVERNANCE GATE · ₹ CRORES">
        <Grid2>
          <div><Label>Current Spend</Label>     <NumInput value={spend}  onChange={setSpend}  step={1} unit="₹ Cr" /></div>
          <div><Label>Quarterly Budget</Label>   <NumInput value={budget} onChange={setBudget} step={5} unit="₹ Cr" /></div>
          <div><Label>Capital Expenditure Gate</Label><NumInput value={capex} onChange={setCapex}  step={5} unit="₹ Cr" /></div>
        </Grid2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
          <MetricCard label="Budget Utilisation"  value={fmtPct(gate.util)} accent={gate.util > 85 ? C.danger : C.success} />
          <MetricCard label="Governance Tier"     value={gate.tier}  note={gate.verdict} accent={gate.tier === 'Breach' ? C.danger : gate.tier === 'Aggressive' ? C.warn : C.success} />
        </div>
        <Disclaimer text="Sample governance model only — not a chartered accountant's assessment or statutory compliance audit." />
      </Section>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NidhivanBooksPage() {
  const [tab, setTab] = useState<BookTab>('dscr');

  const TAB_CONTENT: Record<BookTab, React.ReactNode> = {
    dscr:      <DscrTab />,
    capital:   <CapitalTab />,
    valuation: <ValuationTab />,
    irr:       <IRRTab />,
    boq:       <BOQTab />,
    runway:    <RunwayTab />,
    ltvCac:   <LTVCACTab />,
    burn:      <BurnTab />,
  };

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700,
            color: C.text, letterSpacing: '0.06em' }}>The Books — Financial Modeler</div>
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
            letterSpacing: '0.1em', marginTop: 2 }}>
            Nidhivan Consulting · DSCR · IRR · Valuation · BOQ · Runway · LTV:CAC · Burn
          </div>
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
          Sample only — not financial advice
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '11px 14px', whiteSpace: 'nowrap',
            borderBottom: tab === t.id ? `3px solid ${C.gold}` : '3px solid transparent',
            color: tab === t.id ? C.gold : C.muted,
            fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        {TAB_CONTENT[tab]}
      </div>
    </div>
  );
}
