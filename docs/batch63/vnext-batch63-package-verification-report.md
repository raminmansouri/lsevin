# Batch 63 Package Verification Report

Release: `v1.0.0-rc.26`

## Source archive policy

The full source package excludes generated or private runtime material:

- `node_modules`
- `.next`
- `.git`
- `.test-private-files`
- `tsconfig.tsbuildinfo`
- Python bytecode/cache files

It includes source, migrations, tests, multilingual worklist artifacts, release notes and the Batch 63 tracker.

## Clean extraction verification

The full source archive was extracted into a new directory and dependencies were installed with `npm ci`.

Passed from the clean extraction:

- `npm run migrate:verify` — 89 migrations (8 Core + 81 module)
- `npm run qa:multilingual-inventory` — 24 modules, 65 route pages, 135 files
- `npm run qa:batch63` — 29/29
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 errors

The first combined verification command reached and completed TypeScript but the external command wrapper ended before printing lint. Lint was therefore rerun separately from the same clean extraction and passed. This was a wrapper-duration issue, not a code failure.

## Production evidence

The source package corresponds to the production build already verified in the working tree:

- Next.js 15.5.20
- compiled in 15.1 seconds
- generated 3/3 static pages
- Build ID `N2EvYfACHzg1loCxPqAkd`
- all established production route fixtures passed
- 24 authenticated application route-locale cases passed

## Diff and integrity

Compared with rc.25, the rc.26 delivery contains only added/changed files; no source file was deleted. Every distributed ZIP was tested with the ZIP CRC integrity check, and SHA-256 checksums are provided separately.
