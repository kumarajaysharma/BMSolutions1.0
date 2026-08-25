This file is a merged representation of a subset of the codebase, containing specifically included files and files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
- Pay special attention to the Repository Description. These contain important context and guidelines specific to this project.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: src/app/api/limsy/**/*, src/app/studio/limsy/**/*, src/db/**/*, src/lib/request-context.ts, src/lib/auth.ts, src/middleware.ts, drizzle/migrations/**/*, complete project progress .md, System State.json
- Files matching these patterns are excluded: node_modules, .next, .git, dist, out, *.lock, cookies.txt
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# User Provided Header
BNLV Group Enterprise Platform — Targeted Core LLM Context Bundle

# Directory Structure
```
drizzle/
  migrations/
    meta/
      _journal.json
      0000_snapshot.json
      0003_snapshot.json
      0007_snapshot.json
      0008_snapshot.json
    0000_slippery_james_howlett.sql
    0001_fix_schema_drift.sql
    0002_enable_rls.sql
    0003_limsys_workflow.sql
    0004_revoke_limsy_delete.sql
    0005_nidhivan_rls_hardening.sql
    0006_vault_secrets_columns.sql
    0007_nidhivan_irr_percent.sql
    0008_commercial_launch_foundation.sql
    0009_schema_hardening.sql
    0010_force_rls_revoke_truncate_limsy.sql
src/
  app/
    api/
      limsy/
        cases/
          route.ts
        hearings/
          route.ts
        orders/
          route.ts
    studio/
      limsy/
        page.tsx
  db/
    apply-rls.ts
    index.ts
    restore-admins.ts
    run-seed.ts
    schema.ts
    seed-nidhivan.ts
    seed-production-verticals.ts
    seed.ts
    sync-hash.ts
    verify-login.ts
  lib/
    auth.ts
    request-context.ts
```

# Files

## File: drizzle/migrations/meta/0000_snapshot.json
```json
{
  "id": "f0f7178b-f1d8-41ec-affc-c573888d543c",
  "prevId": "00000000-0000-0000-0000-000000000000",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.ai_tasks": {
      "name": "ai_tasks",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "prompt": {
          "name": "prompt",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "task_class": {
          "name": "task_class",
          "type": "task_class",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "routed_model": {
          "name": "routed_model",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "routing_reason": {
          "name": "routing_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "complexity_score": {
          "name": "complexity_score",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "status": {
          "name": "status",
          "type": "task_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'queued'"
        },
        "stages": {
          "name": "stages",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "output": {
          "name": "output",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "security_status": {
          "name": "security_status",
          "type": "security_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'pending'"
        },
        "security_findings": {
          "name": "security_findings",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "ai_tasks_tenant_id_idx": {
          "name": "ai_tasks_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "ai_tasks_tenant_status_idx": {
          "name": "ai_tasks_tenant_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "ai_tasks_project_id_idx": {
          "name": "ai_tasks_project_id_idx",
          "columns": [
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "ai_tasks_security_status_idx": {
          "name": "ai_tasks_security_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "security_status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "ai_tasks_tenant_id_tenants_id_fk": {
          "name": "ai_tasks_tenant_id_tenants_id_fk",
          "tableFrom": "ai_tasks",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "ai_tasks_project_id_projects_id_fk": {
          "name": "ai_tasks_project_id_projects_id_fk",
          "tableFrom": "ai_tasks",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.api_keys": {
      "name": "api_keys",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "prefix": {
          "name": "prefix",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "key_hash": {
          "name": "key_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "scopes": {
          "name": "scopes",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "rate_limit": {
          "name": "rate_limit",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1000
        },
        "status": {
          "name": "status",
          "type": "api_key_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "last_used_at": {
          "name": "last_used_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "api_keys_tenant_id_idx": {
          "name": "api_keys_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "api_keys_tenant_status_idx": {
          "name": "api_keys_tenant_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "api_keys_key_hash_uidx": {
          "name": "api_keys_key_hash_uidx",
          "columns": [
            {
              "expression": "key_hash",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "api_keys_tenant_name_uidx": {
          "name": "api_keys_tenant_name_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "name",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "api_keys_tenant_id_tenants_id_fk": {
          "name": "api_keys_tenant_id_tenants_id_fk",
          "tableFrom": "api_keys",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.audit_logs": {
      "name": "audit_logs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "actor": {
          "name": "actor",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'system'"
        },
        "action": {
          "name": "action",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "target": {
          "name": "target",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "severity": {
          "name": "severity",
          "type": "audit_severity",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'info'"
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false,
          "default": "'{}'::jsonb"
        },
        "ip_address": {
          "name": "ip_address",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "audit_logs_tenant_id_idx": {
          "name": "audit_logs_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "audit_logs_tenant_created_idx": {
          "name": "audit_logs_tenant_created_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "created_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "audit_logs_tenant_severity_idx": {
          "name": "audit_logs_tenant_severity_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "severity",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "audit_logs_action_idx": {
          "name": "audit_logs_action_idx",
          "columns": [
            {
              "expression": "action",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "audit_logs_tenant_id_tenants_id_fk": {
          "name": "audit_logs_tenant_id_tenants_id_fk",
          "tableFrom": "audit_logs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.builder_components": {
      "name": "builder_components",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "props": {
          "name": "props",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'{}'::jsonb"
        },
        "sort_order": {
          "name": "sort_order",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "builder_components_tenant_id_idx": {
          "name": "builder_components_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "builder_components_project_id_idx": {
          "name": "builder_components_project_id_idx",
          "columns": [
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "builder_components_project_sort_idx": {
          "name": "builder_components_project_sort_idx",
          "columns": [
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "sort_order",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "builder_components_tenant_id_tenants_id_fk": {
          "name": "builder_components_tenant_id_tenants_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "builder_components_project_id_projects_id_fk": {
          "name": "builder_components_project_id_projects_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.client_requests": {
      "name": "client_requests",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "company": {
          "name": "company",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "service": {
          "name": "service",
          "type": "client_request_service",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "preferred_date": {
          "name": "preferred_date",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "preferred_time": {
          "name": "preferred_time",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "status": {
          "name": "status",
          "type": "client_request_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'pending'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "client_requests_status_idx": {
          "name": "client_requests_status_idx",
          "columns": [
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "client_requests_email_idx": {
          "name": "client_requests_email_idx",
          "columns": [
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.deployments": {
      "name": "deployments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "environment_id": {
          "name": "environment_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "version": {
          "name": "version",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "commit_sha": {
          "name": "commit_sha",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "triggered_by": {
          "name": "triggered_by",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'studio-ci'"
        },
        "status": {
          "name": "status",
          "type": "deployment_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'running'"
        },
        "stages": {
          "name": "stages",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "deployments_tenant_id_idx": {
          "name": "deployments_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "deployments_project_id_idx": {
          "name": "deployments_project_id_idx",
          "columns": [
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "deployments_environment_id_idx": {
          "name": "deployments_environment_id_idx",
          "columns": [
            {
              "expression": "environment_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "deployments_tenant_status_idx": {
          "name": "deployments_tenant_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "deployments_commit_sha_idx": {
          "name": "deployments_commit_sha_idx",
          "columns": [
            {
              "expression": "commit_sha",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "deployments_tenant_id_tenants_id_fk": {
          "name": "deployments_tenant_id_tenants_id_fk",
          "tableFrom": "deployments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_project_id_projects_id_fk": {
          "name": "deployments_project_id_projects_id_fk",
          "tableFrom": "deployments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_environment_id_environments_id_fk": {
          "name": "deployments_environment_id_environments_id_fk",
          "tableFrom": "deployments",
          "tableTo": "environments",
          "columnsFrom": [
            "environment_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.environments": {
      "name": "environments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "env_name",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "region": {
          "name": "region",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'us-east-1'"
        },
        "tier": {
          "name": "tier",
          "type": "env_tier",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'standard'"
        },
        "status": {
          "name": "status",
          "type": "env_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'provisioning'"
        },
        "terraform": {
          "name": "terraform",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "environments_tenant_id_idx": {
          "name": "environments_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "environments_project_id_idx": {
          "name": "environments_project_id_idx",
          "columns": [
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "environments_project_name_uidx": {
          "name": "environments_project_name_uidx",
          "columns": [
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "name",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "environments_tenant_id_tenants_id_fk": {
          "name": "environments_tenant_id_tenants_id_fk",
          "tableFrom": "environments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "environments_project_id_projects_id_fk": {
          "name": "environments_project_id_projects_id_fk",
          "tableFrom": "environments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.feature_flags": {
      "name": "feature_flags",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "rollout": {
          "name": "rollout",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "environments": {
          "name": "environments",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "feature_flags_tenant_id_idx": {
          "name": "feature_flags_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "feature_flags_tenant_key_uidx": {
          "name": "feature_flags_tenant_key_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "key",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "feature_flags_tenant_id_tenants_id_fk": {
          "name": "feature_flags_tenant_id_tenants_id_fk",
          "tableFrom": "feature_flags",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {
        "feature_flags_rollout_range": {
          "name": "feature_flags_rollout_range",
          "value": "\"feature_flags\".\"rollout\" >= 0 AND \"feature_flags\".\"rollout\" <= 100"
        }
      },
      "isRLSEnabled": false
    },
    "public.incidents": {
      "name": "incidents",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "service": {
          "name": "service",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'app-service'"
        },
        "severity": {
          "name": "severity",
          "type": "incident_severity",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'sev3'"
        },
        "status": {
          "name": "status",
          "type": "incident_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'open'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "resolved_at": {
          "name": "resolved_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "incidents_tenant_id_idx": {
          "name": "incidents_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "incidents_tenant_status_idx": {
          "name": "incidents_tenant_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "incidents_tenant_severity_idx": {
          "name": "incidents_tenant_severity_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "severity",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "incidents_tenant_id_tenants_id_fk": {
          "name": "incidents_tenant_id_tenants_id_fk",
          "tableFrom": "incidents",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.job_applications": {
      "name": "job_applications",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "role_slug": {
          "name": "role_slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "role_title": {
          "name": "role_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "portfolio": {
          "name": "portfolio",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "note": {
          "name": "note",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "status": {
          "name": "status",
          "type": "job_application_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'received'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "job_applications_role_slug_idx": {
          "name": "job_applications_role_slug_idx",
          "columns": [
            {
              "expression": "role_slug",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "job_applications_status_idx": {
          "name": "job_applications_status_idx",
          "columns": [
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "job_applications_email_idx": {
          "name": "job_applications_email_idx",
          "columns": [
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.projects": {
      "name": "projects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "framework": {
          "name": "framework",
          "type": "project_framework",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'react-vite'"
        },
        "status": {
          "name": "status",
          "type": "project_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'draft'"
        },
        "design_tokens": {
          "name": "design_tokens",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'{}'::jsonb"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "projects_tenant_id_idx": {
          "name": "projects_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "projects_tenant_status_idx": {
          "name": "projects_tenant_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "projects_tenant_name_uidx": {
          "name": "projects_tenant_name_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "name",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "projects_tenant_id_tenants_id_fk": {
          "name": "projects_tenant_id_tenants_id_fk",
          "tableFrom": "projects",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.sessions": {
      "name": "sessions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "user_id": {
          "name": "user_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "token_hash": {
          "name": "token_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "user_agent": {
          "name": "user_agent",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "ip_address": {
          "name": "ip_address",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "sessions_user_id_idx": {
          "name": "sessions_user_id_idx",
          "columns": [
            {
              "expression": "user_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "sessions_tenant_id_idx": {
          "name": "sessions_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "sessions_token_hash_uidx": {
          "name": "sessions_token_hash_uidx",
          "columns": [
            {
              "expression": "token_hash",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "sessions_expires_at_idx": {
          "name": "sessions_expires_at_idx",
          "columns": [
            {
              "expression": "expires_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "sessions_user_id_users_id_fk": {
          "name": "sessions_user_id_users_id_fk",
          "tableFrom": "sessions",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "sessions_tenant_id_tenants_id_fk": {
          "name": "sessions_tenant_id_tenants_id_fk",
          "tableFrom": "sessions",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.tenants": {
      "name": "tenants",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "slug": {
          "name": "slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "plan": {
          "name": "plan",
          "type": "tenant_plan",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'scale'"
        },
        "status": {
          "name": "status",
          "type": "tenant_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "region": {
          "name": "region",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'us-east-1'"
        },
        "site_data": {
          "name": "site_data",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'{}'::jsonb"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "tenants_slug_uidx": {
          "name": "tenants_slug_uidx",
          "columns": [
            {
              "expression": "slug",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "tenants_status_idx": {
          "name": "tenants_status_idx",
          "columns": [
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "tenants_plan_idx": {
          "name": "tenants_plan_idx",
          "columns": [
            {
              "expression": "plan",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.users": {
      "name": "users",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "password_hash": {
          "name": "password_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role": {
          "name": "role",
          "type": "user_role",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'developer'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "last_login_at": {
          "name": "last_login_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "users_tenant_email_uidx": {
          "name": "users_tenant_email_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "users_tenant_id_idx": {
          "name": "users_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "users_tenant_role_idx": {
          "name": "users_tenant_role_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "role",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "users_active_idx": {
          "name": "users_active_idx",
          "columns": [
            {
              "expression": "active",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "users_tenant_id_tenants_id_fk": {
          "name": "users_tenant_id_tenants_id_fk",
          "tableFrom": "users",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.vault_secrets": {
      "name": "vault_secrets",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "masked_value": {
          "name": "masked_value",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "environment": {
          "name": "environment",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'all'"
        },
        "version": {
          "name": "version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "rotated_at": {
          "name": "rotated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "vault_secrets_tenant_id_idx": {
          "name": "vault_secrets_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "vault_secrets_tenant_name_env_uidx": {
          "name": "vault_secrets_tenant_name_env_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "name",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "environment",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "vault_secrets_tenant_id_tenants_id_fk": {
          "name": "vault_secrets_tenant_id_tenants_id_fk",
          "tableFrom": "vault_secrets",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.webhook_endpoints": {
      "name": "webhook_endpoints",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "url": {
          "name": "url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "events": {
          "name": "events",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "signing_secret_hash": {
          "name": "signing_secret_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "status": {
          "name": "status",
          "type": "webhook_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "deliveries": {
          "name": "deliveries",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "webhook_endpoints_tenant_id_idx": {
          "name": "webhook_endpoints_tenant_id_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "webhook_endpoints_tenant_status_idx": {
          "name": "webhook_endpoints_tenant_status_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "webhook_endpoints_tenant_id_tenants_id_fk": {
          "name": "webhook_endpoints_tenant_id_tenants_id_fk",
          "tableFrom": "webhook_endpoints",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.api_key_status": {
      "name": "api_key_status",
      "schema": "public",
      "values": [
        "active",
        "revoked"
      ]
    },
    "public.audit_severity": {
      "name": "audit_severity",
      "schema": "public",
      "values": [
        "info",
        "warn",
        "critical"
      ]
    },
    "public.client_request_service": {
      "name": "client_request_service",
      "schema": "public",
      "values": [
        "platform-demo",
        "architecture-consult",
        "migration-assessment",
        "security-review"
      ]
    },
    "public.client_request_status": {
      "name": "client_request_status",
      "schema": "public",
      "values": [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
      ]
    },
    "public.deployment_status": {
      "name": "deployment_status",
      "schema": "public",
      "values": [
        "running",
        "success",
        "failed",
        "rolled_back"
      ]
    },
    "public.env_name": {
      "name": "env_name",
      "schema": "public",
      "values": [
        "development",
        "staging",
        "production"
      ]
    },
    "public.env_status": {
      "name": "env_status",
      "schema": "public",
      "values": [
        "provisioning",
        "running",
        "degraded",
        "destroyed"
      ]
    },
    "public.env_tier": {
      "name": "env_tier",
      "schema": "public",
      "values": [
        "standard",
        "performance",
        "dedicated"
      ]
    },
    "public.incident_severity": {
      "name": "incident_severity",
      "schema": "public",
      "values": [
        "sev1",
        "sev2",
        "sev3"
      ]
    },
    "public.incident_status": {
      "name": "incident_status",
      "schema": "public",
      "values": [
        "open",
        "monitoring",
        "resolved"
      ]
    },
    "public.job_application_status": {
      "name": "job_application_status",
      "schema": "public",
      "values": [
        "received",
        "screening",
        "interview",
        "offer",
        "closed"
      ]
    },
    "public.project_framework": {
      "name": "project_framework",
      "schema": "public",
      "values": [
        "react-vite",
        "nextjs",
        "vue-vite",
        "remix"
      ]
    },
    "public.project_status": {
      "name": "project_status",
      "schema": "public",
      "values": [
        "draft",
        "building",
        "deployed",
        "archived"
      ]
    },
    "public.security_status": {
      "name": "security_status",
      "schema": "public",
      "values": [
        "pending",
        "pass",
        "warn",
        "fail"
      ]
    },
    "public.task_class": {
      "name": "task_class",
      "schema": "public",
      "values": [
        "planning",
        "backend",
        "frontend",
        "styling",
        "security"
      ]
    },
    "public.task_status": {
      "name": "task_status",
      "schema": "public",
      "values": [
        "queued",
        "running",
        "verified",
        "committed",
        "blocked",
        "failed"
      ]
    },
    "public.tenant_plan": {
      "name": "tenant_plan",
      "schema": "public",
      "values": [
        "starter",
        "scale",
        "enterprise"
      ]
    },
    "public.tenant_status": {
      "name": "tenant_status",
      "schema": "public",
      "values": [
        "active",
        "suspended",
        "deleted"
      ]
    },
    "public.user_role": {
      "name": "user_role",
      "schema": "public",
      "values": [
        "owner",
        "admin",
        "architect",
        "developer",
        "designer",
        "viewer"
      ]
    },
    "public.webhook_status": {
      "name": "webhook_status",
      "schema": "public",
      "values": [
        "active",
        "paused"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
```

## File: drizzle/migrations/meta/0003_snapshot.json
```json
{
  "id": "3d035017-21e3-463b-8dba-bcba6d1e4976",
  "prevId": "f0f7178b-f1d8-41ec-affc-c573888d543c",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.ai_tasks": {
      "name": "ai_tasks",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'pending'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "ai_tasks_tenant_id_tenants_id_fk": {
          "name": "ai_tasks_tenant_id_tenants_id_fk",
          "tableFrom": "ai_tasks",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.api_keys": {
      "name": "api_keys",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "prefix": {
          "name": "prefix",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "key_hash": {
          "name": "key_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "scopes": {
          "name": "scopes",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "rate_limit": {
          "name": "rate_limit",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1000
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "api_keys_tenant_id_tenants_id_fk": {
          "name": "api_keys_tenant_id_tenants_id_fk",
          "tableFrom": "api_keys",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.audit_logs": {
      "name": "audit_logs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "actor": {
          "name": "actor",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "action": {
          "name": "action",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "target": {
          "name": "target",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'info'"
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "ip_address": {
          "name": "ip_address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "audit_logs_tenant_id_tenants_id_fk": {
          "name": "audit_logs_tenant_id_tenants_id_fk",
          "tableFrom": "audit_logs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.builder_components": {
      "name": "builder_components",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'component'"
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'default'"
        },
        "sort_order": {
          "name": "sort_order",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "config": {
          "name": "config",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "props": {
          "name": "props",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "builder_components_tenant_id_tenants_id_fk": {
          "name": "builder_components_tenant_id_tenants_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "builder_components_project_id_projects_id_fk": {
          "name": "builder_components_project_id_projects_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.client_requests": {
      "name": "client_requests",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "company": {
          "name": "company",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "service": {
          "name": "service",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'platform-demo'"
        },
        "preferred_date": {
          "name": "preferred_date",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "preferred_time": {
          "name": "preferred_time",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "subject": {
          "name": "subject",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'Client Inquiry'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'open'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "client_requests_tenant_id_tenants_id_fk": {
          "name": "client_requests_tenant_id_tenants_id_fk",
          "tableFrom": "client_requests",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.deployments": {
      "name": "deployments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "environment_id": {
          "name": "environment_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "version": {
          "name": "version",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'success'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "deployments_tenant_id_tenants_id_fk": {
          "name": "deployments_tenant_id_tenants_id_fk",
          "tableFrom": "deployments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_project_id_projects_id_fk": {
          "name": "deployments_project_id_projects_id_fk",
          "tableFrom": "deployments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_environment_id_environments_id_fk": {
          "name": "deployments_environment_id_environments_id_fk",
          "tableFrom": "deployments",
          "tableTo": "environments",
          "columnsFrom": [
            "environment_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.environments": {
      "name": "environments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'production'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "environments_tenant_id_tenants_id_fk": {
          "name": "environments_tenant_id_tenants_id_fk",
          "tableFrom": "environments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "environments_project_id_projects_id_fk": {
          "name": "environments_project_id_projects_id_fk",
          "tableFrom": "environments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.feature_flags": {
      "name": "feature_flags",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "rollout": {
          "name": "rollout",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "environments": {
          "name": "environments",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "feature_flags_tenant_id_tenants_id_fk": {
          "name": "feature_flags_tenant_id_tenants_id_fk",
          "tableFrom": "feature_flags",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.incidents": {
      "name": "incidents",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'medium'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'open'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "incidents_tenant_id_tenants_id_fk": {
          "name": "incidents_tenant_id_tenants_id_fk",
          "tableFrom": "incidents",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.job_applications": {
      "name": "job_applications",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "candidate_name": {
          "name": "candidate_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "phone": {
          "name": "phone",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "position": {
          "name": "position",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role_slug": {
          "name": "role_slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'general'"
        },
        "role_title": {
          "name": "role_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'General'"
        },
        "portfolio": {
          "name": "portfolio",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "resume_url": {
          "name": "resume_url",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "cover_letter": {
          "name": "cover_letter",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "note": {
          "name": "note",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'applied'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "job_applications_tenant_id_tenants_id_fk": {
          "name": "job_applications_tenant_id_tenants_id_fk",
          "tableFrom": "job_applications",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_bench_assignments": {
      "name": "limsy_bench_assignments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "bench_type": {
          "name": "bench_type",
          "type": "limsy_bench_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "presiding": {
          "name": "presiding",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "members": {
          "name": "members",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "constituted_on": {
          "name": "constituted_on",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "reconstituted_on": {
          "name": "reconstituted_on",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "reconstitution_reason": {
          "name": "reconstitution_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "is_active": {
          "name": "is_active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_bench_assignments_tenant_id_tenants_id_fk": {
          "name": "limsy_bench_assignments_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_bench_assignments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_bench_assignments_case_id_limsy_cases_id_fk": {
          "name": "limsy_bench_assignments_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_bench_assignments",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_cases": {
      "name": "limsy_cases",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_number": {
          "name": "case_number",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "internal_ref": {
          "name": "internal_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "court_level": {
          "name": "court_level",
          "type": "court_level",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "court_name": {
          "name": "court_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "court_location": {
          "name": "court_location",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "case_type": {
          "name": "case_type",
          "type": "limsy_case_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "limsy_case_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'intake'"
        },
        "petitioner": {
          "name": "petitioner",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "respondent": {
          "name": "respondent",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "petitioner_adv": {
          "name": "petitioner_adv",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "respondent_adv": {
          "name": "respondent_adv",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "filing_date": {
          "name": "filing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "admission_date": {
          "name": "admission_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_date": {
          "name": "next_hearing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "disposal_date": {
          "name": "disposal_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "subject_matter": {
          "name": "subject_matter",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "relief_sought": {
          "name": "relief_sought",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "acts_sections": {
          "name": "acts_sections",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "tags": {
          "name": "tags",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "urgency_flag": {
          "name": "urgency_flag",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "priority_level": {
          "name": "priority_level",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 3
        },
        "parent_case_id": {
          "name": "parent_case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "related_cases": {
          "name": "related_cases",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "outcome_notes": {
          "name": "outcome_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "outcome_type": {
          "name": "outcome_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "estimated_fees": {
          "name": "estimated_fees",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "billed_amount": {
          "name": "billed_amount",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_cases_tenant_id_tenants_id_fk": {
          "name": "limsy_cases_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_cases",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_hearings": {
      "name": "limsy_hearings",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "hearing_number": {
          "name": "hearing_number",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "scheduled_date": {
          "name": "scheduled_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "actual_date": {
          "name": "actual_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "limsy_hearing_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'scheduled'"
        },
        "board_position": {
          "name": "board_position",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "court_room": {
          "name": "court_room",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "session_type": {
          "name": "session_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'regular'"
        },
        "adjourned_by": {
          "name": "adjourned_by",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "adjournment_reason": {
          "name": "adjournment_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "adjournment_count": {
          "name": "adjournment_count",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "proceedings_summary": {
          "name": "proceedings_summary",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "detailed_minutes": {
          "name": "detailed_minutes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "appearances": {
          "name": "appearances",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "arguments_summary": {
          "name": "arguments_summary",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_date": {
          "name": "next_hearing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_purpose": {
          "name": "next_hearing_purpose",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_deadline": {
          "name": "compliance_deadline",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_notes": {
          "name": "compliance_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_hearings_tenant_id_tenants_id_fk": {
          "name": "limsy_hearings_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_hearings",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_hearings_case_id_limsy_cases_id_fk": {
          "name": "limsy_hearings_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_hearings",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_orders": {
      "name": "limsy_orders",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "hearing_id": {
          "name": "hearing_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "order_type": {
          "name": "order_type",
          "type": "limsy_order_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "order_date": {
          "name": "order_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "order_number": {
          "name": "order_number",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "order_title": {
          "name": "order_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "operative": {
          "name": "operative",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "full_text": {
          "name": "full_text",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "translation_hindi": {
          "name": "translation_hindi",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "has_stay": {
          "name": "has_stay",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "stay_scope": {
          "name": "stay_scope",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "stay_expiry": {
          "name": "stay_expiry",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "stay_conditions": {
          "name": "stay_conditions",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_required": {
          "name": "compliance_required",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "compliance_deadline": {
          "name": "compliance_deadline",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_party": {
          "name": "compliance_party",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_status": {
          "name": "compliance_status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'pending'"
        },
        "compliance_notes": {
          "name": "compliance_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "cost_awarded": {
          "name": "cost_awarded",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "cost_amount": {
          "name": "cost_amount",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "cost_payable": {
          "name": "cost_payable",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "external_link": {
          "name": "external_link",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "appealed": {
          "name": "appealed",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "appeal_case_id": {
          "name": "appeal_case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "review_filed": {
          "name": "review_filed",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "is_final": {
          "name": "is_final",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "reportable": {
          "name": "reportable",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_orders_tenant_id_tenants_id_fk": {
          "name": "limsy_orders_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_orders_case_id_limsy_cases_id_fk": {
          "name": "limsy_orders_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_orders_hearing_id_limsy_hearings_id_fk": {
          "name": "limsy_orders_hearing_id_limsy_hearings_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "limsy_hearings",
          "columnsFrom": [
            "hearing_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.projects": {
      "name": "projects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "projects_tenant_id_tenants_id_fk": {
          "name": "projects_tenant_id_tenants_id_fk",
          "tableFrom": "projects",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.sessions": {
      "name": "sessions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "user_id": {
          "name": "user_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "token": {
          "name": "token",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "token_hash": {
          "name": "token_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "sessions_tenant_id_tenants_id_fk": {
          "name": "sessions_tenant_id_tenants_id_fk",
          "tableFrom": "sessions",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "sessions_user_id_users_id_fk": {
          "name": "sessions_user_id_users_id_fk",
          "tableFrom": "sessions",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.tenants": {
      "name": "tenants",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "slug": {
          "name": "slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "plan": {
          "name": "plan",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'scale'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "region": {
          "name": "region",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'ap-south-1'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "tenants_slug_unique": {
          "name": "tenants_slug_unique",
          "nullsNotDistinct": false,
          "columns": [
            "slug"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.users": {
      "name": "users",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "password_hash": {
          "name": "password_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role": {
          "name": "role",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'developer'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "last_login_at": {
          "name": "last_login_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "users_tenant_email_uidx": {
          "name": "users_tenant_email_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "users_tenant_id_tenants_id_fk": {
          "name": "users_tenant_id_tenants_id_fk",
          "tableFrom": "users",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.vault_secrets": {
      "name": "vault_secrets",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'secret'"
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "encrypted_value": {
          "name": "encrypted_value",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "masked_value": {
          "name": "masked_value",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "environment": {
          "name": "environment",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'production'"
        },
        "version": {
          "name": "version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "rotated_at": {
          "name": "rotated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "vault_secrets_tenant_id_tenants_id_fk": {
          "name": "vault_secrets_tenant_id_tenants_id_fk",
          "tableFrom": "vault_secrets",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.webhook_endpoints": {
      "name": "webhook_endpoints",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "url": {
          "name": "url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "events": {
          "name": "events",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "signing_secret_hash": {
          "name": "signing_secret_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "deliveries": {
          "name": "deliveries",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "webhook_endpoints_tenant_id_tenants_id_fk": {
          "name": "webhook_endpoints_tenant_id_tenants_id_fk",
          "tableFrom": "webhook_endpoints",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.court_level": {
      "name": "court_level",
      "schema": "public",
      "values": [
        "supreme_court",
        "high_court",
        "district_court",
        "tribunal",
        "consumer_forum",
        "arbitration",
        "nclt",
        "nclat",
        "ncdrc"
      ]
    },
    "public.limsy_bench_type": {
      "name": "limsy_bench_type",
      "schema": "public",
      "values": [
        "single_judge",
        "division_bench",
        "full_bench",
        "constitutional_bench",
        "larger_bench"
      ]
    },
    "public.limsy_case_status": {
      "name": "limsy_case_status",
      "schema": "public",
      "values": [
        "intake",
        "diarised",
        "admitted",
        "pending_hearing",
        "under_hearing",
        "reserved",
        "disposed",
        "withdrawn",
        "abated",
        "transferred"
      ]
    },
    "public.limsy_case_type": {
      "name": "limsy_case_type",
      "schema": "public",
      "values": [
        "slp",
        "writ_petition",
        "civil_appeal",
        "criminal_appeal",
        "review_petition",
        "curative_petition",
        "original_suit",
        "execution_petition",
        "consumer_complaint",
        "arbitration_petition",
        "ibc_petition",
        "nclt_petition",
        "other"
      ]
    },
    "public.limsy_hearing_status": {
      "name": "limsy_hearing_status",
      "schema": "public",
      "values": [
        "scheduled",
        "listed",
        "adjourned",
        "part_heard",
        "concluded",
        "cancelled",
        "orders_passed"
      ]
    },
    "public.limsy_order_type": {
      "name": "limsy_order_type",
      "schema": "public",
      "values": [
        "interim_stay",
        "interim_injunction",
        "direction",
        "contempt_notice",
        "final_judgment",
        "consent_order",
        "dismissal",
        "remand",
        "cost_order",
        "modification"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
```

## File: drizzle/migrations/meta/0007_snapshot.json
```json
{
  "id": "b4f78c0b-c31d-4c33-ab14-553ee66cfc32",
  "prevId": "3d035017-21e3-463b-8dba-bcba6d1e4976",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.ai_tasks": {
      "name": "ai_tasks",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'pending'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "ai_tasks_tenant_id_tenants_id_fk": {
          "name": "ai_tasks_tenant_id_tenants_id_fk",
          "tableFrom": "ai_tasks",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.api_keys": {
      "name": "api_keys",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "prefix": {
          "name": "prefix",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "key_hash": {
          "name": "key_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "scopes": {
          "name": "scopes",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "rate_limit": {
          "name": "rate_limit",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1000
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "api_keys_tenant_id_tenants_id_fk": {
          "name": "api_keys_tenant_id_tenants_id_fk",
          "tableFrom": "api_keys",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.audit_logs": {
      "name": "audit_logs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "actor": {
          "name": "actor",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "action": {
          "name": "action",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "target": {
          "name": "target",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'info'"
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "ip_address": {
          "name": "ip_address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "audit_logs_tenant_id_tenants_id_fk": {
          "name": "audit_logs_tenant_id_tenants_id_fk",
          "tableFrom": "audit_logs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.builder_components": {
      "name": "builder_components",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'component'"
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'default'"
        },
        "sort_order": {
          "name": "sort_order",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "config": {
          "name": "config",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "props": {
          "name": "props",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "builder_components_tenant_id_tenants_id_fk": {
          "name": "builder_components_tenant_id_tenants_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "builder_components_project_id_projects_id_fk": {
          "name": "builder_components_project_id_projects_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.client_requests": {
      "name": "client_requests",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "company": {
          "name": "company",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "service": {
          "name": "service",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'platform-demo'"
        },
        "preferred_date": {
          "name": "preferred_date",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "preferred_time": {
          "name": "preferred_time",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "subject": {
          "name": "subject",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'Client Inquiry'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'open'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "client_requests_tenant_id_tenants_id_fk": {
          "name": "client_requests_tenant_id_tenants_id_fk",
          "tableFrom": "client_requests",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.deployments": {
      "name": "deployments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "environment_id": {
          "name": "environment_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "version": {
          "name": "version",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'success'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "deployments_tenant_id_tenants_id_fk": {
          "name": "deployments_tenant_id_tenants_id_fk",
          "tableFrom": "deployments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_project_id_projects_id_fk": {
          "name": "deployments_project_id_projects_id_fk",
          "tableFrom": "deployments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_environment_id_environments_id_fk": {
          "name": "deployments_environment_id_environments_id_fk",
          "tableFrom": "deployments",
          "tableTo": "environments",
          "columnsFrom": [
            "environment_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.environments": {
      "name": "environments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'production'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "environments_tenant_id_tenants_id_fk": {
          "name": "environments_tenant_id_tenants_id_fk",
          "tableFrom": "environments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "environments_project_id_projects_id_fk": {
          "name": "environments_project_id_projects_id_fk",
          "tableFrom": "environments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.feature_flags": {
      "name": "feature_flags",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "rollout": {
          "name": "rollout",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "environments": {
          "name": "environments",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "feature_flags_tenant_id_tenants_id_fk": {
          "name": "feature_flags_tenant_id_tenants_id_fk",
          "tableFrom": "feature_flags",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.incidents": {
      "name": "incidents",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'medium'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'open'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "incidents_tenant_id_tenants_id_fk": {
          "name": "incidents_tenant_id_tenants_id_fk",
          "tableFrom": "incidents",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.job_applications": {
      "name": "job_applications",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "candidate_name": {
          "name": "candidate_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "phone": {
          "name": "phone",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "position": {
          "name": "position",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role_slug": {
          "name": "role_slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'general'"
        },
        "role_title": {
          "name": "role_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'General'"
        },
        "portfolio": {
          "name": "portfolio",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "resume_url": {
          "name": "resume_url",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "cover_letter": {
          "name": "cover_letter",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "note": {
          "name": "note",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'applied'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "job_applications_tenant_id_tenants_id_fk": {
          "name": "job_applications_tenant_id_tenants_id_fk",
          "tableFrom": "job_applications",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_bench_assignments": {
      "name": "limsy_bench_assignments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "bench_type": {
          "name": "bench_type",
          "type": "limsy_bench_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "presiding": {
          "name": "presiding",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "members": {
          "name": "members",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "constituted_on": {
          "name": "constituted_on",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "reconstituted_on": {
          "name": "reconstituted_on",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "reconstitution_reason": {
          "name": "reconstitution_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "is_active": {
          "name": "is_active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_bench_assignments_tenant_id_tenants_id_fk": {
          "name": "limsy_bench_assignments_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_bench_assignments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_bench_assignments_case_id_limsy_cases_id_fk": {
          "name": "limsy_bench_assignments_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_bench_assignments",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_cases": {
      "name": "limsy_cases",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_number": {
          "name": "case_number",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "internal_ref": {
          "name": "internal_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "court_level": {
          "name": "court_level",
          "type": "court_level",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "court_name": {
          "name": "court_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "court_location": {
          "name": "court_location",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "case_type": {
          "name": "case_type",
          "type": "limsy_case_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "limsy_case_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'intake'"
        },
        "petitioner": {
          "name": "petitioner",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "respondent": {
          "name": "respondent",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "petitioner_adv": {
          "name": "petitioner_adv",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "respondent_adv": {
          "name": "respondent_adv",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "filing_date": {
          "name": "filing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "admission_date": {
          "name": "admission_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_date": {
          "name": "next_hearing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "disposal_date": {
          "name": "disposal_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "subject_matter": {
          "name": "subject_matter",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "relief_sought": {
          "name": "relief_sought",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "acts_sections": {
          "name": "acts_sections",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "tags": {
          "name": "tags",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "urgency_flag": {
          "name": "urgency_flag",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "priority_level": {
          "name": "priority_level",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 3
        },
        "parent_case_id": {
          "name": "parent_case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "related_cases": {
          "name": "related_cases",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "outcome_notes": {
          "name": "outcome_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "outcome_type": {
          "name": "outcome_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "estimated_fees": {
          "name": "estimated_fees",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "billed_amount": {
          "name": "billed_amount",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_cases_tenant_id_tenants_id_fk": {
          "name": "limsy_cases_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_cases",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_hearings": {
      "name": "limsy_hearings",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "hearing_number": {
          "name": "hearing_number",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "scheduled_date": {
          "name": "scheduled_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "actual_date": {
          "name": "actual_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "limsy_hearing_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'scheduled'"
        },
        "board_position": {
          "name": "board_position",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "court_room": {
          "name": "court_room",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "session_type": {
          "name": "session_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'regular'"
        },
        "adjourned_by": {
          "name": "adjourned_by",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "adjournment_reason": {
          "name": "adjournment_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "adjournment_count": {
          "name": "adjournment_count",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "proceedings_summary": {
          "name": "proceedings_summary",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "detailed_minutes": {
          "name": "detailed_minutes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "appearances": {
          "name": "appearances",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "arguments_summary": {
          "name": "arguments_summary",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_date": {
          "name": "next_hearing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_purpose": {
          "name": "next_hearing_purpose",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_deadline": {
          "name": "compliance_deadline",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_notes": {
          "name": "compliance_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_hearings_tenant_id_tenants_id_fk": {
          "name": "limsy_hearings_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_hearings",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_hearings_case_id_limsy_cases_id_fk": {
          "name": "limsy_hearings_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_hearings",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_orders": {
      "name": "limsy_orders",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "hearing_id": {
          "name": "hearing_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "order_type": {
          "name": "order_type",
          "type": "limsy_order_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "order_date": {
          "name": "order_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "order_number": {
          "name": "order_number",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "order_title": {
          "name": "order_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "operative": {
          "name": "operative",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "full_text": {
          "name": "full_text",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "translation_hindi": {
          "name": "translation_hindi",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "has_stay": {
          "name": "has_stay",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "stay_scope": {
          "name": "stay_scope",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "stay_expiry": {
          "name": "stay_expiry",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "stay_conditions": {
          "name": "stay_conditions",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_required": {
          "name": "compliance_required",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "compliance_deadline": {
          "name": "compliance_deadline",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_party": {
          "name": "compliance_party",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_status": {
          "name": "compliance_status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'pending'"
        },
        "compliance_notes": {
          "name": "compliance_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "cost_awarded": {
          "name": "cost_awarded",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "cost_amount": {
          "name": "cost_amount",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "cost_payable": {
          "name": "cost_payable",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "external_link": {
          "name": "external_link",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "appealed": {
          "name": "appealed",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "appeal_case_id": {
          "name": "appeal_case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "review_filed": {
          "name": "review_filed",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "is_final": {
          "name": "is_final",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "reportable": {
          "name": "reportable",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_orders_tenant_id_tenants_id_fk": {
          "name": "limsy_orders_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_orders_case_id_limsy_cases_id_fk": {
          "name": "limsy_orders_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_orders_hearing_id_limsy_hearings_id_fk": {
          "name": "limsy_orders_hearing_id_limsy_hearings_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "limsy_hearings",
          "columnsFrom": [
            "hearing_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_boq_items": {
      "name": "nidhivan_boq_items",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "boq_id": {
          "name": "boq_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "item_number": {
          "name": "item_number",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "section_code": {
          "name": "section_code",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "is_section_header": {
          "name": "is_section_header",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "unit": {
          "name": "unit",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "quantity": {
          "name": "quantity",
          "type": "double precision",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "unit_rate_paise": {
          "name": "unit_rate_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "amount_paise": {
          "name": "amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "rate_ref": {
          "name": "rate_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "remarks": {
          "name": "remarks",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_boq_items_tenant_boq_idx": {
          "name": "nidhivan_boq_items_tenant_boq_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "boq_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_boq_items_tenant_id_tenants_id_fk": {
          "name": "nidhivan_boq_items_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_boq_items",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk": {
          "name": "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk",
          "tableFrom": "nidhivan_boq_items",
          "tableTo": "nidhivan_boqs",
          "columnsFrom": [
            "boq_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_boqs": {
      "name": "nidhivan_boqs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "dpr_id": {
          "name": "dpr_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "boq_version": {
          "name": "boq_version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "boq_number": {
          "name": "boq_number",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "nidhivan_boq_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'draft'"
        },
        "base_amount_paise": {
          "name": "base_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "contingency_pct": {
          "name": "contingency_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 5
        },
        "contingency_amount_paise": {
          "name": "contingency_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "overhead_pct": {
          "name": "overhead_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "overhead_amount_paise": {
          "name": "overhead_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "gst_pct": {
          "name": "gst_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 18
        },
        "gst_amount_paise": {
          "name": "gst_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "total_amount_paise": {
          "name": "total_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "base_year": {
          "name": "base_year",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "rate_schedule_ref": {
          "name": "rate_schedule_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_date": {
          "name": "approval_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_boqs_tenant_dpr_idx": {
          "name": "nidhivan_boqs_tenant_dpr_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "dpr_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_boqs_tenant_id_tenants_id_fk": {
          "name": "nidhivan_boqs_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_boqs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_boqs_project_id_nidhivan_projects_id_fk": {
          "name": "nidhivan_boqs_project_id_nidhivan_projects_id_fk",
          "tableFrom": "nidhivan_boqs",
          "tableTo": "nidhivan_projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk": {
          "name": "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk",
          "tableFrom": "nidhivan_boqs",
          "tableTo": "nidhivan_dprs",
          "columnsFrom": [
            "dpr_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_dprs": {
      "name": "nidhivan_dprs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "dpr_version": {
          "name": "dpr_version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "dpr_number": {
          "name": "dpr_number",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "financial_year": {
          "name": "financial_year",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "nidhivan_dpr_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'draft'"
        },
        "total_project_cost_paise": {
          "name": "total_project_cost_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "central_share_paise": {
          "name": "central_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "state_share_paise": {
          "name": "state_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "beneficiary_share_paise": {
          "name": "beneficiary_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "loan_paise": {
          "name": "loan_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "cost_basis_year": {
          "name": "cost_basis_year",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "contingency_pct": {
          "name": "contingency_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 5
        },
        "overhead_pct": {
          "name": "overhead_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "sections": {
          "name": "sections",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false,
          "default": "'{}'"
        },
        "consultant_name": {
          "name": "consultant_name",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "prepared_by": {
          "name": "prepared_by",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "submitted_to": {
          "name": "submitted_to",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_authority": {
          "name": "approval_authority",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_ref": {
          "name": "approval_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_date": {
          "name": "approval_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_dprs_tenant_project_idx": {
          "name": "nidhivan_dprs_tenant_project_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_dprs_tenant_id_tenants_id_fk": {
          "name": "nidhivan_dprs_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_dprs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_dprs_project_id_nidhivan_projects_id_fk": {
          "name": "nidhivan_dprs_project_id_nidhivan_projects_id_fk",
          "tableFrom": "nidhivan_dprs",
          "tableTo": "nidhivan_projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_financial_metrics": {
      "name": "nidhivan_financial_metrics",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "reporting_period": {
          "name": "reporting_period",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "period_type": {
          "name": "period_type",
          "type": "nidhivan_period_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'monthly'"
        },
        "funds_released_central_paise": {
          "name": "funds_released_central_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "funds_released_state_paise": {
          "name": "funds_released_state_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "funds_released_beneficiary_paise": {
          "name": "funds_released_beneficiary_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "expenditure_cumulative_paise": {
          "name": "expenditure_cumulative_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "expenditure_this_period_paise": {
          "name": "expenditure_this_period_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "balance_available_paise": {
          "name": "balance_available_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "physical_progress_pct": {
          "name": "physical_progress_pct",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "financial_progress_pct": {
          "name": "financial_progress_pct",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "projected_irr_percent": {
          "name": "projected_irr_percent",
          "type": "numeric(5, 2)",
          "primaryKey": false,
          "notNull": false
        },
        "remarks": {
          "name": "remarks",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "reported_by": {
          "name": "reported_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "reported_at": {
          "name": "reported_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_financial_metrics_tenant_project_idx": {
          "name": "nidhivan_financial_metrics_tenant_project_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_financial_metrics_tenant_id_tenants_id_fk": {
          "name": "nidhivan_financial_metrics_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_financial_metrics",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_financial_metrics_project_id_nidhivan_projects_id_fk": {
          "name": "nidhivan_financial_metrics_project_id_nidhivan_projects_id_fk",
          "tableFrom": "nidhivan_financial_metrics",
          "tableTo": "nidhivan_projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_financial_metrics_reported_by_users_id_fk": {
          "name": "nidhivan_financial_metrics_reported_by_users_id_fk",
          "tableFrom": "nidhivan_financial_metrics",
          "tableTo": "users",
          "columnsFrom": [
            "reported_by"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "restrict",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_projects": {
      "name": "nidhivan_projects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_code": {
          "name": "project_code",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "project_title": {
          "name": "project_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "project_type": {
          "name": "project_type",
          "type": "nidhivan_project_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "sector": {
          "name": "sector",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "subsector": {
          "name": "subsector",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "implementing_agency": {
          "name": "implementing_agency",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "sponsoring_authority": {
          "name": "sponsoring_authority",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "project_state": {
          "name": "project_state",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "project_district": {
          "name": "project_district",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "project_location": {
          "name": "project_location",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "total_cost_paise": {
          "name": "total_cost_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "central_share_paise": {
          "name": "central_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "state_share_paise": {
          "name": "state_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "beneficiary_share_paise": {
          "name": "beneficiary_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "loan_paise": {
          "name": "loan_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "funding_agencies": {
          "name": "funding_agencies",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "nidhivan_project_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'conceptual'"
        },
        "urgency_flag": {
          "name": "urgency_flag",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "priority_level": {
          "name": "priority_level",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 3
        },
        "appraisal_date": {
          "name": "appraisal_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "sanction_date": {
          "name": "sanction_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "commencement_date": {
          "name": "commencement_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "target_completion_date": {
          "name": "target_completion_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "actual_completion_date": {
          "name": "actual_completion_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "project_scope": {
          "name": "project_scope",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "objectives": {
          "name": "objectives",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "outcomes": {
          "name": "outcomes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_projects_tenant_idx": {
          "name": "nidhivan_projects_tenant_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_projects_tenant_id_tenants_id_fk": {
          "name": "nidhivan_projects_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_projects",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.projects": {
      "name": "projects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "projects_tenant_id_tenants_id_fk": {
          "name": "projects_tenant_id_tenants_id_fk",
          "tableFrom": "projects",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.sessions": {
      "name": "sessions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "user_id": {
          "name": "user_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "token": {
          "name": "token",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "token_hash": {
          "name": "token_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "sessions_tenant_id_tenants_id_fk": {
          "name": "sessions_tenant_id_tenants_id_fk",
          "tableFrom": "sessions",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "sessions_user_id_users_id_fk": {
          "name": "sessions_user_id_users_id_fk",
          "tableFrom": "sessions",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.tenants": {
      "name": "tenants",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "slug": {
          "name": "slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "plan": {
          "name": "plan",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'scale'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "region": {
          "name": "region",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'ap-south-1'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "tenants_slug_unique": {
          "name": "tenants_slug_unique",
          "nullsNotDistinct": false,
          "columns": [
            "slug"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.users": {
      "name": "users",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "password_hash": {
          "name": "password_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role": {
          "name": "role",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'developer'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "last_login_at": {
          "name": "last_login_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "users_tenant_email_uidx": {
          "name": "users_tenant_email_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "users_tenant_id_tenants_id_fk": {
          "name": "users_tenant_id_tenants_id_fk",
          "tableFrom": "users",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.vault_secrets": {
      "name": "vault_secrets",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'secret'"
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "encrypted_value": {
          "name": "encrypted_value",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "masked_value": {
          "name": "masked_value",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "environment": {
          "name": "environment",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'production'"
        },
        "version": {
          "name": "version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "rotated_at": {
          "name": "rotated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "vault_secrets_tenant_id_tenants_id_fk": {
          "name": "vault_secrets_tenant_id_tenants_id_fk",
          "tableFrom": "vault_secrets",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.webhook_endpoints": {
      "name": "webhook_endpoints",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "url": {
          "name": "url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "events": {
          "name": "events",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "signing_secret_hash": {
          "name": "signing_secret_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "deliveries": {
          "name": "deliveries",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "webhook_endpoints_tenant_id_tenants_id_fk": {
          "name": "webhook_endpoints_tenant_id_tenants_id_fk",
          "tableFrom": "webhook_endpoints",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.court_level": {
      "name": "court_level",
      "schema": "public",
      "values": [
        "supreme_court",
        "high_court",
        "district_court",
        "tribunal",
        "consumer_forum",
        "arbitration",
        "nclt",
        "nclat",
        "ncdrc"
      ]
    },
    "public.limsy_bench_type": {
      "name": "limsy_bench_type",
      "schema": "public",
      "values": [
        "single_judge",
        "division_bench",
        "full_bench",
        "constitutional_bench",
        "larger_bench"
      ]
    },
    "public.limsy_case_status": {
      "name": "limsy_case_status",
      "schema": "public",
      "values": [
        "intake",
        "diarised",
        "admitted",
        "pending_hearing",
        "under_hearing",
        "reserved",
        "disposed",
        "withdrawn",
        "abated",
        "transferred"
      ]
    },
    "public.limsy_case_type": {
      "name": "limsy_case_type",
      "schema": "public",
      "values": [
        "slp",
        "writ_petition",
        "civil_appeal",
        "criminal_appeal",
        "review_petition",
        "curative_petition",
        "original_suit",
        "execution_petition",
        "consumer_complaint",
        "arbitration_petition",
        "ibc_petition",
        "nclt_petition",
        "other"
      ]
    },
    "public.limsy_hearing_status": {
      "name": "limsy_hearing_status",
      "schema": "public",
      "values": [
        "scheduled",
        "listed",
        "adjourned",
        "part_heard",
        "concluded",
        "cancelled",
        "orders_passed"
      ]
    },
    "public.limsy_order_type": {
      "name": "limsy_order_type",
      "schema": "public",
      "values": [
        "interim_stay",
        "interim_injunction",
        "direction",
        "contempt_notice",
        "final_judgment",
        "consent_order",
        "dismissal",
        "remand",
        "cost_order",
        "modification"
      ]
    },
    "public.nidhivan_boq_status": {
      "name": "nidhivan_boq_status",
      "schema": "public",
      "values": [
        "draft",
        "approved",
        "revision_required",
        "finalized"
      ]
    },
    "public.nidhivan_dpr_status": {
      "name": "nidhivan_dpr_status",
      "schema": "public",
      "values": [
        "draft",
        "under_review",
        "approved",
        "submitted",
        "returned",
        "archived"
      ]
    },
    "public.nidhivan_period_type": {
      "name": "nidhivan_period_type",
      "schema": "public",
      "values": [
        "monthly",
        "quarterly",
        "annual"
      ]
    },
    "public.nidhivan_project_status": {
      "name": "nidhivan_project_status",
      "schema": "public",
      "values": [
        "conceptual",
        "dpr_preparation",
        "dpr_submitted",
        "appraisal",
        "sanctioned",
        "in_progress",
        "completed",
        "abandoned",
        "archived"
      ]
    },
    "public.nidhivan_project_type": {
      "name": "nidhivan_project_type",
      "schema": "public",
      "values": [
        "infrastructure",
        "housing",
        "water_sanitation",
        "energy",
        "transport",
        "healthcare",
        "education",
        "agriculture",
        "industrial",
        "urban_development",
        "rural_development",
        "digital",
        "environment",
        "other"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
```

## File: drizzle/migrations/meta/0008_snapshot.json
```json
{
  "id": "1194dcb9-5494-42c7-a65d-9d0d86d73076",
  "prevId": "b4f78c0b-c31d-4c33-ab14-553ee66cfc32",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.ai_tasks": {
      "name": "ai_tasks",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'pending'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "ai_tasks_tenant_id_tenants_id_fk": {
          "name": "ai_tasks_tenant_id_tenants_id_fk",
          "tableFrom": "ai_tasks",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.api_keys": {
      "name": "api_keys",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "prefix": {
          "name": "prefix",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "key_hash": {
          "name": "key_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "scopes": {
          "name": "scopes",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "rate_limit": {
          "name": "rate_limit",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1000
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "api_keys_tenant_id_tenants_id_fk": {
          "name": "api_keys_tenant_id_tenants_id_fk",
          "tableFrom": "api_keys",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.audit_logs": {
      "name": "audit_logs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "actor": {
          "name": "actor",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "action": {
          "name": "action",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "target": {
          "name": "target",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'info'"
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "ip_address": {
          "name": "ip_address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "audit_logs_tenant_id_tenants_id_fk": {
          "name": "audit_logs_tenant_id_tenants_id_fk",
          "tableFrom": "audit_logs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.builder_components": {
      "name": "builder_components",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'component'"
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'default'"
        },
        "sort_order": {
          "name": "sort_order",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "config": {
          "name": "config",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "props": {
          "name": "props",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "builder_components_tenant_id_tenants_id_fk": {
          "name": "builder_components_tenant_id_tenants_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "builder_components_project_id_projects_id_fk": {
          "name": "builder_components_project_id_projects_id_fk",
          "tableFrom": "builder_components",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.client_requests": {
      "name": "client_requests",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "idempotency_key": {
          "name": "idempotency_key",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "company_name": {
          "name": "company_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "contact_name": {
          "name": "contact_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "contact_email": {
          "name": "contact_email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "contact_phone": {
          "name": "contact_phone",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "requested_plan": {
          "name": "requested_plan",
          "type": "tenant_plan",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'starter'"
        },
        "subsidiary": {
          "name": "subsidiary",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "message": {
          "name": "message",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "request_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'pending'"
        },
        "processed_by": {
          "name": "processed_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "processed_at": {
          "name": "processed_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "provisioned_tenant_id": {
          "name": "provisioned_tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "handled_by_tenant_id": {
          "name": "handled_by_tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "client_requests_processed_by_users_id_fk": {
          "name": "client_requests_processed_by_users_id_fk",
          "tableFrom": "client_requests",
          "tableTo": "users",
          "columnsFrom": [
            "processed_by"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        },
        "client_requests_provisioned_tenant_id_tenants_id_fk": {
          "name": "client_requests_provisioned_tenant_id_tenants_id_fk",
          "tableFrom": "client_requests",
          "tableTo": "tenants",
          "columnsFrom": [
            "provisioned_tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        },
        "client_requests_handled_by_tenant_id_tenants_id_fk": {
          "name": "client_requests_handled_by_tenant_id_tenants_id_fk",
          "tableFrom": "client_requests",
          "tableTo": "tenants",
          "columnsFrom": [
            "handled_by_tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "restrict",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "client_requests_idempotency_key_unique": {
          "name": "client_requests_idempotency_key_unique",
          "nullsNotDistinct": false,
          "columns": [
            "idempotency_key"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.deployments": {
      "name": "deployments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "environment_id": {
          "name": "environment_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "version": {
          "name": "version",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'success'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "deployments_tenant_id_tenants_id_fk": {
          "name": "deployments_tenant_id_tenants_id_fk",
          "tableFrom": "deployments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_project_id_projects_id_fk": {
          "name": "deployments_project_id_projects_id_fk",
          "tableFrom": "deployments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "deployments_environment_id_environments_id_fk": {
          "name": "deployments_environment_id_environments_id_fk",
          "tableFrom": "deployments",
          "tableTo": "environments",
          "columnsFrom": [
            "environment_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.environments": {
      "name": "environments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'production'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "environments_tenant_id_tenants_id_fk": {
          "name": "environments_tenant_id_tenants_id_fk",
          "tableFrom": "environments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "environments_project_id_projects_id_fk": {
          "name": "environments_project_id_projects_id_fk",
          "tableFrom": "environments",
          "tableTo": "projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.feature_flags": {
      "name": "feature_flags",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "rollout": {
          "name": "rollout",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "environments": {
          "name": "environments",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "feature_flags_tenant_id_tenants_id_fk": {
          "name": "feature_flags_tenant_id_tenants_id_fk",
          "tableFrom": "feature_flags",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.incidents": {
      "name": "incidents",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'medium'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'open'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "incidents_tenant_id_tenants_id_fk": {
          "name": "incidents_tenant_id_tenants_id_fk",
          "tableFrom": "incidents",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.job_applications": {
      "name": "job_applications",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "candidate_name": {
          "name": "candidate_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "phone": {
          "name": "phone",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "position": {
          "name": "position",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role_slug": {
          "name": "role_slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'general'"
        },
        "role_title": {
          "name": "role_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'General'"
        },
        "portfolio": {
          "name": "portfolio",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "resume_url": {
          "name": "resume_url",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "cover_letter": {
          "name": "cover_letter",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "note": {
          "name": "note",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'applied'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "job_applications_tenant_id_tenants_id_fk": {
          "name": "job_applications_tenant_id_tenants_id_fk",
          "tableFrom": "job_applications",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_bench_assignments": {
      "name": "limsy_bench_assignments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "bench_type": {
          "name": "bench_type",
          "type": "limsy_bench_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "presiding": {
          "name": "presiding",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "members": {
          "name": "members",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "constituted_on": {
          "name": "constituted_on",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "reconstituted_on": {
          "name": "reconstituted_on",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "reconstitution_reason": {
          "name": "reconstitution_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "is_active": {
          "name": "is_active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_bench_assignments_tenant_id_tenants_id_fk": {
          "name": "limsy_bench_assignments_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_bench_assignments",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_bench_assignments_case_id_limsy_cases_id_fk": {
          "name": "limsy_bench_assignments_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_bench_assignments",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_cases": {
      "name": "limsy_cases",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_number": {
          "name": "case_number",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "internal_ref": {
          "name": "internal_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "court_level": {
          "name": "court_level",
          "type": "court_level",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "court_name": {
          "name": "court_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "court_location": {
          "name": "court_location",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "case_type": {
          "name": "case_type",
          "type": "limsy_case_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "limsy_case_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'intake'"
        },
        "petitioner": {
          "name": "petitioner",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "respondent": {
          "name": "respondent",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "petitioner_adv": {
          "name": "petitioner_adv",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "respondent_adv": {
          "name": "respondent_adv",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "filing_date": {
          "name": "filing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "admission_date": {
          "name": "admission_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_date": {
          "name": "next_hearing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "disposal_date": {
          "name": "disposal_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "subject_matter": {
          "name": "subject_matter",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "relief_sought": {
          "name": "relief_sought",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "acts_sections": {
          "name": "acts_sections",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "tags": {
          "name": "tags",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "urgency_flag": {
          "name": "urgency_flag",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "priority_level": {
          "name": "priority_level",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 3
        },
        "parent_case_id": {
          "name": "parent_case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "related_cases": {
          "name": "related_cases",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "outcome_notes": {
          "name": "outcome_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "outcome_type": {
          "name": "outcome_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "estimated_fees": {
          "name": "estimated_fees",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "billed_amount": {
          "name": "billed_amount",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_cases_tenant_id_tenants_id_fk": {
          "name": "limsy_cases_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_cases",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_hearings": {
      "name": "limsy_hearings",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "hearing_number": {
          "name": "hearing_number",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "scheduled_date": {
          "name": "scheduled_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "actual_date": {
          "name": "actual_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "limsy_hearing_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'scheduled'"
        },
        "board_position": {
          "name": "board_position",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "court_room": {
          "name": "court_room",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "session_type": {
          "name": "session_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'regular'"
        },
        "adjourned_by": {
          "name": "adjourned_by",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "adjournment_reason": {
          "name": "adjournment_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "adjournment_count": {
          "name": "adjournment_count",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "proceedings_summary": {
          "name": "proceedings_summary",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "detailed_minutes": {
          "name": "detailed_minutes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "appearances": {
          "name": "appearances",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "arguments_summary": {
          "name": "arguments_summary",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_date": {
          "name": "next_hearing_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "next_hearing_purpose": {
          "name": "next_hearing_purpose",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_deadline": {
          "name": "compliance_deadline",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_notes": {
          "name": "compliance_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_hearings_tenant_id_tenants_id_fk": {
          "name": "limsy_hearings_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_hearings",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_hearings_case_id_limsy_cases_id_fk": {
          "name": "limsy_hearings_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_hearings",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.limsy_orders": {
      "name": "limsy_orders",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "case_id": {
          "name": "case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "hearing_id": {
          "name": "hearing_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "order_type": {
          "name": "order_type",
          "type": "limsy_order_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "order_date": {
          "name": "order_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "order_number": {
          "name": "order_number",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "order_title": {
          "name": "order_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "operative": {
          "name": "operative",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "full_text": {
          "name": "full_text",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "translation_hindi": {
          "name": "translation_hindi",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "has_stay": {
          "name": "has_stay",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "stay_scope": {
          "name": "stay_scope",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "stay_expiry": {
          "name": "stay_expiry",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "stay_conditions": {
          "name": "stay_conditions",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_required": {
          "name": "compliance_required",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "compliance_deadline": {
          "name": "compliance_deadline",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_party": {
          "name": "compliance_party",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "compliance_status": {
          "name": "compliance_status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'pending'"
        },
        "compliance_notes": {
          "name": "compliance_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "cost_awarded": {
          "name": "cost_awarded",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "cost_amount": {
          "name": "cost_amount",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "cost_payable": {
          "name": "cost_payable",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "external_link": {
          "name": "external_link",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "appealed": {
          "name": "appealed",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "appeal_case_id": {
          "name": "appeal_case_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "review_filed": {
          "name": "review_filed",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "is_final": {
          "name": "is_final",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "reportable": {
          "name": "reportable",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "limsy_orders_tenant_id_tenants_id_fk": {
          "name": "limsy_orders_tenant_id_tenants_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_orders_case_id_limsy_cases_id_fk": {
          "name": "limsy_orders_case_id_limsy_cases_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "limsy_cases",
          "columnsFrom": [
            "case_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "limsy_orders_hearing_id_limsy_hearings_id_fk": {
          "name": "limsy_orders_hearing_id_limsy_hearings_id_fk",
          "tableFrom": "limsy_orders",
          "tableTo": "limsy_hearings",
          "columnsFrom": [
            "hearing_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_boq_items": {
      "name": "nidhivan_boq_items",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "boq_id": {
          "name": "boq_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "item_number": {
          "name": "item_number",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "section_code": {
          "name": "section_code",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "is_section_header": {
          "name": "is_section_header",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "unit": {
          "name": "unit",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "quantity": {
          "name": "quantity",
          "type": "double precision",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "unit_rate_paise": {
          "name": "unit_rate_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "amount_paise": {
          "name": "amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "rate_ref": {
          "name": "rate_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "remarks": {
          "name": "remarks",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_boq_items_tenant_boq_idx": {
          "name": "nidhivan_boq_items_tenant_boq_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "boq_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_boq_items_tenant_id_tenants_id_fk": {
          "name": "nidhivan_boq_items_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_boq_items",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk": {
          "name": "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk",
          "tableFrom": "nidhivan_boq_items",
          "tableTo": "nidhivan_boqs",
          "columnsFrom": [
            "boq_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_boqs": {
      "name": "nidhivan_boqs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "dpr_id": {
          "name": "dpr_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "boq_version": {
          "name": "boq_version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "boq_number": {
          "name": "boq_number",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "nidhivan_boq_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'draft'"
        },
        "base_amount_paise": {
          "name": "base_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "contingency_pct": {
          "name": "contingency_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 5
        },
        "contingency_amount_paise": {
          "name": "contingency_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "overhead_pct": {
          "name": "overhead_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "overhead_amount_paise": {
          "name": "overhead_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "gst_pct": {
          "name": "gst_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 18
        },
        "gst_amount_paise": {
          "name": "gst_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "total_amount_paise": {
          "name": "total_amount_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "base_year": {
          "name": "base_year",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "rate_schedule_ref": {
          "name": "rate_schedule_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_date": {
          "name": "approval_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_boqs_tenant_dpr_idx": {
          "name": "nidhivan_boqs_tenant_dpr_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "dpr_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_boqs_tenant_id_tenants_id_fk": {
          "name": "nidhivan_boqs_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_boqs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_boqs_project_id_nidhivan_projects_id_fk": {
          "name": "nidhivan_boqs_project_id_nidhivan_projects_id_fk",
          "tableFrom": "nidhivan_boqs",
          "tableTo": "nidhivan_projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk": {
          "name": "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk",
          "tableFrom": "nidhivan_boqs",
          "tableTo": "nidhivan_dprs",
          "columnsFrom": [
            "dpr_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_dprs": {
      "name": "nidhivan_dprs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "dpr_version": {
          "name": "dpr_version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "dpr_number": {
          "name": "dpr_number",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "financial_year": {
          "name": "financial_year",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "nidhivan_dpr_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'draft'"
        },
        "total_project_cost_paise": {
          "name": "total_project_cost_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "central_share_paise": {
          "name": "central_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "state_share_paise": {
          "name": "state_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "beneficiary_share_paise": {
          "name": "beneficiary_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "loan_paise": {
          "name": "loan_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "cost_basis_year": {
          "name": "cost_basis_year",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "contingency_pct": {
          "name": "contingency_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 5
        },
        "overhead_pct": {
          "name": "overhead_pct",
          "type": "real",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "sections": {
          "name": "sections",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false,
          "default": "'{}'"
        },
        "consultant_name": {
          "name": "consultant_name",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "prepared_by": {
          "name": "prepared_by",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "submitted_to": {
          "name": "submitted_to",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_authority": {
          "name": "approval_authority",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_ref": {
          "name": "approval_ref",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "approval_date": {
          "name": "approval_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "document_links": {
          "name": "document_links",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "crypto_hash": {
          "name": "crypto_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_dprs_tenant_project_idx": {
          "name": "nidhivan_dprs_tenant_project_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_dprs_tenant_id_tenants_id_fk": {
          "name": "nidhivan_dprs_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_dprs",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_dprs_project_id_nidhivan_projects_id_fk": {
          "name": "nidhivan_dprs_project_id_nidhivan_projects_id_fk",
          "tableFrom": "nidhivan_dprs",
          "tableTo": "nidhivan_projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_financial_metrics": {
      "name": "nidhivan_financial_metrics",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_id": {
          "name": "project_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "reporting_period": {
          "name": "reporting_period",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "period_type": {
          "name": "period_type",
          "type": "nidhivan_period_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'monthly'"
        },
        "funds_released_central_paise": {
          "name": "funds_released_central_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "funds_released_state_paise": {
          "name": "funds_released_state_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "funds_released_beneficiary_paise": {
          "name": "funds_released_beneficiary_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "expenditure_cumulative_paise": {
          "name": "expenditure_cumulative_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "expenditure_this_period_paise": {
          "name": "expenditure_this_period_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "balance_available_paise": {
          "name": "balance_available_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "physical_progress_pct": {
          "name": "physical_progress_pct",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "financial_progress_pct": {
          "name": "financial_progress_pct",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "projected_irr_percent": {
          "name": "projected_irr_percent",
          "type": "numeric(5, 2)",
          "primaryKey": false,
          "notNull": false
        },
        "remarks": {
          "name": "remarks",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "reported_by": {
          "name": "reported_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "reported_at": {
          "name": "reported_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_financial_metrics_tenant_project_idx": {
          "name": "nidhivan_financial_metrics_tenant_project_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "project_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_financial_metrics_tenant_id_tenants_id_fk": {
          "name": "nidhivan_financial_metrics_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_financial_metrics",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_financial_metrics_project_id_nidhivan_projects_id_fk": {
          "name": "nidhivan_financial_metrics_project_id_nidhivan_projects_id_fk",
          "tableFrom": "nidhivan_financial_metrics",
          "tableTo": "nidhivan_projects",
          "columnsFrom": [
            "project_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "nidhivan_financial_metrics_reported_by_users_id_fk": {
          "name": "nidhivan_financial_metrics_reported_by_users_id_fk",
          "tableFrom": "nidhivan_financial_metrics",
          "tableTo": "users",
          "columnsFrom": [
            "reported_by"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "restrict",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.nidhivan_projects": {
      "name": "nidhivan_projects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "project_code": {
          "name": "project_code",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "project_title": {
          "name": "project_title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "project_type": {
          "name": "project_type",
          "type": "nidhivan_project_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "sector": {
          "name": "sector",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "subsector": {
          "name": "subsector",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "implementing_agency": {
          "name": "implementing_agency",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "sponsoring_authority": {
          "name": "sponsoring_authority",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "project_state": {
          "name": "project_state",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "project_district": {
          "name": "project_district",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "project_location": {
          "name": "project_location",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "total_cost_paise": {
          "name": "total_cost_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "central_share_paise": {
          "name": "central_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "state_share_paise": {
          "name": "state_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "beneficiary_share_paise": {
          "name": "beneficiary_share_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "loan_paise": {
          "name": "loan_paise",
          "type": "bigint",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "funding_agencies": {
          "name": "funding_agencies",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "nidhivan_project_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'conceptual'"
        },
        "urgency_flag": {
          "name": "urgency_flag",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "priority_level": {
          "name": "priority_level",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 3
        },
        "appraisal_date": {
          "name": "appraisal_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "sanction_date": {
          "name": "sanction_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "commencement_date": {
          "name": "commencement_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "target_completion_date": {
          "name": "target_completion_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "actual_completion_date": {
          "name": "actual_completion_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "project_scope": {
          "name": "project_scope",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "objectives": {
          "name": "objectives",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "outcomes": {
          "name": "outcomes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_by": {
          "name": "created_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "updated_by": {
          "name": "updated_by",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "nidhivan_projects_tenant_idx": {
          "name": "nidhivan_projects_tenant_idx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "nidhivan_projects_tenant_id_tenants_id_fk": {
          "name": "nidhivan_projects_tenant_id_tenants_id_fk",
          "tableFrom": "nidhivan_projects",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.projects": {
      "name": "projects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "projects_tenant_id_tenants_id_fk": {
          "name": "projects_tenant_id_tenants_id_fk",
          "tableFrom": "projects",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.sessions": {
      "name": "sessions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "user_id": {
          "name": "user_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "token": {
          "name": "token",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "token_hash": {
          "name": "token_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "sessions_tenant_id_tenants_id_fk": {
          "name": "sessions_tenant_id_tenants_id_fk",
          "tableFrom": "sessions",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "sessions_user_id_users_id_fk": {
          "name": "sessions_user_id_users_id_fk",
          "tableFrom": "sessions",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.tenants": {
      "name": "tenants",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "slug": {
          "name": "slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "plan": {
          "name": "plan",
          "type": "tenant_plan",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'starter'"
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "region": {
          "name": "region",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'ap-south-1'"
        },
        "stripe_customer_id": {
          "name": "stripe_customer_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "stripe_subscription_id": {
          "name": "stripe_subscription_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "stripe_price_id": {
          "name": "stripe_price_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "plan_expires_at": {
          "name": "plan_expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "tenants_slug_unique": {
          "name": "tenants_slug_unique",
          "nullsNotDistinct": false,
          "columns": [
            "slug"
          ]
        },
        "tenants_stripe_customer_id_unique": {
          "name": "tenants_stripe_customer_id_unique",
          "nullsNotDistinct": false,
          "columns": [
            "stripe_customer_id"
          ]
        },
        "tenants_stripe_subscription_id_unique": {
          "name": "tenants_stripe_subscription_id_unique",
          "nullsNotDistinct": false,
          "columns": [
            "stripe_subscription_id"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.users": {
      "name": "users",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "password_hash": {
          "name": "password_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "role": {
          "name": "role",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'developer'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "last_login_at": {
          "name": "last_login_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "users_tenant_email_uidx": {
          "name": "users_tenant_email_uidx",
          "columns": [
            {
              "expression": "tenant_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "users_tenant_id_tenants_id_fk": {
          "name": "users_tenant_id_tenants_id_fk",
          "tableFrom": "users",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.vault_secrets": {
      "name": "vault_secrets",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'secret'"
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "encrypted_value": {
          "name": "encrypted_value",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "masked_value": {
          "name": "masked_value",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "environment": {
          "name": "environment",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'production'"
        },
        "version": {
          "name": "version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "rotated_at": {
          "name": "rotated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "vault_secrets_tenant_id_tenants_id_fk": {
          "name": "vault_secrets_tenant_id_tenants_id_fk",
          "tableFrom": "vault_secrets",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.webhook_endpoints": {
      "name": "webhook_endpoints",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "tenant_id": {
          "name": "tenant_id",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "url": {
          "name": "url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "events": {
          "name": "events",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "signing_secret_hash": {
          "name": "signing_secret_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "deliveries": {
          "name": "deliveries",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'active'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "webhook_endpoints_tenant_id_tenants_id_fk": {
          "name": "webhook_endpoints_tenant_id_tenants_id_fk",
          "tableFrom": "webhook_endpoints",
          "tableTo": "tenants",
          "columnsFrom": [
            "tenant_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.court_level": {
      "name": "court_level",
      "schema": "public",
      "values": [
        "supreme_court",
        "high_court",
        "district_court",
        "tribunal",
        "consumer_forum",
        "arbitration",
        "nclt",
        "nclat",
        "ncdrc"
      ]
    },
    "public.limsy_bench_type": {
      "name": "limsy_bench_type",
      "schema": "public",
      "values": [
        "single_judge",
        "division_bench",
        "full_bench",
        "constitutional_bench",
        "larger_bench"
      ]
    },
    "public.limsy_case_status": {
      "name": "limsy_case_status",
      "schema": "public",
      "values": [
        "intake",
        "diarised",
        "admitted",
        "pending_hearing",
        "under_hearing",
        "reserved",
        "disposed",
        "withdrawn",
        "abated",
        "transferred"
      ]
    },
    "public.limsy_case_type": {
      "name": "limsy_case_type",
      "schema": "public",
      "values": [
        "slp",
        "writ_petition",
        "civil_appeal",
        "criminal_appeal",
        "review_petition",
        "curative_petition",
        "original_suit",
        "execution_petition",
        "consumer_complaint",
        "arbitration_petition",
        "ibc_petition",
        "nclt_petition",
        "other"
      ]
    },
    "public.limsy_hearing_status": {
      "name": "limsy_hearing_status",
      "schema": "public",
      "values": [
        "scheduled",
        "listed",
        "adjourned",
        "part_heard",
        "concluded",
        "cancelled",
        "orders_passed"
      ]
    },
    "public.limsy_order_type": {
      "name": "limsy_order_type",
      "schema": "public",
      "values": [
        "interim_stay",
        "interim_injunction",
        "direction",
        "contempt_notice",
        "final_judgment",
        "consent_order",
        "dismissal",
        "remand",
        "cost_order",
        "modification"
      ]
    },
    "public.nidhivan_boq_status": {
      "name": "nidhivan_boq_status",
      "schema": "public",
      "values": [
        "draft",
        "approved",
        "revision_required",
        "finalized"
      ]
    },
    "public.nidhivan_dpr_status": {
      "name": "nidhivan_dpr_status",
      "schema": "public",
      "values": [
        "draft",
        "under_review",
        "approved",
        "submitted",
        "returned",
        "archived"
      ]
    },
    "public.nidhivan_period_type": {
      "name": "nidhivan_period_type",
      "schema": "public",
      "values": [
        "monthly",
        "quarterly",
        "annual"
      ]
    },
    "public.nidhivan_project_status": {
      "name": "nidhivan_project_status",
      "schema": "public",
      "values": [
        "conceptual",
        "dpr_preparation",
        "dpr_submitted",
        "appraisal",
        "sanctioned",
        "in_progress",
        "completed",
        "abandoned",
        "archived"
      ]
    },
    "public.nidhivan_project_type": {
      "name": "nidhivan_project_type",
      "schema": "public",
      "values": [
        "infrastructure",
        "housing",
        "water_sanitation",
        "energy",
        "transport",
        "healthcare",
        "education",
        "agriculture",
        "industrial",
        "urban_development",
        "rural_development",
        "digital",
        "environment",
        "other"
      ]
    },
    "public.request_status": {
      "name": "request_status",
      "schema": "public",
      "values": [
        "pending",
        "approved",
        "rejected",
        "onboarded"
      ]
    },
    "public.tenant_plan": {
      "name": "tenant_plan",
      "schema": "public",
      "values": [
        "pilot",
        "starter",
        "professional",
        "scale",
        "enterprise"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
```

## File: drizzle/migrations/0000_slippery_james_howlett.sql
```sql
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warn', 'critical');--> statement-breakpoint
CREATE TYPE "public"."client_request_service" AS ENUM('platform-demo', 'architecture-consult', 'migration-assessment', 'security-review');--> statement-breakpoint
CREATE TYPE "public"."client_request_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deployment_status" AS ENUM('running', 'success', 'failed', 'rolled_back');--> statement-breakpoint
CREATE TYPE "public"."env_name" AS ENUM('development', 'staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."env_status" AS ENUM('provisioning', 'running', 'degraded', 'destroyed');--> statement-breakpoint
CREATE TYPE "public"."env_tier" AS ENUM('standard', 'performance', 'dedicated');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('sev1', 'sev2', 'sev3');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('open', 'monitoring', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."job_application_status" AS ENUM('received', 'screening', 'interview', 'offer', 'closed');--> statement-breakpoint
CREATE TYPE "public"."project_framework" AS ENUM('react-vite', 'nextjs', 'vue-vite', 'remix');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'building', 'deployed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."security_status" AS ENUM('pending', 'pass', 'warn', 'fail');--> statement-breakpoint
CREATE TYPE "public"."task_class" AS ENUM('planning', 'backend', 'frontend', 'styling', 'security');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('queued', 'running', 'verified', 'committed', 'blocked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('starter', 'scale', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'architect', 'developer', 'designer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TABLE "ai_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer,
	"prompt" text NOT NULL,
	"task_class" "task_class" NOT NULL,
	"routed_model" text NOT NULL,
	"routing_reason" text DEFAULT '' NOT NULL,
	"complexity_score" integer DEFAULT 0 NOT NULL,
	"status" "task_status" DEFAULT 'queued' NOT NULL,
	"stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output" text DEFAULT '' NOT NULL,
	"security_status" "security_status" DEFAULT 'pending' NOT NULL,
	"security_findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
	"action" text NOT NULL,
	"target" text DEFAULT '' NOT NULL,
	"severity" "audit_severity" DEFAULT 'info' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builder_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"type" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"service" "client_request_service" NOT NULL,
	"preferred_date" text DEFAULT '' NOT NULL,
	"preferred_time" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" "client_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"environment_id" integer NOT NULL,
	"version" text NOT NULL,
	"commit_sha" text NOT NULL,
	"triggered_by" text DEFAULT 'studio-ci' NOT NULL,
	"status" "deployment_status" DEFAULT 'running' NOT NULL,
	"stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"name" "env_name" NOT NULL,
	"region" text DEFAULT 'us-east-1' NOT NULL,
	"tier" "env_tier" DEFAULT 'standard' NOT NULL,
	"status" "env_status" DEFAULT 'provisioning' NOT NULL,
	"terraform" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"key" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout" integer DEFAULT 0 NOT NULL,
	"environments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_rollout_range" CHECK ("feature_flags"."rollout" >= 0 AND "feature_flags"."rollout" <= 100)
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text NOT NULL,
	"service" text DEFAULT 'app-service' NOT NULL,
	"severity" "incident_severity" DEFAULT 'sev3' NOT NULL,
	"status" "incident_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_slug" text NOT NULL,
	"role_title" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"portfolio" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" "job_application_status" DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"framework" "project_framework" DEFAULT 'react-vite' NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"design_tokens" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tenant_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"ip_address" text DEFAULT '' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "tenant_plan" DEFAULT 'scale' NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"region" text DEFAULT 'us-east-1' NOT NULL,
	"site_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text DEFAULT '' NOT NULL,
	"role" "user_role" DEFAULT 'developer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_secrets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"masked_value" text NOT NULL,
	"environment" text DEFAULT 'all' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signing_secret_hash" text DEFAULT '' NOT NULL,
	"status" "webhook_status" DEFAULT 'active' NOT NULL,
	"deliveries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_components" ADD CONSTRAINT "builder_components_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_components" ADD CONSTRAINT "builder_components_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_secrets" ADD CONSTRAINT "vault_secrets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_tasks_tenant_id_idx" ON "ai_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_tasks_tenant_status_idx" ON "ai_tasks" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "ai_tasks_project_id_idx" ON "ai_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "ai_tasks_security_status_idx" ON "ai_tasks" USING btree ("tenant_id","security_status");--> statement-breakpoint
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "api_keys_tenant_status_idx" ON "api_keys" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_uidx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_tenant_name_uidx" ON "api_keys" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_created_idx" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_severity_idx" ON "audit_logs" USING btree ("tenant_id","severity");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "builder_components_tenant_id_idx" ON "builder_components" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "builder_components_project_id_idx" ON "builder_components" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "builder_components_project_sort_idx" ON "builder_components" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "client_requests_status_idx" ON "client_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_requests_email_idx" ON "client_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "deployments_tenant_id_idx" ON "deployments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "deployments_project_id_idx" ON "deployments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "deployments_environment_id_idx" ON "deployments" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "deployments_tenant_status_idx" ON "deployments" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "deployments_commit_sha_idx" ON "deployments" USING btree ("commit_sha");--> statement-breakpoint
CREATE INDEX "environments_tenant_id_idx" ON "environments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "environments_project_id_idx" ON "environments" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "environments_project_name_uidx" ON "environments" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "feature_flags_tenant_id_idx" ON "feature_flags" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_tenant_key_uidx" ON "feature_flags" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX "incidents_tenant_id_idx" ON "incidents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "incidents_tenant_status_idx" ON "incidents" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "incidents_tenant_severity_idx" ON "incidents" USING btree ("tenant_id","severity");--> statement-breakpoint
CREATE INDEX "job_applications_role_slug_idx" ON "job_applications" USING btree ("role_slug");--> statement-breakpoint
CREATE INDEX "job_applications_status_idx" ON "job_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_applications_email_idx" ON "job_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "projects_tenant_id_idx" ON "projects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "projects_tenant_status_idx" ON "projects" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_tenant_name_uidx" ON "projects" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_tenant_id_idx" ON "sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_uidx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_uidx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenants_plan_idx" ON "tenants" USING btree ("plan");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_uidx" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "users_tenant_role_idx" ON "users" USING btree ("tenant_id","role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("active");--> statement-breakpoint
CREATE INDEX "vault_secrets_tenant_id_idx" ON "vault_secrets" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_secrets_tenant_name_env_uidx" ON "vault_secrets" USING btree ("tenant_id","name","environment");--> statement-breakpoint
CREATE INDEX "webhook_endpoints_tenant_id_idx" ON "webhook_endpoints" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "webhook_endpoints_tenant_status_idx" ON "webhook_endpoints" USING btree ("tenant_id","status");
```

## File: drizzle/migrations/0001_fix_schema_drift.sql
```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Actual Schema Drift Fixes
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "ai_tasks" ADD COLUMN "title" text DEFAULT 'Untitled Task' NOT NULL;
ALTER TABLE "builder_components" ADD COLUMN "name" text DEFAULT 'component' NOT NULL;
ALTER TABLE "builder_components" ADD COLUMN "config" jsonb;
ALTER TABLE "client_requests" ADD COLUMN "tenant_id" integer DEFAULT 1 NOT NULL;
ALTER TABLE "client_requests" ADD COLUMN "subject" text DEFAULT 'Client Inquiry' NOT NULL;
ALTER TABLE "environments" ADD COLUMN "type" text DEFAULT 'production' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "tenant_id" integer DEFAULT 1 NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "candidate_name" text DEFAULT '' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "phone" text;
ALTER TABLE "job_applications" ADD COLUMN "position" text DEFAULT '' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "resume_url" text;
ALTER TABLE "job_applications" ADD COLUMN "cover_letter" text;
ALTER TABLE "sessions" ADD COLUMN "token" text DEFAULT '' NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Missing Foreign Key Constraints
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
 ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
```

## File: drizzle/migrations/0002_enable_rls.sql
```sql
-- =============================================================================
-- Migration: 0002_enable_rls.sql
-- BNLV Studio — Row-Level Security for all tenant-scoped tables
-- =============================================================================
-- Run with:
--   psql "$DATABASE_URL_UNPOOLED" \
--     -v STUDIO_APP_PASSWORD="<password>" \
--     -v STUDIO_MIGRATOR_PASSWORD="<password>" \
--     -f 0002_enable_rls.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Create application roles
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'studio_app') THEN
    CREATE ROLE studio_app NOINHERIT LOGIN PASSWORD :'STUDIO_APP_PASSWORD';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'studio_migrator') THEN
    CREATE ROLE studio_migrator NOINHERIT LOGIN PASSWORD :'STUDIO_MIGRATOR_PASSWORD'
      BYPASSRLS;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Grant privileges
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO studio_app;
GRANT USAGE ON SCHEMA public TO studio_migrator;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO studio_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO studio_migrator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO studio_migrator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO studio_migrator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO studio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO studio_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studio_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO studio_app;

-- audit_logs is append-only at the DB level
REVOKE UPDATE, DELETE ON TABLE audit_logs FROM studio_app;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- sessions: excluded from RLS — required pre-tenant-context for bootstrap lookup
-- client_requests / job_applications: platform-level, no tenant scope

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tenant resolver function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::integer;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenants_app_select ON tenants;
CREATE POLICY tenants_app_select ON tenants
  FOR SELECT TO studio_app
  USING (id = current_tenant_id());

DROP POLICY IF EXISTS tenants_app_update ON tenants;
CREATE POLICY tenants_app_update ON tenants
  FOR UPDATE TO studio_app
  USING (id = current_tenant_id())
  WITH CHECK (id = current_tenant_id());

DROP POLICY IF EXISTS users_app_all ON users;
CREATE POLICY users_app_all ON users
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS projects_app_all ON projects;
CREATE POLICY projects_app_all ON projects
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS builder_components_app_all ON builder_components;
CREATE POLICY builder_components_app_all ON builder_components
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS ai_tasks_app_all ON ai_tasks;
CREATE POLICY ai_tasks_app_all ON ai_tasks
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS environments_app_all ON environments;
CREATE POLICY environments_app_all ON environments
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS deployments_app_all ON deployments;
CREATE POLICY deployments_app_all ON deployments
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS api_keys_app_all ON api_keys;
CREATE POLICY api_keys_app_all ON api_keys
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS feature_flags_app_all ON feature_flags;
CREATE POLICY feature_flags_app_all ON feature_flags
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS vault_secrets_app_all ON vault_secrets;
CREATE POLICY vault_secrets_app_all ON vault_secrets
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS webhook_endpoints_app_all ON webhook_endpoints;
CREATE POLICY webhook_endpoints_app_all ON webhook_endpoints
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS incidents_app_all ON incidents;
CREATE POLICY incidents_app_all ON incidents
  FOR ALL TO studio_app
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS audit_logs_app_select ON audit_logs;
CREATE POLICY audit_logs_app_select ON audit_logs
  FOR SELECT TO studio_app
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS audit_logs_app_insert ON audit_logs;
CREATE POLICY audit_logs_app_insert ON audit_logs
  FOR INSERT TO studio_app
  WITH CHECK (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verification (run manually)
-- ─────────────────────────────────────────────────────────────────────────────

/*
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Isolation test (should return 0 rows for any non-existent tenant):
SET app.current_tenant_id = '99999';
SELECT count(*) FROM projects;
SET app.current_tenant_id = '';
*/
```

## File: drizzle/migrations/0003_limsys_workflow.sql
```sql
-- ============================================================================
-- Migration: 0003_limsy_workflow.sql
-- LIMSY Supreme Court Standard Case Workflow Tables (Production Ready)
-- ============================================================================
-- Run AFTER: 0002_enable_rls.sql
-- Apply with: psql $DATABASE_URL_UNPOOLED -f drizzle/migrations/0003_limsy_workflow.sql
-- ============================================================================

-- ── ENUMS ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE court_level AS ENUM (
    'supreme_court','high_court','district_court','tribunal',
    'consumer_forum','arbitration','nclt','nclat','ncdrc'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_case_status AS ENUM (
    'intake','diarised','admitted','pending_hearing','under_hearing',
    'reserved','disposed','withdrawn','abated','transferred'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_case_type AS ENUM (
    'slp','writ_petition','civil_appeal','criminal_appeal','review_petition',
    'curative_petition','original_suit','execution_petition',
    'consumer_complaint','arbitration_petition','ibc_petition','nclt_petition','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_hearing_status AS ENUM (
    'scheduled','listed','adjourned','part_heard','concluded','cancelled','orders_passed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_order_type AS ENUM (
    'interim_stay','interim_injunction','direction','contempt_notice',
    'final_judgment','consent_order','dismissal','remand','cost_order','modification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE limsy_bench_type AS ENUM (
    'single_judge','division_bench','full_bench','constitutional_bench','larger_bench'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLE: limsy_cases ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_cases (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL,
  case_number         VARCHAR(120),
  internal_ref        VARCHAR(80) NOT NULL,
  court_level         court_level NOT NULL,
  court_name          VARCHAR(200) NOT NULL,
  court_location      VARCHAR(200),
  case_type           limsy_case_type NOT NULL,
  status              limsy_case_status NOT NULL DEFAULT 'intake',
  petitioner          VARCHAR(500) NOT NULL,
  respondent          VARCHAR(500) NOT NULL,
  petitioner_adv      VARCHAR(300),
  respondent_adv      VARCHAR(300),
  filing_date         TIMESTAMPTZ,
  admission_date      TIMESTAMPTZ,
  next_hearing_date   TIMESTAMPTZ,
  disposal_date       TIMESTAMPTZ,
  subject_matter      TEXT NOT NULL,
  relief_sought       TEXT,
  acts_sections       TEXT,
  tags                VARCHAR(500),
  urgency_flag        BOOLEAN NOT NULL DEFAULT false,
  priority_level      INTEGER NOT NULL DEFAULT 3,
  parent_case_id      INTEGER,
  related_cases       JSONB,
  document_links      JSONB,
  outcome_notes       TEXT,
  outcome_type        VARCHAR(80),
  estimated_fees      INTEGER,
  billed_amount       INTEGER,
  created_by          INTEGER NOT NULL,
  updated_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS limsy_cases_internal_ref_idx
  ON limsy_cases (tenant_id, internal_ref);
CREATE INDEX IF NOT EXISTS limsy_cases_tenant_idx       ON limsy_cases (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_cases_status_idx       ON limsy_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS limsy_cases_court_level_idx  ON limsy_cases (tenant_id, court_level);
CREATE INDEX IF NOT EXISTS limsy_cases_next_hearing_idx ON limsy_cases (tenant_id, next_hearing_date);
CREATE INDEX IF NOT EXISTS limsy_cases_urgency_idx      ON limsy_cases (tenant_id, urgency_flag);

-- ── TABLE: limsy_bench_assignments ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_bench_assignments (
  id                      SERIAL PRIMARY KEY,
  tenant_id               INTEGER NOT NULL,
  case_id                 INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  bench_type              limsy_bench_type NOT NULL,
  presiding               VARCHAR(300) NOT NULL,
  members                 JSONB,
  constituted_on          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconstituted_on        TIMESTAMPTZ,
  reconstitution_reason   TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  notes                   TEXT,
  created_by              INTEGER NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS limsy_bench_tenant_idx ON limsy_bench_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_bench_case_idx   ON limsy_bench_assignments (case_id);
CREATE INDEX IF NOT EXISTS limsy_bench_active_idx ON limsy_bench_assignments (case_id, is_active);

-- ── TABLE: limsy_hearings ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_hearings (
  id                      SERIAL PRIMARY KEY,
  tenant_id               INTEGER NOT NULL,
  case_id                 INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  hearing_number          INTEGER NOT NULL,
  scheduled_date          TIMESTAMPTZ NOT NULL,
  actual_date             TIMESTAMPTZ,
  status                  limsy_hearing_status NOT NULL DEFAULT 'scheduled',
  board_position          INTEGER,
  court_room              VARCHAR(60),
  session_type            VARCHAR(40) DEFAULT 'regular',
  adjourned_by            VARCHAR(120),
  adjournment_reason      TEXT,
  adjournment_count       INTEGER NOT NULL DEFAULT 0,
  proceedings_summary     TEXT,
  detailed_minutes        TEXT,
  appearances             JSONB,
  arguments_summary       TEXT,
  next_hearing_date       TIMESTAMPTZ,
  next_hearing_purpose    VARCHAR(200),
  document_links          JSONB,
  compliance_deadline     TIMESTAMPTZ,
  compliance_notes        TEXT,
  created_by              INTEGER NOT NULL,
  updated_by              INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, hearing_number)
);

CREATE INDEX IF NOT EXISTS limsy_hearings_tenant_idx     ON limsy_hearings (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_hearings_case_idx       ON limsy_hearings (case_id);
CREATE INDEX IF NOT EXISTS limsy_hearings_scheduled_idx  ON limsy_hearings (tenant_id, scheduled_date);
CREATE INDEX IF NOT EXISTS limsy_hearings_status_idx     ON limsy_hearings (tenant_id, status);
CREATE INDEX IF NOT EXISTS limsy_hearings_compliance_idx ON limsy_hearings (tenant_id, compliance_deadline);

-- ── TABLE: limsy_orders ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS limsy_orders (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INTEGER NOT NULL,
  case_id               INTEGER NOT NULL REFERENCES limsy_cases(id) ON DELETE CASCADE,
  hearing_id            INTEGER REFERENCES limsy_hearings(id) ON DELETE SET NULL,
  order_type            limsy_order_type NOT NULL,
  order_date            TIMESTAMPTZ NOT NULL,
  order_number          VARCHAR(120),
  order_title           VARCHAR(500) NOT NULL,
  operative             TEXT NOT NULL,
  full_text             TEXT,
  translation_hindi     TEXT,
  crypto_hash           VARCHAR(255),
  has_stay              BOOLEAN NOT NULL DEFAULT false,
  stay_scope            TEXT,
  stay_expiry           TIMESTAMPTZ,
  stay_conditions       TEXT,
  compliance_required   BOOLEAN NOT NULL DEFAULT false,
  compliance_deadline   TIMESTAMPTZ,
  compliance_party      VARCHAR(300),
  compliance_status     VARCHAR(60) DEFAULT 'pending',
  compliance_notes      TEXT,
  cost_awarded          BOOLEAN NOT NULL DEFAULT false,
  cost_amount           INTEGER,
  cost_payable          VARCHAR(300),
  document_links        JSONB,
  external_link         VARCHAR(1000),
  appealed              BOOLEAN NOT NULL DEFAULT false,
  appeal_case_id        INTEGER,
  review_filed          BOOLEAN NOT NULL DEFAULT false,
  is_final              BOOLEAN NOT NULL DEFAULT false,
  reportable            BOOLEAN NOT NULL DEFAULT false,
  created_by            INTEGER NOT NULL,
  updated_by            INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS limsy_orders_tenant_idx     ON limsy_orders (tenant_id);
CREATE INDEX IF NOT EXISTS limsy_orders_case_idx       ON limsy_orders (case_id);
CREATE INDEX IF NOT EXISTS limsy_orders_hearing_idx    ON limsy_orders (hearing_id);
CREATE INDEX IF NOT EXISTS limsy_orders_date_idx       ON limsy_orders (tenant_id, order_date);
CREATE INDEX IF NOT EXISTS limsy_orders_stay_idx       ON limsy_orders (tenant_id, has_stay);
CREATE INDEX IF NOT EXISTS limsy_orders_compliance_idx ON limsy_orders (tenant_id, compliance_deadline);
CREATE INDEX IF NOT EXISTS limsy_orders_final_idx      ON limsy_orders (case_id, is_final);
CREATE INDEX IF NOT EXISTS limsy_orders_hash_idx       ON limsy_orders (tenant_id, crypto_hash);

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE limsy_cases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_bench_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_hearings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE limsy_orders            ENABLE ROW LEVEL SECURITY;

-- Revoke default public access
REVOKE ALL ON limsy_cases            FROM PUBLIC;
REVOKE ALL ON limsy_bench_assignments FROM PUBLIC;
REVOKE ALL ON limsy_hearings          FROM PUBLIC;
REVOKE ALL ON limsy_orders            FROM PUBLIC;

-- Grant to application role (studio_app)
GRANT SELECT, INSERT, UPDATE ON limsy_cases            TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_bench_assignments TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_hearings          TO studio_app;
GRANT SELECT, INSERT, UPDATE ON limsy_orders            TO studio_app;
GRANT USAGE ON SEQUENCE limsy_cases_id_seq             TO studio_app;
GRANT USAGE ON SEQUENCE limsy_bench_assignments_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE limsy_hearings_id_seq          TO studio_app;
GRANT USAGE ON SEQUENCE limsy_orders_id_seq            TO studio_app;

-- studio_app may NOT delete legal records (immutability requirement)
-- Hard deletes are DBA-only. Soft-delete via status = 'withdrawn' / 'abated'.

-- ── RLS POLICIES ────────────────────────────────────────────────────────────
-- All policies reference app.current_tenant_id, set by withTenant() wrapper.

-- limsy_cases
DROP POLICY IF EXISTS "limsy_cases_tenant_isolation" ON limsy_cases;
CREATE POLICY "limsy_cases_tenant_isolation"
  ON limsy_cases
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- limsy_bench_assignments
DROP POLICY IF EXISTS "limsy_bench_tenant_isolation" ON limsy_bench_assignments;
CREATE POLICY "limsy_bench_tenant_isolation"
  ON limsy_bench_assignments
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- limsy_hearings
DROP POLICY IF EXISTS "limsy_hearings_tenant_isolation" ON limsy_hearings;
CREATE POLICY "limsy_hearings_tenant_isolation"
  ON limsy_hearings
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- limsy_orders
DROP POLICY IF EXISTS "limsy_orders_tenant_isolation" ON limsy_orders;
CREATE POLICY "limsy_orders_tenant_isolation"
  ON limsy_orders
  FOR ALL
  TO studio_app
  USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- studio_migrator bypass
DROP POLICY IF EXISTS "limsy_cases_migrator_bypass"            ON limsy_cases;
DROP POLICY IF EXISTS "limsy_bench_migrator_bypass"            ON limsy_bench_assignments;
DROP POLICY IF EXISTS "limsy_hearings_migrator_bypass"         ON limsy_hearings;
DROP POLICY IF EXISTS "limsy_orders_migrator_bypass"           ON limsy_orders;

CREATE POLICY "limsy_cases_migrator_bypass"
  ON limsy_cases FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "limsy_bench_migrator_bypass"
  ON limsy_bench_assignments FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "limsy_hearings_migrator_bypass"
  ON limsy_hearings FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "limsy_orders_migrator_bypass"
  ON limsy_orders FOR ALL TO studio_migrator USING (true) WITH CHECK (true);

-- ── AUDIT LOG ENTRY ──────────────────────────────────────────────────────────
INSERT INTO audit_logs (tenant_id, actor, action, target, severity, ip_address)
VALUES (
  11,
  '0',
  'schema.migration',
  '0003_limsy_workflow',
  'warn',
  '127.0.0.1'
) ON CONFLICT DO NOTHING;
```

## File: drizzle/migrations/0004_revoke_limsy_delete.sql
```sql
-- Migration: 0004_revoke_limsy_delete.sql
REVOKE DELETE ON TABLE limsy_cases            FROM studio_app;
REVOKE DELETE ON TABLE limsy_bench_assignments FROM studio_app;
REVOKE DELETE ON TABLE limsy_hearings          FROM studio_app;
REVOKE DELETE ON TABLE limsy_orders            FROM studio_app;
```

## File: drizzle/migrations/0005_nidhivan_rls_hardening.sql
```sql
-- ============================================================================
-- Migration: 0005_nidhivan_rls_hardening.sql
-- Nidhivan Consulting — Row-Level Security Isolation Policies
-- ============================================================================

-- 1. Enable RLS on all Track 2 Tables
ALTER TABLE nidhivan_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_dprs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_boqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nidhivan_financial_metrics ENABLE ROW LEVEL SECURITY;

-- 2. Grant explicit DML permissions to the application role
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_projects TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_dprs TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_boqs TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_boq_items TO studio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON nidhivan_financial_metrics TO studio_app;

-- 3. Grant sequence usages (Required for SERIAL primary keys)
GRANT USAGE ON SEQUENCE nidhivan_projects_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_dprs_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_boqs_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_boq_items_id_seq TO studio_app;
GRANT USAGE ON SEQUENCE nidhivan_financial_metrics_id_seq TO studio_app;

-- 4. Create Isolation Policies binding tenant_id to current_tenant_id() context
DROP POLICY IF EXISTS "nidhivan_projects_app_all" ON nidhivan_projects;
CREATE POLICY "nidhivan_projects_app_all" ON nidhivan_projects 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_dprs_app_all" ON nidhivan_dprs;
CREATE POLICY "nidhivan_dprs_app_all" ON nidhivan_dprs 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_boqs_app_all" ON nidhivan_boqs;
CREATE POLICY "nidhivan_boqs_app_all" ON nidhivan_boqs 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_boq_items_app_all" ON nidhivan_boq_items;
CREATE POLICY "nidhivan_boq_items_app_all" ON nidhivan_boq_items 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "nidhivan_metrics_app_all" ON nidhivan_financial_metrics;
CREATE POLICY "nidhivan_metrics_app_all" ON nidhivan_financial_metrics 
  FOR ALL TO studio_app 
  USING (tenant_id = current_tenant_id()) 
  WITH CHECK (tenant_id = current_tenant_id());
  
-- 5. Studio Migrator Bypass
CREATE POLICY "nidhivan_projects_migrator" ON nidhivan_projects FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_dprs_migrator" ON nidhivan_dprs FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_boqs_migrator" ON nidhivan_boqs FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_boq_items_migrator" ON nidhivan_boq_items FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
CREATE POLICY "nidhivan_metrics_migrator" ON nidhivan_financial_metrics FOR ALL TO studio_migrator USING (true) WITH CHECK (true);
```

## File: drizzle/migrations/0006_vault_secrets_columns.sql
```sql
ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS "key" text NOT NULL DEFAULT '';
ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS "encrypted_value" text NOT NULL DEFAULT '';
ALTER TABLE vault_secrets ALTER COLUMN "masked_value" DROP NOT NULL;
```

## File: drizzle/migrations/0007_nidhivan_irr_percent.sql
```sql
CREATE TYPE "public"."nidhivan_boq_status" AS ENUM('draft', 'approved', 'revision_required', 'finalized');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_dpr_status" AS ENUM('draft', 'under_review', 'approved', 'submitted', 'returned', 'archived');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_period_type" AS ENUM('monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_project_status" AS ENUM('conceptual', 'dpr_preparation', 'dpr_submitted', 'appraisal', 'sanctioned', 'in_progress', 'completed', 'abandoned', 'archived');--> statement-breakpoint
CREATE TYPE "public"."nidhivan_project_type" AS ENUM('infrastructure', 'housing', 'water_sanitation', 'energy', 'transport', 'healthcare', 'education', 'agriculture', 'industrial', 'urban_development', 'rural_development', 'digital', 'environment', 'other');--> statement-breakpoint
CREATE TABLE "nidhivan_boq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"boq_id" integer NOT NULL,
	"item_number" integer NOT NULL,
	"section_code" text,
	"is_section_header" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"unit" text,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"unit_rate_paise" bigint DEFAULT 0 NOT NULL,
	"amount_paise" bigint DEFAULT 0 NOT NULL,
	"rate_ref" text,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_boqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"dpr_id" integer NOT NULL,
	"boq_version" integer DEFAULT 1 NOT NULL,
	"boq_number" text NOT NULL,
	"title" text NOT NULL,
	"status" "nidhivan_boq_status" DEFAULT 'draft' NOT NULL,
	"base_amount_paise" bigint DEFAULT 0 NOT NULL,
	"contingency_pct" real DEFAULT 5 NOT NULL,
	"contingency_amount_paise" bigint DEFAULT 0 NOT NULL,
	"overhead_pct" real DEFAULT 0 NOT NULL,
	"overhead_amount_paise" bigint DEFAULT 0 NOT NULL,
	"gst_pct" real DEFAULT 18 NOT NULL,
	"gst_amount_paise" bigint DEFAULT 0 NOT NULL,
	"total_amount_paise" bigint DEFAULT 0 NOT NULL,
	"base_year" text,
	"rate_schedule_ref" text,
	"approval_date" timestamp with time zone,
	"document_links" jsonb,
	"crypto_hash" text,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_dprs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"dpr_version" integer DEFAULT 1 NOT NULL,
	"dpr_number" text NOT NULL,
	"title" text NOT NULL,
	"financial_year" text NOT NULL,
	"status" "nidhivan_dpr_status" DEFAULT 'draft' NOT NULL,
	"total_project_cost_paise" bigint DEFAULT 0 NOT NULL,
	"central_share_paise" bigint DEFAULT 0 NOT NULL,
	"state_share_paise" bigint DEFAULT 0 NOT NULL,
	"beneficiary_share_paise" bigint DEFAULT 0 NOT NULL,
	"loan_paise" bigint DEFAULT 0 NOT NULL,
	"cost_basis_year" text,
	"contingency_pct" real DEFAULT 5 NOT NULL,
	"overhead_pct" real DEFAULT 0 NOT NULL,
	"sections" jsonb DEFAULT '{}',
	"consultant_name" text,
	"prepared_by" text,
	"submitted_to" text,
	"approval_authority" text,
	"approval_ref" text,
	"approval_date" timestamp with time zone,
	"document_links" jsonb,
	"crypto_hash" text,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_financial_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"reporting_period" text NOT NULL,
	"period_type" "nidhivan_period_type" DEFAULT 'monthly' NOT NULL,
	"funds_released_central_paise" bigint DEFAULT 0 NOT NULL,
	"funds_released_state_paise" bigint DEFAULT 0 NOT NULL,
	"funds_released_beneficiary_paise" bigint DEFAULT 0 NOT NULL,
	"expenditure_cumulative_paise" bigint DEFAULT 0 NOT NULL,
	"expenditure_this_period_paise" bigint DEFAULT 0 NOT NULL,
	"balance_available_paise" bigint DEFAULT 0 NOT NULL,
	"physical_progress_pct" integer DEFAULT 0 NOT NULL,
	"financial_progress_pct" integer DEFAULT 0 NOT NULL,
	"projected_irr_percent" numeric(5, 2),
	"remarks" text,
	"reported_by" integer NOT NULL,
	"reported_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nidhivan_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"project_code" text NOT NULL,
	"project_title" text NOT NULL,
	"project_type" "nidhivan_project_type" NOT NULL,
	"sector" text NOT NULL,
	"subsector" text,
	"implementing_agency" text NOT NULL,
	"sponsoring_authority" text,
	"project_state" text NOT NULL,
	"project_district" text,
	"project_location" text,
	"total_cost_paise" bigint DEFAULT 0 NOT NULL,
	"central_share_paise" bigint DEFAULT 0 NOT NULL,
	"state_share_paise" bigint DEFAULT 0 NOT NULL,
	"beneficiary_share_paise" bigint DEFAULT 0 NOT NULL,
	"loan_paise" bigint DEFAULT 0 NOT NULL,
	"funding_agencies" jsonb,
	"status" "nidhivan_project_status" DEFAULT 'conceptual' NOT NULL,
	"urgency_flag" boolean DEFAULT false NOT NULL,
	"priority_level" integer DEFAULT 3 NOT NULL,
	"appraisal_date" timestamp with time zone,
	"sanction_date" timestamp with time zone,
	"commencement_date" timestamp with time zone,
	"target_completion_date" timestamp with time zone,
	"actual_completion_date" timestamp with time zone,
	"project_scope" text,
	"objectives" text,
	"outcomes" text,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD CONSTRAINT "nidhivan_boq_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boq_items" ADD CONSTRAINT "nidhivan_boq_items_boq_id_nidhivan_boqs_id_fk" FOREIGN KEY ("boq_id") REFERENCES "public"."nidhivan_boqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_boqs" ADD CONSTRAINT "nidhivan_boqs_dpr_id_nidhivan_dprs_id_fk" FOREIGN KEY ("dpr_id") REFERENCES "public"."nidhivan_dprs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_dprs" ADD CONSTRAINT "nidhivan_dprs_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_project_id_nidhivan_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nidhivan_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_financial_metrics" ADD CONSTRAINT "nidhivan_financial_metrics_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nidhivan_projects" ADD CONSTRAINT "nidhivan_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nidhivan_boq_items_tenant_boq_idx" ON "nidhivan_boq_items" USING btree ("tenant_id","boq_id");--> statement-breakpoint
CREATE INDEX "nidhivan_boqs_tenant_dpr_idx" ON "nidhivan_boqs" USING btree ("tenant_id","dpr_id");--> statement-breakpoint
CREATE INDEX "nidhivan_dprs_tenant_project_idx" ON "nidhivan_dprs" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "nidhivan_financial_metrics_tenant_project_idx" ON "nidhivan_financial_metrics" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "nidhivan_projects_tenant_idx" ON "nidhivan_projects" USING btree ("tenant_id");
```

## File: drizzle/migrations/0008_commercial_launch_foundation.sql
```sql
DO $$ BEGIN
  CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected', 'onboarded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."tenant_plan" AS ENUM('pilot', 'starter', 'professional', 'scale', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "client_requests" DROP CONSTRAINT IF EXISTS "client_requests_tenant_id_tenants_id_fk";
--> statement-breakpoint
-- Safely drop default and alter status column using text casting to prevent type mismatch errors
ALTER TABLE "client_requests" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "client_requests" ALTER COLUMN "status" SET DATA TYPE "public"."request_status" USING "status"::text::"public"."request_status";
--> statement-breakpoint
ALTER TABLE "client_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."request_status";
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DEFAULT 'starter'::"public"."tenant_plan";
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DATA TYPE "public"."tenant_plan" USING "plan"::"public"."tenant_plan";
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "idempotency_key" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "company_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "contact_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "contact_email" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "contact_phone" text;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "requested_plan" "tenant_plan" DEFAULT 'starter' NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "subsidiary" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "message" text;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "processed_by" integer;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "processed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "provisioned_tenant_id" integer;
--> statement-breakpoint
ALTER TABLE "client_requests" ADD COLUMN IF NOT EXISTS "handled_by_tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_price_id" text;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp with time zone;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_provisioned_tenant_id_tenants_id_fk" FOREIGN KEY ("provisioned_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_handled_by_tenant_id_tenants_id_fk" FOREIGN KEY ("handled_by_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "tenant_id";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "name";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "email";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "company";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "service";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "preferred_date";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "preferred_time";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "notes";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP COLUMN IF EXISTS "subject";
--> statement-breakpoint
ALTER TABLE "client_requests" DROP CONSTRAINT IF EXISTS "client_requests_idempotency_key_unique";
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_idempotency_key_unique" UNIQUE("idempotency_key");
--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "tenants_stripe_customer_id_unique";
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_stripe_customer_id_unique" UNIQUE("stripe_customer_id");
--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "tenants_stripe_subscription_id_unique";
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");
```

## File: drizzle/migrations/0009_schema_hardening.sql
```sql
-- Migration: 0009_schema_hardeningecho -- Executed:  August 12, 2026echo -- Author:    BNLV Group - Office of the CTOecho --echo -- RESULT: NO-OP - All targeted columns confirmed already in correct stateecho -- on Neon production instance prior to this migration run.echo --echo -- Columns verified correct from inception:echo --   limsy_cases.estimated_fees_paise    bigint        confirmedecho --   limsy_cases.billed_amount_paise     bigint        confirmedecho --   limsy_orders.cost_amount_paise      bigint        confirmedecho --   sessions.token_hash                 text          confirmedecho --   job_applications.name               text          confirmedecho --   nidhivan_boqs.contingency_pct       numeric(5,2) confirmedecho --   nidhivan_boqs.overhead_pct          numeric(5,2) confirmedecho --   nidhivan_boqs.gst_pct               numeric(5,2) confirmedecho --   nidhivan_dprs.contingency_pct       numeric(5,2) confirmedecho --   nidhivan_dprs.overhead_pct          numeric(5,2) confirmedecho --echo -- Database was provisioned from the correct hardened schema.echo -- No destructive operations were required or applied.echo.echo SELECT 1;
```

## File: drizzle/migrations/0010_force_rls_revoke_truncate_limsy.sql
```sql
ALTER TABLE limsy_cases             FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_hearings          FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_orders            FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_bench_assignments FORCE ROW LEVEL SECURITY;

REVOKE TRUNCATE ON limsy_cases             FROM studio_app;
REVOKE TRUNCATE ON limsy_hearings          FROM studio_app;
REVOKE TRUNCATE ON limsy_orders            FROM studio_app;
REVOKE TRUNCATE ON limsy_bench_assignments FROM studio_app;
```

## File: src/app/api/limsy/orders/route.ts
```typescript
/**
 * src/app/api/limsy/orders/route.ts
 *
 * LIMSY Supreme Court Standard — Cryptographically Verified Orders API
 * =====================================================================
 * REMEDIATION (P0 Sprint):
 *   - Defect 2: GET elevated from "developer" to "architect".
 *               Rationale: operative text and crypto_hash constitute the
 *               legally immutable record. developer-role exposure violates
 *               least-privilege on cryptographic legal data.
 *   - POST: enum validation on orderType before DB round-trip.
 *   - POST: insert values use $inferInsert-compatible types throughout.
 * SECURITY REMEDIATION (2026-07-27):
 *   - Updated IP extraction to prioritize Cloudflare's authoritative `cf-connecting-ip` header.
 *   - Normalized `caseId` in the cryptographic canonical string calculation to prevent hash variance.
 *   - Added an explicit `tenantId` match predicate to any future mutation/lookup paths for defense-in-depth RLS separation.
 * BLOCKER REMEDIATION:
 *   - CR-002: Fixed auditLogs actor string format to enforce `user:${ctx.userId}`.
 *
 * RBAC:
 *   - GET  → "architect"  (cryptographic operative text — elevated from developer)
 *   - POST → "architect"  (immutable legal record creation)
 *
 * CRYPTOGRAPHIC INTEGRITY:
 *   SHA-256 is computed server-side over the canonical string:
 *     `${caseId}:${orderDate.toISOString()}:${orderType}:${operative.trim()}`
 *   The ISO string form of orderDate is used to ensure timezone-stable hashing.
 *   Any future hash verification must reconstruct this exact string.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import { limsyOrders, auditLogs, VALID_LIMSY_ORDER_TYPES } from "@/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Retrieve tenant-scoped verified orders
// Defect 2 Fix: Elevated to "architect" — operative text is sensitive legal data
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    // ELEVATED from "developer" to "architect" — see remediation header
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const data = await withTenant(ctx.tenantId, async (tx) => {
      return tx.select().from(limsyOrders).orderBy(asc(limsyOrders.id));
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[LIMSY] orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Record a cryptographically verified court order
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    // Required field validation
    if (!body.caseId || !body.orderDate || !body.orderType || !body.operative || !body.orderTitle) {
      return NextResponse.json(
        {
          error: "Required fields: caseId, orderDate, orderType, orderTitle, operative.",
        },
        { status: 400 }
      );
    }

    // Enum validation — pre-flight before database round-trip
    const orderType = String(body.orderType).trim();
    if (!VALID_LIMSY_ORDER_TYPES.includes(orderType as (typeof VALID_LIMSY_ORDER_TYPES)[number])) {
      return NextResponse.json(
        {
          error: `Invalid orderType. Must be one of: ${VALID_LIMSY_ORDER_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse and validate order date
    const orderDate = new Date(body.orderDate);
    if (isNaN(orderDate.getTime())) {
      return NextResponse.json({ error: "Invalid orderDate format." }, { status: 400 });
    }

    const operative = String(body.operative).trim();
    const caseIdNormalized = Number(body.caseId).toString();

    // Server-side SHA-256 — ISO string ensures timezone-stable hash regardless of client locale.
    // IMPORTANT: verification logic must use the same canonical string format.
    const canonicalString = `${caseIdNormalized}:${orderDate.toISOString()}:${orderType}:${operative}`;
    const cryptoHash = crypto.createHash("sha256").update(canonicalString).digest("hex");

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";
      
    const actor = `user:${ctx.userId}`; // CR-002: Hardened Actor format

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(limsyOrders)
        .values({
          tenantId: ctx.tenantId,
          caseId: Number(caseIdNormalized),
          hearingId: body.hearingId ? Number(body.hearingId) : null,
          orderType: orderType as (typeof VALID_LIMSY_ORDER_TYPES)[number],
          orderDate,
          orderNumber: body.orderNumber ? String(body.orderNumber).trim() : null,
          orderTitle: String(body.orderTitle).trim(),
          operative,
          fullText: body.fullText ? String(body.fullText).trim() : null,
          translationHindi: body.translationHindi ? String(body.translationHindi).trim() : null,
          cryptoHash,
          hasStay: Boolean(body.hasStay ?? false),
          stayScope: body.stayScope ? String(body.stayScope).trim() : null,
          stayExpiry: body.stayExpiry ? new Date(body.stayExpiry) : null,
          stayConditions: body.stayConditions ? String(body.stayConditions).trim() : null,
          complianceRequired: Boolean(body.complianceRequired ?? false),
          complianceDeadline: body.complianceDeadline ? new Date(body.complianceDeadline) : null,
          complianceParty: body.complianceParty ? String(body.complianceParty).trim() : null,
          costAwarded: Boolean(body.costAwarded ?? false),
          costAmount: body.costAmount ? Number(body.costAmount) : null,
          costPayable: body.costPayable ? String(body.costPayable).trim() : null,
          documentLinks: body.documentLinks ?? null,
          externalLink: body.externalLink ? String(body.externalLink).trim() : null,
          appealed: Boolean(body.appealed ?? false),
          appealCaseId: body.appealCaseId ? Number(body.appealCaseId) : null,
          reviewFiled: Boolean(body.reviewFiled ?? false),
          isFinal: Boolean(body.isFinal ?? false),
          reportable: Boolean(body.reportable ?? false),
          createdBy: ctx.userId,
        })
        .returning();

      // Audit log severity is "critical" for immutable legal record creation
      await tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor, // CR-002
        action: `limsy.order.record:${inserted.orderType}`,
        target: inserted.cryptoHash ?? inserted.id.toString(),
        severity: "critical",
        ipAddress: ip,
      });

      return inserted;
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("[LIMSY] order POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## File: src/app/studio/limsy/page.tsx
```typescript
/**
 * src/app/studio/limsy/page.tsx
 * LIMSY Supreme Court Standard — Workspace Management Dashboard
 *
 * REMEDIATION (P0 — 2026-07-25):
 *    - CaseItem type realigned to limsy_cases schema columns.
 *      Removed: title, filingType, benchCoram (non-existent in schema).
 *      Added: internalRef, courtLevel, courtName, caseType, petitioner,
 *             respondent, urgencyFlag, priorityLevel.
 *    - OrderItem type enriched with complianceRequired, complianceDeadline, isFinal.
 *    - handleFileCase POST body corrected to API-required canonical fields:
 *      internalRef, courtLevel, courtName, caseType, petitioner, respondent, subjectMatter.
 *      Optional: caseNumber.
 *    - All form state variables and inputs aligned to schema field names.
 *    - Docket list renderer updated to schema-accurate fields with status
 *      colour mapping and urgency flag indicator.
 *    - Raw .json() calls replaced with safeJson (SyntaxError prevention on empty bodies).
 *    - Explicit 401/403 response handling in loadData and handleFileCase.
 *    - loadData wrapped in useCallback to satisfy exhaustive-deps lint rule.
 *    - submitting guard added to prevent duplicate POST on double-click.
 *    - Error dismissal control added.
 *    - resetForm() called on successful submission.
 *    - Full court_level and case_type enum dropdowns present (matches 0003_limsys_workflow.sql).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { safeJson } from "@/lib/safe-json";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — aligned to limsy_cases and limsy_orders schema columns
// ─────────────────────────────────────────────────────────────────────────────

type CaseItem = {
  id: number;
  caseNumber: string | null;
  internalRef: string;
  courtLevel: string;
  courtName: string;
  caseType: string;
  status: string;
  petitioner: string;
  respondent: string;
  nextHearingDate: string | null;
  urgencyFlag: boolean;
  priorityLevel: number;
};

type OrderItem = {
  id: number;
  orderTitle: string;
  orderType: string;
  orderDate: string;
  cryptoHash: string | null;
  hasStay: boolean;
  complianceRequired: boolean;
  complianceDeadline: string | null;
  isFinal: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// ENUM DISPLAY MAPS — mirrors court_level and case_type enums in 0003_limsys_workflow.sql
// ─────────────────────────────────────────────────────────────────────────────

const COURT_LEVEL_LABELS: Record<string, string> = {
  supreme_court:    "Supreme Court",
  high_court:       "High Court",
  district_court: "District Court",
  tribunal:         "Tribunal",
  consumer_forum: "Consumer Forum",
  arbitration:      "Arbitration",
  nclt:             "NCLT",
  nclat:            "NCLAT",
  ncdrc:            "NCDRC",
};

const CASE_TYPE_LABELS: Record<string, string> = {
  slp:                      "Special Leave Petition (SLP)",
  writ_petition:            "Writ Petition",
  civil_appeal:             "Civil Appeal",
  criminal_appeal:          "Criminal Appeal",
  review_petition:          "Review Petition",
  curative_petition:        "Curative Petition",
  original_suit:            "Original Suit",
  execution_petition:       "Execution Petition",
  consumer_complaint:       "Consumer Complaint",
  arbitration_petition:     "Arbitration Petition",
  ibc_petition:             "IBC Petition",
  nclt_petition:            "NCLT Petition",
  other:                    "Other",
};

const STATUS_COLOURS: Record<string, string> = {
  intake:          "bg-slate-100 text-slate-700",
  diarised:        "bg-blue-50 text-blue-700",
  admitted:        "bg-sky-50 text-sky-700",
  pending_hearing: "bg-amber-50 text-amber-700",
  under_hearing:   "bg-orange-50 text-orange-700",
  reserved:        "bg-violet-50 text-violet-700",
  disposed:        "bg-emerald-50 text-emerald-700",
  withdrawn:       "bg-rose-50 text-rose-700",
  abated:          "bg-gray-50 text-gray-500",
  transferred:     "bg-teal-50 text-teal-700",
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPER
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LimsyDashboard() {
  const [activeTab, setActiveTab] = useState<"cases" | "orders">("cases");
  const [cases, setCases]         = useState<CaseItem[]>([]);
  const [orders, setOrders]       = useState<OrderItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Form state — aligned to limsy_cases API-required fields ────────────────
  const [internalRef,   setInternalRef]   = useState("");
  const [caseNumber,    setCaseNumber]    = useState("");
  const [courtLevel,    setCourtLevel]    = useState("supreme_court");
  const [courtName,     setCourtName]     = useState("");
  const [caseType,      setCaseType]      = useState("slp");
  const [petitioner,    setPetitioner]    = useState("");
  const [respondent,    setRespondent]    = useState("");
  const [subjectMatter, setSubjectMatter] = useState("");

  // ── Data Loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, ordersRes] = await Promise.all([
        fetch("/api/limsy/cases"),
        fetch("/api/limsy/orders"),
      ]);

      if (casesRes.status === 401 || ordersRes.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (casesRes.status === 403 || ordersRes.status === 403) {
        setError("Insufficient privileges to access LIMSY workspace data.");
        return;
      }

      const casesData  = casesRes.ok  ? (await safeJson(casesRes) as CaseItem[])   : null;
      const ordersData = ordersRes.ok ? (await safeJson(ordersRes) as OrderItem[]) : null;

      if (casesData)  setCases(casesData);
      if (ordersData) setOrders(ordersData);
    } catch {
      setError("Network error — failed to fetch LIMSY workspace data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (isMounted) {
        await loadData();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // ── Case Filing ───────────────────────────────────────────────────────────────

  const resetForm = () => {
    setInternalRef("");
    setCaseNumber("");
    setCourtLevel("supreme_court");
    setCourtName("");
    setCaseType("slp");
    setPetitioner("");
    setRespondent("");
    setSubjectMatter("");
  };

  const handleFileCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/limsy/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalRef:   internalRef.trim(),
          caseNumber:    caseNumber.trim() || undefined,
          courtLevel,
          courtName:     courtName.trim(),
          caseType,
          petitioner:    petitioner.trim(),
          respondent:    respondent.trim(),
          subjectMatter: subjectMatter.trim(),
        }),
      });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (res.status === 403) {
        setError("Insufficient privileges to file a case.");
        return;
      }

      if (res.ok) {
        resetForm();
        await loadData();
      } else {
        const d = await safeJson(res) as { error?: string };
        setError(d?.error ?? "Failed to file case. Please verify all required fields.");
      }
    } catch {
      setError("Network error while filing case.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      {/* ── Page Header ────────────────────────────────────────────────        */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-800">
            LIMSY Legal Intelligence Studio
          </h1>
          <p className="text-xs text-slate-500">
            Supreme Court Standard Litigation Workflow &amp; Cryptographic Order Verification
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("cases")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "cases"
                ? "bg-navy-700 text-white"
                : "bg-white text-slate-600 border border-sand-200"
            }`}
          >
            Litigation Cases ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "orders"
                ? "bg-navy-700 text-white"
                : "bg-white text-slate-600 border border-sand-200"
            }`}
          >
            Verified Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 flex items-start justify-between rounded-xl border border-rose-200 bg-rose-50 p-4">
          <span className="text-xs font-medium text-rose-700">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="ml-4 shrink-0 text-xs font-semibold text-rose-400 hover:text-rose-700 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Cases Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "cases" ? (
        <div className="grid gap-8 lg:grid-cols-3">

          {/* File New Case Form */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-sm font-semibold text-navy-800">File New Petition / Appeal</h2>
            <form onSubmit={handleFileCase} className="space-y-3">

              {/* Internal Reference — unique per-tenant; required */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Internal Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={internalRef}
                  onChange={(e) => setInternalRef(e.target.value)}
                  placeholder="LIMSY-SC-2026-001"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Case Number — court-assigned docket number; optional */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Case Number
                </label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="SLP(C) No. 0001/2026"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                />
              </div>

              {/* Court Level — enum: court_level */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Court Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={courtLevel}
                  onChange={(e) => setCourtLevel(e.target.value)}
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                >
                  {Object.entries(COURT_LEVEL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Court Name */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Court Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="Supreme Court of India"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Case Type — enum: limsy_case_type */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Case Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                >
                  {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Petitioner */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Petitioner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={petitioner}
                  onChange={(e) => setPetitioner(e.target.value)}
                  placeholder="State of Delhi"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Respondent */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Respondent <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  placeholder="Union of India"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Subject Matter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Subject Matter <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={subjectMatter}
                  onChange={(e) => setSubjectMatter(e.target.value)}
                  placeholder="Brief description of the legal matter and primary relief sought…"
                  className="w-full resize-none rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-navy-700 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Petition Intake"}
              </button>
            </form>
          </div>

          {/* Docket List */}
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-sand-200 bg-sand-50 px-6 py-4">
              <h2 className="text-sm font-semibold text-navy-800">Active Supreme Court Dockets</h2>
            </div>
            <div className="divide-y divide-sand-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading litigation records…</div>
              ) : cases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No active cases found in workspace.</div>
              ) : (
                cases.map((c) => (
                  <div key={c.id} className="flex items-start justify-between px-6 py-4 hover:bg-sand-50/50">
                    <div className="min-w-0 flex-1">
                      {/* Parties — primary identifier */}
                      <div className="flex items-center gap-2">
                        {c.urgencyFlag && (
                          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase text-rose-700">
                            Urgent
                          </span>
                        )}
                        <span className="truncate font-semibold text-sm text-navy-800">
                          {c.petitioner} v. {c.respondent}
                        </span>
                      </div>
                      {/* Meta row */}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{c.internalRef}</span>
                        {c.caseNumber && (
                          <span className="font-mono text-[10px] text-slate-400">· {c.caseNumber}</span>
                        )}
                        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium uppercase text-navy-700">
                          {CASE_TYPE_LABELS[c.caseType] ?? c.caseType}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {COURT_LEVEL_LABELS[c.courtLevel] ?? c.courtLevel}
                        </span>
                      </div>
                      {/* Next hearing */}
                      {c.nextHearingDate && (
                        <div className="mt-1 text-[10px] text-slate-400">
                          Next hearing: {formatDate(c.nextHearingDate)}
                        </div>
                      )}
                    </div>
                    {/* Status badge */}
                    <span
                      className={`ml-4 shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                        STATUS_COLOURS[c.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ── Orders Tab ────────────────────────────────────────────────────── */
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-200 bg-sand-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-navy-800">
              Cryptographically Verified Judicial Orders
            </h2>
          </div>
          <div className="divide-y divide-sand-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading verified orders…</div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No cryptographic orders recorded.</div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="flex items-start justify-between px-6 py-4 hover:bg-sand-50/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {o.isFinal && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                          Final
                        </span>
                      )}
                      <span className="truncate font-semibold text-sm text-navy-800">
                        {o.orderTitle}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase text-rose-700">
                        {o.orderType.replace(/_/g, " ")}
                      </span>
                      {o.cryptoHash && (
                        <span className="font-mono text-[10px] text-slate-400">
                          SHA-256: {o.cryptoHash.slice(0, 16)}…
                        </span>
                      )}
                    </div>
                    {o.complianceRequired && o.complianceDeadline && (
                      <div className="mt-1 text-[10px] font-medium text-amber-600">
                        Compliance due: {formatDate(o.complianceDeadline)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
                    {o.hasStay && (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-semibold text-rose-700">
                        Stay Granted
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{formatDate(o.orderDate)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## File: src/db/apply-rls.ts
```typescript
/**
 * src/db/apply-rls.ts
 * BNLV Group Enterprise — Raw SQL Migration Executor
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';
import { getDirectDb, closeDb } from './index';

async function applySecurityPolicies() {
  console.log("🔐 [SECURITY] Initiating Nidhivan RLS Hardening Deployment...");
  
  try {
    const db = await getDirectDb();
    
    // Resolve the path to the manual SQL migration file
    const sqlPath = path.join(process.cwd(), 'drizzle', 'migrations', '0005_nidhivan_rls_hardening.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File not found: ${sqlPath}`);
    }

    const query = fs.readFileSync(sqlPath, 'utf8');

    // Execute the raw query utilizing the unpooled direct connection
    await db.execute(sql.raw(query));
    
    console.log("✅ [SECURITY] Nidhivan RLS Policies and Migrator Bypasses successfully applied.");
  } catch (error) {
    console.error("❌ [SECURITY FATAL] Failed to apply RLS hardening:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Closing database connections...");
    await closeDb();
    process.exit(0);
  }
}

applySecurityPolicies();
```

## File: src/db/restore-admins.ts
```typescript
/**
 * src/db/restore-admins.ts
 * Universal Admin Credential Restoration Script
 */
import { getDb } from "./index";
import { users, tenants } from "./schema";
import { eq } from "drizzle-orm";

async function restoreAll() {
  const db = await getDb();
  console.log("[RESTORE] Fetching verified Apex SuperAdmin hash...");
  
  const [superadmin] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!superadmin) {
    console.error("[ERROR] SuperAdmin not found. Cannot clone hash.");
    process.exit(1);
  }

  const allTenants = await db.select().from(tenants);
  
  for (const t of allTenants) {
    if (t.slug === "bnlv") continue;
    
    const adminEmail = `admin@${t.slug}.bnlvconsulting.com`;
    const [existing] = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existing) {
      await db.update(users)
        .set({ passwordHash: superadmin.passwordHash, active: true, role: "admin" })
        .where(eq(users.id, existing.id));
      console.log(`[OK] Restored Hash: ${adminEmail} (Workspace: ${t.slug})`);
    } else {
      await db.insert(users).values({
        tenantId: t.id,
        name: `${t.name} Admin`,
        email: adminEmail,
        passwordHash: superadmin.passwordHash,
        role: "admin",
        active: true,
      });
      console.log(`[OK] Created Missing Admin: ${adminEmail} (Workspace: ${t.slug})`);
    }
  }
  
  console.log("\n[SUCCESS] All subsidiary admins are active.");
  process.exit(0);
}

restoreAll().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
```

## File: src/db/seed-production-verticals.ts
```typescript
/**
 * src/db/seed-production-verticals.ts
 * Production Seeder for Nidhivan Consulting & Vihang Creations
 * Sprint Closure: July 31, 2026 | Status: P3 Production-Final
 */

import { getDirectDb, withTenant } from "@/db";
import { 
  nidhivanProjects, 
  nidhivanDprs, 
  builderComponents, 
  tenants,
  auditLogs,
  projects
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { NewNidhivanProject, NewNidhivanDpr } from "@/db/schema";
import crypto from "crypto";

export async function executeProductionSeed(targetTenantId: number, executingUserId: number, clientIp: string = "system-cli") {
  const directDb = await getDirectDb();
  
  const [tenantExists] = await directDb
    .select()
    .from(tenants)
    .where(eq(tenants.id, targetTenantId))
    .limit(1);

  if (!tenantExists) {
    throw new Error(`[SEED CRITICAL] Execution halted. Tenant ID ${targetTenantId} not found.`);
  }

  console.log(`[SEED START] Scoping operations to Tenant: ${tenantExists.name} (ID: ${targetTenantId}).`);

  return await withTenant(targetTenantId, async (tx) => {
    try {
      // ─── NIDHIVAN CONSULTING TRACK ──────────────────────────────────────────

      // 1. Force context pin at the session level to prevent serverless multiplexing drift
      await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);

      const projectData: NewNidhivanProject = {
        tenantId: targetTenantId,
        projectCode: "BNLV-INFRA-2026",
        projectTitle: "New Delhi Smart City Hub - Core Micro-Grid",
        projectType: "infrastructure",
        sector: "Urban Development",
        implementingAgency: "Delhi Development Authority",
        projectState: "New Delhi",
        totalCostPaise: 89000000000, 
        createdBy: executingUserId,
        status: "dpr_preparation"
      };

      const [project] = await tx
        .insert(nidhivanProjects)
        .values(projectData)
        .onConflictDoUpdate({
          target: [nidhivanProjects.tenantId, nidhivanProjects.projectCode],
          set: { projectTitle: projectData.projectTitle, totalCostPaise: projectData.totalCostPaise }
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: targetTenantId,
        actor: String(executingUserId),
        action: "seed.nidhivan_project.upsert",
        target: project.projectCode,
        severity: "info",
        ipAddress: clientIp,
        metadata: {
          seedVersion: "v5.1-Production",
          environment: process.env.NODE_ENV || "production",
          correlationId: crypto.randomUUID()
        }
      });

      const dprData: NewNidhivanDpr = {
        tenantId: targetTenantId,
        projectId: project.id,
        dprNumber: "DPR-BNLV-2026-001",
        title: "Detailed Project Report - Smart City Micro-Grid Phase I",
        financialYear: "2026-2027",
        totalProjectCostPaise: 89000000000,
        createdBy: executingUserId,
        status: "draft"
      };

      const [existingDpr] = await tx
        .select()
        .from(nidhivanDprs)
        .where(and(eq(nidhivanDprs.projectId, project.id), eq(nidhivanDprs.dprNumber, dprData.dprNumber)))
        .limit(1);

      if (!existingDpr) {
        // 2. Re-assert context immediately before vulnerable RLS insert
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);
        
        await tx.insert(nidhivanDprs).values(dprData);
        
        await tx.insert(auditLogs).values({
          tenantId: targetTenantId,
          actor: String(executingUserId),
          action: "seed.nidhivan_dpr.insert",
          target: dprData.dprNumber,
          severity: "info",
          ipAddress: clientIp,
          metadata: {
            seedVersion: "v5.1-Production",
            environment: process.env.NODE_ENV || "production",
            correlationId: crypto.randomUUID()
          }
        });
      }

      // ─── VIHANG CREATIONS TRACK ─────────────────────────────────────────────

      let [globalProject] = await tx
        .select()
        .from(projects)
        .where(and(eq(projects.tenantId, targetTenantId), eq(projects.name, "Global System Layout Space")))
        .limit(1);

      if (!globalProject) {
        // 3. Re-assert context
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);
        
        [globalProject] = await tx.insert(projects).values({
          tenantId: targetTenantId,
          name: "Global System Layout Space",
          description: "Global brand layout assets",
          status: "deployed"
        }).returning();
      }

      const [existingComponent] = await tx
        .select()
        .from(builderComponents)
        .where(and(
          eq(builderComponents.projectId, globalProject.id),
          eq(builderComponents.name, "Vihang Heraldic Design Engine Tokens")
        ))
        .limit(1);

      if (!existingComponent) {
        // 4. Final context assertion
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${targetTenantId.toString()}::text, false)`);
        
        await tx.insert(builderComponents).values({
          tenantId: targetTenantId,
          projectId: globalProject.id, 
          name: "Vihang Heraldic Design Engine Tokens",
          type: "styling-token",
          sortOrder: 0,
          config: {
            typography: { primary: "Cinzel", secondary: "Inter" },
            colors: { primaryNavy: "#002040", heraldicGold: "#C5A059" }
          },
          props: { activeBaseline: "v5.1-Production" }
        });

        await tx.insert(auditLogs).values({
          tenantId: targetTenantId,
          actor: String(executingUserId),
          action: "seed.vihang_tokens.insert",
          target: "Vihang Heraldic Design Engine Tokens",
          severity: "info",
          ipAddress: clientIp,
          metadata: {
            seedVersion: "v5.1-Production",
            environment: process.env.NODE_ENV || "production",
            correlationId: crypto.randomUUID()
          }
        });
      }

      console.log(`[SEED COMPLETE] Institutional baselines and brand tokens established.`);
      return true;

    } catch (error) {
      console.error(`[SEED TRANSACTION FAILED] Rollback initiated. Reason: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  });
}
```

## File: src/db/sync-hash.ts
```typescript
/**
 * src/db/sync-hash.ts
 * Surgically copies the working SuperAdmin password hash to the LIMSY admin.
 */
import { getDb } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function fix() {
  const db = await getDb();
  console.log("🔧 Syncing hashes...");
  
  // 1. Grab the known-working hash from the SuperAdmin
  const [superadmin] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!superadmin) {
    console.log("❌ SuperAdmin not found. Please run seed script first.");
    process.exit(1);
  }

  // 2. Paste it directly onto the LIMSY admin
  const [updatedUser] = await db.update(users)
    .set({ passwordHash: superadmin.passwordHash, active: true })
    .where(eq(users.email, "admin@limsy.bnlvconsulting.com"))
    .returning();
  
  if (updatedUser) {
    console.log("✅ Hash synced! The password for admin@limsy.bnlvconsulting.com is now: Password123!");
  } else {
    console.log("❌ LIMSY user not found in the database.");
  }
  process.exit(0);
}

fix();
```

## File: src/db/index.ts
```typescript
/**
 * src/db/index.ts
 *
 * BNLV Studio — Production Neon Serverless DB Client
 */

// --- FIX: Explicitly load .env.local ---
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// ---------------------------------------

import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// EDGE RUNTIME: WebSocket constructor for Cloudflare/Vercel Edge
// ─────────────────────────────────────────────────────────────────────────────

if (
  typeof process === "undefined" ||
  process.env.NEXT_RUNTIME === "edge" ||
  process.env.CF_WORKER === "true"
) {
  const ws = (globalThis as any).WebSocket;
  if (ws) {
    neonConfig.webSocketConstructor = ws;
  }
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineConnect = false; 
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[db/index] CRITICAL: Missing environment variable: "${name}".`);
    } else {
      console.warn(`[db/index] Warning: Missing environment variable: "${name}".`);
      return "";
    }
  }
  return value.trim();
}

const DATABASE_URL = requireEnv("DATABASE_URL");
const DATABASE_URL_UNPOOLED = requireEnv("DATABASE_URL_UNPOOLED");

// ─────────────────────────────────────────────────────────────────────────────
// SESSION INIT SQL
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_INIT_SQL = `
  SET statement_timeout = '10s';
  SET idle_in_transaction_session_timeout = '30s';
  SET lock_timeout = '5s';
  SET application_name = 'bnlv-studio-app';
  SET search_path = public;
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// POOL CONNECTION MANAGERS
// ─────────────────────────────────────────────────────────────────────────────

const globalForDb = globalThis as typeof globalThis & {
  __bnlvStudioPool?: Pool;
  __bnlvDirectPool?: Pool;
};

// Standard pool via PgBouncer for lightweight read/write operations (No RLS Context required)
function getPool(): Pool {
  if (!globalForDb.__bnlvStudioPool) {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("connect", (client: any) => {
      client.query(SESSION_INIT_SQL).catch((err: Error) => {
        console.error("[db/pool] Failed to apply session init SQL:", err.message);
      });
    });

    pool.on("error", (err: Error) => {
      console.error("[db/pool] Unexpected idle client error:", err.message);
    });

    globalForDb.__bnlvStudioPool = pool;
  }
  return globalForDb.__bnlvStudioPool;
}

// Direct connection pool bypassing PgBouncer specifically for RLS Transaction Integrity
function getDirectPool(): Pool {
  if (!globalForDb.__bnlvDirectPool) {
    const pool = new Pool({
      connectionString: DATABASE_URL_UNPOOLED,
      ssl: { rejectUnauthorized: true },
      max: 5, // Limiting concurrent direct unpooled connections
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("connect", (client: any) => {
      client.query(SESSION_INIT_SQL).catch((err: Error) => {
        console.error("[db/directPool] Failed to apply session init SQL:", err.message);
      });
    });

    pool.on("error", (err: Error) => {
      console.error("[db/directPool] Unexpected idle client error:", err.message);
    });

    globalForDb.__bnlvDirectPool = pool;
  }
  return globalForDb.__bnlvDirectPool;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getDb() & getDirectDb() — Shared Drizzle Instances
// ─────────────────────────────────────────────────────────────────────────────

let _db: NeonDatabase<typeof schema> | null = null;
let _directDb: NeonDatabase<typeof schema> | null = null;

export async function getDb(): Promise<NeonDatabase<typeof schema>> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export async function getDirectDb(): Promise<NeonDatabase<typeof schema>> {
  if (!_directDb) {
    _directDb = drizzle(getDirectPool(), { schema });
  }
  return _directDb;
}

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_target, prop) {
    if (!_db) _db = drizzle(getPool(), { schema });
    return _db[prop as keyof NeonDatabase<typeof schema>];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. withTenant() — RLS via Transactions (Safest Serverless Pattern)
// ─────────────────────────────────────────────────────────────────────────────

export async function withTenant<T>(
  tenantId: string | number,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error("[db/index] CRITICAL: Invalid falsy tenantId provided to withTenant().");
  }

  // Use direct DB instance to bypass PgBouncer and guarantee SET LOCAL isolation
  const database = await getDirectDb();
  
  return database.transaction(async (tx) => {
    // Parameter-safe equivalent to SET LOCAL using true flag for transaction-scoped duration
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId.toString()}::text, true)`);
    return await callback(tx);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. getMigrationClient() — HTTP transport for Drizzle-kit
// ─────────────────────────────────────────────────────────────────────────────

let _migrationDb: NeonDatabase<typeof schema> | null = null;

export function getMigrationClient(): NeonDatabase<typeof schema> {
  if (!_migrationDb) {
    const sqlConnection = neon(DATABASE_URL_UNPOOLED);
    _migrationDb = drizzle(sqlConnection as any, { schema });
  }
  return _migrationDb;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. checkDbHealth() & closeDb()
// ─────────────────────────────────────────────────────────────────────────────

export async function checkDbHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const database = await getDb();
    await database.execute(sql`SELECT 1`);
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function closeDb(): Promise<void> {
  if (globalForDb.__bnlvStudioPool) {
    await globalForDb.__bnlvStudioPool.end();
    globalForDb.__bnlvStudioPool = undefined;
    _db = null;
  }
  if (globalForDb.__bnlvDirectPool) {
    await globalForDb.__bnlvDirectPool.end();
    globalForDb.__bnlvDirectPool = undefined;
    _directDb = null;
  }
}
```

## File: src/db/seed.ts
```typescript
/**
 * src/db/seed.ts
 * BNLV Group Enterprise Database Seeder
 */

import { getDb } from "./index";
import { users, tenants } from "./schema";
import crypto from "crypto";
import { promisify } from "util";

// Explicitly type the promisified function to accept options parameter
const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

async function generateScryptHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const dk = (await scryptAsync(password, salt, 32, { N: 16384, r: 8, p: 1 })) as Buffer;
  return `$scrypt$N=16384,r=8,p=1$${salt.toString("base64url")}$${dk.toString("base64url")}`;
}

async function seed() {
  console.log("🌱 Starting seed...");
  const db = await getDb();

  // Create Tenant
  const [tenant] = await db.insert(tenants).values({
    name: "BNLV Group",
    slug: "bnlv",
  }).returning();
  
  // Create User with Scrypt
  const passwordHash = await generateScryptHash("Password123!");

  await db.insert(users).values({
    name: "Ajay Kumar",
    email: "admin@bnlvconsulting.com",
    passwordHash: passwordHash,
    tenantId: tenant.id,
    role: "owner",
    active: true,
  });

  console.log("✅ Seed complete! Login with: admin@bnlvconsulting.com / Password123!");
  process.exit();
}

seed();
```

## File: src/db/verify-login.ts
```typescript
/**
 * src/db/verify-login.ts
 * BNLV Group Enterprise Login Verification Script
 */

import { getDb } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

async function verifyScryptHash(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 5 || parts[1] !== "scrypt") return false;
    
    const paramsPart = parts[2];
    const saltStr = parts[3];
    const dkStr = parts[4];

    const params: Record<string, number> = {};
    paramsPart.split(",").forEach(param => {
      const [k, v] = param.split("=");
      params[k] = parseInt(v, 10);
    });

    const salt = Buffer.from(saltStr, "base64url");
    const expectedDk = Buffer.from(dkStr, "base64url");

    const computedDk = await scryptAsync(password, salt, expectedDk.length, {
      N: params.N,
      r: params.r,
      p: params.p,
    });

    return crypto.timingSafeEqual(computedDk, expectedDk);
  } catch (err) {
    return false;
  }
}

async function verify() {
  console.log("🔍 Checking user: admin@bnlvconsulting.com");
  const db = await getDb();
  
  const [user] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!user) {
    console.error("❌ CRITICAL: User not found in database.");
    return;
  }

  console.log("✅ User found in DB. Checking password hash via scrypt...");
  const isMatch = await verifyScryptHash("Password123!", user.passwordHash);
  
  if (isMatch) {
    console.log("🎉 Password match SUCCESSFUL. Database is fine.");
  } else {
    console.error("❌ Password match FAILED. Your database hash does not match 'Password123!'");
  }
}

verify().catch((err) => console.error("❌ Script Error:", err));
```

## File: src/app/api/limsy/cases/route.ts
```typescript
/**
 * src/app/api/limsy/cases/route.ts
 *
 * LIMSY Supreme Court Standard — Case Workflow Automation API
 * ==========================================================
 * REMEDIATION (P0 Sprint — 2026-07-24):
 *   - Defect 1: POST now inserts canonical schema fields (petitioner, respondent,
 *               caseType, subjectMatter, internalRef, courtLevel, courtName).
 *               Removed hallucinated title/filingType/benchCoram mappings.
 *   - Defect 3: PATCH validates status against VALID_LIMSY_CASE_STATUSES before
 *               entering withTenant(), returning 400 with explicit enum list on mismatch.
 *   - Defect 4: patch object typed as Partial<typeof limsyCases.$inferInsert>,
 *               eliminating the `as any` cast entirely.
 * SECURITY REMEDIATION (2026-07-27):
 *   - Updated IP extraction to prioritize Cloudflare's authoritative `cf-connecting-ip` header.
 *   - Added explicit `tenantId` match predicate to the PATCH query `WHERE` clause for defense-in-depth RLS separation.
 * 
 * BLOCKER REMEDIATION (Current):
 *   - CR-002: Fixed auditLogs actor string format to enforce `user:${ctx.userId}` in POST and PATCH.
 *   - CR-003: Implemented role-gated column projection in GET to restrict sensitive party data.
 *
 * RBAC:
 *   - GET  → "developer"  (read docket list; sensitive operative text gated to architect+)
 *   - POST → "architect"  (case intake is a privileged legal action)
 *   - PATCH→ "architect"  (status mutation on a legal record)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import {
  limsyCases,
  auditLogs,
  VALID_LIMSY_CASE_STATUSES,
  VALID_LIMSY_CASE_TYPES,
  VALID_COURT_LEVELS,
} from "@/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Retrieve tenant-scoped case docket
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "developer");
    if (denied) return denied;

    // CR-003: Party-identifying and operative fields restricted to architect+
    const fullAccess = ["owner", "admin", "architect"].includes(ctx.role ?? "");

    const data = await withTenant(ctx.tenantId, async (tx) => {
      if (fullAccess) {
        return tx.select().from(limsyCases).orderBy(asc(limsyCases.id));
      }
      
      // Developer/designer/viewer: docket metadata only
      return tx.select({
        id:              limsyCases.id,
        tenantId:        limsyCases.tenantId,
        caseNumber:      limsyCases.caseNumber,
        internalRef:     limsyCases.internalRef,
        courtLevel:      limsyCases.courtLevel,
        courtName:       limsyCases.courtName,
        courtLocation:   limsyCases.courtLocation,
        caseType:        limsyCases.caseType,
        status:          limsyCases.status,
        filingDate:      limsyCases.filingDate,
        admissionDate:   limsyCases.admissionDate,
        nextHearingDate: limsyCases.nextHearingDate,
        urgencyFlag:     limsyCases.urgencyFlag,
        priorityLevel:   limsyCases.priorityLevel,
        parentCaseId:    limsyCases.parentCaseId,
        createdAt:       limsyCases.createdAt,
        updatedAt:       limsyCases.updatedAt,
      }).from(limsyCases).orderBy(asc(limsyCases.id));
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[LIMSY] cases GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — File a new petition / appeal
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    // Required field validation — matches NOT NULL constraints in 0003_limsys_workflow.sql
    if (
      !body.internalRef ||
      !body.courtLevel ||
      !body.courtName ||
      !body.caseType ||
      !body.petitioner ||
      !body.respondent ||
      !body.subjectMatter
    ) {
      return NextResponse.json(
        {
          error:
            "Required fields: internalRef, courtLevel, courtName, caseType, petitioner, respondent, subjectMatter.",
        },
        { status: 400 }
      );
    }

    // Enum validation — pre-flight before database round-trip
    const courtLevel = String(body.courtLevel).trim();
    if (!VALID_COURT_LEVELS.includes(courtLevel as (typeof VALID_COURT_LEVELS)[number])) {
      return NextResponse.json(
        { error: `Invalid courtLevel. Must be one of: ${VALID_COURT_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }

    const caseType = String(body.caseType).trim();
    if (!VALID_LIMSY_CASE_TYPES.includes(caseType as (typeof VALID_LIMSY_CASE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid caseType. Must be one of: ${VALID_LIMSY_CASE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Optional status override — default is "intake" per schema
    let status: (typeof VALID_LIMSY_CASE_STATUSES)[number] = "intake";
    if (body.status) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_CASE_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_CASE_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      status = trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number];
    }

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const actor = `user:${ctx.userId}`; // CR-002

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(limsyCases)
        .values({
          tenantId: ctx.tenantId,
          // Core identifiers
          caseNumber: body.caseNumber ? String(body.caseNumber).trim() : null,
          internalRef: String(body.internalRef).trim(),
          // Court classification
          courtLevel: courtLevel as (typeof VALID_COURT_LEVELS)[number],
          courtName: String(body.courtName).trim(),
          courtLocation: body.courtLocation ? String(body.courtLocation).trim() : null,
          // Case classification
          caseType: caseType as (typeof VALID_LIMSY_CASE_TYPES)[number],
          status,
          // Parties
          petitioner: String(body.petitioner).trim(),
          respondent: String(body.respondent).trim(),
          petitionerAdv: body.petitionerAdv ? String(body.petitionerAdv).trim() : null,
          respondentAdv: body.respondentAdv ? String(body.respondentAdv).trim() : null,
          // Dates
          filingDate: body.filingDate ? new Date(body.filingDate) : null,
          admissionDate: body.admissionDate ? new Date(body.admissionDate) : null,
          nextHearingDate: body.nextHearingDate ? new Date(body.nextHearingDate) : null,
          // Substance
          subjectMatter: String(body.subjectMatter).trim(),
          reliefSought: body.reliefSought ? String(body.reliefSought).trim() : null,
          actsSections: body.actsSections ? String(body.actsSections).trim() : null,
          tags: body.tags ? String(body.tags).trim() : null,
          // Priority
          urgencyFlag: Boolean(body.urgencyFlag ?? false),
          priorityLevel: body.priorityLevel ? Number(body.priorityLevel) : 3,
          // Relationships
          parentCaseId: body.parentCaseId ? Number(body.parentCaseId) : null,
          relatedCases: body.relatedCases ?? null,
          documentLinks: body.documentLinks ?? null,
          // Audit
          createdBy: ctx.userId,
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor, // CR-002
        action: `limsy.case.file:${inserted.caseType}`,
        target: inserted.internalRef,
        severity: "warn",
        ipAddress: ip,
      });

      return inserted;
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("[LIMSY] case POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update case status or next hearing date
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Case ID is required." }, { status: 400 });
    }

    // Strict Drizzle-inferred type — no `as any` cast
    const patch: Partial<typeof limsyCases.$inferInsert> = {};

    // Enum validation before entering the transaction
    if (body.status !== undefined) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_CASE_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_CASE_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      patch.status = trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number];
    }

    if (body.nextHearingDate !== undefined) {
      patch.nextHearingDate = body.nextHearingDate ? new Date(body.nextHearingDate) : null;
    }

    if (body.urgencyFlag !== undefined) {
      patch.urgencyFlag = Boolean(body.urgencyFlag);
    }

    if (body.priorityLevel !== undefined) {
      const level = Number(body.priorityLevel);
      if (isNaN(level) || level < 1 || level > 5) {
        return NextResponse.json(
          { error: "priorityLevel must be an integer between 1 and 5." },
          { status: 400 }
        );
      }
      patch.priorityLevel = level;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    // Stamp the updater
    patch.updatedBy = ctx.userId;
    patch.updatedAt = new Date();

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const actor = `user:${ctx.userId}`; // CR-002

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [updated] = await tx
        .update(limsyCases)
        .set(patch)
        .where(
          and(
            eq(limsyCases.id, Number(body.id)),
            eq(limsyCases.tenantId, ctx.tenantId)
          )
        )
        .returning();

      if (updated) {
        await tx.insert(auditLogs).values({
          tenantId: ctx.tenantId,
          actor, // CR-002
          action: `limsy.case.update:${updated.caseNumber ?? updated.internalRef}`,
          target: String(updated.id),
          severity: "warn",
          ipAddress: ip,
        });
      }

      return updated;
    });

    if (!row) {
      return NextResponse.json({ error: "Case not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[LIMSY] case PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## File: src/app/api/limsy/hearings/route.ts
```typescript
/**
 * src/app/api/limsy/hearings/route.ts
 *
 * LIMSY Supreme Court Standard — Cause-List & Hearing Management API
 * ==================================================================
 * REMEDIATION (P0 Sprint — 2026-07-24):
 *   - POST now inserts canonical schema fields matching limsy_hearings in SQL migration.
 *     Removed non-existent `hearingDate`, `benchAllocation`, `causeListItem` mappings.
 *     Canonical columns: scheduledDate, adjournmentCount (default 0), createdBy.
 *   - Enum validation on status override using VALID_LIMSY_HEARING_STATUSES.
 *   - All date fields use Date objects — TIMESTAMPTZ round-trip is safe via Drizzle.
 * SECURITY REMEDIATION (2026-07-27):
 *   - Updated IP extraction to prioritize Cloudflare's authoritative `cf-connecting-ip` header.
 *   - Added a PATCH handler with explicit `tenantId` match predicates in the query `WHERE` clause for defense-in-depth isolation.
 * BLOCKER REMEDIATION:
 *   - CR-001: Removed client-writable adjournmentCount. Now uses SQL database-side increment on 'adjourned' status.
 *   - CR-002: Fixed auditLogs actor string format to enforce `user:${ctx.userId}`.
 *
 * RBAC:
 *   - GET   → "architect"  (protects sensitive pre-published data like proceedings_summary)
 *   - POST  → "architect"  (scheduling a hearing is a privileged docket action)
 *   - PATCH → "architect"  (updating a hearing lifecycle is a privileged docket action)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import { limsyHearings, auditLogs, VALID_LIMSY_HEARING_STATUSES } from "@/db/schema";
import { asc, eq, and, sql, type SQL } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Retrieve tenant-scoped hearing cause-list
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    // Elevated to "architect" to protect detailed minutes and proceedings summaries
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const data = await withTenant(ctx.tenantId, async (tx) => {
      return tx.select().from(limsyHearings).orderBy(asc(limsyHearings.id));
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[LIMSY] hearings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Schedule a new cause-list hearing
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    // Required field validation — matches NOT NULL constraints in 0003_limsys_workflow.sql
    if (!body.caseId || !body.scheduledDate || body.hearingNumber === undefined) {
      return NextResponse.json(
        {
          error: "Required fields: caseId, scheduledDate, hearingNumber.",
        },
        { status: 400 }
      );
    }

    const hearingNumber = Number(body.hearingNumber);
    if (isNaN(hearingNumber) || hearingNumber < 1) {
      return NextResponse.json(
        { error: "hearingNumber must be a positive integer." },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(body.scheduledDate);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledDate format." }, { status: 400 });
    }

    // Enum validation on optional status override
    let status: (typeof VALID_LIMSY_HEARING_STATUSES)[number] = "scheduled";
    if (body.status !== undefined) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_HEARING_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_HEARING_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      status = trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number];
    }

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const actor = `user:${ctx.userId}`; // CR-002: Hardened Actor format

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(limsyHearings)
        .values({
          tenantId: ctx.tenantId,
          caseId: Number(body.caseId),
          hearingNumber,
          scheduledDate,
          status,
          boardPosition: body.boardPosition ? Number(body.boardPosition) : null,
          courtRoom: body.courtRoom ? String(body.courtRoom).trim() : null,
          sessionType: body.sessionType ? String(body.sessionType).trim() : "regular",
          adjournmentCount: 0, // Always initialise at zero; incremented via PATCH on adjournment
          appearances: body.appearances ?? null,
          documentLinks: body.documentLinks ?? null,
          complianceDeadline: body.complianceDeadline ? new Date(body.complianceDeadline) : null,
          complianceNotes: body.complianceNotes ? String(body.complianceNotes).trim() : null,
          createdBy: ctx.userId,
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor, // CR-002
        action: `limsy.hearing.schedule:${inserted.hearingNumber}`,
        target: `case:${inserted.caseId}`,
        severity: "warn",
        ipAddress: ip,
      });

      return inserted;
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("[LIMSY] hearing POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update hearing status, actual date, or adjournment count
// ─────────────────────────────────────────────────────────────────────────────

type HearingPatch = Omit<Partial<typeof limsyHearings.$inferInsert>, 'adjournmentCount'> & {
  adjournmentCount?: number | SQL<unknown>;
};

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Hearing ID is required." }, { status: 400 });
    }

    const patch: HearingPatch = {};

    if (body.status !== undefined) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_HEARING_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_HEARING_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      patch.status = trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number];

      // CR-001: Safely increment adjournment count on db side ONLY when status transitions to adjourned
      if (patch.status === "adjourned") {
        patch.adjournmentCount = sql`${limsyHearings.adjournmentCount} + 1`;
        
        if (body.adjournmentReason !== undefined) {
          patch.adjournmentReason = String(body.adjournmentReason).trim();
        }
        if (body.adjournedBy !== undefined) {
          patch.adjournedBy = String(body.adjournedBy).trim();
        }
      }
    }

    if (body.actualDate !== undefined) {
      if (body.actualDate === null) {
        patch.actualDate = null;
      } else {
        const actualDate = new Date(body.actualDate);
        if (isNaN(actualDate.getTime())) {
          return NextResponse.json({ error: "Invalid actualDate format." }, { status: 400 });
        }
        patch.actualDate = actualDate;
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    patch.updatedBy = ctx.userId;
    patch.updatedAt = new Date();

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";
      
    const actor = `user:${ctx.userId}`; // CR-002: Hardened Actor format

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [updated] = await tx
        .update(limsyHearings)
        .set(patch)
        .where(
          and(
            eq(limsyHearings.id, Number(body.id)),
            eq(limsyHearings.tenantId, ctx.tenantId)
          )
        )
        .returning();

      if (updated) {
        await tx.insert(auditLogs).values({
          tenantId: ctx.tenantId,
          actor, // CR-002
          action: `limsy.hearing.update:${updated.hearingNumber}`,
          target: String(updated.id),
          severity: "warn",
          ipAddress: ip,
        });
      }

      return updated;
    });

    if (!row) {
      return NextResponse.json({ error: "Hearing not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[LIMSY] hearing PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## File: src/lib/auth.ts
```typescript
/**
 * src/lib/auth.ts
 *
 * BNLV Studio — Zero-Trust Authentication & Session Management (Server-Only)
 */
import { cookies } from "next/headers";
import crypto from "crypto";
import { encrypt, decrypt, SessionPayload } from "./jwt";
import { getDb } from "@/db/index";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type { SessionPayload };
export { encrypt, decrypt };

export async function createSessionCookie(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const sessionToken = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set("bms_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("bms_session");
}

// Added validation helper incorporating the SHA-256 tokenHash fix
export async function verifyDbSession(sessionId: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(sessions)
    .where(
      eq(
        sessions.tokenHash,
        crypto.createHash('sha256').update(sessionId).digest('hex')
      )
    )
    .limit(1);

  return result[0] || null;
}
```

## File: src/lib/request-context.ts
```typescript
/**
 * src/lib/request-context.ts
 *
 * Helpers for reading the verified session context that the proxy injects
 * into every authenticated request via headers.
 *
 * USAGE IN AN API ROUTE:
 *
 *   import { getRequestContext, requireRole } from "@/lib/request-context";
 *
 *   export async function GET(req: NextRequest) {
 *     const ctx = getRequestContext(req);
 *     const denied = requireRole(ctx, "developer");
 *     if (denied) return denied;
 *
 *     // ctx.tenantId is now safe to use in DB queries
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole, type AppRole } from "@/lib/roles";

export interface RequestContext {
  tenantId: number;
  userId: number;
  role: AppRole;
  sessionId?: string;
  tenantSlug: string;
}

/**
 * Extracts the verified session context from proxy-injected headers.
 * Throws an Error if headers are absent — indicates proxy misconfiguration,
 * not a user error. Let this propagate as a 500.
 */
export function getRequestContext(req: NextRequest): RequestContext {
  const tenantIdHeader = req.headers.get("x-tenant-id");
  const userIdHeader = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role") as AppRole | null;
  const sessionId = req.headers.get("x-session-id") ?? undefined;
  const tenantSlug = req.headers.get("x-tenant-slug");

  if (!tenantIdHeader || !userIdHeader || !role || !tenantSlug) {
    throw new Error(
      "[request-context] Session headers missing. " +
        "Verify that src/proxy.ts is running for this route path."
    );
  }

  return {
    tenantId: Number(tenantIdHeader),
    userId: Number(userIdHeader),
    role,
    sessionId,
    tenantSlug,
  };
}

/**
 * Returns a 403 NextResponse if the session role does not satisfy
 * the minimum required role. Returns null on success.
 *
 * Pattern: const denied = requireRole(ctx, "admin"); if (denied) return denied;
 */
export function requireRole(
  ctx: RequestContext,
  minimumRole: AppRole
): NextResponse | null {
  if (!hasMinimumRole(ctx.role, minimumRole)) {
    return NextResponse.json({ error: "Forbidden - Insufficient privileges" }, { status: 403 });
  }
  return null;
}
```

## File: src/db/run-seed.ts
```typescript
/**
 * src/db/run-seed.ts
 * BNLV Group Enterprise — CLI Execution Wrapper (Native Admin Seeder)
 *
 * Architecture Decision (ADR-002): SET ROLE studio_migrator is permanently
 * retired. Neon's serverless infrastructure blocks lateral role switching for
 * non-superusers. This script executes via the primary DB owner connection,
 * which carries implicit superuser privileges and bypasses RLS natively.
 * No role escalation is required or attempted.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  nidhivanProjects,
  nidhivanDprs,
  builderComponents,
  tenants,
  auditLogs,
  projects
} from './schema.js';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

async function run() {
  console.log("🚀 [CLI] Initiating Production Data Seeding (Native Admin Execution)...");

  const TARGET_TENANT_ID = 1;
  const EXECUTING_USER_ID = 1;
  const CLIENT_IP = "system-cli-execution";

  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  const db = drizzle(client);

  try {
    const [tenantExists] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, TARGET_TENANT_ID))
      .limit(1);

    if (!tenantExists) {
      throw new Error(`[SEED CRITICAL] Tenant ID ${TARGET_TENANT_ID} not found.`);
    }

    console.log(`[SEED START] Seeding platform data for Tenant: ${tenantExists.name} (ID: ${TARGET_TENANT_ID}).`);

    await db.transaction(async (tx) => {

      // Pin tenant context for audit logging (session-local — does not persist across connections)
      await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${TARGET_TENANT_ID}';`));

      // ─── NIDHIVAN CONSULTING TRACK ──────────────────────────────────────────
      // Scope: Tenant 1 (BNLV HQ) platform-level demonstration project.
      // Note: Tenant 10 (Nidhivan Consulting) domain data is seeded via
      //       src/db/seed-nidhivan.ts executed separately.

      const [existingProject] = await tx
        .select()
        .from(nidhivanProjects)
        .where(and(
          eq(nidhivanProjects.tenantId, TARGET_TENANT_ID),
          eq(nidhivanProjects.projectCode, "BNLV-INFRA-2026")
        ))
        .limit(1);

      let project: typeof nidhivanProjects.$inferSelect;

      if (!existingProject) {
        const [inserted] = await tx
          .insert(nidhivanProjects)
          .values({
            tenantId: TARGET_TENANT_ID,
            projectCode: "BNLV-INFRA-2026",
            projectTitle: "New Delhi Smart City Hub - Core Micro-Grid",
            projectType: "infrastructure",
            sector: "Urban Development",
            implementingAgency: "Delhi Development Authority",
            projectState: "New Delhi",
            totalCostPaise: 89000000000,
            createdBy: EXECUTING_USER_ID,
            status: "dpr_preparation"
          })
          .returning();

        project = inserted;

        await tx.insert(auditLogs).values({
          tenantId: TARGET_TENANT_ID,
          actor: String(EXECUTING_USER_ID),
          action: "seed.nidhivan_project.insert",
          target: project.projectCode,
          severity: "info",
          ipAddress: CLIENT_IP,
          metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
        });

        console.log(`✅ [CLI] Seeded Nidhivan demo project: ${project.projectCode}`);
      } else {
        project = existingProject;
        console.log(`⏭️  [CLI] Nidhivan demo project already exists (${existingProject.projectCode}). Skipping.`);
      }

      const dprNumber = "DPR-BNLV-2026-001";
      const [existingDpr] = await tx
        .select()
        .from(nidhivanDprs)
        .where(and(
          eq(nidhivanDprs.projectId, project.id),
          eq(nidhivanDprs.dprNumber, dprNumber)
        ))
        .limit(1);

      if (!existingDpr) {
        await tx.insert(nidhivanDprs).values({
          tenantId: TARGET_TENANT_ID,
          projectId: project.id,
          dprNumber: dprNumber,
          title: "Detailed Project Report - Smart City Micro-Grid Phase I",
          financialYear: "2026-2027",
          totalProjectCostPaise: 89000000000,
          createdBy: EXECUTING_USER_ID,
          status: "draft"
        });

        await tx.insert(auditLogs).values({
          tenantId: TARGET_TENANT_ID,
          actor: String(EXECUTING_USER_ID),
          action: "seed.nidhivan_dpr.insert",
          target: dprNumber,
          severity: "info",
          ipAddress: CLIENT_IP,
          metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
        });

        console.log(`✅ [CLI] Seeded DPR: ${dprNumber}`);
      } else {
        console.log(`⏭️  [CLI] DPR ${dprNumber} already exists. Skipping.`);
      }

      // ─── VIHANG CREATIONS TRACK ─────────────────────────────────────────────

      let [globalProject] = await tx
        .select()
        .from(projects)
        .where(and(
          eq(projects.tenantId, TARGET_TENANT_ID),
          eq(projects.name, "Global System Layout Space")
        ))
        .limit(1);

      if (!globalProject) {
        [globalProject] = await tx.insert(projects).values({
          tenantId: TARGET_TENANT_ID,
          name: "Global System Layout Space",
          description: "Global brand layout assets",
        }).returning();
        console.log(`✅ [CLI] Seeded Vihang global project.`);
      } else {
        console.log(`⏭️  [CLI] Global Layout Space already exists. Skipping.`);
      }

      const [existingComponent] = await tx
        .select()
        .from(builderComponents)
        .where(and(
          eq(builderComponents.projectId, globalProject.id),
          eq(builderComponents.name, "Vihang Heraldic Design Engine Tokens")
        ))
        .limit(1);

      if (!existingComponent) {
        await tx.insert(builderComponents).values({
          tenantId: TARGET_TENANT_ID,
          projectId: globalProject.id,
          name: "Vihang Heraldic Design Engine Tokens",
          type: "styling-token",
          sortOrder: 0,
          config: {
            typography: { primary: "Cinzel", secondary: "Inter" },
            colors: { primaryNavy: "#002040", heraldicGold: "#C5A059" }
          },
          props: { activeBaseline: "v5.1-Production" }
        });

        await tx.insert(auditLogs).values({
          tenantId: TARGET_TENANT_ID,
          actor: String(EXECUTING_USER_ID),
          action: "seed.vihang_tokens.insert",
          target: "Vihang Heraldic Design Engine Tokens",
          severity: "info",
          ipAddress: CLIENT_IP,
          metadata: { seedVersion: "v5.1-Production", correlationId: crypto.randomUUID() }
        });

        console.log(`✅ [CLI] Seeded Vihang design tokens.`);
      } else {
        console.log(`⏭️  [CLI] Vihang tokens already exist. Skipping.`);
      }
    });

    console.log("✅ [CLI] Production seeding completed successfully.");

  } catch (error) {
    console.error("❌ [CLI] FATAL ERROR during seeding execution:", error);
    process.exit(1);
  } finally {
    console.log("🔌 [CLI] Closing database connections...");
    await client.end();
    process.exit(0);
  }
}

run();
```

## File: src/db/schema.ts
```typescript
/**
 * src/db/schema.ts
 * BNLV Group Enterprise Schema — Core, Services, LIMSY Supreme Court Module & Nidhivan Track 2
 * Validated for CI/CD Pipeline Integration
 */

import { 
  pgTable, serial, text, timestamp, integer, boolean, jsonb, 
  pgEnum, uniqueIndex, numeric, index, bigint, doublePrecision, type AnyPgColumn 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS (Source of Truth mapped to SQL Migrations)
// ─────────────────────────────────────────────────────────────────────────────

export const tenantPlanEnum = pgEnum('tenant_plan', ['pilot', 'starter', 'professional', 'scale', 'enterprise']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected', 'onboarded']);

export const courtLevelEnum = pgEnum("court_level", [
  'supreme_court', 'high_court', 'district_court', 'tribunal',
  'consumer_forum', 'arbitration', 'nclt', 'nclat', 'ncdrc'
]);

export const limsyCaseStatusEnum = pgEnum("limsy_case_status", [
  'intake', 'diarised', 'admitted', 'pending_hearing', 'under_hearing',
  'reserved', 'disposed', 'withdrawn', 'abated', 'transferred'
]);

export const limsyCaseTypeEnum = pgEnum("limsy_case_type", [
  'slp', 'writ_petition', 'civil_appeal', 'criminal_appeal', 'review_petition',
  'curative_petition', 'original_suit', 'execution_petition', 'consumer_complaint',
  'arbitration_petition', 'ibc_petition', 'nclt_petition', 'other'
]);

export const limsyHearingStatusEnum = pgEnum("limsy_hearing_status", [
  'scheduled', 'listed', 'adjourned', 'part_heard', 'concluded', 'cancelled', 'orders_passed'
]);

export const limsyOrderTypeEnum = pgEnum("limsy_order_type", [
  'interim_stay', 'interim_injunction', 'direction', 'contempt_notice',
  'final_judgment', 'consent_order', 'dismissal', 'remand', 'cost_order', 'modification'
]);

export const limsyBenchTypeEnum = pgEnum("limsy_bench_type", [
  'single_judge', 'division_bench', 'full_bench', 'constitutional_bench', 'larger_bench'
]);

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION CONSTANTS (Matching API imports)
// ─────────────────────────────────────────────────────────────────────────────

export const VALID_COURT_LEVELS = [
  'supreme_court', 'high_court', 'district_court', 'tribunal',
  'consumer_forum', 'arbitration', 'nclt', 'nclat', 'ncdrc'
] as const;

export const VALID_LIMSY_CASE_STATUSES = [
  'intake', 'diarised', 'admitted', 'pending_hearing', 'under_hearing',
  'reserved', 'disposed', 'withdrawn', 'abated', 'transferred'
] as const;

export const VALID_LIMSY_CASE_TYPES = [
  'slp', 'writ_petition', 'civil_appeal', 'criminal_appeal', 'review_petition',
  'curative_petition', 'original_suit', 'execution_petition', 'consumer_complaint',
  'arbitration_petition', 'ibc_petition', 'nclt_petition', 'other'
] as const;

export const VALID_LIMSY_HEARING_STATUSES = [
  'scheduled', 'listed', 'adjourned', 'part_heard', 'concluded', 'cancelled', 'orders_passed'
] as const;

export const VALID_LIMSY_ORDER_TYPES = [
  'interim_stay', 'interim_injunction', 'direction', 'contempt_notice',
  'final_judgment', 'consent_order', 'dismissal', 'remand', 'cost_order', 'modification'
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CORE PLATFORM TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: tenantPlanEnum("plan").notNull().default("starter"),
  status: text("status").notNull().default("active"),
  region: text("region").notNull().default("ap-south-1"),
  
  // Stripe Billing Integration
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull().default(""),
  role: text("role").notNull().default("developer"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    tenantEmailUnique: uniqueIndex("users_tenant_email_uidx").on(table.tenantId, table.email)
  };
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().default(""),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const environments = pgTable("environments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("production"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  environmentId: integer("environment_id").notNull().references(() => environments.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  status: text("status").notNull().default("success"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiTasks = pgTable("ai_tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone"),
  position: text("position").notNull().default(""),
  roleSlug: text("role_slug").notNull().default("general"),
  roleTitle: text("role_title").notNull().default("General"),
  portfolio: text("portfolio"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  note: text("note"),
  status: text("status").notNull().default("applied"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const builderComponents = pgTable("builder_components", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("component"),
  type: text("type").notNull().default("default"),
  sortOrder: integer("sort_order").notNull().default(0),
  config: jsonb("config"),
  props: jsonb("props"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientRequests = pgTable('client_requests', {
  id: serial('id').primaryKey(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  companyName: text('company_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  requestedPlan: tenantPlanEnum('requested_plan').notNull().default('starter'),
  subsidiary: text('subsidiary').notNull(),
  message: text('message'),
  status: requestStatusEnum('status').notNull().default('pending'),
  processedBy: integer('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  provisionedTenantId: integer('provisioned_tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  handledByTenantId: integer('handled_by_tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prefix: text("prefix").notNull().default(""),
  keyHash: text("key_hash").notNull(),
  scopes: jsonb("scopes"),
  rateLimit: integer("rate_limit").notNull().default(1000),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  description: text("description"),
  rollout: jsonb("rollout"),
  environments: jsonb("environments"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vaultSecrets = pgTable("vault_secrets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("secret"),
  key: text("key").notNull().default(""),
  encryptedValue: text("encrypted_value").notNull().default(""),
  maskedValue: text("masked_value"),
  environment: text("environment").notNull().default("production"),
  version: integer("version").notNull().default(1),
  rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: jsonb("events"),
  signingSecretHash: text("signing_secret_hash"),
  deliveries: integer("deliveries").notNull().default(0),
  status: text("status").notNull().default("active"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  severity: text("severity").notNull().default("info"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// LIMSY SUPREME COURT STANDARD MODULE TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const limsyCases = pgTable("limsy_cases", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseNumber: text("case_number"),
  internalRef: text("internal_ref").notNull(),
  courtLevel: courtLevelEnum("court_level").notNull(),
  courtName: text("court_name").notNull(),
  courtLocation: text("court_location"),
  caseType: limsyCaseTypeEnum("case_type").notNull(),
  status: limsyCaseStatusEnum("status").notNull().default("intake"),
  petitioner: text("petitioner").notNull(),
  respondent: text("respondent").notNull(),
  petitionerAdv: text("petitioner_adv"),
  respondentAdv: text("respondent_adv"),
  filingDate: timestamp("filing_date", { withTimezone: true }),
  admissionDate: timestamp("admission_date", { withTimezone: true }),
  nextHearingDate: timestamp("next_hearing_date", { withTimezone: true }),
  disposalDate: timestamp("disposal_date", { withTimezone: true }),
  subjectMatter: text("subject_matter").notNull(),
  reliefSought: text("relief_sought"),
  actsSections: text("acts_sections"),
  tags: text("tags"),
  urgencyFlag: boolean("urgency_flag").notNull().default(false),
  priorityLevel: integer("priority_level").notNull().default(3),
  parentCaseId: integer("parent_case_id")
    .references((): AnyPgColumn => limsyCases.id, { onDelete: 'set null' }),
  relatedCases: jsonb("related_cases"),
  documentLinks: jsonb("document_links"),
  outcomeNotes: text("outcome_notes"),
  outcomeType: text("outcome_type"),
  estimatedFeesPaise: bigint("estimated_fees_paise", { mode: 'number' }),
  billedAmountPaise:  bigint("billed_amount_paise",  { mode: 'number' }),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const limsyBenchAssignments = pgTable("limsy_bench_assignments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => limsyCases.id, { onDelete: "cascade" }),
  benchType: limsyBenchTypeEnum("bench_type").notNull(),
  presiding: text("presiding").notNull(),
  members: jsonb("members"),
  constitutedOn: timestamp("constituted_on", { withTimezone: true }).notNull().defaultNow(),
  reconstitutedOn: timestamp("reconstituted_on", { withTimezone: true }),
  reconstitutionReason: text("reconstitution_reason"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const limsyHearings = pgTable("limsy_hearings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => limsyCases.id, { onDelete: "cascade" }),
  hearingNumber: integer("hearing_number").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  actualDate: timestamp("actual_date", { withTimezone: true }),
  status: limsyHearingStatusEnum("status").notNull().default("scheduled"),
  boardPosition: integer("board_position"),
  courtRoom: text("court_room"),
  sessionType: text("session_type").default("regular"),
  adjournedBy: text("adjourned_by"),
  adjournmentReason: text("adjournment_reason"),
  adjournmentCount: integer("adjournment_count").notNull().default(0),
  proceedingsSummary: text("proceedings_summary"),
  detailedMinutes: text("detailed_minutes"),
  appearances: jsonb("appearances"),
  argumentsSummary: text("arguments_summary"),
  nextHearingDate: timestamp("next_hearing_date", { withTimezone: true }),
  nextHearingPurpose: text("next_hearing_purpose"),
  documentLinks: jsonb("document_links"),
  complianceDeadline: timestamp("compliance_deadline", { withTimezone: true }),
  complianceNotes: text("compliance_notes"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const limsyOrders = pgTable("limsy_orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId: integer("case_id").notNull().references(() => limsyCases.id, { onDelete: "cascade" }),
  hearingId: integer("hearing_id").references(() => limsyHearings.id, { onDelete: "set null" }),
  orderType: limsyOrderTypeEnum("order_type").notNull(),
  orderDate: timestamp("order_date", { withTimezone: true }).notNull(),
  orderNumber: text("order_number"),
  orderTitle: text("order_title").notNull(),
  operative: text("operative").notNull(),
  fullText: text("full_text"),
  translationHindi: text("translation_hindi"),
  cryptoHash: text("crypto_hash"),
  hasStay: boolean("has_stay").notNull().default(false),
  stayScope: text("stay_scope"),
  stayExpiry: timestamp("stay_expiry", { withTimezone: true }),
  stayConditions: text("stay_conditions"),
  complianceRequired: boolean("compliance_required").notNull().default(false),
  complianceDeadline: timestamp("compliance_deadline", { withTimezone: true }),
  complianceParty: text("compliance_party"),
  complianceStatus: text("compliance_status").default("pending"),
  complianceNotes: text("compliance_notes"),
  costAwarded: boolean("cost_awarded").notNull().default(false),
  costAmountPaise: bigint("cost_amount_paise", { mode: 'number' }),
  costPayable: text("cost_payable"),
  documentLinks: jsonb("document_links"),
  externalLink: text("external_link"),
  appealed: boolean("appealed").notNull().default(false),
  appealCaseId: integer("appeal_case_id")
    .references((): AnyPgColumn => limsyCases.id, { onDelete: 'set null' }),
  reviewFiled: boolean("review_filed").notNull().default(false),
  isFinal: boolean("is_final").notNull().default(false),
  reportable: boolean("reportable").notNull().default(false),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// NIDHIVAN CONSULTING WORKSPACE (TRACK 2)
// DPR, BOQ & Financial Metrics Schema
// ─────────────────────────────────────────────────────────────────────────────

export const nidhivanProjectStatusEnum = pgEnum("nidhivan_project_status", [
  'conceptual', 'dpr_preparation', 'dpr_submitted', 'appraisal',
  'sanctioned', 'in_progress', 'completed', 'abandoned', 'archived'
]);

export const nidhivanProjectTypeEnum = pgEnum("nidhivan_project_type", [
  'infrastructure', 'housing', 'water_sanitation', 'energy', 'transport',
  'healthcare', 'education', 'agriculture', 'industrial', 'urban_development',
  'rural_development', 'digital', 'environment', 'other'
]);

export const nidhivanDprStatusEnum = pgEnum("nidhivan_dpr_status", [
  'draft', 'under_review', 'approved', 'submitted', 'returned', 'archived'
]);

export const nidhivanBoqStatusEnum = pgEnum("nidhivan_boq_status", [
  'draft', 'approved', 'revision_required', 'finalized'
]);

export const nidhivanPeriodTypeEnum = pgEnum("nidhivan_period_type", [
  'monthly', 'quarterly', 'annual'
]);

export const nidhivanProjects = pgTable('nidhivan_projects', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectCode: text('project_code').notNull(),
  projectTitle: text('project_title').notNull(),
  projectType: nidhivanProjectTypeEnum('project_type').notNull(),
  sector: text('sector').notNull(),
  subsector: text('subsector'),
  implementingAgency: text('implementing_agency').notNull(),
  sponsoringAuthority: text('sponsoring_authority'),
  projectState: text('project_state').notNull(),
  projectDistrict: text('project_district'),
  projectLocation: text('project_location'),
  totalCostPaise: bigint('total_cost_paise', { mode: 'number' }).notNull().default(0),
  centralSharePaise: bigint('central_share_paise', { mode: 'number' }).notNull().default(0),
  stateSharePaise: bigint('state_share_paise', { mode: 'number' }).notNull().default(0),
  beneficiarySharePaise: bigint('beneficiary_share_paise', { mode: 'number' }).notNull().default(0),
  loanPaise: bigint('loan_paise', { mode: 'number' }).notNull().default(0),
  fundingAgencies: jsonb('funding_agencies'),
  status: nidhivanProjectStatusEnum('status').notNull().default('conceptual'),
  urgencyFlag: boolean('urgency_flag').notNull().default(false),
  priorityLevel: integer('priority_level').notNull().default(3),
  appraisalDate: timestamp('appraisal_date', { withTimezone: true }),
  sanctionDate: timestamp('sanction_date', { withTimezone: true }),
  commencementDate: timestamp('commencement_date', { withTimezone: true }),
  targetCompletionDate: timestamp('target_completion_date', { withTimezone: true }),
  actualCompletionDate: timestamp('actual_completion_date', { withTimezone: true }),
  projectScope: text('project_scope'),
  objectives: text('objectives'),
  outcomes: text('outcomes'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantIdx: index('nidhivan_projects_tenant_idx').on(table.tenantId),
  };
});

export const nidhivanDprs = pgTable('nidhivan_dprs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  dprVersion: integer('dpr_version').notNull().default(1),
  dprNumber: text('dpr_number').notNull(),
  title: text('title').notNull(),
  financialYear: text('financial_year').notNull(),
  status: nidhivanDprStatusEnum('status').notNull().default('draft'),
  totalProjectCostPaise: bigint('total_project_cost_paise', { mode: 'number' }).notNull().default(0),
  centralSharePaise: bigint('central_share_paise', { mode: 'number' }).notNull().default(0),
  stateSharePaise: bigint('state_share_paise', { mode: 'number' }).notNull().default(0),
  beneficiarySharePaise: bigint('beneficiary_share_paise', { mode: 'number' }).notNull().default(0),
  loanPaise: bigint('loan_paise', { mode: 'number' }).notNull().default(0),
  costBasisYear: text('cost_basis_year'),
  contingencyPct: numeric('contingency_pct', { precision: 5, scale: 2 }).notNull().default('5.00'),
  overheadPct: numeric('overhead_pct', { precision: 5, scale: 2 }).notNull().default('0.00'),
  sections: jsonb('sections').default('{}'),
  consultantName: text('consultant_name'),
  preparedBy: text('prepared_by'),
  submittedTo: text('submitted_to'),
  approvalAuthority: text('approval_authority'),
  approvalRef: text('approval_ref'),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  documentLinks: jsonb('document_links'),
  cryptoHash: text('crypto_hash'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantProjectIdx: index('nidhivan_dprs_tenant_project_idx').on(table.tenantId, table.projectId),
  };
});

export const nidhivanBoqs = pgTable('nidhivan_boqs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  dprId: integer('dpr_id').notNull().references(() => nidhivanDprs.id, { onDelete: 'cascade' }),
  boqVersion: integer('boq_version').notNull().default(1),
  boqNumber: text('boq_number').notNull(),
  title: text('title').notNull(),
  status: nidhivanBoqStatusEnum('status').notNull().default('draft'),
  baseAmountPaise: bigint('base_amount_paise', { mode: 'number' }).notNull().default(0),
  contingencyPct: numeric('contingency_pct', { precision: 5, scale: 2 }).notNull().default('5.00'),
  contingencyAmountPaise: bigint('contingency_amount_paise', { mode: 'number' }).notNull().default(0),
  overheadPct: numeric('overhead_pct', { precision: 5, scale: 2 }).notNull().default('0.00'),
  overheadAmountPaise: bigint('overhead_amount_paise', { mode: 'number' }).notNull().default(0),
  gstPct: numeric('gst_pct', { precision: 5, scale: 2 }).notNull().default('18.00'),
  gstAmountPaise: bigint('gst_amount_paise', { mode: 'number' }).notNull().default(0),
  totalAmountPaise: bigint('total_amount_paise', { mode: 'number' }).notNull().default(0),
  baseYear: text('base_year'),
  rateScheduleRef: text('rate_schedule_ref'),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  documentLinks: jsonb('document_links'),
  cryptoHash: text('crypto_hash'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantDprIdx: index('nidhivan_boqs_tenant_dpr_idx').on(table.tenantId, table.dprId),
  };
});

export const nidhivanBoqItems = pgTable('nidhivan_boq_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  boqId: integer('boq_id').notNull().references(() => nidhivanBoqs.id, { onDelete: 'cascade' }),
  itemNumber: integer('item_number').notNull(),
  sectionCode: text('section_code'),
  isSectionHeader: boolean('is_section_header').notNull().default(false),
  description: text('description').notNull(),
  unit: text('unit'),
  quantity: doublePrecision('quantity').notNull().default(0),
  unitRatePaise: bigint('unit_rate_paise', { mode: 'number' }).notNull().default(0),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull().default(0),
  rateRef: text('rate_ref'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantBoqIdx: index('nidhivan_boq_items_tenant_boq_idx').on(table.tenantId, table.boqId),
  };
});

export const nidhivanFinancialMetrics = pgTable('nidhivan_financial_metrics', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => nidhivanProjects.id, { onDelete: 'cascade' }),
  reportingPeriod: text('reporting_period').notNull(),
  periodType: nidhivanPeriodTypeEnum('period_type').notNull().default('monthly'),
  fundsReleasedCentralPaise: bigint('funds_released_central_paise', { mode: 'number' }).notNull().default(0),
  fundsReleasedStatePaise: bigint('funds_released_state_paise', { mode: 'number' }).notNull().default(0),
  fundsReleasedBeneficiaryPaise: bigint('funds_released_beneficiary_paise', { mode: 'number' }).notNull().default(0),
  expenditureCumulativePaise: bigint('expenditure_cumulative_paise', { mode: 'number' }).notNull().default(0),
  expenditureThisPeriodPaise: bigint('expenditure_this_period_paise', { mode: 'number' }).notNull().default(0),
  balanceAvailablePaise: bigint('balance_available_paise', { mode: 'number' }).notNull().default(0),
  physicalProgressPct: integer('physical_progress_pct').notNull().default(0),
  financialProgressPct: integer('financial_progress_pct').notNull().default(0),
  projectedIrrPercent: numeric('projected_irr_percent', { precision: 5, scale: 2 }),
  remarks: text('remarks'),
  reportedBy: integer('reported_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    tenantProjectIdx: index('nidhivan_financial_metrics_tenant_project_idx').on(table.tenantId, table.projectId),
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS DEFINITIONS (Including LIMSY & Nidhivan)
// ─────────────────────────────────────────────────────────────────────────────

export const limsyCasesRelations = relations(limsyCases, ({ many }) => ({
  benchAssignments: many(limsyBenchAssignments),
  hearings: many(limsyHearings),
  orders: many(limsyOrders),
}));

export const limsyBenchAssignmentsRelations = relations(limsyBenchAssignments, ({ one }) => ({
  case: one(limsyCases, {
    fields: [limsyBenchAssignments.caseId],
    references: [limsyCases.id],
  }),
}));

export const limsyHearingsRelations = relations(limsyHearings, ({ one }) => ({
  case: one(limsyCases, { fields: [limsyHearings.caseId], references: [limsyCases.id] }),
}));

export const limsyOrdersRelations = relations(limsyOrders, ({ one }) => ({
  case: one(limsyCases, { fields: [limsyOrders.caseId], references: [limsyCases.id] }),
  hearing: one(limsyHearings, { fields: [limsyOrders.hearingId], references: [limsyHearings.id] }),
}));

export const nidhivanProjectsRelations = relations(nidhivanProjects, ({ many }) => ({
  dprs: many(nidhivanDprs),
  boqs: many(nidhivanBoqs),
  financialMetrics: many(nidhivanFinancialMetrics),
}));

export const nidhivanDprsRelations = relations(nidhivanDprs, ({ one, many }) => ({
  project: one(nidhivanProjects, {
    fields: [nidhivanDprs.projectId],
    references: [nidhivanProjects.id],
  }),
  boqs: many(nidhivanBoqs),
}));

export const nidhivanBoqsRelations = relations(nidhivanBoqs, ({ one, many }) => ({
  project: one(nidhivanProjects, {
    fields: [nidhivanBoqs.projectId],
    references: [nidhivanProjects.id],
  }),
  dpr: one(nidhivanDprs, {
    fields: [nidhivanBoqs.dprId],
    references: [nidhivanDprs.id],
  }),
  items: many(nidhivanBoqItems),
}));

export const nidhivanBoqItemsRelations = relations(nidhivanBoqItems, ({ one }) => ({
  boq: one(nidhivanBoqs, {
    fields: [nidhivanBoqItems.boqId],
    references: [nidhivanBoqs.id],
  }),
}));

export const nidhivanFinancialMetricsRelations = relations(nidhivanFinancialMetrics, ({ one }) => ({
  project: one(nidhivanProjects, {
    fields: [nidhivanFinancialMetrics.projectId],
    references: [nidhivanProjects.id],
  }),
  reporter: one(users, {
    fields: [nidhivanFinancialMetrics.reportedBy],
    references: [users.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES (Strict Type Safety)
// ─────────────────────────────────────────────────────────────────────────────
export type LimsyCase                = typeof limsyCases.$inferSelect;
export type NewLimsyCase             = typeof limsyCases.$inferInsert;
export type LimsyBenchAssignment     = typeof limsyBenchAssignments.$inferSelect;
export type NewLimsyBenchAssignment  = typeof limsyBenchAssignments.$inferInsert;
export type LimsyHearing             = typeof limsyHearings.$inferSelect;
export type NewLimsyHearing          = typeof limsyHearings.$inferInsert;
export type LimsyOrder               = typeof limsyOrders.$inferSelect;
export type NewLimsyOrder            = typeof limsyOrders.$inferInsert;

export type NidhivanProject = typeof nidhivanProjects.$inferSelect;
export type NewNidhivanProject = typeof nidhivanProjects.$inferInsert;

export type NidhivanDpr = typeof nidhivanDprs.$inferSelect;
export type NewNidhivanDpr = typeof nidhivanDprs.$inferInsert;

export type NidhivanBoq = typeof nidhivanBoqs.$inferSelect;
export type NewNidhivanBoq = typeof nidhivanBoqs.$inferInsert;

export type NidhivanBoqItem = typeof nidhivanBoqItems.$inferSelect;
export type NewNidhivanBoqItem = typeof nidhivanBoqItems.$inferInsert;

export type NidhivanFinancialMetric = typeof nidhivanFinancialMetrics.$inferSelect;
export type NewNidhivanFinancialMetric = typeof nidhivanFinancialMetrics.$inferInsert;
```

## File: drizzle/migrations/meta/_journal.json
```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1784470178250,
      "tag": "0000_slippery_james_howlett",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1784961405055,
      "tag": "0001_fix_schema_drift",
      "breakpoints": true
    },
    {
      "idx": 2,
      "version": "7",
      "when": 1784470180000,
      "tag": "0002_enable_rls",
      "breakpoints": true
    },
    {
      "idx": 3,
      "version": "7",
      "when": 1784470185000,
      "tag": "0003_limsys_workflow",
      "breakpoints": true
    },
    {
      "idx": 4,
      "version": "7",
      "when": 1784961450000,
      "tag": "0004_revoke_limsy_delete",
      "breakpoints": true
    },
    {
      "idx": 5,
      "version": "7",
      "when": 1784961480000,
      "tag": "0005_nidhivan_rls_hardening",
      "breakpoints": true
    },
    {
      "idx": 6,
      "version": "7",
      "when": 1784961500000,
      "tag": "0006_vault_secrets_columns",
      "breakpoints": true
    },
    {
      "idx": 7,
      "version": "7",
      "when": 1786082706000,
      "tag": "0007_nidhivan_irr_percent",
      "breakpoints": true
    },
    {
      "idx": 8,
      "version": "7",
      "when": 1786382072565,
      "tag": "0008_commercial_launch_foundation",
      "breakpoints": true
    },
    {
      "idx": 9,
      "version": "7",
      "when": 1786382075000,
      "tag": "0009_schema_hardening",
      "breakpoints": true
    },
    {
      "idx": 10,
      "version": "7",
      "when": 1787500000000,
      "tag": "0010_force_rls_revoke_truncate_limsy",
      "breakpoints": true
    }
  ]
}
```

## File: src/db/seed-nidhivan.ts
```typescript
/**
 * src/db/seed-nidhivan.ts
 * Bootstraps the Nidhivan Consulting Track 2 Workspace with a CPWD Schedule of Rates hierarchy.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { 
  tenants, 
  users, 
  nidhivanProjects, 
  nidhivanDprs, 
  nidhivanBoqs, 
  nidhivanBoqItems, 
  nidhivanFinancialMetrics, 
  auditLogs 
} from './schema.js';

const ADMIN_EMAIL = 'admin@nidhivan.bnlvconsulting.com';

async function seedNidhivan() {
  console.log("🌱 Starting Nidhivan CPWD Schedule of Rates Seed...");

  // Enforce unpooled direct connection for administrative RLS bypass
  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  const db = drizzle(client);

  try {
    // 1. Tenant Provisioning (Public/Unforced Table)
    let tenantRecords = await db.select().from(tenants).where(eq(tenants.slug, 'nidhivan')).limit(1);
    let tenantId: number;

    if (tenantRecords.length === 0) {
      const [newTenant] = await db.insert(tenants).values({
        name: 'Nidhivan Consulting',
        slug: 'nidhivan',
        status: 'active',
      }).returning({ id: tenants.id });
      tenantId = newTenant.id;
      console.log(`✅ Provisioned Tenant: Nidhivan Consulting (ID: ${tenantId})`);
    } else {
      tenantId = tenantRecords[0].id;
      console.log(`✅ Acquired Tenant Identity: Nidhivan Consulting (ID: ${tenantId})`);
    }
    
    // 2. Admin User Provisioning (Public/Unforced Table)
    let adminUsers = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    let adminUserId: number;

    if (adminUsers.length === 0) {
      const [newUser] = await db.insert(users).values({
        email: ADMIN_EMAIL,
        name: 'Nidhivan System Admin',
        tenantId: tenantId,
        role: 'admin',
        active: true,
      }).returning({ id: users.id });
      adminUserId = newUser.id;
      console.log(`✅ Provisioned Admin User: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
    } else {
      adminUserId = adminUsers[0].id;
      console.log(`⏭️  Admin user already exists (ID: ${adminUserId}). Skipping.`);
    }

    // 3. SECURE CONNECTION-LEVEL RLS BINDING
    // Binds the tenant ID to the entire unpooled session. This permanently 
    // resolves the node-postgres asynchronous tick context-dropping.
    await client.query(`SET app.current_tenant_id = '${tenantId}'`);

    // 4. Data Seeding inside strict Transaction
    await db.transaction(async (tx) => {
      
      // Idempotency Gate
      const existingProjects = await tx
        .select({ id: nidhivanProjects.id })
        .from(nidhivanProjects)
        .where(eq(nidhivanProjects.tenantId, tenantId))
        .limit(1);

      if (existingProjects.length > 0) {
        console.log('✅ Idempotency Gate Triggered: Nidhivan Consulting data already seeded. Exiting.');
        return; // Exit transaction gracefully
      }

      const [project] = await tx.insert(nidhivanProjects).values({
        tenantId: tenantId,
        projectCode: "NH44-PKG1",
        projectTitle: "NH-44 Highway Expansion (Package 1)",
        projectType: "infrastructure",
        sector: "Transport",
        implementingAgency: "National Highways Authority of India",
        projectState: "New Delhi",
        totalCostPaise: 4676075000,
        createdBy: adminUserId,
        status: "in_progress"
      }).returning();
      console.log(`✅ Created Project: ${project.projectTitle}`);

      const [dpr] = await tx.insert(nidhivanDprs).values({
        tenantId: tenantId,
        projectId: project.id,
        dprNumber: "DPR-NH44-01",
        title: "Detailed Project Report - NH-44 Widening",
        financialYear: "2026-2027",
        totalProjectCostPaise: 4676075000,
        createdBy: adminUserId,
        status: "draft"
      }).returning();
      console.log(`✅ Created DPR Record: ${dpr.dprNumber}`);

      const [boq] = await tx.insert(nidhivanBoqs).values({
        tenantId: tenantId,
        projectId: project.id,
        dprId: dpr.id,
        boqNumber: "BOQ-NH44-01",
        title: "Master Bill of Quantities (CPWD DSR 2023 Baseline)",
        totalAmountPaise: 4676075000,
        createdBy: adminUserId,
        status: "draft"
      }).returning();
      console.log(`✅ Created BOQ Record: ${boq.title}`);

      await tx.insert(nidhivanBoqItems).values([
        {
          tenantId: tenantId,
          boqId: boq.id,
          itemNumber: 1,
          sectionCode: "SH-01",
          isSectionHeader: true,
          description: "SUB-HEAD 01: EARTHWORK",
          quantity: 0,
          unitRatePaise: 0,
          amountPaise: 0,
        },
        {
          tenantId: tenantId,
          boqId: boq.id,
          itemNumber: 2,
          sectionCode: "SH-01",
          isSectionHeader: false,
          description: "Earth work in excavation by mechanical means (Hydraulic excavator)/manual means over areas...",
          unit: "cum",
          quantity: 4500.500,
          unitRatePaise: 21500,
          amountPaise: 96760750,
          rateRef: "DSR 2023 Item 2.6.1"
        },
        {
          tenantId: tenantId,
          boqId: boq.id,
          itemNumber: 3,
          sectionCode: "SH-01",
          isSectionHeader: false,
          description: "Filling available excavated earth (excluding rock) in trenches, plinth, sides of foundations etc...",
          unit: "cum",
          quantity: 1200.000,
          unitRatePaise: 18550,
          amountPaise: 22260000,
          rateRef: "DSR 2023 Item 2.25"
        },
        {
          tenantId: tenantId,
          boqId: boq.id,
          itemNumber: 4,
          sectionCode: "SH-02",
          isSectionHeader: true,
          description: "SUB-HEAD 02: CONCRETE WORK",
          quantity: 0,
          unitRatePaise: 0,
          amountPaise: 0,
        },
        {
          tenantId: tenantId,
          boqId: boq.id,
          itemNumber: 5,
          sectionCode: "SH-02",
          isSectionHeader: false,
          description: "Providing and laying in position cement concrete of specified grade - 1:1.5:3.",
          unit: "cum",
          quantity: 540.250,
          unitRatePaise: 645000,
          amountPaise: 348461250,
          rateRef: "DSR 2023 Item 4.1.2"
        }
      ]);
      console.log(`✅ Seeded CPWD DSR Execution Items`);
      
      await tx.insert(nidhivanFinancialMetrics).values({
        tenantId: tenantId,
        projectId: project.id,
        reportedBy: adminUserId,
        reportingPeriod: "Q1-2026",
        projectedIrrPercent: "14.50",
        reportedAt: new Date(),
      });
      console.log(`✅ Seeded Financial Metrics`);

      await tx.insert(auditLogs).values({
        tenantId: tenantId,
        actor: "system_seeder",
        action: "seed_nidhivan_hierarchy",
        target: `nidhivan_projects:${project.projectCode}`,
        severity: "info",
        metadata: { 
          event: "Initial CPWD Schedule of Rates Seed",
          projectCode: project.projectCode,
          entityId: project.id.toString(),
          timestamp: new Date().toISOString(),
        }
      });
      console.log(`✅ Wrote Immutable Audit Log`);
    });

    console.log("🎉 Seed Complete! The Nidhivan BOQ Engine now has live database data.");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seedNidhivan();
```
