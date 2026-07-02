# BMSolutions — Enterprise Website v2.0.0

**Division:** BMSolutions · BNLV Group  
**Subdomain:** `bms.bnlvconsulting.com`  
**Stack:** React 19 · Vite 6 · TypeScript 5.8 · Tailwind CSS v4  
**Build status:** Typecheck ✅ · Lint ✅ · Production build ✅ (72.83 kB gzip)

---

## Architecture Overview

```
Cloudflare DNS + WAF
        │
GCP Global Load Balancer (HTTPS, managed TLS)
        │
Cloud Armor (OWASP CRS, DDoS)
        │
Cloud CDN ──── GCS Bucket (dist/)
                    │
              GitHub Actions
                (CI/CD deploy)
```

The website is a static SPA served from GCS via Cloud CDN. All SPA routes are handled by the GCS `not_found_page: index.html` fallback. Hashed Vite asset filenames are served with `Cache-Control: immutable, max-age=31536000`. HTML root files are served no-cache to ensure instant propagation on every deploy.

---

## Local Development

```bash
# 1. Install
npm install

# 2. Type check
npm run typecheck

# 3. Lint (zero warnings enforced)
npm run lint

# 4. Dev server
npm run dev
# → http://localhost:5173

# 5. Production build
npm run build

# 6. Preview production bundle
npm run preview
```

---

## Production Deployment — GCS

### Prerequisites

- GCP project with billing enabled
- Terraform >= 1.9 with a GCS remote state bucket
- Workload Identity Federation configured (no static SA keys)
- GitHub repository secrets set:

| Secret | Value |
|---|---|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCS_BUCKET_NAME` | Output from `terraform output gcs_bucket_name` |
| `CDN_BACKEND_SERVICE` | Output from `terraform output cdn_backend_service` |
| `WIF_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/...` |
| `WIF_SERVICE_ACCOUNT` | `deploy-sa@PROJECT_ID.iam.gserviceaccount.com` |

### Provision Infrastructure

```bash
cd terraform/

# Initialise remote state
terraform init

# Plan
terraform plan -var="project_id=YOUR_PROJECT_ID"

# Apply
terraform apply -var="project_id=YOUR_PROJECT_ID"

# Note the output IP address
terraform output global_ip_address
```

### DNS Configuration (Cloudflare)

1. Add an **A record** pointing `bms` → `<global_ip_address>` output above.
2. Set proxy status to **Orange Cloud (proxied)**.
3. SSL/TLS mode: **Full (Strict)**.

> **TLS cert window:** Google-managed certificates provision asynchronously (5–15 minutes). Cloudflare 526 errors during this window are expected. Do not switch Cloudflare to Full (Strict) until the GCP certificate status is `ACTIVE`.

### Deploy

Push to `main` → GitHub Actions `deploy.yml` runs automatically:

1. `npm ci && npm run typecheck && npm run lint && npm run build`
2. `gsutil rsync` hashed assets → immutable cache headers
3. `gsutil rsync` HTML/root → no-cache headers
4. Cloud CDN cache invalidation (`/*`)

---

## Containerised Deployment (GKE / Docker)

```bash
# Build
docker build -t bms-website:latest .

# Run locally
docker run -p 8080:8080 bms-website:latest

# Health check
curl http://localhost:8080/health
# → {"status":"ok","service":"bms-website"}
```

The Dockerfile enforces:
- Two-stage build (Node 22 → nginx 1.27 alpine)
- Non-root user (`bmsuser:bmsgroup`, UID 1001)
- Hardened nginx config with CSP, HSTS, X-Frame-Options: DENY
- Health endpoint at `/health`

---

## Security Headers

Enforced by `nginx.conf`:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self' https://api.bms.bnlvconsulting.com` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `Home` | Landing page — hero, capabilities, platform grid, CTA |
| `/platforms` | `Platforms` | Full platform catalogue with category filter |
| `/platforms/:platformId` | `PlatformDetail` | Individual platform deep-dive |
| `/about` | `About` | Engineering philosophy, BNLV Group overview |
| `/security` | `Security` | Six-layer security architecture + compliance matrix |
| `/contact` | `Contact` | Enterprise inquiry form |
| `*` | `NotFound` | 404 fallback |

### Platform IDs (`:platformId`)

`jinto` · `limsy` · `nidhivan` · `kundali-pro` · `blueprint` · `project-perl` · `vihang` · `astrology-academy`

---

## Build Artefacts

| File | Gzip Size | Cache |
|---|---|---|
| `dist/index.html` | 0.65 kB | no-cache |
| `dist/assets/index-*.css` | 7.11 kB | immutable, 1 year |
| `dist/assets/icons-*.js` | 2.99 kB | immutable, 1 year |
| `dist/assets/vendor-*.js` | 17.32 kB | immutable, 1 year |
| `dist/assets/index-*.js` | 72.83 kB | immutable, 1 year |

**Total JS gzip: ~93.14 kB** — within the 200 kB CI budget enforced by `ci.yml`.

---

## Environment Variables

This project requires no runtime environment variables for the frontend. All platform data is static (see `src/data/`). API endpoints consumed by the contact form or future integrations are configured in `src/` source and proxied via `https://api.bms.bnlvconsulting.com`.

---

## Contact & Escalation

Enterprise inquiries: `contact@bnlvconsulting.com`  
HR / recruitment: `hr@bnlvconsulting.com`
