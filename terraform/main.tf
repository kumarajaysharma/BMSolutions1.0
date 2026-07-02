# ─────────────────────────────────────────────────────────────────
# BMSolutions — Website Hosting Infrastructure
# Terraform v1.9+ · GCP Provider v6+
#
# Resources provisioned:
#   - GCS bucket (website backend, versioning enabled)
#   - Cloud CDN backend bucket
#   - URL map with HTTPS redirect
#   - Managed SSL certificate (Google-managed)
#   - Global forwarding rules (HTTPS + HTTP→HTTPS redirect)
#   - Cloud Armor security policy (OWASP CRS)
# ─────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Remote state — update bucket and prefix for your environment
  backend "gcs" {
    bucket = "bnlv-terraform-state"
    prefix = "bms-website"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Variables ──────────────────────────────────────────────────
variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  default     = "asia-south1"
  description = "Primary GCP region"
}

variable "domain" {
  type        = string
  default     = "bms.bnlvconsulting.com"
  description = "Primary domain for the website"
}

variable "bucket_location" {
  type        = string
  default     = "ASIA"
  description = "GCS bucket multi-region location"
}

# ─── GCS Website Bucket ─────────────────────────────────────────
resource "google_storage_bucket" "website" {
  name                        = "${var.project_id}-bms-website"
  location                    = var.bucket_location
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"   # SPA fallback
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 5
      with_state         = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    environment = "production"
    managed_by  = "terraform"
    team        = "bms-platform"
  }
}

# Public read for CDN access
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ─── Cloud Armor Security Policy ────────────────────────────────
resource "google_compute_security_policy" "bms_waf" {
  name        = "bms-website-waf"
  description = "Cloud Armor WAF — OWASP CRS for BMSolutions website"

  # OWASP CRS — SQL injection
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQLi attacks"
  }

  # OWASP CRS — XSS
  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  # OWASP CRS — Remote file inclusion
  rule {
    action   = "deny(403)"
    priority = 1002
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rfi-v33-stable')"
      }
    }
    description = "Block RFI attacks"
  }

  # Default allow
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow"
  }

  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable = true
    }
  }
}

# ─── Cloud CDN Backend Bucket ────────────────────────────────────
resource "google_compute_backend_bucket" "website" {
  name        = "bms-website-backend"
  description = "BMSolutions website — GCS backend with CDN"
  bucket_name = google_storage_bucket.website.name
  enable_cdn  = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    max_ttl                      = 86400
    client_ttl                   = 3600
    serve_while_stale            = 86400
    negative_caching             = true
    compress_text_responses      = true

    negative_caching_policy {
      code = 404
      ttl  = 60
    }
    negative_caching_policy {
      code = 410
      ttl  = 60
    }
  }
}

# ─── Managed SSL Certificate ────────────────────────────────────
resource "google_compute_managed_ssl_certificate" "bms" {
  name = "bms-website-cert"

  managed {
    domains = [var.domain]
  }
}

# ─── URL Map ────────────────────────────────────────────────────
resource "google_compute_url_map" "bms_https" {
  name            = "bms-website-https"
  default_service = google_compute_backend_bucket.website.id
}

# HTTP → HTTPS redirect URL map
resource "google_compute_url_map" "bms_http_redirect" {
  name = "bms-website-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

# ─── HTTPS Proxy ────────────────────────────────────────────────
resource "google_compute_target_https_proxy" "bms" {
  name             = "bms-website-https-proxy"
  url_map          = google_compute_url_map.bms_https.id
  ssl_certificates = [google_compute_managed_ssl_certificate.bms.id]
}

# ─── HTTP Proxy (redirect only) ─────────────────────────────────
resource "google_compute_target_http_proxy" "bms_redirect" {
  name    = "bms-website-http-proxy"
  url_map = google_compute_url_map.bms_http_redirect.id
}

# ─── Global IP ──────────────────────────────────────────────────
resource "google_compute_global_address" "bms" {
  name         = "bms-website-ip"
  address_type = "EXTERNAL"
  ip_version   = "IPV4"
}

# ─── Forwarding Rules ───────────────────────────────────────────
resource "google_compute_global_forwarding_rule" "bms_https" {
  name                  = "bms-website-https"
  ip_address            = google_compute_global_address.bms.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.bms.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_global_forwarding_rule" "bms_http" {
  name                  = "bms-website-http-redirect"
  ip_address            = google_compute_global_address.bms.address
  port_range            = "80"
  target                = google_compute_target_http_proxy.bms_redirect.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# ─── Outputs ────────────────────────────────────────────────────
output "global_ip_address" {
  value       = google_compute_global_address.bms.address
  description = "Point your DNS A record to this IP. Cloudflare: orange-cloud (proxied)."
}

output "gcs_bucket_name" {
  value       = google_storage_bucket.website.name
  description = "GCS bucket for gsutil rsync in the deploy workflow."
}

output "cdn_backend_service" {
  value       = google_compute_backend_bucket.website.name
  description = "Set GH secret CDN_BACKEND_SERVICE to this value."
}
