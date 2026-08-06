/**
 * src/lib/subsidiaries.ts
 * BNLV Group — Subsidiary Entity Configuration & Module Mapping
 */

export type SubsidiaryConfig = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  accentColor: string;
  badgeTone: string;
  logoText: string;
  defaultModule: string;
};

export const SUBSIDIARIES: Record<string, SubsidiaryConfig> = {
  bnlv: {
    slug: "bnlv",
    name: "BNLV Group of Companies",
    shortName: "BNLV Apex",
    tagline: "Enterprise Management & Holding Infrastructure",
    accentColor: "from-amber-600 to-amber-700",
    badgeTone: "bg-amber-50 text-amber-700 ring-amber-200",
    logoText: "BNLV",
    defaultModule: "apex-control",
  },
  bms: {
    slug: "bms",
    name: "BMSolutions",
    shortName: "BMS Enterprise",
    tagline: "SaaS projects, environment provisioning, and CI/CD deployment pipelines",
    accentColor: "from-blue-600 to-indigo-700",
    badgeTone: "bg-blue-50 text-blue-700 ring-blue-200",
    logoText: "BMS",
    defaultModule: "saas-studio",
  },
  nidhivan: {
    slug: "nidhivan",
    name: "Nidhivan Consulting",
    shortName: "Nidhivan Financial",
    tagline: "Financial advisory metrics, DPR compliance checklists, and capital reporting",
    accentColor: "from-emerald-600 to-teal-700",
    badgeTone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    logoText: "NIDHIVAN",
    defaultModule: "financial-dpr",
  },
  limsy: {
    slug: "limsy",
    name: "LIMSY",
    shortName: "LIMSY Legal Systems",
    tagline: "Legal Intelligence Managerial Systems",
    accentColor: "from-rose-600 to-red-700",
    badgeTone: "bg-rose-50 text-rose-700 ring-rose-200",
    logoText: "LIMSY",
    defaultModule: "legal-intelligence",
  },
  vihang: {
    slug: "vihang",
    name: "Vihang Creations",
    shortName: "Vihang Creative & Media",
    tagline: "Brand identity suites, typography, HDTV telemetry & OTT delivery controls",
    accentColor: "from-fuchsia-600 to-purple-700",
    badgeTone: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
    logoText: "VIHANG",
    defaultModule: "brand-and-media",
  },
};

export function getSubsidiaryConfig(slug?: string | null): SubsidiaryConfig {
  if (!slug || !SUBSIDIARIES[slug]) {
    return SUBSIDIARIES["bnlv"];
  }
  return SUBSIDIARIES[slug];
}