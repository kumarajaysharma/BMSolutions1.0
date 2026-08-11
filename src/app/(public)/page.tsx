import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Briefcase, Target, Zap, Users, TrendingUp, Shield } from 'lucide-react';

export const metadata = {
  title: 'BNLV Group | Enterprise Software & Consulting',
  description: 'A multi-subsidiary enterprise conglomerate delivering SaaS, infrastructure DPRs, legal intelligence, and digital design.',
};

export default function Home() {
  return (
    <div className="w-full bg-bnlv-cream text-bnlv-navy selection:bg-bnlv-gold selection:text-bnlv-navy">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bnlv-cream to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-extrabold text-bnlv-navy leading-tight">
                  BNLV Group of
                  <span className="block text-bnlv-gold">Companies</span>
                </h1>
                <p className="text-xl font-light text-slate-600">
                  Engineered for Enterprise. Delivering high-performance SaaS platforms, infrastructure intelligence, and digital transformation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-bnlv-gold text-bnlv-navy rounded-md font-semibold hover:bg-yellow-500 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Access Enterprise Portal <ArrowRight size={20} />
                </Link>
                <Link
                  href="#companies"
                  className="px-8 py-4 bg-transparent border border-bnlv-navy text-bnlv-navy rounded-md font-semibold hover:bg-bnlv-navy hover:text-bnlv-cream transition-all text-center"
                >
                  Explore Subsidiaries
                </Link>
              </div>

              <div className="pt-8 space-y-3 text-sm text-slate-600 font-medium">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-bnlv-gold rounded-full"></span>
                  Multi-tenant Zero Trust Architecture
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-bnlv-gold rounded-full"></span>
                  Hardware-backed Cryptography
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-bnlv-gold rounded-full"></span>
                  High-performance Enterprise SaaS
                </p>
              </div>
            </div>

            {/* Hero Image - Holographic Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-bnlv-gold rounded-2xl opacity-10 animate-pulse blur-xl"></div>
              <div className="relative bg-white rounded-2xl p-8 border border-bnlv-navy/10 shadow-2xl flex items-center justify-center">
                <Image 
                  src="/brand/bms-logo.png" 
                  alt="BNLV Group Logo"
                  width={400}
                  height={400}
                  className="w-full aspect-square object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Showcase */}
      <section id="companies" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 border-b border-bnlv-navy/10 pb-4">
            <h2 className="text-3xl font-bold text-bnlv-navy">Our Subsidiaries</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* BMS */}
            <Link
              href="/bms"
              className="group bg-white border border-slate-200 rounded-xl p-8 hover:border-bnlv-gold hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-bnlv-navy rounded-lg flex items-center justify-center text-bnlv-cream mb-6 group-hover:bg-bnlv-gold group-hover:text-bnlv-navy transition-colors">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-bold text-bnlv-navy mb-2">BMSolutions</h3>
              <p className="text-slate-600 mb-4">
                Enterprise SaaS Framework & IT/Business Consulting driving strategic expansion.
              </p>
              <div className="flex items-center text-bnlv-navy font-semibold group-hover:text-bnlv-gold transition-colors">
                Learn More <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Nidhivan */}
            <Link
              href="/nidhivan"
              className="group bg-white border border-slate-200 rounded-xl p-8 hover:border-bnlv-gold hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-bnlv-navy rounded-lg flex items-center justify-center text-bnlv-cream mb-6 group-hover:bg-bnlv-gold group-hover:text-bnlv-navy transition-colors">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-bnlv-navy mb-2">Nidhivan</h3>
              <p className="text-slate-600 mb-4">
                Infrastructure DPRs, CPWD DSR 2023 BOQ Engine, and institutional FinTech advisory.
              </p>
              <div className="flex items-center text-bnlv-navy font-semibold group-hover:text-bnlv-gold transition-colors">
                Learn More <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* LIMSY */}
            <Link
              href="/limsy"
              className="group bg-white border border-slate-200 rounded-xl p-8 hover:border-bnlv-gold hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-bnlv-navy rounded-lg flex items-center justify-center text-bnlv-cream mb-6 group-hover:bg-bnlv-gold group-hover:text-bnlv-navy transition-colors">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold text-bnlv-navy mb-2">LIMSY</h3>
              <p className="text-slate-600 mb-4">
                Supreme Court Workflow, Legal Intelligence, and unified Case Management frameworks.
              </p>
              <div className="flex items-center text-bnlv-navy font-semibold group-hover:text-bnlv-gold transition-colors">
                Learn More <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Vihang */}
            <Link
              href="/vihang"
              className="group bg-white border border-slate-200 rounded-xl p-8 hover:border-bnlv-gold hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-bnlv-navy rounded-lg flex items-center justify-center text-bnlv-cream mb-6 group-hover:bg-bnlv-gold group-hover:text-bnlv-navy transition-colors">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-bold text-bnlv-navy mb-2">Vihang</h3>
              <p className="text-slate-600 mb-4">
                Generative AI, Digital Media strategy, and enterprise Visual Design Canvas.
              </p>
              <div className="flex items-center text-bnlv-navy font-semibold group-hover:text-bnlv-gold transition-colors">
                Learn More <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-bnlv-cream border-t border-bnlv-navy/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-bnlv-navy">Enterprise Capabilities</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
              Architecting scalable, defense-grade solutions for institutional operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-bnlv-navy/10 rounded-xl p-8 hover:border-bnlv-gold transition-colors">
              <div className="w-12 h-12 bg-bnlv-cream rounded-lg flex items-center justify-center mb-6">
                <Target className="text-bnlv-navy" size={24} />
              </div>
              <h3 className="text-xl font-bold text-bnlv-navy mb-3">Multi-Tenant SaaS</h3>
              <p className="text-slate-600">
                Centralized architectural frameworks enforcing strict row-level security and data isolation across all tenant workspaces.
              </p>
            </div>

            <div className="bg-white border border-bnlv-navy/10 rounded-xl p-8 hover:border-bnlv-gold transition-colors">
              <div className="w-12 h-12 bg-bnlv-cream rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-bnlv-navy" size={24} />
              </div>
              <h3 className="text-xl font-bold text-bnlv-navy mb-3">Infrastructure DPRs</h3>
              <p className="text-slate-600">
                Automated Detailed Project Report generation and CPWD-compliant Bill of Quantities estimation engines.
              </p>
            </div>

            <div className="bg-white border border-bnlv-navy/10 rounded-xl p-8 hover:border-bnlv-gold transition-colors">
              <div className="w-12 h-12 bg-bnlv-cream rounded-lg flex items-center justify-center mb-6">
                <Shield className="text-bnlv-navy" size={24} />
              </div>
              <h3 className="text-xl font-bold text-bnlv-navy mb-3">Zero Trust Security</h3>
              <p className="text-slate-600">
                Hardware-backed edge cryptography and Cloudflare WAF integration protecting mission-critical institutional data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bnlv-navy">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-bnlv-gold">4</div>
              <p className="text-bnlv-cream/80 font-medium">Core Subsidiaries</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-bnlv-gold">Zero</div>
              <p className="text-bnlv-cream/80 font-medium">Data Breaches</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-bnlv-gold">100%</div>
              <p className="text-bnlv-cream/80 font-medium">Tenant Isolation</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-bnlv-gold">24/7</div>
              <p className="text-bnlv-cream/80 font-medium">Edge Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-bnlv-navy/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-bnlv-navy">Initiate Digital Transformation</h2>
            <p className="text-xl text-slate-600 font-light">
              Partner with BNLV Group to deploy scalable, secure, and intelligent enterprise infrastructure.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-block px-10 py-4 bg-bnlv-gold text-bnlv-navy rounded-md font-semibold hover:bg-yellow-500 hover:shadow-xl transition-all"
          >
            Contact the Board
          </Link>
        </div>
      </section>
    </div>
  );
}