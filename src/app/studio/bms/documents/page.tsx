'use client';

/**
 * src/app/studio/bms/documents/page.tsx
 *
 * BMS Documentation Engine — Workspace
 * =====================================
 * Full 4-phase enterprise document lifecycle workspace.
 * Adapted for BNLV Group Enterprise Architecture
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ARTIFACTS,
  DEFAULT_SCOPE,
  PHASE_META,
  injectScope,
  renderMarkdown,
  type PhaseKey,
  type ScopeVar,
} from '@/lib/bms-artifacts';

// ── Brand tokens (matches BNLV platform) ─────────────────────────────────────
const C = {
  bg:       '#080D18',
  surface:  '#0C1425',
  card:     '#0F1B30',
  cardHov:  '#122038',
  border:   '#162340',
  gold:     '#C9A84C',
  goldDim:  '#7A5E28',
  goldGlow: 'rgba(201,168,76,0.10)',
  white:    '#FFFFFF',
  text:     '#DDE5EF',
  sub:      '#8DA0B8',
  muted:    '#4A6080',
  success:  '#0FA472',
  danger:   '#DC2626',
  warn:     '#D97706',
  info:     '#6366F1',
  mono:     "'JetBrains Mono', 'Courier New', monospace",
  sans:     "'Inter', 'DM Sans', system-ui, sans-serif",
  serif:    "'Cormorant Garamond', 'Georgia', serif",
} as const;

// Phase accent colours (overriding PHASE_META per UI theme)
const PHASE_COLOR: Record<number, string> = {
  1: '#C9A84C', // gold — commercial/legal
  2: '#6366F1', // indigo — architecture
  3: '#DC2626', // red — security/QA
  4: '#0FA472', // green — launch/closure
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface SavedDocument {
  id: number;
  title: string;
  documentType: string;
  status: string;
  phase: number;
  artifactKey: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ── Small UI primitives ───────────────────────────────────────────────────────
function Label({ children, color = C.gold }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: C.mono, fontSize: 8, color, fontWeight: 700,
      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    DRAFT:          { bg: '#1A2540', text: C.sub },
    GENERATING:     { bg: '#1A0E40', text: C.info },
    REVIEW_PENDING: { bg: '#1A1000', text: C.warn },
    PUBLISHED:      { bg: '#0A2015', text: C.success },
    ARCHIVED:       { bg: '#1A0505', text: C.danger },
  };
  const c = colors[status] ?? colors.DRAFT;
  return (
    <span style={{ background: c.bg, color: c.text, fontFamily: C.mono, fontSize: 7,
      fontWeight: 700, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.08em' }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Btn({
  children, onClick, disabled = false, variant = 'primary', size = 'md', style: extraStyle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}) {
  const bg: Record<string, string> = {
    primary: disabled ? C.border : C.gold,
    ghost:   'transparent',
    danger:  disabled ? C.border : '#7F1D1D',
    success: disabled ? C.border : '#065F46',
  };
  const textColor: Record<string, string> = {
    primary: disabled ? C.muted : '#080800',
    ghost:   disabled ? C.muted : C.gold,
    danger:  disabled ? C.muted : '#FCA5A5',
    success: disabled ? C.muted : '#6EE7B7',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg[variant],
        color: textColor[variant],
        border: variant === 'ghost' ? `1px solid ${disabled ? C.border : C.gold}` : 'none',
        borderRadius: 7,
        padding: size === 'sm' ? '5px 11px' : '9px 18px',
        fontFamily: C.mono,
        fontSize: size === 'sm' ? 8 : 10,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.1em',
        transition: 'all 0.15s',
        opacity: disabled ? 0.55 : 1,
        ...extraStyle,
      }}>
      {children}
    </button>
  );
}

// ── Download helper ───────────────────────────────────────────────────────────
function downloadMarkdown(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function BmsDocumentsPage() {
  // Phase / artifact selection
  const [phase, setPhase]           = useState<PhaseKey>(1);
  const [activeKey, setActiveKey]   = useState<string>('mou');

  // Scope editor
  const [scope, setScope]           = useState<ScopeVar[]>(DEFAULT_SCOPE || []);
  const [scopeOpen, setScopeOpen]   = useState(false);
  const [scopeGroup, setScopeGroup] = useState<string>('Parties');

  // Document operations
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [savedDocId, setSavedDocId] = useState<number | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // History panel
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [documents, setDocuments]       = useState<SavedDocument[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Custom instruction for AI
  const [instruction, setInstruction] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  // Derived
  const phaseArtifacts = useMemo(() =>
    (ARTIFACTS || []).filter(a => a.phase === phase),
    [phase]
  );

  const artifact = useMemo(() =>
    (ARTIFACTS || []).find(a => a.key === activeKey) ?? phaseArtifacts[0] ?? ARTIFACTS[0],
    [activeKey, phaseArtifacts]
  );

  const preview = useMemo(() => {
    if (!artifact) return '';
    return renderMarkdown(injectScope(artifact.content, scope));
  }, [artifact, scope]);

  // When phase changes, default to first artifact of that phase
  useEffect(() => {
    const first = (ARTIFACTS || []).find(a => a.phase === phase);
    if (first) setActiveKey(first.key);
  }, [phase]);

  // Clear messages after 4s
  useEffect(() => {
    if (!error && !successMsg) return;
    const t = setTimeout(() => { setError(null); setSuccessMsg(null); }, 4000);
    return () => clearTimeout(t);
  }, [error, successMsg]);

  // ── Scope editor helpers ────────────────────────────────────────────────────
  const updateScope = useCallback((key: string, value: string) => {
    setScope(prev => prev.map(v => v.key === key ? { ...v, value } : v));
  }, []);

  const scopeGroups = useMemo(() =>
    Array.from(new Set((DEFAULT_SCOPE || []).map(s => s.group))),
    []
  );

  const filteredScope = useMemo(() =>
    scope.filter(s => s.group === scopeGroup),
    [scope, scopeGroup]
  );

  // ── Load document history ───────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/bms/documents?limit=50');
      if (res.ok) {
        const data = await res.json() as { documents: SavedDocument[] };
        setDocuments(data.documents ?? []);
      }
    } catch { /* non-fatal */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { if (historyOpen) loadHistory(); }, [historyOpen, loadHistory]);

  // ── Save draft ──────────────────────────────────────────────────────────────
  const saveDraft = useCallback(async () => {
    if (!artifact) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title:         `${artifact.title} — ${scope.find(s => s.key === 'CLIENT')?.value ?? 'Client'}`,
        documentType:  artifact.docType,
        artifactKey:   artifact.key,
        phase:         artifact.phase,
        rawMarkdown:   injectScope(artifact.content, scope),
        scopeSnapshot: Object.fromEntries(scope.map(s => [s.key, s.value])),
        metadata:      { modelRouting: 'template-only', artifactKey: artifact.key },
      };

      const endpoint = savedDocId
        ? `/api/bms/documents/${savedDocId}`
        : '/api/bms/documents';
      const method = savedDocId ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { document: SavedDocument };
      setSavedDocId(data.document.id);
      setSuccessMsg(`Saved as v${data.document.version} — ID #${data.document.id}`);
      if (historyOpen) loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [artifact, scope, savedDocId, historyOpen, loadHistory]);

  // ── AI Generation ───────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!artifact) return;
    setGenerating(true);
    setError(null);

    try {
      // 1. Ensure document exists in DB
      let docId = savedDocId;
      if (!docId) {
        const createRes = await fetch('/api/bms/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:        `${artifact.title} — ${scope.find(s => s.key === 'CLIENT')?.value ?? 'Client'}`,
            documentType: artifact.docType,
            artifactKey:  artifact.key,
            phase:        artifact.phase,
            scopeSnapshot: Object.fromEntries(scope.map(s => [s.key, s.value])),
          }),
        });
        if (!createRes.ok) throw new Error('Could not create document record.');
        const { document } = await createRes.json() as { document: SavedDocument };
        docId = document.id;
        setSavedDocId(docId);
      }

      // 2. Trigger AI generation
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const genRes = await fetch(`/api/bms/documents/${docId}`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, instruction: instruction.trim() || undefined }),
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Generation failed: HTTP ${genRes.status}`);
      }

      const data = await genRes.json() as { document: SavedDocument; model?: string };
      setSuccessMsg(`Generated with ${data.model ?? 'AI'} — v${data.document.version}`);
      if (historyOpen) loadHistory();

    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }, [artifact, scope, instruction, savedDocId, historyOpen, loadHistory]);

  // ── Publish ─────────────────────────────────────────────────────────────────
  const publish = useCallback(async () => {
    if (!savedDocId) return saveDraft();
    setSaving(true);
    try {
      const res = await fetch(`/api/bms/documents/${savedDocId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
      if (res.ok) {
        setSuccessMsg('Document published successfully.');
        if (historyOpen) loadHistory();
      }
    } catch { setError('Publish failed.'); }
    finally { setSaving(false); }
  }, [savedDocId, saveDraft, historyOpen, loadHistory]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (!artifact) {
    return <div style={{ color: C.text, padding: 20 }}>Loading Artifacts...</div>;
  }

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh',
      display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, background: C.gold, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#080800', fontWeight: 900, flexShrink: 0 }}>D</div>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', color: C.text, lineHeight: 1 }}>
              Documentation Engine
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
              letterSpacing: '0.12em', marginTop: 2 }}>
              BMSolutions · BNLV Group · 14 Templates · 4 Commercial Phases · Claude Sonnet 5
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Btn size="sm" variant="ghost" onClick={() => { setHistoryOpen(!historyOpen); }}>
            {historyOpen ? '× HISTORY' : '⌛ HISTORY'}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setScopeOpen(!scopeOpen)}>
            {scopeOpen ? '× SCOPE' : '⚙ SCOPE VARS'}
          </Btn>
        </div>
      </div>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {(error || successMsg) && (
        <div style={{
          background: error ? '#1A0505' : '#0A2015',
          border: `1px solid ${error ? C.danger : C.success}40`,
          padding: '9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: C.mono, fontSize: 9, color: error ? C.danger : C.success,
        }}>
          <span>{error ? `⚠ ${error}` : `✓ ${successMsg}`}</span>
          <button onClick={() => { setError(null); setSuccessMsg(null); }}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 10 }}>✕</button>
        </div>
      )}

      {/* ── PHASE TABS ────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', gap: 2, flexShrink: 0 }}>
        {([1, 2, 3, 4] as PhaseKey[]).map(p => {
          const meta  = PHASE_META[p];
          const color = PHASE_COLOR[p];
          const count = (ARTIFACTS || []).filter(a => a.phase === p).length;
          return (
            <button key={p} onClick={() => setPhase(p)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 16px',
              borderBottom: phase === p ? `3px solid ${color}` : '3px solid transparent',
              color: phase === p ? color : C.muted,
              fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
            }}>
              <span>{meta.label}</span>
              <span style={{ fontSize: 7, fontWeight: 400, color: phase === p ? color : C.muted,
                opacity: 0.7 }}>
                {meta.sub} · {count} docs
              </span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: Artifact selector ─────────────────────────────────────────── */}
        <div style={{ width: 240, flexShrink: 0, background: C.surface,
          borderRight: `1px solid ${C.border}`, overflowY: 'auto', padding: 12 }}>

          <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted,
            letterSpacing: '0.12em', marginBottom: 12, paddingBottom: 8,
            borderBottom: `1px solid ${C.border}` }}>
            PHASE {phase} TEMPLATES
          </div>

          {phaseArtifacts.map(a => {
            const isActive = a.key === activeKey;
            const color    = PHASE_COLOR[a.phase];
            return (
              <button key={a.key} onClick={() => { setActiveKey(a.key); setSavedDocId(null); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: isActive ? `${color}15` : 'none',
                  border: isActive ? `1px solid ${color}40` : '1px solid transparent',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 6,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: C.mono, fontSize: 7, color,
                    background: `${color}20`, padding: '1px 6px', borderRadius: 3,
                    fontWeight: 700 }}>
                    {a.tag}
                  </span>
                  <span style={{ fontFamily: C.mono, fontSize: 7, color: C.muted }}>
                    {a.num}
                  </span>
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600,
                  color: isActive ? C.text : C.sub, lineHeight: 1.3, marginBottom: 3 }}>
                  {a.title}
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 10, color: C.muted,
                  lineHeight: 1.4 }}>
                  {a.summary.slice(0, 80)}{a.summary.length > 80 ? '…' : ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* CENTER + RIGHT wrapper */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* SCOPE EDITOR (collapsible) ────────────────────────────────────── */}
          {scopeOpen && (
            <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`,
              padding: '14px 20px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                  fontWeight: 700, letterSpacing: '0.14em' }}>
                  ⚙ SCOPE VARIABLES
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {scopeGroups.map(g => (
                    <button key={g} onClick={() => setScopeGroup(g)} style={{
                      background: scopeGroup === g ? C.gold : 'transparent',
                      color: scopeGroup === g ? '#080800' : C.muted,
                      border: `1px solid ${scopeGroup === g ? C.gold : C.border}`,
                      borderRadius: 4, padding: '3px 9px', fontFamily: C.mono,
                      fontSize: 7, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em',
                    }}>
                      {g.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {filteredScope.map(v => (
                  <div key={v.key}>
                    <Label color={C.sub}>{v.label} <span style={{ color: C.muted }}>({v.key})</span></Label>
                    <input
                      value={v.value}
                      onChange={e => updateScope(v.key, e.target.value)}
                      style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 6, padding: '7px 10px', color: C.text,
                        fontFamily: v.key === 'STACK' || v.key === 'PLATFORM' ? C.mono : C.sans,
                        fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENT PREVIEW ──────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Preview toolbar */}
            <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`,
              padding: '10px 20px', display: 'flex', alignItems: 'center',
              gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: C.mono, fontSize: 8, color: PHASE_COLOR[artifact.phase],
                  fontWeight: 700, marginBottom: 2, letterSpacing: '0.12em' }}>
                  PHASE {artifact.phase} · {artifact.tag} · {artifact.docType}
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 600, color: C.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {artifact.title}
                </div>
              </div>

              {savedDocId && (
                <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                  DOC #{savedDocId}
                </div>
              )}

              {/* Custom instruction */}
              <input
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder="Optional AI instruction (e.g. 'add DPDP clause to section 4')"
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: '6px 10px', color: C.text, fontFamily: C.sans, fontSize: 11,
                  outline: 'none', width: 300 }}
              />

              <Btn size="sm" onClick={generate} disabled={generating || saving}>
                {generating ? '◌ GENERATING…' : '✦ AI GENERATE'}
              </Btn>
              <Btn size="sm" variant="ghost" onClick={saveDraft} disabled={saving || generating}>
                {saving ? '◌ SAVING…' : '⬇ SAVE DRAFT'}
              </Btn>
              <Btn size="sm" variant="success" onClick={publish} disabled={saving || generating || !savedDocId}>
                ✓ PUBLISH
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() =>
                downloadMarkdown(
                  `${artifact.key}-${scope.find(s => s.key === 'CLIENT')?.value.replace(/\s+/g, '-').toLowerCase() ?? 'client'}.md`,
                  injectScope(artifact.content, scope)
                )
              }>
                ↓ .MD
              </Btn>
            </div>

            {/* Rendered preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F9FAFB' }}>
              <style>{`
                .doc-preview h1 { font-size: 26px; font-weight: 700; border-bottom: 3px solid #C9A84C; padding-bottom: 10px; margin: 28px 0 16px; color: #091929; }
                .doc-preview h2 { font-size: 19px; font-weight: 700; margin: 24px 0 10px; color: #091929; }
                .doc-preview h3 { font-size: 15px; font-weight: 700; margin: 18px 0 8px; color: #1A2B3C; }
                .doc-preview table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
                .doc-preview th { background: #091929; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
                .doc-preview td { padding: 8px 12px; border-bottom: 1px solid #E8ECF0; }
                .doc-preview tr:nth-child(even) td { background: #F5F7FA; }
                .doc-preview code { font-family: 'Courier New', monospace; background: #EEF0F4; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
                .doc-preview pre { background: #1C2B3A; color: #DDE5EF; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
                .doc-preview li { margin: 4px 0 4px 20px; }
                .doc-preview hr { border: none; border-top: 2px solid #C9A84C; margin: 24px 0; }
                .doc-preview p { margin: 10px 0; }
                .doc-preview strong { color: #091929; }
              `}</style>
              <div
                className="doc-preview"
                style={{ 
                  maxWidth: 860, margin: '0 auto', 
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 14, lineHeight: 1.8, color: '#1C2B3A' 
                }}
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Document History panel ──────────────────────────────────── */}
        {historyOpen && (
          <div style={{ width: 320, flexShrink: 0, background: C.surface,
            borderLeft: `1px solid ${C.border}`, overflowY: 'auto', display: 'flex',
            flexDirection: 'column' }}>

            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.gold,
                fontWeight: 700, letterSpacing: '0.14em' }}>
                DOCUMENT HISTORY
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="ghost" onClick={loadHistory}>↻</Btn>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {historyLoading ? (
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted,
                  textAlign: 'center', paddingTop: 32 }}>LOADING…</div>
              ) : documents.length === 0 ? (
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted,
                  textAlign: 'center', paddingTop: 32 }}>
                  No saved documents yet.
                  <br />Generate and save a document to see it here.
                </div>
              ) : (
                documents.map(doc => {
                  const color = PHASE_COLOR[doc.phase] ?? C.gold;
                  const isActive = doc.id === savedDocId;
                  return (
                    <div key={doc.id}
                      onClick={() => { setSavedDocId(doc.id); setActiveKey(doc.artifactKey); }}
                      style={{
                        background: isActive ? `${color}10` : C.card,
                        border: `1px solid ${isActive ? color + '40' : C.border}`,
                        borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 7,
                          color, fontWeight: 700 }}>
                          P{doc.phase} · {doc.documentType}
                        </span>
                        <StatusBadge status={doc.status} />
                      </div>
                      <div style={{ fontFamily: C.sans, fontSize: 11, fontWeight: 600,
                        color: C.text, lineHeight: 1.3, marginBottom: 4 }}>
                        {doc.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontFamily: C.mono, fontSize: 7, color: C.muted }}>
                        <span>v{doc.version} · #{doc.id}</span>
                        <span>{new Date(doc.updatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* History stats */}
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 16px',
              flexShrink: 0, display: 'flex', gap: 12 }}>
              {[
                { label: 'TOTAL', value: documents.length },
                { label: 'PUBLISHED', value: documents.filter(d => d.status === 'PUBLISHED').length },
                { label: 'DRAFT', value: documents.filter(d => d.status === 'DRAFT').length },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700,
                    color: C.gold }}>{s.value}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted,
                    letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STATUS BAR ────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`,
        padding: '6px 20px', display: 'flex', alignItems: 'center',
        gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: C.mono, fontSize: 8, color: PHASE_COLOR[artifact.phase],
          fontWeight: 700 }}>
          PHASE {artifact.phase} — {PHASE_META[artifact.phase].sub.toUpperCase()}
        </span>
        <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
          Template: {artifact.key} · {artifact.docType}
        </span>
        {savedDocId && (
          <span style={{ fontFamily: C.mono, fontSize: 8, color: C.success }}>
            ✓ Saved as Doc #{savedDocId}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: C.mono, fontSize: 8, color: C.muted }}>
          {(ARTIFACTS || []).length} templates · Claude Sonnet 5 · DPDP Act 2023 Compliant
        </span>
      </div>
    </div>
  );
}