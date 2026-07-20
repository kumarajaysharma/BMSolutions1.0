import type { NextConfig } from "next";

/**
 * Enterprise config — "operational everywhere" policy.
 *
 * IMPORTANT: Do NOT send X-Frame-Options or a restrictive
 * frame-ancestors CSP. The site must render in every condition:
 * direct navigation, new windows, and cross-origin iframe embeds
 * (hosting-platform previews, partner portals, in-app webviews).
 * Firefox hard-blocks embedded pages when X-Frame-Options is set
 * to SAMEORIGIN/DENY — that was the "can't open this page" failure.
 *
 * Clickjacking risk is mitigated at the application layer instead:
 * every privileged mutation requires explicit in-app interaction and
 * is written to the zero-trust audit trail.
 */

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // The service worker must never be served from a stale HTTP cache,
        // otherwise clients can be stranded on an old build.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
