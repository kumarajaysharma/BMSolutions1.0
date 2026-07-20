// ── Zero-Trust Security Verification Stage ─────────────────────────
// Every AI-generated snippet passes through this linting gate before
// it can be committed to the repository. No implicit trust.

export type Finding = {
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  line: number;
};

const RULES: { rule: string; re: RegExp; severity: Finding["severity"]; message: string }[] = [
  {
    rule: "no-eval",
    re: /\beval\s*\(/,
    severity: "critical",
    message: "Dynamic code execution via eval() is forbidden by Zero Trust policy.",
  },
  {
    rule: "no-new-function",
    re: /new\s+Function\s*\(/,
    severity: "critical",
    message: "Runtime code construction (new Function) is forbidden.",
  },
  {
    rule: "no-hardcoded-secret",
    re: /(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{12,}|api[_-]?key\s*[:=]\s*["'][A-Za-z0-9]{12,}["']|password\s*[:=]\s*["'][^"']+["'])/i,
    severity: "critical",
    message: "Hardcoded credential detected. Secrets must be injected via environment vault.",
  },
  {
    rule: "no-dangerous-html",
    re: /dangerouslySetInnerHTML|\.innerHTML\s*=/,
    severity: "high",
    message: "Raw HTML injection surface (XSS risk). Use sanitized rendering.",
  },
  {
    rule: "no-child-process",
    re: /child_process|execSync\s*\(|spawnSync\s*\(/,
    severity: "high",
    message: "Shell execution is not permitted in generated application code.",
  },
  {
    rule: "no-sql-concat",
    re: /(query|execute)\s*\(\s*[`"'].*(\$\{|['"]\s*\+)/,
    severity: "high",
    message: "String-built SQL detected. Use parameterized queries (SQL injection risk).",
  },
  {
    rule: "require-tls",
    re: /http:\/\/(?!localhost|127\.0\.0\.1)/,
    severity: "medium",
    message: "Non-TLS endpoint referenced. All egress must use HTTPS.",
  },
  {
    rule: "no-wildcard-cors",
    re: /Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*/,
    severity: "medium",
    message: "Wildcard CORS policy violates tenant isolation.",
  },
  {
    rule: "no-console-secrets",
    re: /console\.log\([^)]*(token|secret|password|credential)/i,
    severity: "low",
    message: "Potential secret leakage to logs.",
  },
];

export function lintSnippet(code: string): {
  status: "pass" | "warn" | "fail";
  findings: Finding[];
} {
  const findings: Finding[] = [];
  const lines = code.split("\n");
  for (const r of RULES) {
    lines.forEach((line, i) => {
      if (r.re.test(line)) {
        findings.push({
          rule: r.rule,
          severity: r.severity,
          message: r.message,
          line: i + 1,
        });
      }
    });
  }
  const hasBlocker = findings.some(
    (f) => f.severity === "critical" || f.severity === "high"
  );
  const status = hasBlocker ? "fail" : findings.length > 0 ? "warn" : "pass";
  return { status, findings };
}
