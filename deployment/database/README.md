# Database publication

The database publication path is deliberately small:

- PostgreSQL is restored by the official `postgres:17-alpine` image when an empty local/self-hosted data volume is created.
- Portal schema changes remain normal `.sql` files owned by Core or their feature module.
- `deployment/database/migrate.sql` is the explicit canonical ordering of all enabled application migrations.
- `deployment/database/Dockerfile` packages the migration sources with PostgreSQL's own `psql` client.
- Docker Compose uses a one-shot `migrate` service.
- Kubernetes uses the same migration image as an init container.

There is no Node migration runner and no shell migration wrapper. The aggregate migration runs inside one PostgreSQL transaction and takes a transaction-scoped advisory lock so two publishers cannot change the schema concurrently. Lock acquisition is bounded to 60 seconds so publication does not wait forever behind a stuck transaction.

## Current migration set

The publication image contains every SQL migration under:

- `src/core/migrations/`
- enabled `src/modules/*/migrations/` directories

When a new migration is added, add one `\\ir` line to `migrate.sql` in the same order used by `src/core/modules/migrationDiscovery.ts`. The database image copies the module tree in one Docker `COPY`, so adding a brand-new module does not require another Dockerfile edit.

## Migration rule

Every migration must be safe to execute again. Prefer PostgreSQL-native idempotent forms such as `create table if not exists`, `create index if not exists`, guarded `alter table`, and `insert ... on conflict`.

Production uses a dedicated migration database account with DDL permissions. The long-running web container uses a separate limited runtime account. Database role creation and password rotation are infrastructure administration and are intentionally not performed by application startup.
