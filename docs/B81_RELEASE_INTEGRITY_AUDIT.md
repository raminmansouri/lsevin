# B81 Full Release Integrity Audit

## Scope

B81 treats the current Providers Portal failures as one release-integrity problem across source, migration lineage, release profile, admin coverage, experience/localization, deployment ordering, and superseded release tooling.

Target release contract remains `rc16.2-platform-aligned` / package `1.0.0-rc.16`. B81 does **not** promote the product to RC17; Jenkins/staging/runtime promotion evidence remains external.

## Root cause found

The previous B77/B80 reconciliation imposed an unsafe "exactly 16 migrations" rule. To satisfy that artificial count, later published migrations were concatenated into older migration files. PostgreSQL's migration ledger correctly rejected the changed checksum. The user's runtime evidence for `src/core/migrations/002_provider_portal_management.sql` proved this: the database had the original checksum `c81fc6d...`, while the B80 source carried mutated checksum `76e94bcd...`.

This was not isolated to migration 002. Nine published migration identities had been rewritten:

1. `src/core/migrations/002_provider_portal_management.sql`
2. `src/core/migrations/003_admin_catalog_actions.sql`
3. `src/core/migrations/004_lsevin_media_ownership.sql`
4. `src/modules/booking-management/migrations/001_booking_management.sql`
5. `src/modules/notifications-module/migrations/001_notifications_module.sql`
6. `src/modules/onboarding/migrations/001_onboarding_admin.sql`
7. `src/modules/payment-billing/migrations/001_payment_billing.sql`
8. `src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql`
9. `src/modules/reviews-standalone/migrations/001_reviews_standalone.sql`

B81 restores all nine to their original published bytes/checksums.

The later schema changes are restored under their original separate identities instead of being folded backward into old files:

- Core: `005_module_runtime_state`, `005_staff_shared_provider_media`, `009_lsevin_sso_sessions`
- Booking Management: `002_booking_management_hardening`, `003_booking_change_workflow`
- Notifications: `002_notifications_bridge`, `031_reviews_workflow_templates`, `032_booking_lifecycle_templates`
- Onboarding: `002_application_draft_workflow`
- Payment/Billing: `002_payment_integrity`
- Provider Finance & Analytics: `001a_prepare_finance_view_reconciliation`, `002_finance_views_reconciliation`, `002_staff_compensation`
- Reviews: `001_provider_staff_review_workflow`, `001_review_reply_roles`

## Migration policy after B81

B81 replaces migration-count compression with an immutable lineage manifest at `scripts/migrations/lineage.json`.

Current state:

- 31 active immutable executable migrations
  - 7 Core
  - 24 module
- 104 known historical migration identities
- 73 retired historical identities

Rules:

1. Published migration content is immutable.
2. A schema change receives a new migration path; it is never appended to an already-applied migration.
3. Retired historical migrations are not re-executed, but their identities/checksums remain known so existing databases can be audited safely.
4. Unknown ledger entries fail the migration audit.
5. Active checksum drift fails the migration audit.
6. Retired checksum drift fails the migration audit.
7. All drift/history problems are reported before any pending migration is applied.
8. Pending active migrations are allowed by `migrate:audit`, then applied by `migrate` only after the lineage audit succeeds.

Local and production Compose now run `migrationaudit` before `migrate`. Kubernetes runs `audit-migration-lineage` before its migration init container.

## Release-profile audit

The current platform boundary is enforced as exactly 24 supported module folders and 24 enabled module IDs. Unsupported historical studio modules remain excluded from source/runtime publication.

The release contract no longer equates the module count with an artificial migration count. Module boundary and migration lineage are separate invariants.

## Stale release-QA contracts found and repaired

The broader audit found several QA scripts still describing older release lines:

- Admin catalog QA still expected 17 modules.
- Core experience QA still expected the old 17-enabled / 43-disabled profile and the removed `pricing-plans` module.
- Admin surface audit left `bookings`, legacy `finance`, and `support` unclassified even though their admin responsibilities are covered by Booking Management, Provider Finance & Analytics, and Ticketing.
- Static/release-boundary QA still assumed 16 migrations.

B81 updates these gates to the current 24-module / immutable-lineage model. Admin surface now reports:

- 18 direct admin surfaces
- 5 covered by canonical replacement admin surfaces
- 1 not required
- 0 backlog
- 0 unclassified

A new dependency-free `deployment/scripts/validate-release-hygiene.mjs` is wired into local sourcecheck, production Docker build, and the B81 reconciler. It checks current admin/experience audit inventories, release-gate wiring, superseded reconciler absence, and the specific stale UI patterns found in this audit.

## Real experience/localization gaps repaired

The broader QA also found two genuine current-release experience gaps; these were fixed rather than weakening the tests:

### Offers

The legacy Persian-only `description_fa` textarea was replaced with the shared `LocalizedField` description contract. The existing action already accepted translation maps, so the UI now matches the existing multilingual data contract across the eight portal locales.

### Provider Portal

- hard-coded four-language locale select -> shared `LocaleSelect`
- legacy per-language title/text inputs -> shared `LocalizedField`
- raw currency code input -> searchable shared `CurrencySelect`
- action now resolves the selected localized title/text with deterministic locale/fallback behavior while retaining translation maps

The regenerated experience audit reports all 24 supported modules main-use-case complete and zero reference-select, localized-field, media-picker, or locale-hardcode release gaps.

## Superseded release tooling

The old B78/B79/B80 apply scripts encoded release assumptions that can undo B81. The B81 reconciler removes those executable reconcilers from the target repository. Historical documentation can remain, but only `APPLY_B81_RELEASE_INTEGRITY_AUDIT.mjs` is authoritative for this source line.

## Source and deployment status

The user's B80 runtime already provided real environment evidence that, before migration application:

- `pnpm typecheck` passed
- `pnpm lint` passed
- PostgreSQL reached the migration stage

B81 changes TypeScript/TSX files for the experience fixes, so B81 does not claim a dependency-backed typecheck/lint/build until the user's next Docker sourcecheck proves them. Static parsing of all 373 TS/TSX files passes with zero syntax errors.

B81 also retains the previous deployment fixes: exact pnpm toolchain, generated `.next` isolation, database credential reconciliation for persistent volumes, discrete PG credentials, secret-example hygiene, non-destructive database reuse, and migration/permission/web ordering.

## Promotion policy

B81 is a repair/reconciliation release artifact, not promotion evidence. Package version intentionally remains `1.0.0-rc.16` and release profile `rc16.2-platform-aligned`. RC17 promotion remains held until the real CI/staging/runtime gates are green.
