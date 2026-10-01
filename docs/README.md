# BNLV Group - Platform Documentation

## Structure
- `adrs/` - Architecture Decision Records
- `api/` - API reference
- `runbooks/` - Operational runbooks
- `security/` - Security policies

## Quick Reference
- Migrations: always via DATABASE_URL_UNPOOLED
- Financial values: BIGINT paise in DB
- AI routing: Anthropic-only for LIMSY/Nidhivan
- Tenant isolation: withTenant() wrapper mandatory
