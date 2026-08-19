# Batch 60 QA Report

## Static and release checks

- npm audit: 0 vulnerabilities
- Route layout: passed
- TypeScript: passed
- ESLint: passed
- Static QA: 60 modules / 607 source files
- Administration surface backlog: 0
- Batch 51–60 regression gates: passed
- Batch 60 safety gate: 18/18
- Translation integrity: passed; zero hybrid word substitutions
- Migration verification: 87 migrations (7 Core, 80 module)

## Production build

- Next.js 15.5.20
- Compilation: 30.3 seconds
- Static pages: 3/3
- Optimization and build trace collection: passed
- BUILD_ID: `2J9R-SZ2mJRqH1bR7yZhm`

## Runtime fixtures

- Local and production preflight fixtures: passed
- Anonymous/authenticated route fixtures: passed
- Administration catalog: passed
- Governance allow and deny: passed
- Onboarding approval page: passed
- Module state and frontend-safety routing: 27/27
- Safety-disabled module count rendered: 36
- No AggregateError
- No hydration mismatch

## Explicit runtime samples

The following disabled surfaces returned 404:

- `/admin/business-growth`
- `/admin/boost-studio`
- `/admin/content-studio`
- `/admin/notifications`
- `/admin/arrival-checkin`
- `/providers/:providerId/challenges`
- `/providers/:providerId/ask`
- `/providers/:providerId/updates`
- `/providers/:providerId/stories`
- `/providers/:providerId/my-case`
- growth, decision, audience and content public APIs

## Not verified here

- Migration 007 against the real PostgreSQL deployment
- Restart persistence in the real deployment
- Real SUPERADMIN override audit rows
- Installation/completion of corresponding LSevin customer frontends
