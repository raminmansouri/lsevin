# Batch 65 Package Verification Report

## Archive integrity

The following archives passed `unzip -t` CRC verification:

- `lsevin-providers-portal-v1.0.0-rc14-built.zip`
- `lsevin-providers-portal-v1.0.0-rc14-batch65-patch.zip`
- `lsevin-providers-portal-provider-portal-batch65-module-bundle.zip`
- `lsevin-providers-portal-batch65-multilingual-worklist.zip`

The full source archive was also checked to confirm it contains no packaged `node_modules`, `.next`, `.git`, Python cache or TypeScript incremental-build cache.

## Clean extracted source verification

The full RC14 source archive was extracted into a new empty directory and verified independently:

- `npm ci`: passed; 392 packages installed; 0 vulnerabilities
- TypeScript: passed
- Provider Portal multilingual QA: 28/28 passed
- Production build: passed
- Next.js: 15.5.20
- Clean-package compile: 14.9 seconds
- Static generation: 3/3
- Package version: 1.0.0-rc.14
- Module folders: 60

## Environment-dependent gate

The archive intentionally contains no production `.env.local`. Database-backed preflight and authenticated UAT therefore require deployment secrets and a restored LSevin PostgreSQL database.
