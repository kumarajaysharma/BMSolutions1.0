ALTER TABLE limsy_cases             FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_hearings          FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_orders            FORCE ROW LEVEL SECURITY;
ALTER TABLE limsy_bench_assignments FORCE ROW LEVEL SECURITY;

REVOKE TRUNCATE ON limsy_cases             FROM studio_app;
REVOKE TRUNCATE ON limsy_hearings          FROM studio_app;
REVOKE TRUNCATE ON limsy_orders            FROM studio_app;
REVOKE TRUNCATE ON limsy_bench_assignments FROM studio_app;