# Deployment root-cause audit — B73

## What the latest log proves
- Docker and PostgreSQL are healthy.
- Public npm registry access is healthy.
- pnpm resolved/downloaded all 373 packages.
- failure occurred during pnpm binary linking (`compareCommandsInConflict` / `deduplicateCommands`).
- stack path shows pnpm **10.34.5**, not the documented 9.15.9 baseline.

## B72 defect
`normalize-package-manager.mjs` preserved any existing `pnpm@...` pin. Therefore deployment behavior depended on historical repository state.

## B73 invariants
1. `deployment/toolchain.json` is the deployment toolchain source of truth.
2. bootstrap sets `packageManager` exactly to `pnpm@9.15.9`.
3. all Corepack calls explicitly invoke `pnpm@9.15.9`.
4. a toolchain gate checks Node major + actual pnpm version before install.
5. pnpm-10 dependency/store/Corepack volumes are not reused.
6. local install may update the pnpm lockfile from the current package.json.
7. production requires the committed lockfile and uses `--frozen-lockfile`.
8. private OpenAI registry URLs, npm installs, OS package installs, and bash dependencies remain prohibited.
9. required later-stage deployment files are verified before dependency installation.

## Remaining external dependencies
First local startup still necessarily needs:
- Docker Hub for `node:22.23.2-alpine` and `postgres:17-alpine` if not already cached.
- `registry.npmjs.org` for pnpm/package tarballs not already cached.

No Alpine/Debian package repository is used by the app deployment.
