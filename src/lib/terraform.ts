// ── Infrastructure-as-Code output ──────────────────────────────────
// The studio emits Terraform for every provisioned environment so the
// full lifecycle (create / scale / destroy) is automated and reviewable.

export function generateTerraform(opts: {
  tenantSlug: string;
  projectName: string;
  envName: string;
  region: string;
  tier: string;
}): string {
  const app = `${opts.tenantSlug}-${opts.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${opts.envName}`;
  const size =
    opts.tier === "dedicated" ? "large" : opts.tier === "performance" ? "medium" : "small";
  const replicas = opts.envName === "production" ? 3 : 1;

  return `terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "studio-tfstate-${opts.tenantSlug}"
    key    = "${app}/terraform.tfstate"
    region = "${opts.region}"
  }
}

provider "aws" {
  region = "${opts.region}"
  default_tags {
    tags = {
      Tenant      = "${opts.tenantSlug}"
      Project     = "${opts.projectName}"
      Environment = "${opts.envName}"
      ManagedBy   = "saas-studio"
    }
  }
}

module "network" {
  source              = "studio-modules/vpc"
  name                = "${app}-vpc"
  cidr_block          = "10.0.0.0/16"
  enable_flow_logs    = true            # zero-trust: full egress audit
  private_subnets_only = ${opts.envName === "production"}
}

module "app_service" {
  source        = "studio-modules/ecs-service"
  name          = "${app}"
  image         = "registry.studio.dev/${opts.tenantSlug}/${opts.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}:latest"
  instance_size = "${size}"
  replicas      = ${replicas}
  vpc_id        = module.network.vpc_id
  https_only    = true
  waf_enabled   = ${opts.envName === "production"}
}

module "database" {
  source                  = "studio-modules/rds-postgres"
  identifier              = "${app}-db"
  engine_version          = "16.4"
  instance_class          = "db.t4g.${size === "large" ? "xlarge" : size}"
  multi_az                = ${opts.envName === "production"}
  storage_encrypted       = true
  iam_authentication      = true       # no static DB passwords
  deletion_protection     = ${opts.envName === "production"}
  backup_retention_period = ${opts.envName === "production" ? 30 : 7}
}

module "secrets" {
  source   = "studio-modules/vault"
  app_name = "${app}"
  rotation_days = 30
}

output "app_url" {
  value = module.app_service.url
}
`;
}
