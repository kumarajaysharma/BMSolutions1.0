import { useState } from 'react';
import { platforms, platformCategories } from '@/data/platforms';
import PlatformCard from '@/components/PlatformCard';
import { Section, Container, SectionHeader } from '@/components/Section';
import type { PlatformCategory } from '@/types';

const ALL = 'All' as const;
type FilterValue = typeof ALL | PlatformCategory;

export default function Platforms() {
  const [filter, setFilter] = useState<FilterValue>(ALL);

  const filtered =
    filter === ALL ? platforms : platforms.filter((p) => p.category === filter);

  const counts = {
    live: platforms.filter((p) => p.status === 'live').length,
    beta: platforms.filter((p) => p.status === 'beta').length,
    development: platforms.filter((p) => p.status === 'development').length,
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 grid-pattern">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, #00D4FF 0%, transparent 60%)',
          }}
        />
        <Container className="relative">
          <SectionHeader
            eyebrow="Platform Portfolio"
            title="Eight Production Platforms"
            subtitle="Each platform is built on the same JINTO infrastructure backbone — Zero Trust, HSM-backed, and multi-tenant by design."
          />

          {/* Status summary */}
          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { label: `${counts.live} Live`, color: '#10B981', dot: 'bg-[#10B981]' },
              { label: `${counts.beta} Beta`, color: '#F59E0B', dot: 'bg-[#F59E0B]' },
              {
                label: `${counts.development} In Development`,
                color: '#94A3B8',
                dot: 'bg-[#94A3B8]',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 text-sm font-mono"
                style={{ color: s.color }}
              >
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </div>
            ))}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(ALL)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === ALL
                  ? 'bg-[#00D4FF] text-[#0A0E1A]'
                  : 'bg-[#111827] text-[#64748B] border border-[#1E2A3B] hover:text-white'
              }`}
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              All ({platforms.length})
            </button>
            {platformCategories.map((cat) => {
              const count = platforms.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filter === cat
                      ? 'bg-[#00D4FF20] text-[#00D4FF] border border-[#00D4FF40]'
                      : 'bg-[#111827] text-[#64748B] border border-[#1E2A3B] hover:text-white'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Platform Grid ── */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#4B5563]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              No platforms in this category.
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
