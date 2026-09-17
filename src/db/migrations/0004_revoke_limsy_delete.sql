-- Migration: 0004_revoke_limsy_delete.sql
REVOKE DELETE ON TABLE limsy_cases            FROM studio_app;
REVOKE DELETE ON TABLE limsy_bench_assignments FROM studio_app;
REVOKE DELETE ON TABLE limsy_hearings          FROM studio_app;
REVOKE DELETE ON TABLE limsy_orders            FROM studio_app;