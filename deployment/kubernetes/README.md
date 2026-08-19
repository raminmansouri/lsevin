# Kubernetes publication

The Kubernetes deployment uses Kubernetes-native lifecycle controls:

1. An init container runs the migration image. Its process is `psql` directly.
2. Kubernetes retries a failed init container automatically until the database is reachable and migrations succeed.
3. The web container starts only after the migration init container succeeds.
4. `startupProbe` and `livenessProbe` use `/api/health`.
5. `readinessProbe` uses `/api/ready`, which also checks PostgreSQL.

No Node deployment scripts and no shell wrapper scripts are involved.

## Build local images

For the development overlay:

```bash
docker build --target development -t lsevin-providers:dev .
docker build -f deployment/database/Dockerfile -t lsevin-providers-db:dev .
```

For the local production-like overlay:

```bash
docker build --target production -t lsevin-providers:local .
docker build -f deployment/database/Dockerfile -t lsevin-providers-db:local .
```

The development overlay sets `NODE_ENV=development` and enables the local account chooser. The local production-like overlay runs the standalone production image and keeps local authentication disabled, matching the production authentication boundary.

Load those images into your local Kubernetes engine if it does not share Docker's image store.

## Prepare the included PostgreSQL database

The SQL dump is intentionally not stored in a ConfigMap because it is large.

```bash
kubectl apply -f deployment/kubernetes/base/namespace.yaml
kubectl apply -f deployment/kubernetes/database/backup-storage.yaml
kubectl cp database-backup.sql lsevin-providers/lsevin-db-backup-loader:/backup/database-backup.sql
```

Then create the Secrets described in `SECRET_COMMANDS.md`.

## Development cluster

```bash
kubectl apply -k deployment/kubernetes/overlays/development
kubectl -n lsevin-providers port-forward service/providers-portal 3000:80
```

Open `http://localhost:3000`.

## Local production-like cluster

This overlay expects the same SSO/session settings as production. Create the portal secret first, then:

```bash
kubectl apply -k deployment/kubernetes/overlays/local
kubectl -n lsevin-providers port-forward service/providers-portal 3000:80
```

Open `http://localhost:3000`.

## Production with managed PostgreSQL

Edit the production image names/tags and database host, then:

```bash
kubectl apply -k deployment/kubernetes/overlays/production
```

## Production with self-hosted PostgreSQL

Upload `database-backup.sql` first, then:

```bash
kubectl apply -k deployment/kubernetes/overlays/production-selfhosted
```

The included PostgreSQL StatefulSet is a portable single-node option, not a high-availability database architecture.

## Scaling note

The bundled persistent file/media volumes are `ReadWriteOnce`, so the base deployment uses one replica with `Recreate`. Before scaling the Kubernetes web deployment above one replica, move uploads/private files to RWX storage or object storage, then switch to a rolling strategy.

`NEXT_PUBLIC_*` values are compiled into the image. Production registry images must therefore be built with the production build arguments shown in `deployment/README.md`; changing only the ConfigMap cannot rewrite already-built browser JavaScript.
