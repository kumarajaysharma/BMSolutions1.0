import { Link } from 'react-router-dom';
import { Shield, Github, Linkedin, Mail, ExternalLink } from 'lucide-react';

const footerSections = [
  {
    title: 'Platforms',
    links: [
      { label: 'JINTO Infrastructure', href: '/platforms/jinto' },
      { label: 'LIMSY Health', href: '/platforms/limsy' },
      { label: 'Nidhivan R&D', href: '/platforms/nidhivan' },
      { label: 'KundaliPro', href: '/platforms/kundali-pro' },
      { label: 'Blueprint', href: '/platforms/blueprint' },
      { label: 'Project PERL', href: '/platforms/project-perl' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About BMSolutions', href: '/about' },
      { label: 'BNLV Group', href: '/about#bnlv' },
      { label: 'Security Architecture', href: '/security' },
      { label: 'Contact & Demo', href: '/contact' },
    ],
  },
  {
    title: 'Technical',
    links: [
      { label: 'API Documentation', href: '/docs/api', external: true },
      { label: 'System Status', href: '/status', external: true },
      { label: 'Security Policy', href: '/security' },
      { label: 'Compliance Overview', href: '/security#compliance' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1E2A3B] bg-[#080C16]">
      {/* ── Upper Footer ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* ── Brand Column ── */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#00D4FF15] border border-[#00D4FF40] rounded flex items-center justify-center">
                <span
                  className="font-bold text-[#00D4FF] text-sm tracking-widest"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  BM
                </span>
              </div>
              <div>
                <div
                  className="text-white font-semibold text-sm"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  BMSolutions
                </div>
                <div
                  className="text-[#4B5563] text-[10px] tracking-widest uppercase"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  BNLV Group
                </div>
              </div>
            </Link>
            <p
              className="text-[#64748B] text-sm leading-relaxed max-w-xs mb-6"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Enterprise SaaS division of BNLV Group. Defense-caliber infrastructure,
              AI-driven platforms, and institutional-grade orchestration.
            </p>

            {/* Security badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Zero Trust', 'CMEK/HSM', 'SOC 2 Aligned', 'FIPS 140-3'].map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] px-2 py-1 bg-[#111827] border border-[#1E2A3B] text-[#64748B] rounded font-mono"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Uptime indicator */}
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  All systems operational
                </span>
              </div>
            </div>
          </div>

          {/* ── Link Columns ── */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3
                className="text-white text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lower Footer ── */}
      <div className="border-t border-[#1E2A3B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            className="text-xs text-[#4B5563]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            © {year} BMSolutions — BNLV Group. All rights reserved.
            &nbsp;|&nbsp; Deployed on{' '}
            <span className="text-[#00D4FF]">bms.bnlvconsulting.com</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[#4B5563]">
              <Shield className="w-3 h-3 text-[#10B981]" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Defense-grade infrastructure
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="mailto:contact@bnlvconsulting.com"
                className="text-[#4B5563] hover:text-[#94A3B8] transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                className="text-[#4B5563] hover:text-[#94A3B8] transition-colors"
                rel="noopener noreferrer"
                target="_blank"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                className="text-[#4B5563] hover:text-[#94A3B8] transition-colors"
                rel="noopener noreferrer"
                target="_blank"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
