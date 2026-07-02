import { Shield, Lock, Key, Eye, Server, AlertTriangle } from 'lucide-react';
import { Section, Container, SectionHeader } from '@/components/Section';

const securityLayers = [
  {
    layer: 'L1',
    title: 'Network Perimeter',
    icon: <Shield className="w-5 h-5" />,
    color: '#00D4FF',
    items: [
      'Cloudflare WAF with OWASP CRS rule set',
      'Cloud Armor DDoS mitigation and geo-fencing',
      'Private GKE cluster — no public API server endpoint',
      'Default-deny NetworkPolicy on all namespaces',
      'Ingress-only via GKE managed Ingress + FrontendConfig',
    ],
  },
  {
    layer: 'L2',
    title: 'Identity & Authentication',
    icon: <Lock className="w-5 h-5" />,
    color: '#10B981',
    items: [
      'OIDC / JWKS with JOSE library — no custom JWT implementation',
      'JTI revocation via Redis blocklist (per-token invalidation)',
      'Granular scope validation at every controller boundary',
      'Workload Identity Federation — no static service account keys',
      'mTLS enforced for all service-to-service communication',
    ],
  },
  {
    layer: 'L3',
    title: 'Cryptographic Primitives',
    icon: <Key className="w-5 h-5" />,
    color: '#F59E0B',
    items: [
      'Cloud KMS HSM-backed CMEK — three keys per data classification',
      'FIPS 140-3 validated hardware modules',
      'AES-256-GCM for data-at-rest encryption',
      'TLS 1.3 minimum on all transport paths',
      'Binary Authorization with KMS-backed attestor (image provenance)',
    ],
  },
  {
    layer: 'L4',
    title: 'Secrets Management',
    icon: <Eye className="w-5 h-5" />,
    color: '#8B5CF6',
    items: [
      'External Secrets Operator via Helm — secrets never in-cluster',
      'No plaintext secrets in environment variables or manifests',
      'Secret rotation hooks at Cloud Secret Manager',
      'Audit trail on every secret access event',
      'Dependency denylist actively guards against credential drift',
    ],
  },
  {
    layer: 'L5',
    title: 'Runtime Isolation',
    icon: <Server className="w-5 h-5" />,
    color: '#EC4899',
    items: [
      'Pod Security Standards — restricted enforcement on all namespaces',
      'Non-root, read-only filesystem container images',
      'Per-tenant circuit breakers and rate limiting',
      'Resource quotas and PodDisruptionBudgets',
      'Dataplane V2 (eBPF) — kernel-level network policy enforcement',
    ],
  },
  {
    layer: 'L6',
    title: 'Audit & Observability',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: '#F97316',
    items: [
      'SHA-256 hash-chained audit log — each record links to prior',
      'Tamper-evident record linkage across write operations',
      'Structured Pino logging with GKE-native log sink',
      'OpenTelemetry trace propagation across service boundaries',
      'Authorization decision logging at every scope check',
    ],
  },
];

const complianceMatrix = [
  {
    framework: 'SOC 2 Type II',
    scope: 'Security, Availability, Confidentiality',
    status: 'Architected to align',
    note: 'Third-party audit required for certification',
  },
  {
    framework: 'ISO 27001',
    scope: 'Information Security Management',
    status: 'Architected to align',
    note: 'Controls mapped; certification requires external audit',
  },
  {
    framework: 'FIPS 140-3',
    scope: 'Cryptographic Module Security',
    status: 'HSM-backed primitives active',
    note: 'Cloud KMS HSM uses FIPS 140-3 validated hardware',
  },
  {
    framework: 'GDPR',
    scope: 'Data Protection & Residency',
    status: 'Controls implemented',
    note: 'Data residency configurable per deployment region',
  },
  {
    framework: 'Zero Trust (NIST SP 800-207)',
    scope: 'Network Access Architecture',
    status: 'Fully enforced',
    note: 'Every request authenticated; no implicit network trust',
  },
];

export default function Security() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 grid-pattern">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, #10B981 0%, transparent 60%)',
          }}
        />
        <Container className="relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] text-[#10B981] font-mono px-3 py-1.5 bg-[#10B98110] border border-[#10B98130] rounded-full mb-6">
              <Shield className="w-3 h-3" />
              Security Architecture — BMSolutions / JINTO
            </div>
            <h1
              className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Six-Layer
              <br />
              <span className="text-[#10B981]">Security Architecture</span>
            </h1>
            <p
              className="text-lg text-[#64748B] leading-relaxed"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Defense-grade security is not a feature set — it is the foundation.
              Every layer described here is enforced by infrastructure code, not
              documented as an aspiration. Hardware-backed primitives at every
              cryptographic boundary. Zero Trust at every request boundary.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Security Layers ── */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Defense in Depth"
            title="Six Enforcement Layers"
            subtitle="Each layer is independently enforced. Compromise of one layer does not cascade — isolation is cryptographic, not policy-dependent."
          />
          <div className="space-y-4">
            {securityLayers.map((layer) => (
              <div
                key={layer.layer}
                className="group p-6 bg-[#111827] border border-[#1E2A3B] rounded-xl hover:border-[#2D3E54] transition-colors"
              >
                <div className="flex items-start gap-5">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border"
                    style={{
                      background: `${layer.color}15`,
                      borderColor: `${layer.color}30`,
                      color: layer.color,
                    }}
                  >
                    {layer.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-[10px] font-mono text-[#4B5563] tracking-widest"
                      >
                        {layer.layer}
                      </span>
                      <h3
                        className="text-white font-semibold"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {layer.title}
                      </h3>
                    </div>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {layer.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-[#64748B]"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          <span
                            className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                            style={{ background: layer.color }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Compliance Matrix ── */}
      <Section id="compliance" className="bg-[#080C16]">
        <Container>
          <SectionHeader
            eyebrow="Compliance"
            title="Framework Alignment Matrix"
            subtitle='Compliance language is precise: "Architected to align" means controls are implemented and mapped. Certification status requires documented third-party audit.'
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#1E2A3B]">
                  {['Framework', 'Scope', 'Status', 'Notes'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-[10px] text-[#4B5563] uppercase tracking-widest font-mono"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complianceMatrix.map((row, i) => (
                  <tr
                    key={row.framework}
                    className={`border-b border-[#1E2A3B] hover:bg-[#111827] transition-colors ${
                      i % 2 === 0 ? '' : 'bg-[#111827]/50'
                    }`}
                  >
                    <td
                      className="py-4 px-4 text-white font-medium"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {row.framework}
                    </td>
                    <td
                      className="py-4 px-4 text-[#64748B]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {row.scope}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] px-2 py-1 bg-[#10B98115] text-[#10B981] border border-[#10B98130] rounded font-mono">
                        {row.status}
                      </span>
                    </td>
                    <td
                      className="py-4 px-4 text-xs text-[#4B5563]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>
    </>
  );
}
