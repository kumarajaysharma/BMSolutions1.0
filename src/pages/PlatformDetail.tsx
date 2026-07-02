import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { getPlatformById, platforms } from '@/data/platforms';
import { Section, Container } from '@/components/Section';

const statusConfig = {
  live: { label: 'Live', color: 'text-[#10B981] bg-[#10B98115] border-[#10B98130]' },
  beta: { label: 'Beta', color: 'text-[#F59E0B] bg-[#F59E0B15] border-[#F59E0B30]' },
  development: { label: 'In Development', color: 'text-[#94A3B8] bg-[#94A3B815] border-[#94A3B830]' },
  planning: { label: 'Planning', color: 'text-[#64748B] bg-[#64748B15] border-[#64748B30]' },
};

export default function PlatformDetail() {
  const { platformId } = useParams<{ platformId: string }>();
  const platform = platformId ? getPlatformById(platformId) : undefined;

  if (!platform) return <Navigate to="/platforms" replace />;

  const status = statusConfig[platform.status];
  const related = platforms.filter((p) => p.id !== platform.id && p.category === platform.category).slice(0, 3);

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative pt-28 pb-16 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, ${platform.accentColor}08 0%, transparent 60%), #0A0E1A`,
        }}
      >
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${platform.accentColor}60, transparent)`,
          }}
        />
        <Container className="relative">
          <Link
            to="/platforms"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-white mb-8 transition-colors"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Platforms
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              {/* Status + Category */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-mono font-medium ${status.color}`}
                >
                  {status.label}
                </span>
                <span
                  className="text-xs text-[#4B5563] font-mono uppercase tracking-wider"
                >
                  {platform.category}
                </span>
              </div>

              {/* Icon + Name */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border"
                  style={{
                    background: `${platform.accentColor}15`,
                    borderColor: `${platform.accentColor}30`,
                    color: platform.accentColor,
                  }}
                >
                  {platform.icon}
                </div>
                <div>
                  <h1
                    className="text-3xl lg:text-4xl font-bold text-white"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {platform.name}
                  </h1>
                  <p
                    className="text-sm text-[#4B5563] font-mono mt-0.5"
                  >
                    {platform.tagline}
                  </p>
                </div>
              </div>

              <p
                className="text-[#94A3B8] leading-relaxed text-base mb-6"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {platform.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {platform.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 bg-[#111827] border border-[#1E2A3B] text-[#64748B] rounded font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg text-sm transition-colors"
                style={{
                  background: platform.accentColor,
                  color: '#0A0E1A',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                <Zap className="w-4 h-4" />
                Request Demo — {platform.shortName}
              </Link>
            </div>

            {/* Metrics + Features */}
            <div className="space-y-4">
              {/* Metrics */}
              {platform.metrics && (
                <div className="grid grid-cols-3 gap-3">
                  {platform.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="p-4 bg-[#111827] border border-[#1E2A3B] rounded-xl text-center"
                    >
                      <div
                        className="text-xl font-bold mb-1"
                        style={{ color: platform.accentColor, fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {m.value}
                        {m.unit && <span className="text-xs ml-1 opacity-70">{m.unit}</span>}
                      </div>
                      <div className="text-[10px] text-[#4B5563] uppercase tracking-wider font-mono">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Features */}
              <div className="p-6 bg-[#111827] border border-[#1E2A3B] rounded-xl">
                <h3
                  className="text-white font-semibold mb-4 text-sm uppercase tracking-widest"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Key Capabilities
                </h3>
                <ul className="space-y-2.5">
                  {platform.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: platform.accentColor }}
                      />
                      <span
                        className="text-sm text-[#94A3B8]"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Related Platforms ── */}
      {related.length > 0 && (
        <Section className="bg-[#080C16]">
          <Container>
            <h2
              className="text-xl font-semibold text-white mb-6"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Related Platforms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to={p.route}
                  className="flex items-center gap-4 p-5 bg-[#111827] border border-[#1E2A3B] rounded-xl hover:border-[#2D3E54] transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${p.accentColor}15`, color: p.accentColor }}
                  >
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-white font-medium text-sm truncate"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {p.name}
                    </div>
                    <div className="text-xs text-[#4B5563] truncate">{p.tagline}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#4B5563] group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
