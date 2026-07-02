import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Cpu, Globe, Target } from 'lucide-react';
import { bnlvGroupCompanies, techStack } from '@/data/company';
import { Section, Container, SectionHeader } from '@/components/Section';

const principles = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Hardware-First Security',
    body: 'Software-only cryptographic solutions are explicitly rejected. Every secret, every key, every cryptographic primitive routes through Cloud KMS HSM-backed hardware. No exceptions.',
    color: '#00D4FF',
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'Verified by Execution',
    body: 'Architecture claims are proven by build verification — typecheck clean, lint clean, unit tests passing, and production builds verified before any result is reported.',
    color: '#10B981',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Zero Trust by Default',
    body: 'No implicit trust at any network layer. Every request is authenticated, every scope is validated, every service-to-service call traverses mTLS with Workload Identity.',
    color: '#F59E0B',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Institutional Throughput',
    body: 'Availability claims match topology. Single-region deployments support 99.95–99.99% uptime. The 99.999% target requires documented geographic redundancy — never asserted without proof.',
    color: '#EC4899',
  },
];

export default function About() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 grid-pattern">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, #FF6B35 0%, transparent 60%)',
          }}
        />
        <Container className="relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] text-[#FF6B35] font-mono px-3 py-1.5 bg-[#FF6B3510] border border-[#FF6B3530] rounded-full mb-6">
              <span className="w-1 h-1 bg-[#FF6B35] rounded-full" />
              About BMSolutions — BNLV Group
            </div>
            <h1
              className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Engineering at
              <br />
              <span className="text-[#FF6B35]">Institutional Scale</span>
            </h1>
            <p
              className="text-lg text-[#64748B] leading-relaxed"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              BMSolutions is the enterprise SaaS division of BNLV Group — a diversified
              institutional group spanning healthcare informatics, financial technology,
              research intelligence, and AI-driven platform engineering. Our mandate is
              defense-grade infrastructure that operates without startup-tier compromise.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Engineering Principles ── */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Engineering Philosophy"
            title="Non-Negotiable Principles"
            subtitle="These are operational constraints, not aspirations. Every platform built under the BMSolutions mandate enforces them at the architecture level."
          />
          <div className="grid md:grid-cols-2 gap-4">
            {principles.map((p) => (
              <div
                key={p.title}
                className="p-6 bg-[#111827] border border-[#1E2A3B] rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 border"
                  style={{
                    background: `${p.color}15`,
                    borderColor: `${p.color}30`,
                    color: p.color,
                  }}
                >
                  {p.icon}
                </div>
                <h3
                  className="text-white font-semibold mb-2"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-sm text-[#64748B] leading-relaxed"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── BNLV Group ── */}
      <Section id="bnlv" className="bg-[#080C16]">
        <Container>
          <SectionHeader
            eyebrow="BNLV Group"
            title="The Parent Organization"
            subtitle="BNLV Group is a multi-vertical institutional organization. BMSolutions provides the enterprise SaaS backbone that connects all group entities under a unified, secure platform architecture."
          />
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {bnlvGroupCompanies.map((company) => (
              <div
                key={company.id}
                className="p-6 bg-[#111827] border border-[#1E2A3B] rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-white font-semibold"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {company.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-[#10B98115] text-[#10B981] border border-[#10B98130] rounded font-mono">
                    {company.status}
                  </span>
                </div>
                <p
                  className="text-sm text-[#64748B]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {company.description}
                </p>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div>
            <h3
              className="text-white font-semibold mb-6 text-sm uppercase tracking-widest"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Canonical Technology Stack
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {techStack.map((tier) => (
                <div
                  key={tier.category}
                  className="p-4 bg-[#111827] border border-[#1E2A3B] rounded-xl"
                >
                  <div
                    className="text-[10px] text-[#4B5563] uppercase tracking-widest font-mono mb-3"
                  >
                    {tier.category}
                  </div>
                  <ul className="space-y-1.5">
                    {tier.items.map((item) => (
                      <li
                        key={item}
                        className="text-xs text-[#94A3B8] font-mono flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 bg-[#00D4FF] rounded-full flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <Container>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-[#111827] border border-[#1E2A3B] rounded-xl">
            <div>
              <h3
                className="text-xl font-bold text-white mb-1"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Work with BMSolutions
              </h3>
              <p
                className="text-sm text-[#64748B]"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Enterprise deployments, technical evaluations, and security audits.
              </p>
            </div>
            <Link
              to="/contact"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#00D4FF] text-[#0A0E1A] text-sm font-bold rounded-lg hover:bg-[#00E5FF] transition-colors flex-shrink-0"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Contact Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
