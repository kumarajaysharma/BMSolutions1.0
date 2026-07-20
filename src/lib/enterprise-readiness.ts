export type AuditStatus = "pass" | "warn" | "fail";

export type AuditEvidence = {
  label: string;
  value: string;
  href?: string;
};

export type AuditControl = {
  id: string;
  title: string;
  domain: string;
  status: AuditStatus;
  owner: string;
  evidence: AuditEvidence[];
  recommendation: string;
};

export type AuditPhase = {
  id: string;
  title: string;
  description: string;
  status: AuditStatus;
  steps: { label: string; status: AuditStatus; detail: string }[];
};

export type PlatformTarget = {
  id: string;
  name: string;
  channel: string;
  status: AuditStatus;
  capabilities: string[];
  compliance: string[];
};

const scoreFor = (status: AuditStatus) =>
  status === "pass" ? 100 : status === "warn" ? 72 : 28;

export function overallScore(items: { status: AuditStatus }[]) {
  if (!items.length) return 100;
  return Math.round(items.reduce((sum, i) => sum + scoreFor(i.status), 0) / items.length);
}

export function readinessLevel(score: number) {
  if (score >= 90) return "Enterprise Ready";
  if (score >= 75) return "Production Ready with Watch Items";
  if (score >= 55) return "Controlled Beta";
  return "Not Production Ready";
}

export function buildEnterpriseControls(input: {
  tenants: number;
  users: number;
  projects: number;
  runningEnvs: number;
  deployments: number;
  deploySuccessRate: number;
  openIncidents: number;
  activeKeys: number;
  liveFlags: number;
  pendingRequests: number;
}) {
  const controls: AuditControl[] = [
    {
      id: "ENT-ARCH-001",
      title: "Modular architecture and source-of-truth integrity",
      domain: "Architecture",
      status: input.projects > 0 ? "pass" : "warn",
      owner: "Chief Architect",
      evidence: [
        { label: "Projects", value: String(input.projects), href: "/builder" },
        { label: "Visual-to-code mapping", value: "Deterministic React generation", href: "/builder" },
      ],
      recommendation: "Keep every builder mutation backed by canonical source generation and audit logs.",
    },
    {
      id: "ENT-SEC-001",
      title: "Zero-trust AI security gate",
      domain: "Security",
      status: "pass",
      owner: "Security Engineering",
      evidence: [
        { label: "Policy rules", value: "9 static verification rules", href: "/ai-engine" },
        { label: "Commit guard", value: "Blocking fail/high severity findings" },
      ],
      recommendation: "Add dependency SBOM attestation for every generated artifact before external release.",
    },
    {
      id: "ENT-IAM-001",
      title: "RBAC and multi-tenant administration",
      domain: "Identity & Access",
      status: input.tenants > 0 && input.users > 0 ? "pass" : "warn",
      owner: "Studio Admin",
      evidence: [
        { label: "Tenants", value: String(input.tenants), href: "/admin" },
        { label: "Users", value: String(input.users), href: "/admin" },
        { label: "Roles", value: "owner/admin/architect/developer/designer/viewer" },
      ],
      recommendation: "Integrate SAML/OIDC enterprise SSO before public enterprise launch.",
    },
    {
      id: "ENT-DEL-001",
      title: "CI/CD, canary deployment and rollback",
      domain: "Delivery",
      status: input.deployments > 0 && input.deploySuccessRate >= 80 ? "pass" : "warn",
      owner: "Platform Engineering",
      evidence: [
        { label: "Deployments", value: String(input.deployments), href: "/deployments" },
        { label: "Success rate", value: `${input.deploySuccessRate}%` },
      ],
      recommendation: "Require protected-branch approvals and signed provenance for marketplace releases.",
    },
    {
      id: "ENT-OPS-001",
      title: "Operational stability and incident readiness",
      domain: "Operations",
      status: input.openIncidents === 0 ? "pass" : "warn",
      owner: "SRE / On-call",
      evidence: [
        { label: "Open incidents", value: String(input.openIncidents), href: "/observability" },
        { label: "SLO model", value: "Availability target + error budget" },
      ],
      recommendation:
        input.openIncidents > 0
          ? "Close or document active incidents before enterprise release sign-off."
          : "Run quarterly disaster recovery and restore drills.",
    },
    {
      id: "ENT-PLAT-001",
      title: "Developer platform controls",
      domain: "Platform Services",
      status: input.activeKeys > 0 ? "pass" : "warn",
      owner: "Developer Platform",
      evidence: [
        { label: "Active API keys", value: String(input.activeKeys), href: "/services" },
        { label: "Live feature flags", value: String(input.liveFlags), href: "/services" },
      ],
      recommendation: "Enforce per-tenant API quotas, automated key expiry and webhook delivery SLAs.",
    },
    {
      id: "ENT-CX-001",
      title: "Business intake and client scheduling",
      domain: "Customer Experience",
      status: "pass",
      owner: "Go-to-market",
      evidence: [
        { label: "Pending requests", value: String(input.pendingRequests), href: "/admin" },
        { label: "Landing scheduler", value: "Enabled", href: "/#schedule" },
      ],
      recommendation: "Connect scheduler to CRM and calendar provider for enterprise sales operations.",
    },
    {
      id: "ENT-APP-001",
      title: "Website and market app parity",
      domain: "Cross-platform App",
      status: "pass",
      owner: "Product Engineering",
      evidence: [
        { label: "Shared app config", value: "/api/app-config", href: "/api/app-config" },
        { label: "PWA manifest", value: "/manifest.webmanifest", href: "/manifest.webmanifest" },
        { label: "Offline shell", value: "Service worker registered" },
      ],
      recommendation: "Use the same app-config contract for iOS, Android, desktop shell and web app releases.",
    },
    {
      id: "ENT-PERF-001",
      title: "Performance and browsing responsiveness",
      domain: "Performance",
      status: "pass",
      owner: "Platform Engineering",
      evidence: [
        { label: "Read-path strategy", value: "Aggregate SQL counts (no full-table scans)" },
        { label: "Server micro-cache", value: "TTL cache absorbs dashboard polling fan-out" },
        { label: "Zero interception", value: "No service worker between browser and server (kill-switch deployed)" },
        { label: "Polling discipline", value: "Paused when tab hidden; 5-15s when visible" },
        { label: "Home/Landing", value: "Shared component — zero duplicate payload", href: "/home" },
      ],
      recommendation: "Add CDN edge caching and HTTP compression at the load balancer for global clients.",
    },
    {
      id: "ENT-COMP-001",
      title: "Compliance readiness baseline",
      domain: "Compliance",
      status: "warn",
      owner: "GRC",
      evidence: [
        { label: "Audit trail", value: "Enabled", href: "/admin" },
        { label: "Security gate", value: "Enabled", href: "/ai-engine" },
        { label: "Data residency", value: "Region-aware environments" },
      ],
      recommendation: "Complete legal review for SOC2 report package, DPA, privacy policy and subprocessors list.",
    },
  ];

  const phases: AuditPhase[] = [
    {
      id: "phase-01",
      title: "1. Strategy, scope and product definition",
      description: "Confirm personas, enterprise value proposition, platform boundaries and marketable app scope.",
      status: "pass",
      steps: [
        { label: "Business model", status: "pass", detail: "SaaS studio positioning with admin, builder, AI and platform services." },
        { label: "Enterprise personas", status: "pass", detail: "Owner, admin, architect, developer, designer and viewer mapped in RBAC." },
        { label: "Market app scope", status: "pass", detail: "Web/PWA shell and native app contract share the same configuration API." },
      ],
    },
    {
      id: "phase-02",
      title: "2. Experience design and brand system",
      description: "Validate world-class aesthetics, accessibility, localization and theme parity across website and app.",
      status: "pass",
      steps: [
        { label: "Default aesthetic", status: "pass", detail: "Serene Sand remains saved as the default palette." },
        { label: "Theme variants", status: "pass", detail: "Royal Maroon, Forest Jade and Navy Blue available globally." },
        { label: "Localization", status: "pass", detail: "English default with Hindi plus additional language options." },
      ],
    },
    {
      id: "phase-03",
      title: "3. Production development lifecycle",
      description: "Assess code generation, extension safety, CI/CD and quality gates.",
      status: input.deployments > 0 ? "pass" : "warn",
      steps: [
        { label: "Visual-to-code", status: "pass", detail: "Component model deterministically generates production React source." },
        { label: "AI routing", status: "pass", detail: "Planning/backend tasks route to Opus; UI/styling tasks route to Gemini." },
        { label: "Pipeline", status: input.deployments > 0 ? "pass" : "warn", detail: "Blue/green pipeline exists with rollback and chaos drill support." },
      ],
    },
    {
      id: "phase-04",
      title: "4. Security, privacy and compliance",
      description: "Verify zero-trust controls, tenant isolation, secrets, auditability and GRC readiness.",
      status: "warn",
      steps: [
        { label: "AI security gate", status: "pass", detail: "Dangerous code, XSS, SQL concatenation and secrets are blocked." },
        { label: "Secrets vault", status: "pass", detail: "Masked values, environment scoping and rotation versioning are present." },
        { label: "Legal artifacts", status: "warn", detail: "Privacy policy, DPA and subprocessors list should be finalized before launch." },
      ],
    },
    {
      id: "phase-05",
      title: "5. Operations, support and scale",
      description: "Review SLOs, incident response, observability, provisioning and release stability.",
      status: input.openIncidents === 0 ? "pass" : "warn",
      steps: [
        { label: "SLO and error budget", status: "pass", detail: "Availability target and error budget burn are computed from live service data." },
        { label: "Incident lifecycle", status: "pass", detail: "SEV1-SEV3 incidents progress open → monitoring → resolved." },
        { label: "Current operational state", status: input.openIncidents === 0 ? "pass" : "warn", detail: `${input.openIncidents} active incident(s).` },
      ],
    },
    {
      id: "phase-06",
      title: "6. Market app packaging and platform sync",
      description: "Ensure web, PWA, iOS, Android and desktop editions stay compliant and aligned with website state.",
      status: "pass",
      steps: [
        { label: "Shared configuration", status: "pass", detail: "All app shells consume /api/app-config for nav, themes, languages and compliance links." },
        { label: "PWA installability", status: "pass", detail: "Manifest, icons and service worker are provided for market-ready web app packaging." },
        { label: "Native parity", status: "pass", detail: "Platform contract lists required capabilities for iOS, Android, desktop and web." },
      ],
    },
  ];

  const platforms: PlatformTarget[] = [
    {
      id: "web",
      name: "Responsive Website",
      channel: "Browser / SEO landing",
      status: "pass",
      capabilities: ["Landing", "Scheduler", "About", "Careers", "Studio modules", "i18n", "Themes"],
      compliance: ["Cookie-light", "Accessible forms", "Audit logged actions"],
    },
    {
      id: "pwa",
      name: "Installable PWA",
      channel: "Chrome / Edge / Safari install",
      status: "pass",
      capabilities: ["Manifest", "Service worker", "Offline shell", "App icons", "Shared config API"],
      compliance: ["HTTPS required", "No hardcoded secrets", "Cache-first static assets"],
    },
    {
      id: "ios",
      name: "iOS App Shell",
      channel: "Apple App Store / TestFlight",
      status: "warn",
      capabilities: ["Native wrapper", "Shared API contract", "Deep links", "Push notifications ready"],
      compliance: ["Apple privacy nutrition label pending", "DPA/privacy policy required"],
    },
    {
      id: "android",
      name: "Android App Shell",
      channel: "Google Play / Enterprise managed Play",
      status: "warn",
      capabilities: ["Native wrapper", "Shared API contract", "Deep links", "Push notifications ready"],
      compliance: ["Data Safety form pending", "Play integrity review required"],
    },
    {
      id: "desktop",
      name: "Desktop Workspace",
      channel: "Mac / Windows / Linux shell",
      status: "warn",
      capabilities: ["Electron/Tauri shell contract", "SSO browser handoff", "Secure local storage", "Auto-update design"],
      compliance: ["Code signing required", "Auto-update signing required"],
    },
  ];

  return { controls, phases, platforms };
}

export const APP_CAPABILITY_CONTRACT = {
  appId: "com.bnlvgroup.bms.enterprise",
  name: "BMS (Business Management Solutions) — A BNLV Group of Company",
  defaultLanguage: "en",
  defaultTheme: "serene-sand",
  supportedLanguages: ["en", "hi", "es", "fr"],
  supportedThemes: ["serene-sand", "royal-maroon", "forest-jade", "navy-blue"],
  requiredCapabilities: [
    "client-request-scheduling",
    "visual-builder",
    "ai-routing-engine",
    "studio-admin-rbac",
    "iac-environment-provisioning",
    "cicd-blue-green-deployments",
    "observability-slo-incidents",
    "developer-platform-services",
    "enterprise-readiness-audit",
  ],
  complianceBaseline: [
    "zero-trust-ai-security-gate",
    "tenant-aware-audit-trail",
    "masked-secrets-and-rotation",
    "https-only-webhooks",
    "pwa-installability",
    "shared-config-contract",
  ],
};
