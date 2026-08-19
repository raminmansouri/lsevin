# B71 — Package-manager root-cause stabilization

## Why this exists

The deployment path had mixed two repository generations:

- an older Providers Portal source that used npm + package-lock.json;
- a newer LSevin development convention that uses pnpm;
- a later source manifest whose dependency versions no longer matched the copied npm lockfile.

That created a domino sequence: npm runtime bugs, private registry URLs, then lockfile/manifest drift.

B71 removes the mixed contract instead of adding another npm workaround.

## New invariant

The Providers Portal deployment has exactly one JavaScript package manager:

- `packageManager` in `package.json`: pnpm (existing pnpm pin is preserved; otherwise pnpm 9.15.9 is selected)
- development lockfile: `pnpm-lock.yaml`
- production install: `pnpm install --frozen-lockfile`
- package registry: `https://registry.npmjs.org/`
- `package-lock.json` / `npm-shrinkwrap.json`: removed
- Docker development: dependency install happens once in the `deps` service and is shared through Linux volumes
- Docker production: dependencies are installed in a deterministic cached build stage

## Important safety property

This overlay does NOT ship a package.json or lockfile from an older release.

The first local startup reads your current package.json, converts only package-manager orchestration, removes the stale npm lock, then lets pnpm resolve the current manifest and write the new pnpm-lock.yaml into your repository.

No application dependency version is changed by the bootstrap script.

## One command

After extracting this overlay over the repository root:

```powershell
docker compose -f deployment/docker/compose.local.yml up --build
```

The startup chain is:

```text
bootstrap -> deps -> verify -> migrate -> permissions -> web
     \                         /
      -------- postgres ------
```

If the package-manager contract is inconsistent, `verify` stops before migrations or the application start.
