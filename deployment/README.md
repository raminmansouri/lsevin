# LSevin Providers Portal publication

This deployment is intentionally orchestrator-first and script-free.

## Runtime contract

- **Web image:** built by the root `Dockerfile`; starts with `node server.js`.
- **Migration image:** built by `deployment/database/Dockerfile`; starts with `psql` and applies the canonical Core + enabled-module SQL set from `deployment/database/migrate.sql`.
- **PostgreSQL:** the official PostgreSQL image handles first-time database restore for local/self-hosted environments.
- **Docker Compose:** owns dependency ordering and container health.
- **Kubernetes:** owns init sequencing plus startup/liveness/readiness probes.
- **Jenkins:** builds two immutable images, runs the one-shot migration container, and rolls the two Docker replicas one at a time.
- **Rancher:** deploys the Kubernetes overlays; it does not introduce application-specific startup logic.

There are no required `scripts/`, `ci/*.sh`, `deployment/*.mjs`, startup wrappers, migration runners, or deployment contract validators.

## Three environments

### 1. Development

Hot-reload Next.js with local PostgreSQL:

```bash
docker compose up --build
```

Open `http://localhost:3000`.

### 2. Local production-like publish

Runs the real standalone production image locally. Keep your existing `.env.local`, or create one from the safe template and fill the SSO/session values:

```bash
cp .env.example .env.local
docker compose -f deployment/docker/compose.local.yml up -d --build
```

Check:

```bash
docker compose -f deployment/docker/compose.local.yml ps
docker compose -f deployment/docker/compose.local.yml logs -f web
```

### 3. Production Docker publication

Production uses two files outside Git:

- `/etc/lsevin/projects/providers.env` -> long-running web runtime credentials/settings.
- `/etc/lsevin/projects/providers-migration.env` -> short-lived database migration credential.

Templates are in `deployment/env/`.

The Jenkinsfile publishes automatically. For a manual publication:

```bash
export IMAGE_TAG=manual-001

docker build --target production \
  --build-arg NEXT_PUBLIC_APP_URL=https://providers.lsevin.com \
  --build-arg NEXT_PUBLIC_DEFAULT_LOCALE=fa-IR \
  --build-arg NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Tehran \
  --build-arg NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN=.lsevin.com \
  -t lsevin-providers:$IMAGE_TAG .

docker build -f deployment/database/Dockerfile \
  -t lsevin-providers-db:$IMAGE_TAG .

docker compose -f deployment/docker/compose.production.yml config --quiet

docker compose -f deployment/docker/compose.production.yml run --rm --no-deps migrate

docker compose -f deployment/docker/compose.production.yml up -d --no-deps --force-recreate web-1
# Wait until web-1 is healthy before replacing web-2.
docker compose -f deployment/docker/compose.production.yml up -d --no-deps --force-recreate web-2
```

### Connect to the existing LSevin PostgreSQL container

The production Compose file does not declare PostgreSQL and cannot create,
replace, or remove its volume. It joins the platform's existing external Docker
network by its exact name:

```yaml
networks:
  lsevin-network:
    external: true
    name: lsevin-network
```

The platform exposes both PostgreSQL and PgBouncer on that network. Use two
different connection targets:

- `/etc/lsevin/projects/providers.env` (long-running web):
  `PGHOST=pgbouncer`, `PGPORT=6432`.
- `/etc/lsevin/projects/providers-migration.env` (one-shot DDL):
  `PGHOST=postgres`, `PGPORT=5432`.

The migrator must bypass PgBouncer because publication holds a session-level
PostgreSQL advisory lock across multiple migration transactions. Sending it
through a transaction-pooled proxy could change the server session between
transactions and invalidate that serialization guarantee. Runtime traffic uses
PgBouncer normally. The supplied PgBouncer configuration supports protocol-level
prepared statements (`max_prepared_statements`), so the runtime template keeps
`POSTGRES_PREPARE=true`; set it to `false` only if that server-side setting is
removed or disabled.

Do not use `localhost`, `0.0.0.0`, or either host-published port from the portal
containers. Docker services reach one another using service DNS names and
container ports.

Before publishing, verify that the network and database service are present:

```bash
docker network inspect lsevin-network >/dev/null
docker compose -f /path/to/lsevin-platform/docker-compose.yml ps postgres
docker compose -f /path/to/lsevin-platform/docker-compose.yml ps pgbouncer
```

Copy `deployment/env/production-runtime.env.example` to
`/etc/lsevin/projects/providers.env` and
`deployment/env/production-migration.env.example` to
`/etc/lsevin/projects/providers-migration.env`. Fill in the real database name,
users, and passwords, and restrict both files to the deployment account
(`chmod 600`). Keep the DDL-capable migration credential out of the long-running
web env file.

Map the platform credentials directly: `PGDATABASE=${POSTGRES_DB}`,
`PGUSER=${POSTGRES_USER}`, and `PGPASSWORD=${POSTGRES_PASSWORD}`. If dedicated
`providers_portal_migrator` and `providers_portal_app` roles have not yet been
created and granted the required access by database administration, use the
existing platform PostgreSQL account for the first controlled publication in
both files. Do not put literal `${...}` placeholders in the files—Compose
`env_file` entries are not a reliable cross-file secret-expansion mechanism.
Move the web runtime to a least-privilege role as a separate, tested database
administration change.

### Production-safe first migration

1. Confirm PostgreSQL is the writable primary and take a fresh, successful
   pgBackRest backup using the stanza configured by the platform project. Do
   this from that project, where its Compose file and pgBackRest stanza are
   known:

   ```bash
   docker compose -f /path/to/lsevin-platform/docker-compose.yml exec -T postgres \
     psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -X -v ON_ERROR_STOP=1 \
     -c "select current_database(), current_user, pg_is_in_recovery();"

   docker compose -f /path/to/lsevin-platform/docker-compose.yml exec -T postgres \
     pgbackrest --stanza=YOUR_STANZA --type=full backup

   docker compose -f /path/to/lsevin-platform/docker-compose.yml exec -T postgres \
     pgbackrest --stanza=YOUR_STANZA info
   ```

   Continue only when `pg_is_in_recovery` is `f` and the new backup reports a
   successful status. Replace `YOUR_STANZA`; do not guess it on production.

2. Build the immutable web and migration images as shown above, then validate
   the resolved Compose configuration. `config` does not connect to PostgreSQL:

   ```bash
   IMAGE_TAG=manual-001 docker compose \
     -f deployment/docker/compose.production.yml config --quiet
   ```

3. Run only the one-shot migrator and review its complete output before
   restarting either web replica:

   ```bash
   IMAGE_TAG=manual-001 docker compose \
     -f deployment/docker/compose.production.yml run --rm --no-deps migrate
   ```

   Production migration always passes `allow_bootstrap=false`; therefore the
   checked-in `database-backup.sql` can never be restored over production. The
   migrator checks the shared LSevin baseline and the portal foundation before
   changing anything, serializes publishers with a PostgreSQL advisory lock,
   verifies checksums of previously applied migrations, and applies each new
   migration in its own transaction with `ON_ERROR_STOP`. A failed migration is
   rolled back and stops publication. Re-running the command skips migrations
   already recorded successfully.

4. If the migrator reports that the `provider_portal` foundation is incomplete,
   stop. This release deliberately does not synthesize those foundation tables
   in an existing production database. Reconcile the platform database version
   or restore the correct production database; never enable bootstrap as a
   workaround.

5. After migration succeeds, roll `web-1` and wait for it to become healthy,
   then roll `web-2`, as shown in the manual publication commands. The readiness
   endpoint proves the runtime credential can query the existing database.

Do not run `docker compose down -v`, restore `database-backup.sql`, or attach a
new PostgreSQL service to this production Compose project. Database recovery is
owned by the platform project's pgBackRest procedure.

## Health model

- `/api/health` means the Node/Next.js process is alive.
- `/api/ready` means the application is alive **and** can query PostgreSQL.

Docker health checks use `/api/ready`. Kubernetes uses `/api/health` for startup/liveness and `/api/ready` for readiness.

## Database backup

`database-backup.sql` is used only to initialize an **empty** local/self-hosted PostgreSQL data volume. It is not copied into the web image and production publication never resets an existing database volume.
