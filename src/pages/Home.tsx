import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Zap, Globe, Lock, Server, BarChart3,
  ChevronRight, CheckCircle2, Activity,
} from 'lucide-react';
import { platforms } from '@/data/platforms';
import { companyStats } from '@/data/company';
import PlatformCard from '@/components/PlatformCard';
import { Section, Container, SectionHeader, MetricBadge } from '@/components/Section';

const coreCapabilities = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Zero Trust Architecture',
    description:
      'OIDC/JWKS with JTI revocation, per-request scope validation, mTLS at every service boundary, and Workload Identity Federation across all compute layers.',
    color: '#00D4FF',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'HSM-Backed Cryptography',
    description:
      'Cloud KMS HSM-backed CMEK with three keys per data classification. Hardware primitives first — no software-only fallbacks in the cryptographic path.',
    color: '#10B981',
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Defense-Grade Infrastructure',
    description:
      'Private GKE with Dataplane V2, Cloud Armor WAF, Binary Authorization with KMS attestors, and External Secrets Operator — every layer hardened.',
    color: '#F59E0B',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Multi-Tenant Isolation',
    description:
      'Per-tenant circuit breakers, namespace-level network policy with default-deny, resource quotas, and cryptographically isolated audit trails per tenant.',
    color: '#8B5CF6',
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Immutable Audit Chain',
    description:
      'SHA-256 hash-chained audit logging with tamper-evident record linkage. Every write operation, authorization decision, and state transition is auditable.',
    color: '#EC4899',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Observable by Design',
    description:
      'Structured Pino logging, OpenTelemetry traces, GKE-native metrics, HPA/PDB-driven autoscaling, and Pino-driven structured audit records.',
    color: '#F97316',
  },
];

const complianceItems = [
  'SOC 2 Type II — architected to align',
  'ISO 27001 — architected to align',
  'FIPS 140-3 — HSM-backed primitives',
  'GDPR — data residency controls',
  'Zero Trust — fully enforced',
  'Binary Authorization — image provenance',
];

export default function Home() {
  const featuredPlatforms = platforms.filter((p) =>
    ['jinto', 'limsy', 'nidhivan', 'kundali-pro'].includes(p.id)
  );

  return (
    <>
      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-40" />

        {/* Radial glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, #00D4FF 0%, transparent 70%)',
          }}
        />

        {/* Diagonal accent line */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03]"
          style={{
            background:
              'linear-gradient(135deg, transparent 40%, #FF6B35 50%, transparent 60%)',
          }}
        />

        <Container className="relative z-10 py-20">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="animate-fade-up-1 inline-flex items-center gap-3 mb-8">
              <div
                className="flex items-center gap-2 text-[10px] text-[#10B981] font-mono px-3 py-1.5 bg-[#10B98110] border border-[#10B98130] rounded-full"
              >
                <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                All systems operational · BNLV Group Enterprise SaaS
              </div>
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up-2 text-5xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Defense-Grade
              <br />
              <span
                className="shimmer-text"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Platform Engineering
              </span>
              <br />
              for Institutional Scale
            </h1>

            {/* Subheadline */}
            <p
              className="animate-fade-up-3 text-lg lg:text-xl text-[#64748B] leading-relaxed mb-8 max-w-2xl"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              BMSolutions engineers HSM-backed, Zero Trust, multi-tenant SaaS platforms
              that operate at institutional throughput. Eight production platforms.
              Zero compromises.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up-4 flex flex-wrap items-center gap-4 mb-16">
              <Link
                to="/contact"
                className="flex items-center gap-2 px-6 py-3 bg-[#00D4FF] text-[#0A0E1A] font-bold rounded-lg hover:bg-[#00E5FF] transition-colors"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                <Zap className="w-4 h-4" />
                Request Enterprise Demo
              </Link>
              <Link
                to="/platforms"
                className="flex items-center gap-2 px-6 py-3 border border-[#1E2A3B] text-[#94A3B8] rounded-lg hover:border-[#2D3E54] hover:text-white transition-colors"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Explore Platforms
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stat row */}
            <div className="animate-fade-up-5 grid grid-cols-2 lg:grid-cols-4 gap-8">
              {companyStats.map((stat) => (
                <div key={stat.label}>
                  <div
                    className="text-2xl lg:text-3xl font-bold text-[#00D4FF] mb-1"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {stat.value}
                    <span className="text-[#FF6B35]">{stat.suffix}</span>
                  </div>
                  <div
                    className="text-xs text-[#4B5563] uppercase tracking-wider"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div
            className="text-[10px] text-[#4B5563] uppercase tracking-widest"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Scroll
          </div>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#4B5563] to-transparent animate-pulse" />
        </div>
      </section>

      {/* ════════════════════════ CAPABILITIES ════════════════════════ */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Core Capabilities"
            title="Engineered for Institutional Deployment"
            subtitle="Every security primitive is hardware-backed. Every isolation boundary is cryptographically enforced. No startup-tier shortcuts."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreCapabilities.map((cap, i) => (
              <div
                key={cap.title}
                className="group p-6 bg-[#111827] border border-[#1E2A3B] rounded-xl hover:border-[#2D3E54] transition-colors"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 border"
                  style={{
                    background: `${cap.color}15`,
                    borderColor: `${cap.color}30`,
                    color: cap.color,
                  }}
                >
                  {cap.icon}
                </div>
                <h3
                  className="text-white font-semibold mb-2"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {cap.title}
                </h3>
                <p
                  className="text-sm text-[#64748B] leading-relaxed"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ════════════════════════ PLATFORMS ════════════════════════ */}
      <Section className="bg-[#080C16]" grid>
        <Container>
          <div className="flex items-end justify-between mb-12">
            <SectionHeader
              eyebrow="Platform Portfolio"
              title="Eight Production Platforms"
              subtitle="From lab informatics to drone fleet management — each platform built to the same defense-grade security baseline."
              className="mb-0"
            />
            <Link
              to="/platforms"
              className="hidden lg:flex items-center gap-1.5 text-sm text-[#00D4FF] hover:text-[#00E5FF] transition-colors flex-shrink-0 ml-8"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              View all platforms
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredPlatforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>

          <div className="mt-6 flex gap-4 justify-center lg:justify-start flex-wrap">
            {platforms.slice(4).map((p) => (
              <Link
                key={p.id}
                to={p.route}
                className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-[#1E2A3B] rounded-lg text-sm text-[#64748B] hover:text-white hover:border-[#2D3E54] transition-colors"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <span style={{ color: p.accentColor }}>{p.icon}</span>
                {p.name}
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* ════════════════════════ COMPLIANCE ════════════════════════ */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader
                eyebrow="Security & Compliance"
                title="Architected for Regulated Industries"
                subtitle="Compliance language is precise: BMSolutions platforms are architected to align with SOC 2, ISO 27001, and FIPS 140-3 — not claimed as certified absent third-party audit."
              />
              <ul className="space-y-3">
                {complianceItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                    <span
                      className="text-sm text-[#94A3B8]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  to="/security"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1E2A3B] text-sm text-[#94A3B8] rounded-lg hover:border-[#00D4FF40] hover:text-white transition-colors"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  <Shield className="w-4 h-4" />
                  Security Architecture Overview
                </Link>
              </div>
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '99.99%', label: 'Uptime SLA', color: '#10B981' },
                { value: '<12ms', label: 'Auth P99 Latency', color: '#00D4FF' },
                { value: 'HSM', label: 'Crypto Primitive', color: '#F59E0B' },
                { value: '0', label: 'Plaintext Secrets', color: '#EC4899' },
                { value: 'AES-256', label: 'Data-at-Rest Cipher', color: '#8B5CF6' },
                { value: 'mTLS', label: 'Service-to-Service', color: '#F97316' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-5 bg-[#111827] border border-[#1E2A3B] rounded-xl text-center"
                >
                  <MetricBadge value={m.value} label={m.label} color={m.color} />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ════════════════════════ CTA ════════════════════════ */}
      <Section className="bg-[#080C16]">
        <Container>
          <div className="relative overflow-hidden border border-[#1E2A3B] rounded-2xl p-12 lg:p-16 text-center">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background: 'radial-gradient(ellipse at center, #00D4FF 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute top-0 left-0 right-0 h-[1px] opacity-30"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #00D4FF, #FF6B35, transparent)',
              }}
            />
            <div className="relative">
              <div
                className="inline-flex items-center gap-2 text-[10px] text-[#00D4FF] font-mono px-3 py-1.5 bg-[#00D4FF10] border border-[#00D4FF20] rounded-full mb-6"
              >
                <Zap className="w-3 h-3" />
                Available for enterprise onboarding
              </div>
              <h2
                className="text-3xl lg:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Ready to Deploy
                <br />
                Defense-Grade Infrastructure?
              </h2>
              <p
                className="text-[#64748B] text-lg mb-8 max-w-xl mx-auto"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Request a technical evaluation or enterprise demo. Our team handles
                onboarding, security audits, and custom deployment configurations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/contact"
                  className="flex items-center gap-2 px-7 py-3.5 bg-[#00D4FF] text-[#0A0E1A] font-bold rounded-lg hover:bg-[#00E5FF] transition-colors text-sm"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  <Zap className="w-4 h-4" />
                  Request Enterprise Demo
                </Link>
                <Link
                  to="/platforms"
                  className="flex items-center gap-2 px-7 py-3.5 border border-[#2D3E54] text-[#94A3B8] rounded-lg hover:text-white hover:border-[#3D4E64] transition-colors text-sm"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Platform Technical Specs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
