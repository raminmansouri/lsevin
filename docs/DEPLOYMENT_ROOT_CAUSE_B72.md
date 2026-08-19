# B72 — Deployment root-cause stabilization

This replaces the symptom-by-symptom Docker fixes with one deployment contract.

## Root causes found

1. An older npm-based Providers Portal baseline leaked into a pnpm-oriented LSevin repository.
2. A stale npm lockfile was incorrectly treated as authoritative against a newer package.json.
3. An OpenAI-internal npm registry URL leaked into a lockfile.
4. Local Docker builds performed JavaScript dependency installation inside BuildKit.
5. The next local image revision still ran `apk add`, introducing an unrelated Alpine mirror dependency.
6. Docker/Kubernetes database helper paths still assumed `bash` while Alpine images only guarantee POSIX `sh`.
7. The production Dockerfile assumed a single-package repository instead of allowing pnpm workspace manifests.

## B72 invariants

- pnpm is the only project package manager.
- package.json is never replaced by this overlay.
- package-lock.json/npm-shrinkwrap.json are removed by the local bootstrap.
- local dependency installation happens in a visible `deps` service, not during image build.
- local app services use `node:22.23.2-alpine` directly; no custom app image build is needed.
- no `apk add`, `apt-get install`, or bash requirement exists in the deployment path.
- public package registry is `https://registry.npmjs.org/`.
- dependency install has a registry preflight and bounded fetch timeouts.
- pnpm store and Corepack cache are persistent Docker volumes.
- production requires a committed `pnpm-lock.yaml` and uses `--frozen-lockfile`.
- production copies the real repository/workspace before dependency resolution.
- `database-backup.sql` remains external to the app image and initializes PostgreSQL 17.
- DB migrations use admin credentials; web runtime uses a limited DB role.
- Docker and Kubernetes both use POSIX `sh` for DB permission scripts.

## Local command

```powershell
docker compose -f deployment/docker/compose.local.yml up --build
```

`--build` is harmless: the local application services no longer declare a build section.
Docker may pull the Node/Postgres images, then Compose starts the explicit bootstrap chain.

## First successful local run

The bootstrap may modify the current repository by:

- adding/preserving `packageManager: pnpm@...`;
- converting internal npm/npx script orchestration to pnpm;
- deleting package-lock.json/npm-shrinkwrap.json;
- generating/updating pnpm-lock.yaml from the CURRENT package.json/workspace.

Commit the resulting pnpm-lock.yaml once validated.

## External network dependencies remaining

The deployment cannot eliminate every network dependency. First-time startup/build still needs:

- Docker Hub (to pull Node/PostgreSQL/BusyBox images);
- registry.npmjs.org (to fetch pnpm and JavaScript packages).

It no longer needs Alpine or Debian OS package mirrors.
