'use client';

/**
 * src/app/studio/limsy/trial/page.tsx
 *
 * LIMSY Supreme Court Standard — War Room
 * =========================================
 * Replaces the "COMING SOON" stub at /studio/limsy/trial.
 * Consolidated from: build-limsy-judicial-platform.zip (war-room.tsx)
 *
 * CHANNELS (role-gated per BNLV RBAC):
 *   SHARED     — All authenticated roles; open advocacy exchange
 *   CHAMBERS   — architect+ only; judicial deliberation space
 *   PROCEEDING — All roles during active hearing; formal record channel
 *
 * DATA SOVEREIGNTY (ADR-006 + DPDP Act 2023):
 *   All war room AI assistance routes exclusively to Claude Sonnet 5.
 *   Messages are court-privileged communications — hard DELETE revoked.
 *
 * REAL-TIME:
 *   Message list polls /api/limsy/war-room/messages?caseId=X&channel=Y every 5s.
 *   On send: POST /api/limsy/war-room/messages
 *   These API routes are stubs — add to /api/limsy/ as next Phase D task.
 *
 * TABLES (migration 0019):
 *   limsy_case_workspaces · limsy_war_room_messages
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const C = {
  bg:      '#080D18', surface: '#0C1425', card:   '#0F1B30',
  border:  '#162340', gold:    '#C9A84C', text:   '#DDE5EF',
  sub:     '#8DA0B8', muted:   '#4A6080', success:'#0FA472',
  danger:  '#DC2626', warn:    '#D97706', info:   '#6366F1',
  chambers:'#1A0A40', proceeding:'#0A1A0A',
  mono:    "'JetBrains Mono', monospace",
  sans:    "'Inter', system-ui, sans-serif",
} as const;

// ── Channel definitions ───────────────────────────────────────────────────────
const CHANNELS = [
  {
    id: 'SHARED',
    label: 'SHARED',
    icon: '◐',
    color: C.gold,
    bg: C.card,
    minRole: 'viewer',
    desc: 'Open advocacy exchange — all authenticated users',
  },
  {
    id: 'CHAMBERS',
    label: 'CHAMBERS',
    icon: '⚖',
    color: C.info,
    bg: C.chambers,
    minRole: 'architect',
    desc: 'Judicial deliberation — architect+ only · privileged communication',
  },
  {
    id: 'PROCEEDING',
    label: 'PROCEEDING',
    icon: '▣',
    color: C.success,
    bg: C.proceeding,
    minRole: 'viewer',
    desc: 'Formal proceeding record — all roles during active hearing',
  },
] as const;

type ChannelId = 'SHARED' | 'CHAMBERS' | 'PROCEEDING';

// ── Message types ─────────────────────────────────────────────────────────────
interface Message {
  id: number;
  sender_name: string;
  sender_role: string;
  content: string;
  kind: 'text' | 'annotation' | 'exhibit_ref' | 'ruling' | 'system';
  channel: ChannelId;
  is_pinned: boolean;
  created_at: string;
}

// ── Seed data (used when API returns empty) ───────────────────────────────────
const SEED_CASES = [
  { id: 1, internalRef: 'LIMSY-2026-001', petitioner: 'State of Maharashtra',
    respondent: 'Union of India', caseType: 'writ_petition', status: 'active' },
  { id: 2, internalRef: 'LIMSY-2026-002', petitioner: 'XYZ Corp Ltd',
    respondent: 'SEBI', caseType: 'slp', status: 'active' },
];

const makeSeedMessages = (channel: ChannelId): Message[] => ({
  SHARED: [
    { id: 1, sender_name: 'Sr. Adv. Mehta', sender_role: 'advocate', content:
      'Submitting certified copy of Article 14 petition. Respondent has failed to file counter-affidavit within the 4-week timeline ordered by this Hon\'ble Court on 12 Sep 2026.',
      kind: 'text', channel: 'SHARED', is_pinned: false, created_at: '10:04 IST' },
    { id: 2, sender_name: 'Adv. Sharma', sender_role: 'advocate', content:
      'Counterpoint: The delay was caused by force majeure — refer Exhibit C3 (SEBI internal circular dated 28 Aug 2026).',
      kind: 'exhibit_ref', channel: 'SHARED', is_pinned: false, created_at: '10:07 IST' },
    { id: 3, sender_name: 'Court AI (Claude)', sender_role: 'system', content:
      'PRECEDENT ALERT: Maneka Gandhi v. Union of India (1978) — Article 21 golden triangle. Relevant to the Article 14 argument at hand.',
      kind: 'annotation', channel: 'SHARED', is_pinned: true, created_at: '10:08 IST' },
  ],
  CHAMBERS: [
    { id: 10, sender_name: 'Hon\'ble Justice R.V. Iyer', sender_role: 'judge', content:
      'After hearing both sides — inclined to grant a 2-week further extension with costs. Propose stay on implementation pending final hearing.',
      kind: 'text', channel: 'CHAMBERS', is_pinned: false, created_at: '10:12 IST' },
    { id: 11, sender_name: 'Hon\'ble Justice P.K. Rao', sender_role: 'judge', content:
      'Concur. The balance of convenience favours the petitioner at this stage. Let us hear on quantum of costs.',
      kind: 'text', channel: 'CHAMBERS', is_pinned: false, created_at: '10:15 IST' },
  ],
  PROCEEDING: [
    { id: 20, sender_name: 'Court Registrar', sender_role: 'clerk', content:
      'CASE CALLED. SLP(C) No. 14892/2026 — State of Maharashtra v. Union of India. Both counsel present. Video conference link active.',
      kind: 'system', channel: 'PROCEEDING', is_pinned: true, created_at: '10:00 IST' },
    { id: 21, sender_name: 'Court Registrar', sender_role: 'clerk', content:
      'Bench constituted: Hon\'ble Justice R.V. Iyer (Presiding) + Hon\'ble Justice P.K. Rao. Matter taken up.',
      kind: 'system', channel: 'PROCEEDING', is_pinned: false, created_at: '10:01 IST' },
  ],
}[channel]);

const ROLE_RANK: Record<string, number> = {
  owner: 0, admin: 1, architect: 2, developer: 3, designer: 4, viewer: 5,
};

function hasRole(actual: string, required: string): boolean {
  return (ROLE_RANK[actual] ?? 99) <= (ROLE_RANK[required] ?? 0);
}

const KIND_STYLE: Record<string, { icon: string; color: string }> = {
  text:        { icon: '◌', color: C.text     },
  annotation:  { icon: '◈', color: C.info     },
  exhibit_ref: { icon: '▤', color: C.warn     },
  ruling:      { icon: '⚖', color: C.gold     },
  system:      { icon: '▣', color: C.sub      },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function LimsyWarRoom() {
  const [selectedCase, setSelectedCase] = useState(SEED_CASES[0]);
  const [channel, setChannel]           = useState<ChannelId>('SHARED');
  const [messages, setMessages]         = useState<Message[]>(makeSeedMessages('SHARED'));
  const [draft, setDraft]               = useState('');
  const [sending, setSending]           = useState(false);
  const [isLive, setIsLive]             = useState(true);

  // Simulated current user role — in production read from middleware x-user-role header
  const userRole = 'admin'; // admin > architect > view all channels

  const pollRef  = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Switch channel → reload seed messages
  const switchChannel = useCallback((ch: ChannelId) => {
    const chDef = CHANNELS.find(c => c.id === ch)!;
    if (!hasRole(userRole, chDef.minRole)) return; // role gate
    setChannel(ch);
    setMessages(makeSeedMessages(ch));
  }, [userRole]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Poll for new messages every 5s (real-time simulation)
  useEffect(() => {
    if (!isLive) return;
    pollRef.current = setInterval(() => {
      // In production: fetch(`/api/limsy/war-room/messages?caseId=${selectedCase.id}&channel=${channel}&since=<lastId>`)
      // and append new messages to state
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isLive, selectedCase.id, channel]);

  const sendMessage = useCallback(async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const newMsg: Message = {
      id: Date.now(), sender_name: 'Ajay Kumar', sender_role: userRole,
      content: draft.trim(), kind: 'text', channel, is_pinned: false,
      created_at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    };
    // In production: await fetch('/api/limsy/war-room/messages', { method:'POST', body: JSON.stringify(newMsg) })
    setMessages(prev => [...prev, newMsg]);
    setDraft('');
    setSending(false);
  }, [draft, sending, channel, userRole]);

  const activeChannel = CHANNELS.find(c => c.id === channel)!;

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text,
      height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 20, color: C.gold }}>⚖</div>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700 }}>
              LIMSY WAR ROOM
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
              Supreme Court Standard · Data Sovereign (Claude Sonnet 5)
            </div>
          </div>
        </div>

        {/* Case selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={selectedCase.id}
            onChange={e => setSelectedCase(SEED_CASES.find(c => c.id === Number(e.target.value))!)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '5px 10px', color: C.gold, fontFamily: C.mono, fontSize: 9,
              outline: 'none' }}>
            {SEED_CASES.map(c => (
              <option key={c.id} value={c.id}>
                {c.internalRef} — {c.petitioner} v. {c.respondent}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%',
              background: isLive ? C.success : C.muted,
              boxShadow: isLive ? `0 0 8px ${C.success}` : 'none' }} />
            <span style={{ fontFamily: C.mono, fontSize: 8, color: isLive ? C.success : C.muted,
              fontWeight: 700 }}>{isLive ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <button onClick={() => setIsLive(v => !v)} style={{ background: 'none',
            border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 10px',
            color: C.muted, fontFamily: C.mono, fontSize: 8, cursor: 'pointer' }}>
            {isLive ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
        </div>
      </div>

      {/* Channel selector */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', display: 'flex', gap: 2, flexShrink: 0 }}>
        {CHANNELS.map(ch => {
          const allowed = hasRole(userRole, ch.minRole);
          const active  = channel === ch.id;
          return (
            <button key={ch.id} onClick={() => switchChannel(ch.id)}
              disabled={!allowed}
              title={!allowed ? `Requires ${ch.minRole}+ role` : ch.desc}
              style={{
                background: 'none', border: 'none',
                cursor: allowed ? 'pointer' : 'not-allowed',
                padding: '11px 16px',
                borderBottom: active ? `3px solid ${ch.color}` : '3px solid transparent',
                color: active ? ch.color : allowed ? C.muted : `${C.muted}50`,
                fontFamily: C.mono, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.12em', opacity: allowed ? 1 : 0.4,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
              <span style={{ fontSize: 13 }}>{ch.icon}</span>
              <span>{ch.label}</span>
              {!allowed && <span style={{ fontSize: 7 }}>🔒</span>}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center',
          fontFamily: C.mono, fontSize: 8, color: C.muted }}>
          {activeChannel.desc}
        </div>
      </div>

      {/* Main layout: messages + sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0,
        background: activeChannel.bg }}>

        {/* Message list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, fontFamily: C.mono,
                fontSize: 10, paddingTop: 60 }}>
                No messages in this channel yet.<br />
                <span style={{ fontSize: 8 }}>Be the first to speak.</span>
              </div>
            )}

            {messages.map(msg => {
              const ks = KIND_STYLE[msg.kind] ?? KIND_STYLE.text;
              const isSelf = msg.sender_name === 'Ajay Kumar';
              const isSystem = msg.sender_role === 'system';
              const isJudge  = msg.sender_role === 'judge';

              if (isSystem) return (
                <div key={msg.id} style={{ textAlign: 'center', padding: '8px 0' }}>
                  <span style={{ background: `${C.sub}18`, color: C.sub,
                    fontFamily: C.mono, fontSize: 8, padding: '4px 14px',
                    borderRadius: 20 }}>
                    {ks.icon} {msg.content}
                  </span>
                </div>
              );

              return (
                <div key={msg.id} style={{
                  display: 'flex', flexDirection: isSelf ? 'row-reverse' : 'row',
                  gap: 10, marginBottom: 14,
                  ...(msg.is_pinned ? { borderLeft: `3px solid ${C.gold}`, paddingLeft: 10 } : {}),
                }}>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isJudge ? '#1B1000' : isSelf ? '#1A2040' : '#0A1A2A',
                    border: `2px solid ${isJudge ? C.gold : isSelf ? C.info : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: C.mono, fontSize: 10, fontWeight: 700,
                    color: isJudge ? C.gold : isSelf ? C.info : C.muted }}>
                    {msg.sender_name.split(' ').pop()?.charAt(0) ?? 'U'}
                  </div>

                  <div style={{ maxWidth: '70%' }}>
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'center',
                      justifyContent: isSelf ? 'flex-end' : 'flex-start',
                      marginBottom: 4,
                    }}>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.muted }}>
                        {msg.created_at}
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: 8,
                        color: isJudge ? C.gold : C.sub, fontWeight: isJudge ? 700 : 400 }}>
                        {msg.sender_name}
                      </span>
                      {msg.kind !== 'text' && (
                        <span style={{ fontFamily: C.mono, fontSize: 7, color: ks.color,
                          background: `${ks.color}18`, padding: '1px 6px', borderRadius: 3 }}>
                          {ks.icon} {msg.kind.replace(/_/g,' ')}
                        </span>
                      )}
                      {msg.is_pinned && (
                        <span style={{ fontFamily: C.mono, fontSize: 7, color: C.gold }}>📌</span>
                      )}
                    </div>
                    <div style={{
                      background: isSelf ? '#1A2040' : isJudge ? '#1B1000' : C.card,
                      border: `1px solid ${isJudge ? `${C.gold}40` : C.border}`,
                      borderRadius: isSelf ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                      padding: '10px 14px', fontSize: 12, lineHeight: 1.6, color: C.text,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px',
            background: C.surface, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexShrink: 0 }}>
                {(['text','exhibit_ref','annotation'] as const).map(k => (
                  <button key={k} style={{ background: 'none', border: `1px solid ${C.border}`,
                    borderRadius: 5, padding: '4px 8px', color: KIND_STYLE[k].color,
                    fontFamily: C.mono, fontSize: 7, cursor: 'pointer' }}>
                    {KIND_STYLE[k].icon} {k.replace(/_/g,' ')}
                  </button>
                ))}
              </div>
              <textarea value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Speak in ${channel} channel… (Enter to send, Shift+Enter for new line)`}
                rows={2}
                style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '8px 12px', color: C.text, fontFamily: C.sans,
                  fontSize: 12, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
              <button onClick={sendMessage} disabled={!draft.trim() || sending}
                style={{ background: draft.trim() && !sending ? activeChannel.color : C.border,
                  border: 'none', borderRadius: 8, padding: '10px 18px',
                  color: draft.trim() && !sending ? '#080800' : C.muted,
                  fontFamily: C.mono, fontSize: 9, fontWeight: 700,
                  cursor: draft.trim() && !sending ? 'pointer' : 'not-allowed',
                  flexShrink: 0, alignSelf: 'flex-end' }}>
                {sending ? '◌' : '⇧ SEND'}
              </button>
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted, marginTop: 6 }}>
              {channel === 'CHAMBERS' && '⚖ CHAMBERS — privileged judicial communication · DPDP-sovereign · not discoverable'}
              {channel === 'SHARED'   && '◐ SHARED — advocate exchange · visible to all proceeding participants'}
              {channel === 'PROCEEDING' && '▣ PROCEEDING — formal record · immutable after session closes · hard DELETE revoked'}
            </div>
          </div>
        </div>

        {/* Right sidebar — participants + case summary */}
        <div style={{ width: 260, flexShrink: 0, background: C.surface,
          borderLeft: `1px solid ${C.border}`, display: 'flex',
          flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
            fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
            letterSpacing: '0.14em' }}>CASE BRIEF</div>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginBottom: 4 }}>REF</div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.gold }}>
              {selectedCase.internalRef}
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 8, marginBottom: 4 }}>PETITIONER</div>
            <div style={{ fontSize: 11 }}>{selectedCase.petitioner}</div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 8, marginBottom: 4 }}>RESPONDENT</div>
            <div style={{ fontSize: 11 }}>{selectedCase.respondent}</div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 8, marginBottom: 4 }}>TYPE</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.info }}>
              {selectedCase.caseType.replace(/_/g,' ').toUpperCase()}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
            fontFamily: C.mono, fontSize: 9, color: C.gold, fontWeight: 700,
            letterSpacing: '0.14em' }}>ACTIVE PARTICIPANTS</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
            {[
              { name: 'Hon\'ble Justice R.V. Iyer', role: 'judge',     status: 'active' },
              { name: 'Hon\'ble Justice P.K. Rao',  role: 'judge',     status: 'active' },
              { name: 'Sr. Adv. Mehta',             role: 'advocate',  status: 'active' },
              { name: 'Adv. Sharma',                role: 'advocate',  status: 'active' },
              { name: 'Court Registrar',            role: 'clerk',     status: 'active' },
              { name: 'Ajay Kumar',                 role: 'admin',     status: 'active' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 0', borderBottom: `1px solid ${C.border}20` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%',
                  background: p.status === 'active' ? C.success : C.muted,
                  flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 7, color: C.muted }}>
                    {p.role}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Co-Counsel quick action */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`,
            flexShrink: 0 }}>
            <button style={{ width: '100%', background: '#0A0E20',
              border: `1px solid ${C.gold}40`, borderRadius: 8, padding: '10px 12px',
              cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontFamily: C.mono, fontSize: 8, color: C.gold,
                fontWeight: 700, marginBottom: 3 }}>◆ AI CO-COUNSEL</div>
              <div style={{ fontSize: 10, color: C.muted }}>
                Claude Sonnet 5 · DPDP-sovereign
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
