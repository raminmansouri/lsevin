# Jenkins recovery steps

1. Build and push the hotfix image from this source.
2. Keep the existing database and migration-history table.
3. Run the migration tool container again.
4. Confirm these lines appear before Core migration 001:

```text
[migrate] applied src/core/migrations/000_00_provider_portal_types.sql
[migrate] applied src/core/migrations/000_01_provider_portal_foundation.sql
```

5. Confirm the final status reports 86 applied, 0 pending, 0 drift.
6. Continue replica deployment only after `pnpm run migrate:check` succeeds.

If the runner reports that the target is not an LSevin-compatible database, verify the database name and `DATABASE_URL`; do not allow it to create shadow `category`, `identity`, `booking`, `commercial`, or `media` schemas.
