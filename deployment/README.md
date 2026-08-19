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

## Health model

- `/api/health` means the Node/Next.js process is alive.
- `/api/ready` means the application is alive **and** can query PostgreSQL.

Docker health checks use `/api/ready`. Kubernetes uses `/api/health` for startup/liveness and `/api/ready` for readiness.

## Database backup

`database-backup.sql` is used only to initialize an **empty** local/self-hosted PostgreSQL data volume. It is not copied into the web image and production publication never resets an existing database volume.
