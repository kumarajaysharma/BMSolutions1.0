import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Platform } from '@/types';

interface PlatformCardProps {
  platform: Platform;
  className?: string;
}

const statusConfig: Record<Platform['status'], { label: string; color: string; dot: string }> = {
  live: { label: 'Live', color: 'text-[#10B981] bg-[#10B98115] border-[#10B98130]', dot: 'bg-[#10B981]' },
  beta: { label: 'Beta', color: 'text-[#F59E0B] bg-[#F59E0B15] border-[#F59E0B30]', dot: 'bg-[#F59E0B]' },
  development: { label: 'In Dev', color: 'text-[#94A3B8] bg-[#94A3B815] border-[#94A3B830]', dot: 'bg-[#94A3B8]' },
  planning: { label: 'Planning', color: 'text-[#64748B] bg-[#64748B15] border-[#64748B30]', dot: 'bg-[#64748B]' },
};

export default function PlatformCard({ platform, className = '' }: PlatformCardProps) {
  const status = statusConfig[platform.status];

  return (
    <Link
      to={platform.route}
      className={`group relative flex flex-col bg-[#111827] border border-[#1E2A3B] rounded-xl p-6 card-hover ${className}`}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${platform.accentColor}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
          style={{
            background: `${platform.accentColor}15`,
            borderColor: `${platform.accentColor}30`,
            color: platform.accentColor,
          }}
        >
          {platform.icon}
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border font-mono font-medium flex items-center gap-1.5 ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Name + Tagline */}
      <h3
        className="text-white font-semibold text-base mb-1 group-hover:text-[--accent] transition-colors"
        style={{ fontFamily: 'Syne, sans-serif', '--accent': platform.accentColor } as React.CSSProperties}
      >
        {platform.name}
      </h3>
      <p
        className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-3 font-mono"
      >
        {platform.shortName} · {platform.category}
      </p>

      {/* Description */}
      <p
        className="text-[#64748B] text-sm leading-relaxed mb-4 flex-1"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {platform.description.length > 120
          ? `${platform.description.slice(0, 120)}…`
          : platform.description}
      </p>

      {/* Metrics */}
      {platform.metrics && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#0A0E1A] rounded-lg border border-[#1E2A3B]">
          {platform.metrics.slice(0, 3).map((m) => (
            <div key={m.label} className="text-center">
              <div
                className="text-sm font-semibold"
                style={{ color: platform.accentColor, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {m.value}
                {m.unit && <span className="text-[10px] ml-0.5 opacity-70">{m.unit}</span>}
              </div>
              <div className="text-[9px] text-[#4B5563] mt-0.5 leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {platform.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 bg-[#1C2333] text-[#4B5563] rounded font-mono"
          >
            {tag}
          </span>
        ))}
        {platform.tags.length > 4 && (
          <span className="text-[9px] px-1.5 py-0.5 text-[#4B5563] font-mono">
            +{platform.tags.length - 4}
          </span>
        )}
      </div>

      {/* CTA */}
      <div
        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: platform.accentColor, fontFamily: 'Syne, sans-serif' }}
      >
        <span>Explore Platform</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
