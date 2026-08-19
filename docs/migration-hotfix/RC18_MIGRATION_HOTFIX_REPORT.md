# LSevin Providers Portal RC18 Migration Hotfix

## Failure fixed

The RC18 migration chain started with `src/core/migrations/001_provider_portal_hardening.sql`, which creates indexes on `provider_portal.provider_members` and other provider-portal foundation tables. Those tables existed in the supplied LSevin backup, but no packaged Providers Portal migration created them for older or partially initialized LSevin databases.

This caused:

```text
[migrate] relation "provider_portal.provider_members" does not exist
```

## Implementation

Two additive migrations now run before every historical migration:

- `src/core/migrations/000_00_provider_portal_types.sql`
- `src/core/migrations/000_01_provider_portal_foundation.sql`

They create or repair:

- four provider-portal enum types;
- all 15 foundational `provider_portal` tables;
- primary keys and natural unique keys;
- canonical LSevin foreign keys;
- essential indexes and update triggers;
- a safe `uuid_generate_v4()` compatibility function when the extension function is absent.

No historical migration was edited. All 84 original RC18 checksums remain identical.

## Migration runner hardening

`scripts/migrate.mjs` now:

- validates migration dependency order;
- verifies that all required foundation relations are present in the additive migrations;
- checks the live LSevin base schema and required columns before applying portal migrations;
- fails early with a precise wrong/incomplete-database message;
- continues to use advisory locking, one transaction per migration, immutable checksums and drift detection.

A `migrate:all` alias was added for the Jenkins/Docker command used in production.

## Verification

- 86 migrations verified: 6 Core + 80 module.
- 84/84 historical migrations checksum-identical.
- 15/15 provider-portal foundation relations covered.
- 14/14 required LSevin base relations found in the supplied PostgreSQL dump.
- Full 86-file SQL chain executed successfully in an isolated PostgreSQL-compatible engine. Four historical `CREATE EXTENSION pgcrypto` statements were omitted only in that embedded test because it does not ship PostgreSQL extensions; the supplied PostgreSQL 16 dump includes pgcrypto.
- TypeScript: passed.
- ESLint: passed.
- Static architecture QA: 60 modules / 600 files.
- Production build: passed with Next.js 15.5.20; 3/3 application routes generated.

## Safe deployment

Do not delete or edit `public.lsevin_provider_portal_migrations`.

```bash
IMAGE_TAG=<new-image-tag> docker compose --env-file /etc/lsevin/projects/providers.env --profile tools run --rm --no-deps migrate
```

Inside the image, the expected sequence is:

```bash
pnpm run migrate:verify
pnpm run migrate:all
pnpm run migrate:check
```

On the failed environment, the two new `000` migrations should apply first. The former `001_provider_portal_hardening.sql` failure should then proceed successfully.
