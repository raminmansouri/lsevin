# Publication validation status

Validated on 2026-08-18 after replacing the old script-driven publication path.

## Static checks completed

- All 24 Docker Compose, Kubernetes, Kustomize and Rancher YAML files parse successfully.
- Every Kustomize `resources` and `patches` reference resolves to an existing file.
- All 31 SQL migrations currently present under Core/module `migrations/` directories are listed exactly once in `deployment/database/migrate.sql`.
- The migration image uses PostgreSQL `psql` directly and copies the module source tree once, preventing a new module migration from being absent merely because another Dockerfile `COPY` line was forgotten.
- The full SQL chain runs in one PostgreSQL transaction with a transaction-scoped advisory lock, preventing half-applied or concurrent schema publication; lock acquisition is bounded to 60 seconds.
- No active source/build/deployment configuration references the deleted `scripts/` tree, `start-local.mjs`, `validate-deployment-contract.mjs`, `migrate.mjs`, or the old JavaScript healthcheck.
- No `script/` or `scripts/` directory remains in the project.
- `package.json` lifecycle commands call Next.js, ESLint and TypeScript directly.
- `/api/health` and `/api/ready` route files exist and are wired into Docker/Kubernetes health checks.
- Current SQL migrations contain no unguarded `CREATE TABLE`, `CREATE INDEX`, `CREATE SCHEMA`, `CREATE TYPE`, `ADD COLUMN`, `DROP TABLE`, or `DROP SCHEMA` statements.

## Runtime checks that must run on the Docker/Jenkins host

This execution environment does not provide Docker, kubectl/kustomize, or network access to install the project dependencies. Therefore the following checks are intentionally performed by the real publication environment instead of being claimed here:

1. `docker build --target production ...`
2. `docker build -f deployment/database/Dockerfile ...`
3. `docker compose -f deployment/docker/compose.production.yml config --quiet`
4. one-shot migration container against the target PostgreSQL server
5. `/api/health` and `/api/ready` container/public endpoint checks

The Jenkinsfile performs these production checks in publication order and stops before replacing replica 2 if replica 1 does not become healthy.
