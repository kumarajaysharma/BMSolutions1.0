import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  grid?: boolean;
}

export function Section({ id, className = '', children, grid = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`relative py-20 lg:py-28 ${grid ? 'grid-pattern' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

interface ContainerProps {
  className?: string;
  children: ReactNode;
}

export function Container({ className = '', children }: ContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = false,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''} ${className}`}>
      {eyebrow && (
        <div
          className="inline-flex items-center gap-2 text-[10px] text-[#00D4FF] uppercase tracking-widest font-mono mb-4 px-3 py-1.5 bg-[#00D4FF10] border border-[#00D4FF20] rounded-full"
        >
          <span className="w-1 h-1 bg-[#00D4FF] rounded-full" />
          {eyebrow}
        </div>
      )}
      <h2
        className="text-3xl lg:text-4xl font-bold text-white mb-4"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-[#64748B] text-lg leading-relaxed ${centered ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface MetricBadgeProps {
  value: string;
  label: string;
  color?: string;
}

export function MetricBadge({ value, label, color = '#00D4FF' }: MetricBadgeProps) {
  return (
    <div className="text-center">
      <div
        className="text-3xl lg:text-4xl font-bold mb-1"
        style={{ color, fontFamily: 'Syne, sans-serif' }}
      >
        {value}
      </div>
      <div
        className="text-xs text-[#64748B] uppercase tracking-wider"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {label}
      </div>
    </div>
  );
}
