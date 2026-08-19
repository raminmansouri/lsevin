# B75 deployment/source root-cause closure

## Failure observed

Next.js started successfully, then compilation of `/` failed because
`src/modules/dashboard/pages/ProviderDashboardPage.tsx` imported `../i18n` while
`src/modules/dashboard/i18n.ts` was absent from the delivered source overlay.

## Why this became a domino failure

The local Compose chain validated package manager and deployment files, but did not
run the already-existing TypeScript/lint quality gate before migrations/web. Next.js
therefore became the first source compiler and surfaced errors one page at a time.

## B75 changes

1. Restores `src/modules/dashboard/i18n.ts` for all eight portal locales.
2. Adds `deployment/scripts/validate-source-tree.mjs`, which scans all source files
   and reports all unresolved relative imports in one pass.
3. Wires `deployment/scripts/run-quality-gates.mjs` into Compose before migrations.
4. `migrate` now requires `sourcecheck` success, and `web` still requires completed
   migration + runtime-role setup.
5. Deployment contract requires the source-checker, quality-gate runner, and dashboard
   i18n file so the omission cannot recur silently.

## Local startup chain

bootstrap -> contract -> toolchain -> deps -> verify -> sourcecheck -> migrate -> permissions -> web

`sourcecheck` = source import integrity + TypeScript typecheck + lint.
