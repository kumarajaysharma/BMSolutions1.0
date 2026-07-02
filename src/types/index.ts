// ─── Platform Types ──────────────────────────────────────────────
export interface Platform {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: PlatformCategory;
  status: 'live' | 'beta' | 'development' | 'planning';
  icon: string;
  accentColor: string;
  features: string[];
  metrics?: Metric[];
  tags: string[];
  route: string;
}

export type PlatformCategory =
  | 'AI & Automation'
  | 'Enterprise Infrastructure'
  | 'Healthcare & Life Sciences'
  | 'Financial Technology'
  | 'Design & Creative'
  | 'Knowledge Management'
  | 'Compliance & Legal';

export interface Metric {
  label: string;
  value: string;
  unit?: string;
}

// ─── Navigation Types ────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// ─── Form Types ──────────────────────────────────────────────────
export interface ContactForm {
  name: string;
  organization: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  inquiry: InquiryType;
}

export type InquiryType =
  | 'enterprise-demo'
  | 'technical-evaluation'
  | 'partnership'
  | 'security-audit'
  | 'custom-deployment'
  | 'general';
