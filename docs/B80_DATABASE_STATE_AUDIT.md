# B80 database-state audit

## Findings

1. PostgreSQL was healthy; TCP clients failed SCRAM authentication for `postgres`.
2. Local Compose supplied a current `POSTGRES_PASSWORD`, but the existing `postgres_local_data` volume could have been initialized with a different earlier password.
3. The previous deployment had no step to reconcile environment secret changes with the password stored in the persistent PostgreSQL cluster.
4. Migration, permissions, and web configuration embedded passwords directly in PostgreSQL URLs, creating a second failure mode for URL-reserved password characters.
5. `release-preflight.mjs` still required `DATABASE_URL`, which would have rejected the new discrete PG configuration later.
6. The audited `.env.example` contained credential-like literals and was unsafe as an example file.

## Remediation

- Added `dbcredential` gate for self-hosted Docker local/production.
- Shared a Unix socket volume between PostgreSQL and the reconciler; PGDATA is not shared with the helper.
- Reconciler rotates the existing admin role through local socket authentication, then verifies TCP/SCRAM authentication.
- Added equivalent self-hosted Kubernetes `postStart` reconciliation and authenticated wait-for-database gate.
- Standardized migration, runtime role provisioning, healthcheck, application DB client, release preflight, superadmin bootstrap, publication UAT, and live UAT on dual database configuration (`DATABASE_URL` or discrete PG fields).
- Removed raw password interpolation from Docker/Kubernetes PostgreSQL URLs.
- Scrubbed example credentials and added a fail-closed example-secret validator.

## Non-destructive behavior

B80 does not run `docker volume rm`, `docker compose down -v`, `DROP DATABASE`, or a full restore over an existing database. `database-backup.sql` remains a first-initialization input only.

## Production least privilege

The production web service keeps `env_file` support for normal runtime/SSO/payment configuration, but explicitly clears admin database secret variables and receives only the limited `providers_portal_app` credential through `PGPASSWORD`. Administrative PostgreSQL credentials remain scoped to reconciliation, migration, and role-provisioning services.
