import type { Metadata } from 'next';

const SUBSIDIARY_META: Record<string, { title: string; description: string }> = {
  bms:      { title: 'BMSolutions — Enterprise SaaS & Website Builder Suites | BNLV Group', description: 'Deploy production-ready enterprise codebases and advanced visual builder suites. Multi-tenant architecture by BNLV Group.' },
  nidhivan: { title: 'Nidhivan Consulting — Institutional DPR, BOQ & Financial Engine | BNLV Group', description: 'Automated CA project reports, bill of quantities, and institutional fundraising dossiers for enterprise finance teams.' },
  limsy:    { title: 'LIMSY — Supreme Court Standard Docket & Case Intelligence | BNLV Group', description: 'Advanced legal analytics, precedent tracking, and automated document generation for elite law firms.' },
  vihang:   { title: 'Vihang Creations — Enterprise Digital Asset & Layout Studios | BNLV Group', description: 'High-performance design systems, asset pipelines, and enterprise layout components for modern brands.' },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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