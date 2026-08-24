// src/lib/security-linter.ts
// ── Zero-Trust Security Verification Stages ─────────────────────────
// Handles both INGRESS (Prompt Injection/Jailbreak detection) and 
// EGRESS (Generated Code Vulnerability linting).

export type SecurityStatus = "pending" | "pass" | "warn" | "fail";
export type Severity = "critical" | "high" | "medium" | "low" | "warn";

export interface SecurityFinding {
  ruleId: string;
  severity: Severity;
  description: string;
  line?: number;
}

export interface SecurityEvaluation {
  status: SecurityStatus;
  findings: SecurityFinding[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. INGRESS: Prompt Injection & Jailbreak Detection
// ─────────────────────────────────────────────────────────────────────────────

const JAILBREAK_PATTERNS = [
  /ignore (all )?(previous )?(instructions|directions)/i,
  /system prompt/i,
  /you are (now )?an? (unfiltered|unrestricted|DAN|developer) (ai|model|mode)/i,
  /base instructions/i,
  /forget (everything )?you (were|have been) told/i,
];

const EXFILTRATION_PATTERNS = [
  /print(.*)environment variables/i,
  /output(.*)config/i,
  /reveal(.*)secrets?/i,
  /```bash\n(env|printenv|cat .*)/i,
];

export function analyzePromptSecurity(prompt: string): SecurityEvaluation {
  const findings: SecurityFinding[] = [];
  let status: SecurityStatus = "pass";

  if (!prompt || typeof prompt !== "string") {
    return {
      status: "fail",
      findings: [{ ruleId: "INGRESS-000", description: "Empty or invalid prompt payload.", severity: "critical" }]
    };
  }

  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(prompt)) {
      findings.push({
        ruleId: "INGRESS-001",
        description: `Potential jailbreak attempt detected: matched pattern ${pattern.toString()}`,
        severity: "critical",
      });
      status = "fail";
    }
  }

  for (const pattern of EXFILTRATION_PATTERNS) {
    if (pattern.test(prompt)) {
      findings.push({
        ruleId: "INGRESS-002",
        description: `Data exfiltration attempt detected: matched pattern ${pattern.toString()}`,
        severity: "high",
      });
      status = "fail";
    }
  }

  if (prompt.length > 25000) {
    findings.push({
      ruleId: "INGRESS-003",
      description: "Prompt length exceeds 25,000 characters. Potential context flooding attack.",
      severity: "warn",
    });
    if (status === "pass") status = "warn";
  }

  if (/(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/.test(prompt)) {
    findings.push({
      ruleId: "INGRESS-004",
      description: "Large block of Base64 encoded text detected. May contain obfuscated instructions.",
      severity: "warn",
    });
    if (status === "pass") status = "warn";
  }

  return { status, findings };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EGRESS: Generated Code Security Linter
// ─────────────────────────────────────────────────────────────────────────────

const CODE_RULES: { rule: string; re: RegExp; severity: Severity; message: string }[] = [
  {
    rule: "EGRESS-001",
    re: /\beval\s*\(/,
    severity: "critical",
    message: "Dynamic code execution via eval() is forbidden by Zero Trust policy.",
  },
  {
    rule: "EGRESS-002",
    re: /new\s+Function\s*\(/,
    severity: "critical",
    message: "Runtime code construction (new Function) is forbidden.",
  },
  {
    rule: "EGRESS-003",
    re: /(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{12,}|api[_-]?key\s*[:=]\s*["'][A-Za-z0-9]{12,}["']|password\s*[:=]\s*["'][^"']+["'])/i,
    severity: "critical",
    message: "Hardcoded credential detected. Secrets must be injected via environment vault.",
  },
  {
    rule: "EGRESS-004",
    re: /dangerouslySetInnerHTML|\.innerHTML\s*=/,
    severity: "high",
    message: "Raw HTML injection surface (XSS risk). Use sanitized rendering.",
  },
  {
    rule: "EGRESS-005",
    re: /child_process|execSync\s*\(|spawnSync\s*\(/,
    severity: "high",
    message: "Shell execution is not permitted in generated application code.",
  },
  {
    rule: "EGRESS-006",
    re: /(query|execute)\s*\(\s*[`"'].*(\$\{|['"]\s*\+)/,
    severity: "high",
    message: "String-built SQL detected. Use parameterized queries (SQL injection risk).",
  },
  {
    rule: "EGRESS-007",
    re: /http:\/\/(?!localhost|127\.0\.0\.1)/,
    severity: "medium",
    message: "Non-TLS endpoint referenced. All egress must use HTTPS.",
  },
  {
    rule: "EGRESS-008",
    re: /Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*/,
    severity: "medium",
    message: "Wildcard CORS policy violates tenant isolation.",
  },
  {
    rule: "EGRESS-009",
    re: /console\.log\([^)]*(token|secret|password|credential)/i,
    severity: "low",
    message: "Potential secret leakage to logs.",
  },
];

export function lintSnippet(code: string): SecurityEvaluation {
  const findings: SecurityFinding[] = [];
  const lines = code.split("\n");
  
  for (const r of CODE_RULES) {
    lines.forEach((line, i) => {
      if (r.re.test(line)) {
        findings.push({
          ruleId: r.rule,
          severity: r.severity,
          description: r.message,
          line: i + 1,
        });
      }
    });
  }
  
  const hasBlocker = findings.some(
    (f) => f.severity === "critical" || f.severity === "high"
  );
  
  const status: SecurityStatus = hasBlocker ? "fail" : findings.length > 0 ? "warn" : "pass";
  
  return { status, findings };
}