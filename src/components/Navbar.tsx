import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Shield, Zap } from 'lucide-react';

interface NavChild {
  label: string;
  href: string;
  tag?: string;
}

interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  {
    label: 'Platforms',
    href: '/platforms',
    children: [
      { label: 'JINTO', href: '/platforms/jinto', tag: 'Core' },
      { label: 'LIMSY', href: '/platforms/limsy', tag: 'Live' },
      { label: 'Nidhivan R&D', href: '/platforms/nidhivan', tag: 'Live' },
      { label: 'KundaliPro', href: '/platforms/kundali-pro', tag: 'Live' },
      { label: 'Blueprint', href: '/platforms/blueprint', tag: 'Beta' },
      { label: 'Project PERL', href: '/platforms/project-perl', tag: 'Beta' },
      { label: 'Vihang', href: '/platforms/vihang', tag: 'Dev' },
      { label: 'Astrology Academy', href: '/platforms/astrology-academy', tag: 'Beta' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Security', href: '/security' },
  { label: 'Contact', href: '/contact' },
];

const statusColor: Record<string, string> = {
  Core: 'text-[#00D4FF] bg-[#00D4FF15]',
  Live: 'text-[#10B981] bg-[#10B98115]',
  Beta: 'text-[#F59E0B] bg-[#F59E0B15]',
  Dev: 'text-[#94A3B8] bg-[#94A3B815]',
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const isActive = (href: string) =>
    href === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(href);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0E1A]/95 backdrop-blur-md border-b border-[#1E2A3B]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00D4FF15] rounded border border-[#00D4FF40] group-hover:border-[#00D4FF] transition-colors" />
              <span className="relative font-['Syne'] font-800 text-[#00D4FF] text-sm tracking-widest">
                BM
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-['Syne'] font-semibold text-white text-sm tracking-wide"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                BMSolutions
              </span>
              <span
                className="text-[#4B5563] text-[10px] tracking-widest uppercase"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                BNLV Group
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-[#00D4FF]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </Link>

                {/* Dropdown */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-[#111827] border border-[#1E2A3B] rounded-lg shadow-2xl overflow-hidden">
                    <div className="p-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-[#94A3B8] hover:text-white hover:bg-[#1C2333] transition-colors group"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          <span>{child.label}</span>
                          {child.tag && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                                statusColor[child.tag] ?? ''
                              }`}
                            >
                              {child.tag}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── CTA + Mobile Toggle ── */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[#10B981] font-mono px-2 py-1 bg-[#10B98110] border border-[#10B98130] rounded">
                <Shield className="w-3 h-3" />
                <span>Zero Trust</span>
              </div>
              <Link
                to="/contact"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00D4FF] text-[#0A0E1A] text-sm font-semibold rounded hover:bg-[#00E5FF] transition-colors"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                <Zap className="w-3.5 h-3.5" />
                Request Demo
              </Link>
            </div>

            <button
              className="lg:hidden p-2 text-[#94A3B8] hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0A0E1A] border-t border-[#1E2A3B]">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <div key={item.label}>
                <Link
                  to={item.href}
                  className={`block px-3 py-2.5 rounded text-sm font-medium ${
                    isActive(item.href)
                      ? 'text-[#00D4FF] bg-[#00D4FF10]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="pl-4 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className="flex items-center justify-between px-3 py-2 rounded text-xs text-[#64748B] hover:text-[#94A3B8]"
                      >
                        <span>{child.label}</span>
                        {child.tag && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              statusColor[child.tag] ?? ''
                            }`}
                          >
                            {child.tag}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-[#1E2A3B]">
              <Link
                to="/contact"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#00D4FF] text-[#0A0E1A] text-sm font-semibold rounded"
              >
                <Zap className="w-3.5 h-3.5" />
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
