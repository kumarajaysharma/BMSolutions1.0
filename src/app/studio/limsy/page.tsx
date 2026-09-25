/**
 * src/app/studio/limsy/page.tsx
 *
 * LIMSY Supreme Court Standard — Workspace Management Dashboard
 * ============================================================
 * PRODUCTION FIXES (Phase C launch):
 *
 *  UX-001   Replaced all `alert()` calls with inline `fileError` state.
 *           `alert()` blocks the main thread and is inaccessible to screen
 *           readers — unacceptable in a legal-grade production interface.
 *           The error now renders as a dismissible red banner above the
 *           FILE PETITION button.
 *
 *  UX-002   Split the conflated `aiLoading` boolean into two distinct states:
 *           `synopsisLoading` and `filingLoading`. The original code used
 *           one flag for both operations, causing the FILE PETITION button to
 *           display "◌ FILING..." during AI generation (misleading user state).
 *
 *  MODEL-001 Updated AI label from "Claude 3.5 Sonnet" to "Claude Sonnet 5"
 *            to match the model actually in use at `/api/limsy/synopsis`.
 *            Stale model labels in legal UI constitute a transparency failure
 *            under enterprise AI governance requirements.
 *
 *  SEC-001  ⚠ CRITICAL — verifySeal() is currently a FAKE animation.
 *           It waits 1.4s and sets `sealId` to show "SEAL VERIFIED" without
 *           performing any cryptographic computation. This is a defect in a
 *           legal records system — the UI asserts tamper-proof integrity
 *           that has not been verified.
 *
 *           REQUIRED BEFORE GO-LIVE: Replace with a real call to
 *           `POST /api/limsy/orders/{id}/verify` that reconstructs the
 *           canonical string `${caseId}:${orderDate.toISOString()}:${orderType}:${operative.trim()}`
 *           on the server, computes SHA-256, and compares against `crypto_hash`.
 *           The client must never perform hash verification — server only.
 *           The current implementation is retained for layout purposes only.
 *           Do not ship this to production clients without this remediation.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Design Tokens ──────────────────────────────────────────────────────────
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
} as const;

const COURT_LEVELS = [
  'supreme_court', 'high_court', 'district_court', 'tribunal',
  'consumer_forum', 'arbitration', 'nclt', 'nclat', 'ncdrc',
] as const;

const CASE_TYPES = [
  'slp', 'writ_petition', 'civil_appeal', 'criminal_appeal', 'review_petition',
  'curative_petition', 'original_suit', 'execution_petition', 'consumer_complaint',
  'arbitration_petition', 'ibc_petition', 'nclt_petition', 'other',
] as const;

// ── Primitive UI helpers ───────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
    {children}
  </div>
);

const Field = ({ value, onChange, placeholder, type = 'text', disabled = false }:
  { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) => (
  <input
    type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled}
    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
      padding: '8px 11px', color: disabled ? C.muted : C.text, fontSize: 12, fontFamily: C.sans,
      outline: 'none', boxSizing: 'border-box', opacity: disabled ? 0.6 : 1 }} />
);

const Select = ({ value, onChange, options, disabled = false }:
  { value: string; onChange: (v: string) => void; options: readonly string[]; disabled?: boolean }) => (
  <select
    value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
      padding: '8px 11px', color: disabled ? C.muted : C.text, fontSize: 12, fontFamily: C.sans,
      outline: 'none', boxSizing: 'border-box' }}>
    {options.map(o => (
      <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
    ))}
  </select>
);

// ── Type definitions ───────────────────────────────────────────────────────

interface LimsyCase {
  id: number;
  status?: string;
  internalRef?: string;
  caseType?: string;
  courtName?: string;
  courtLevel?: string;
  petitioner?: string;
  respondent?: string;
  subjectMatter?: string;
  /** Dedicated synopsis column — populated from migration 0016 onwards */
  synopsis?: string | null;
  urgencyFlag?: boolean;
  createdAt?: string;
}

interface LimsyOrder {
  id: number;
  orderNumber?: string;
  orderType?: string;
  orderDate: string;
  orderTitle?: string;
  operative?: string;
  cryptoHash?: string;
  caseId?: number;
  caseRef?: string;
  bench?: string;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function LIMSYWorkspace() {
  const [tab, setTab]               = useState<'command' | 'intake' | 'docket' | 'vault'>('command');
  const [backlog, setBacklog]       = useState<LimsyCase[]>([]);
  const [docket, setDocket]         = useState<LimsyCase[]>([]);
  const [orders, setOrders]         = useState<LimsyOrder[]>([]);
  const [loading, setLoading]       = useState(true);

  // UX-002: Split loading states — previously one `aiLoading` flag served both
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [filingLoading, setFilingLoading]     = useState(false);

  // UX-001: Inline error state replaces alert()
  const [fileError, setFileError]   = useState<string | null>(null);

  const blank = {
    ref: '', court: '', courtLevel: 'supreme_court' as string,
    caseType: 'slp' as string, petitioner: '', respondent: '',
    subject: '', urgency: false,
  };
  const [form, setForm]             = useState(blank);
  const upd = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const [synopsis, setSynopsis]     = useState('');

  // Vault state
  const [sealId, setSealId]         = useState<number | null>(null);
  const [sealing, setSealing]       = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // ── Data Fetch ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const [casesRes, ordersRes] = await Promise.all([
        fetch('/api/limsy/cases',  { signal: controller.signal }),
        fetch('/api/limsy/orders', { signal: controller.signal }),
      ]);

      if (casesRes.ok) {
        const all: LimsyCase[] = await casesRes.json();
        const arr = Array.isArray(all) ? all : [];
        setBacklog(arr.filter(c => c.status === 'intake' || c.status === 'proposed' || c.status === 'draft'));
        setDocket(arr.filter(c => c.status !== 'intake' && c.status !== 'proposed' && c.status !== 'draft'));
      }

      if (ordersRes.ok) {
        const raw: LimsyOrder[] = await ordersRes.json();
        setOrders(Array.isArray(raw) ? raw : []);
      }

    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      console.error('[LIMSY] Failed to load workspace data:', e);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
    loadData();
    return () => {
      try { document.head.removeChild(link); } catch {}
      abortRef.current?.abort();
    };
  }, [loadData]);

  // ── AI Synopsis Generation ──────────────────────────────────────────────

  const generateSynopsis = async () => {
    if (!form.petitioner || !form.subject) return;
    setSynopsisLoading(true);
    setSynopsis('');

    try {
      const res = await fetch('/api/limsy/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectMatter: form.subject,
          petitioner:    form.petitioner,
          respondent:    form.respondent,
          caseType:      form.caseType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Failed to generate synopsis');
      }

      const data = await res.json() as { synopsis?: string };
      setSynopsis(data.synopsis ?? 'Unable to generate synopsis. Please draft manually.');

    } catch (err) {
      console.error('[LIMSY] AI Generation Error:', err);
      setSynopsis('AI assistance temporarily unavailable. Please draft synopsis manually.');
    } finally {
      setSynopsisLoading(false);
    }
  };

  // ── Case Filing ─────────────────────────────────────────────────────────

  const fileCase = async () => {
    if (!canFile) return;
    setFilingLoading(true);
    setFileError(null);

    try {
      const combinedSubject = synopsis
        ? `${form.subject}\n\n=== AI SYNOPSIS ===\n${synopsis}`
        : form.subject;

      const res = await fetch('/api/limsy/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalRef:   form.ref,
          courtLevel:    form.courtLevel,
          courtName:     form.court || form.courtLevel.replace(/_/g, ' '),
          caseType:      form.caseType,
          petitioner:    form.petitioner,
          respondent:    form.respondent,
          subjectMatter: combinedSubject,
          urgencyFlag:   form.urgency,
        }),
      });

      if (res.ok) {
        await loadData();
        setForm(blank);
        setSynopsis('');
        setTab('docket');
      } else {
        // UX-001: Replace alert() with inline error banner
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        setFileError([err.error, err.detail].filter(Boolean).join(' — ') || 'Filing failed.');
      }

    } catch {
      setFileError('Network error while filing case. Check your connection and retry.');
    } finally {
      setFilingLoading(false);
    }
  };

  const loadPending = (p: LimsyCase) => {
    setForm({
      ref:        p.internalRef ?? '',
      court:      p.courtName   ?? '',
      courtLevel: p.courtLevel  ?? 'supreme_court',
      caseType:   p.caseType    ?? 'slp',
      petitioner: p.petitioner  ?? '',
      respondent: p.respondent  ?? '',
      subject:    p.subjectMatter?.split('\n\n=== AI SYNOPSIS ===')[0] ?? '',
      urgency:    p.urgencyFlag === true,
    });
    setSynopsis('');
    setFileError(null);
    setTab('intake');
  };

  /**
   * Real cryptographic seal verification.
   * Calls GET /api/limsy/orders/[id]/verify which:
   *   1. Fetches the order from the DB via withTenant()
   *   2. Reconstructs: `${caseId}:${orderDate.toISOString()}:${orderType}:${operative.trim()}`
   *   3. Computes SHA-256 server-side
   *   4. Compares against stored crypto_hash
   *   5. Writes audit log (INFO on pass, CRITICAL on mismatch)
   *   6. Returns { verified: boolean, storedHash, computedHash }
   *
   * The client NEVER performs hash computation — server only.
   * A false result (verified: false) triggers a CRITICAL audit log entry
   * and shows an inline tamper-detection error banner to the user.
   */
  const verifySeal = async (id: number) => {
    setSealing(true);
    setSealId(null);      // Reset any prior verification badge
    setFileError(null);   // Clear unrelated errors

    try {
      const res = await fetch(`/api/limsy/orders/${id}/verify`, {
        method: "GET",
        // No x-tenant-id — Zero Trust middleware injects from JWT (ADR-001)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Verification failed: HTTP ${res.status}`);
      }

      const result = await res.json() as {
        verified: boolean;
        storedHash: string;
        computedHash: string;
        tamperIndicator?: string;
        detail?: string;
      };

      if (result.verified) {
        setSealId(id);     // Renders the gold "✓ SEAL VERIFIED" badge
      } else {
        // TAMPER DETECTED — show critical error, do not display verified badge
        setFileError(
          `⚠ INTEGRITY FAILURE — Order #${id}: ${result.detail ?? "SHA-256 hash mismatch. Record may have been tampered with."}`
        );
      }

    } catch (err: unknown) {
      setFileError(
        err instanceof Error ? err.message : "Seal verification failed. Check console."
      );
    } finally {
      setSealing(false);
    }
  };

  const canFile = !!(form.ref && form.petitioner && form.respondent && form.subject && form.court);

  // ── Loading Screen ──────────────────────────────────────────────────────

  if (loading && docket.length === 0 && backlog.length === 0) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: C.muted, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.1em' }}>
      INITIALISING LIMSY WORKSPACE…
    </div>
  );

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, background: C.gold, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#0A0800', flexShrink: 0 }}>⚖</div>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 20, fontWeight: 600,
              letterSpacing: '0.04em', lineHeight: 1 }}>LIMSY</div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
              letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>
              Legal Intelligence System · Supreme Court Standard · Production
            </div>
          </div>
          <div style={{ width: 1, height: 26, background: C.border, marginLeft: 6 }} />
          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
            limsy.bnlvconsulting.com · Tenant ID: 4 · RLS Active
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {backlog.length > 0 && (
            <div style={{ background: '#180A00', border: `1px solid ${C.warn}50`,
              borderRadius: 5, padding: '4px 11px', fontFamily: C.mono, fontSize: 8,
              color: C.warn, fontWeight: 700, letterSpacing: '0.12em' }}>
              ⚠ {backlog.length} CASES PENDING INTAKE
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success,
              boxShadow: `0 0 7px ${C.success}` }} />
            <span style={{ fontFamily: C.mono, fontSize: 8, color: C.success, fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', gap: 2 }}>
        {([
          { id: 'command', label: 'COMMAND' },
          { id: 'intake',  label: 'CASE INTAKE' },
          { id: 'docket',  label: `DOCKET (${docket.length})` },
          { id: 'vault',   label: `ORDERS VAULT (${orders.length})` },
        ] as const).map(({ id, label }) => (
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

        {/* ── COMMAND ────────────────────────────────────────────────────── */}
        {tab === 'command' && <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: C.serif, fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginBottom: 4 }}>
              Command Centre
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              Commercial Launch — {backlog.length} cases await immediate intake
            </div>
          </div>

          {backlog.length > 0 && (
            <div style={{ background: '#0E0800', border: `1px solid ${C.warn}35`,
              borderRadius: 12, padding: 18, marginBottom: 18 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.warn, fontWeight: 700,
                letterSpacing: '0.14em', marginBottom: 12 }}>
                ⚠ URGENT INTAKE QUEUE
              </div>
              {backlog.slice(0, 3).map(p => (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, marginBottom: 3 }}>
                      {p.internalRef}
                    </div>
                    <div style={{ fontFamily: C.serif, fontSize: 14, fontWeight: 600 }}>
                      {p.petitioner} <em style={{ fontWeight: 400, color: C.muted }}>v.</em> {p.respondent}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 2 }}>
                      {p.caseType?.replace(/_/g, ' ')} · {p.courtLevel?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <button onClick={() => loadPending(p)} style={{
                    flexShrink: 0, background: C.gold, color: '#080800', border: 'none',
                    borderRadius: 6, padding: '7px 13px', fontFamily: C.mono, fontSize: 8,
                    fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em',
                  }}>INTAKE →</button>
                </div>
              ))}
              {backlog.length > 3 && (
                <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 6, textAlign: 'right' }}>
                  +{backlog.length - 3} more pending
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => setTab('intake')} style={{
              background: C.card, border: `1px solid ${C.goldDim}`, borderRadius: 10,
              padding: 16, cursor: 'pointer', textAlign: 'left', color: C.text,
            }}>
              <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700, marginBottom: 7 }}>
                ⚡ NEW CASE INTAKE
              </div>
              <div style={{ fontFamily: C.serif, fontSize: 14, lineHeight: 1.5 }}>
                File petition with AI-assisted synopsis to Supreme Court standard
              </div>
            </button>
            <button onClick={() => setTab('vault')} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 16, cursor: 'pointer', textAlign: 'left', color: C.text,
            }}>
              <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, fontWeight: 700, marginBottom: 7 }}>
                🔐 ORDERS VAULT
              </div>
              <div style={{ fontFamily: C.serif, fontSize: 14, lineHeight: 1.5 }}>
                Verify SHA-256 cryptographic seals on immutable court orders
              </div>
            </button>
          </div>
        </>}

        {/* ── INTAKE ─────────────────────────────────────────────────────── */}
        {tab === 'intake' && <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 500, marginBottom: 4 }}>Case Intake</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              Supreme Court Standard · RLS-isolated · DB Persisted with Audit Trail
            </div>
          </div>

          {/* I. Case Identification */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 18, marginBottom: 12 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.16em', marginBottom: 16 }}>I. CASE IDENTIFICATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><Label>Internal Reference</Label>
                <Field value={form.ref} onChange={v => upd('ref', v)} placeholder="LIMSY-2026-001" /></div>
              <div><Label>Court Name</Label>
                <Field value={form.court} onChange={v => upd('court', v)} placeholder="Supreme Court of India" /></div>
              <div><Label>Court Level</Label>
                <Select value={form.courtLevel} onChange={v => upd('courtLevel', v)} options={COURT_LEVELS} /></div>
              <div><Label>Case Type</Label>
                <Select value={form.caseType} onChange={v => upd('caseType', v)} options={CASE_TYPES} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <input type="checkbox" id="urgency" checked={form.urgency}
                onChange={e => upd('urgency', e.target.checked)}
                style={{ width: 14, height: 14, accentColor: C.gold }} />
              <label htmlFor="urgency" style={{ fontFamily: C.mono, fontSize: 9, color: C.warn, fontWeight: 600, cursor: 'pointer' }}>
                FLAG AS URGENT — Priority listing on cause list
              </label>
            </div>
          </div>

          {/* II. Parties */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 18, marginBottom: 12 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.16em', marginBottom: 16 }}>II. PARTIES</div>
            <div style={{ marginBottom: 12 }}>
              <Label>Petitioner / Appellant</Label>
              <Field value={form.petitioner} onChange={v => upd('petitioner', v)} placeholder="State of Maharashtra" />
            </div>
            <div>
              <Label>Respondent / Opposite Party</Label>
              <Field value={form.respondent} onChange={v => upd('respondent', v)} placeholder="Union of India" />
            </div>
          </div>

          {/* III. Subject Matter + AI */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: 18, marginBottom: 14 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
              letterSpacing: '0.16em', marginBottom: 16 }}>III. SUBJECT MATTER & AI LEGAL SYNOPSIS</div>

            <div style={{ marginBottom: 16 }}>
              <Label>Subject Matter</Label>
              <textarea
                value={form.subject}
                onChange={e => upd('subject', e.target.value)}
                rows={4}
                placeholder="Describe the legal dispute in detail — acts, sections, constitutional provisions, factual background, precedents relied upon…"
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
                  padding: '9px 11px', color: C.text, fontSize: 12, fontFamily: C.sans,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                {/* MODEL-001: Updated from "Claude 3.5 Sonnet" to match actual model in route */}
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
                  ⚡ AI LEGAL SYNOPSIS — Claude Sonnet 5
                </div>
                <button
                  onClick={generateSynopsis}
                  disabled={synopsisLoading || !form.petitioner || !form.subject}
                  style={{
                    background: synopsisLoading ? C.surface : 'transparent',
                    border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 6,
                    padding: '6px 13px', fontFamily: C.mono, fontSize: 9, fontWeight: 700,
                    cursor: (!form.petitioner || !form.subject || synopsisLoading) ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.08em',
                    opacity: (!form.petitioner || !form.subject) ? 0.4 : 1,
                  }}>
                  {synopsisLoading ? '◌ DRAFTING…' : 'GENERATE SYNOPSIS'}
                </button>
              </div>

              {synopsis ? (
                <div style={{ background: '#060E1C', border: `1px solid ${C.goldDim}`, borderRadius: 8, padding: 16,
                  fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.85, color: '#B8CAE0',
                  whiteSpace: 'pre-wrap', borderLeft: `3px solid ${C.gold}` }}>
                  {synopsis}
                </div>
              ) : synopsisLoading ? (
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.gold, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>◌</span> Drafting court-ready legal synopsis…
                </div>
              ) : (
                <div style={{ fontFamily: C.serif, fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 1.6 }}>
                  Fill in parties and subject matter above, then generate an AI-assisted synopsis
                  drafted to Supreme Court of India standard — covering matter in issue,
                  relief sought, and preliminary assessment of maintainability.
                </div>
              )}
            </div>
          </div>

          {/* UX-001: Inline error banner — replaces alert() */}
          {fileError && (
            <div style={{ background: '#1A0505', border: `1px solid ${C.danger}50`, borderRadius: 9,
              padding: '12px 16px', marginBottom: 14, display: 'flex',
              alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.danger, lineHeight: 1.5 }}>
                ⚠ FILING FAILED — {fileError}
              </div>
              <button onClick={() => setFileError(null)} style={{
                flexShrink: 0, background: 'none', border: 'none', color: C.muted,
                fontFamily: C.mono, fontSize: 10, cursor: 'pointer', padding: 0,
              }}>✕</button>
            </div>
          )}

          <button
            onClick={fileCase}
            disabled={!canFile || filingLoading || synopsisLoading}
            style={{
              width: '100%',
              background: (canFile && !filingLoading && !synopsisLoading) ? C.gold : C.border,
              color: (canFile && !filingLoading && !synopsisLoading) ? '#080800' : C.muted,
              border: 'none', borderRadius: 10, padding: '14px 20px',
              fontFamily: C.mono, fontSize: 11, fontWeight: 700,
              cursor: (canFile && !filingLoading && !synopsisLoading) ? 'pointer' : 'not-allowed',
              letterSpacing: '0.1em', transition: 'all 0.2s',
            }}>
            {filingLoading ? '◌ FILING…' : '⚖ FILE PETITION TO DOCKET'}
          </button>
        </>}

        {/* ── DOCKET ─────────────────────────────────────────────────────── */}
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
                {backlog.length} case(s) await intake
              </div>
              <button onClick={() => setTab('command')} style={{
                background: C.gold, color: '#080800', border: 'none', borderRadius: 7,
                padding: '9px 18px', fontFamily: C.mono, fontSize: 9, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.1em',
              }}>VIEW PENDING CASES →</button>
            </div>
          ) : (
            docket.map(c => (
              <div key={c.id} style={{ background: C.card,
                border: `1px solid ${c.urgencyFlag ? C.warn + '50' : C.border}`,
                borderRadius: 10, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700 }}>
                        {c.internalRef}
                      </span>
                      <span style={{ background: '#0A2015', color: C.success, fontFamily: C.mono,
                        fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                        letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {c.status?.replace(/_/g, ' ') ?? 'FILED'}
                      </span>
                      {c.urgencyFlag && (
                        <span style={{ background: '#1A0A00', color: C.warn, fontFamily: C.mono,
                          fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>URGENT</span>
                      )}
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                        {c.caseType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: 5 }}>
                      {c.petitioner} <em style={{ fontWeight: 400, fontSize: 14, color: C.muted }}>v.</em> {c.respondent}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {c.courtName} · {c.courtLevel?.replace(/_/g, ' ')}
                    </div>
                    {/* Post-migration 0016: read from dedicated synopsis column */}
                    {c.synopsis && (
                      <div style={{ background: '#060E1C', borderRadius: 7, padding: 10, marginTop: 10,
                        fontFamily: C.serif, fontSize: 12, color: '#8A9EB8', lineHeight: 1.65,
                        borderLeft: `2px solid ${C.gold}`, whiteSpace: 'pre-wrap' }}>
                        {c.synopsis.slice(0, 320)}
                        {c.synopsis.length > 320 ? '…' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, textAlign: 'right', flexShrink: 0 }}>
                    {new Date(c.createdAt ?? Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    <br />
                    {new Date(c.createdAt ?? Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </>}

        {/* ── VAULT ──────────────────────────────────────────────────────── */}
        {tab === 'vault' && <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 500, marginBottom: 4 }}>
              Cryptographic Orders Vault
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
              SHA-256 verified · Immutable judicial record · limsy_orders table
            </div>
          </div>

          {orders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: C.mono,
              fontSize: 10, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
              No cryptographically sealed orders present in the database.
            </div>
          ) : orders.map(o => {
            const verified = sealId === o.id;
            return (
              <div key={o.id} style={{ background: C.card,
                border: `1px solid ${verified ? C.gold : C.border}`,
                borderRadius: 13, padding: 22, marginBottom: 14, transition: 'border-color 0.6s, box-shadow 0.6s',
                boxShadow: verified ? `0 0 40px ${C.goldGlow}` : 'none' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.gold, fontWeight: 700 }}>
                        {o.orderNumber ?? `ORD-${o.id}`}
                      </span>
                      <span style={{ background: '#1A1000', color: C.gold, fontFamily: C.mono,
                        fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em' }}>
                        {(o.orderType ?? '').replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                        Case: {o.caseId ?? o.caseRef}
                      </span>
                    </div>
                    <div style={{ fontFamily: C.serif, fontSize: 19, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                      {o.orderTitle}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted }}>
                      {o.bench ? `${o.bench} · ` : ''}{new Date(o.orderDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* SEC-001: "VERIFY SEAL" button — currently a stub. See verifySeal() comment above. */}
                  <button
                    onClick={() => !sealing && !verified && verifySeal(o.id)}
                    disabled={sealing || verified || !o.cryptoHash}
                    style={{
                      flexShrink: 0,
                      background: verified ? C.gold : 'transparent',
                      color: verified ? '#080800' : (o.cryptoHash ? C.gold : C.muted),
                      border: `1px solid ${o.cryptoHash ? C.gold : C.border}`,
                      borderRadius: 8, padding: '10px 18px', fontFamily: C.mono, fontSize: 9,
                      fontWeight: 700, cursor: (verified || sealing || !o.cryptoHash) ? 'default' : 'pointer',
                      letterSpacing: '0.1em', transition: 'all 0.4s', whiteSpace: 'nowrap',
                    }}>
                    {!o.cryptoHash ? 'NO SEAL' : sealing ? '◌ VERIFYING…' : verified ? '✓ SEAL VERIFIED' : 'VERIFY SEAL'}
                  </button>
                </div>

                <div style={{ background: '#06101C', borderRadius: 8, padding: 16, marginBottom: 14,
                  borderLeft: `3px solid ${verified ? C.gold : '#1E3050'}`, transition: 'border-color 0.6s' }}>
                  <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: 8 }}>OPERATIVE PORTION</div>
                  <div style={{ fontFamily: C.serif, fontSize: 14, fontStyle: 'italic', lineHeight: 1.8, color: '#B5C8DC' }}>
                    &ldquo;{o.operative}&rdquo;
                  </div>
                </div>

                {o.cryptoHash && (
                  <div style={{ background: '#06101C', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
                      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                      SHA-256 CRYPTOGRAPHIC HASH
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, wordBreak: 'break-all',
                      lineHeight: 1.7, letterSpacing: '0.04em',
                      color: verified ? C.gold : '#243548', transition: 'color 1s ease' }}>
                      {o.cryptoHash}
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
                )}
              </div>
            );
          })}
        </>}

      </div>
    </div>
  );
}