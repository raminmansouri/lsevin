# QA report

## Redesign target

Redesign the providers portal so the project uses:

- one core module;
- one-folder extended modules;
- no scattered feature routes under `src/app`;
- no root-level module migrations;
- no bash install/export scripts for modules;
- no sibling-module imports inside extended modules.

## Static QA checks

`npm run qa:static` runs `scripts/static-qa.py` and verifies:

1. Core route host files exist.
2. Only core-owned app files exist under `src/app`.
3. Every module folder has `module.tsx` and `index.ts`.
4. No module contains `route-segments` or module helper `scripts` folders.
5. Imports resolve statically.
6. Extended modules do not import sibling modules through `@modules/*`.
7. Core imports extended modules only through `src/core/modules/registry.ts`.
8. Critical feature terms exist: onboarding, provider members, resources, availability rules, offers, reviews, support tickets, payout accounts, provider wallets and settlement batches.
9. Required modular route declarations exist.

## Result

Static QA was run 10 times after the redesign. All 10 passes succeeded.

## Build limitation

A full `next build` was not run in this sandbox because dependencies are not installed. Run this locally after extracting:

```bash
npm install
npm run typecheck
npm run build
npm run qa:static
```
