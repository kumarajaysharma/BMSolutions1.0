// src/app/[subdomain]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IntakeForm } from './_components/IntakeForm';

// Unlisted subdomains resolve to static 404 at the edge — no server execution.
export const dynamicParams = false;

// ─────────────────────────────────────────────────────────────────────────────
// SUBSIDIARY CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const SUBSIDIARY_CONFIG: Record<string, {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  features: string[];
  defaultPlan: 'pilot' | 'starter' | 'professional' | 'scale' | 'enterprise';
}> = {
  bms: {
    name: 'BMSolutions',
    slug: 'bms',
    tagline: 'Enterprise Full-Stack SaaS & Advanced Website Builder Suites',
    description: 'Deploy ready-to-use production enterprise codebases and advanced visual builder suites instantly.',
    features: ['Ready-to-Deploy ZIP Export', 'Multi-Tenant Architecture', 'Custom Domain Routing'],
    defaultPlan: 'enterprise',
  },
  nidhivan: {
    name: 'Nidhivan Consulting',
    slug: 'nidhivan',
    tagline: 'Institutional DPR, BOQ, and Financial Metrics Engine',
    description: 'Automated Chartered Accountant project reports, bill of quantities, and institutional fundraising dossiers.',
    features: ['CA Project Reports', 'BOQ Automation', 'Risk Committee Compliance'],
    defaultPlan: 'professional',
  },
  limsy: {
    name: 'Legal Intelligence (LIMSY)',
    slug: 'limsy',
    tagline: 'Supreme Court Standard Docket & Case Intelligence System',
    description: 'Advanced legal analytics, precedent tracking, and automated document generation for elite law firms.',
    features: ['Supreme Court Standard Dockets', 'Precedent Vector Search', 'Secure Client Vaults'],
    defaultPlan: 'enterprise',
  },
  vihang: {
    name: 'Vihang Creations',
    slug: 'vihang',
    tagline: 'Scalable Digital Asset & Enterprise Layout Studios',
    description: 'High-performance design systems, asset pipelines, and enterprise layout components for modern brands.',
    features: ['Scalable Asset Pipelines', 'Enterprise Design Tokens', 'High-Conversion Layouts'],
    defaultPlan: 'scale',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

const SUBSIDIARY_META: Record<string, { title: string; description: string }> = {
  bms: {
    title: 'BMSolutions — Enterprise SaaS & Website Builder Suites | BNLV Group',
    description: 'Deploy production-ready enterprise codebases and advanced visual builder suites. Multi-tenant architecture by BNLV Group.',
  },
  nidhivan: {
    title: 'Nidhivan Consulting — Institutional DPR, BOQ & Financial Engine | BNLV Group',
    description: 'Automated CA project reports, bill of quantities, and institutional fundraising dossiers for enterprise finance teams.',
  },
  limsy: {
    title: 'LIMSY — Supreme Court Standard Docket & Case Intelligence | BNLV Group',
    description: 'Advanced legal analytics, precedent tracking, and automated document generation for elite law firms.',
  },
  vihang: {
    title: 'Vihang Creations — Enterprise Digital Asset & Layout Studios | BNLV Group',
    description: 'High-performance design systems, asset pipelines, and enterprise layout components for modern brands.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// NEXT.JS EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return Object.keys(SUBSIDIARY_CONFIG).map((subdomain) => ({ subdomain }));
}

// Renamed from PageProps to SubsidiaryPageProps to avoid collision with
// Next.js 16's built-in generic PageProps<T> type, which caused TS2344:
// "Property 'default' is missing in type ... AppPageConfig<'/[subdomain]'>".
interface SubsidiaryPageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: SubsidiaryPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const meta = SUBSIDIARY_META[subdomain];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `https://${subdomain}.bnlvconsulting.com` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://${subdomain}.bnlvconsulting.com`,
      siteName: 'BNLV Group',
      type: 'website',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function SubsidiaryLandingPage({ params }: SubsidiaryPageProps) {
  const { subdomain } = await params;
  const data = SUBSIDIARY_CONFIG[subdomain];

  if (!data) {
    notFound();
  }

  return (
    <>
      {/* Navigation Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold tracking-tight text-lg">
            BNLV Group /{' '}
            <span className="text-blue-400">{data.name}</span>
          </span>
        </div>
        <a
          href="#contact"
          className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Request Access
        </a>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center space-y-8 flex-grow flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-semibold tracking-wide uppercase">
          {data.slug}.bnlvconsulting.com
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          {data.tagline}
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left max-w-4xl mx-auto w-full">
          {data.features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-lg"
            >
              <div className="text-blue-400 font-bold text-lg mb-2">0{idx + 1}.</div>
              <h3 className="font-semibold text-slate-200">{feature}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Client Intake Form Section */}
      <section id="contact" className="border-t border-slate-800/60 bg-slate-900/20 py-20 px-6">
        <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Enterprise Onboarding</h2>
          <p className="text-sm text-slate-400 mb-6">
            Submit your organization details to provision a secure workspace.
          </p>
          <IntakeForm subsidiaryName={data.name} defaultPlan={data.defaultPlan} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full">
        &copy; {new Date().getFullYear()} BNLV Group of Companies. All rights reserved.
      </footer>
    </>
  );
}
