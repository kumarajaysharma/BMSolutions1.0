'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DESKS = [
  { href: '/studio/nidhivan/cockpit', label: '◉ CFO Cockpit' },
  { href: '/studio/nidhivan/books', label: '▤ The Books & Ledger' },
  { href: '/studio/nidhivan', label: '▩ BOQ / DPR Desk' },
  { href: '/studio/nidhivan/research', label: '◈ Research' },
  { href: '/studio/nidhivan/lab', label: '⚗ Fintech Lab' },
  { href: '/studio/nidhivan/counsel', label: '◆ Fin Co-Counsel' },
  { href: '/studio/nidhivan/connectors', label: '⊞ Connectors' },
];

export default function NidhivanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0A1222', borderBottom: '1px solid #162340', overflowX: 'auto' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', marginRight: 8, whiteSpace: 'nowrap' }}>
          NIDHIVAN FIN-OS ›
        </span>
        {DESKS.map((d) => {
          const active = pathname === d.href;
          return (
            <Link
              key={d.href}
              href={d.href}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                background: active ? 'rgba(201,168,76,0.18)' : 'rgba(15,27,48,0.6)',
                border: active ? '1px solid #C9A84C' : '1px solid #162340',
                color: active ? '#C9A84C' : '#8DA0B8',
              }}
            >
              {d.label}
            </Link>
          );
        })}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
