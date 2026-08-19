# Batch 6 build and UAT limitations

- `DATABASE_URL`: not configured in this execution environment.
- `.env.local`: not present.
- Authenticated PostgreSQL integration/UAT: not run and not claimed.
- `npm ci`: dependency registry returned HTTP 503 responses before installation completed.
- Partial `node_modules`: removed after the failed installation attempt.
- Semantic TypeScript / ESLint / Next.js production build / npm audit / dependency-backed `migrate:verify`: not run and not claimed.

Static, structural, migration-immutability, route, Core Experience, focused acceptance, regression and changed-file TypeScript syntax gates were run and passed as reported in `STAFF_REVIEWS_MEDIA_ACCEPTANCE_BATCH6.md`.
