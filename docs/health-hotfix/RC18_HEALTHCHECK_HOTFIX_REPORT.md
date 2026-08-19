# RC18 Health-check hotfix

## Incident

Database migration completed successfully, but Jenkins timed out while repeatedly calling:

```text
http://lsevin-providers-1:3000/api/health
```

The application had no explicit health handler. The catch-all module API returned 404. A first attempt to route health through the normal module host was also unsafe because importing the full module registry can initialize production configuration and database-dependent modules before the liveness response is produced.

## Final implementation

The existing catch-all API route handles `health` and `ready` before dynamically importing the module host.

- `GET /api/health`: dependency-free process liveness, HTTP 200.
- `HEAD /api/health`: dependency-free process liveness, HTTP 200.
- `GET /api/ready`: validates production configuration and database connectivity; HTTP 200 when ready, HTTP 503 otherwise.
- All other API requests dynamically import and use the normal Core/module API host.

This preserves the project rule of one explicit catch-all API route and avoids scattered App Router files.

## Verified results

- Health QA: 10/10
- Route layout: passed
- Static architecture: 60 modules / 601 files
- TypeScript: 0 errors
- ESLint: 0 errors
- Next.js compilation: 20.5 seconds
- Static pages: 3/3
- Build ID: `9cRB7jeuB_O62yu5p8tGO`
- Runtime startup: 1.45 seconds
- GET `/api/health`: 200
- HEAD `/api/health`: 200
- GET `/api/ready` without production environment: 503, as designed

## Changed files

- `src/core/api/health.ts`
- `src/app/api/[[...modulePath]]/route.ts`
- `scripts/health-route-qa.mjs`
- `package.json`
