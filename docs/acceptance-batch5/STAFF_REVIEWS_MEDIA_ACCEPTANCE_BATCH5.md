# LSevin Providers Portal — Staff Reviews & Media Acceptance Batch 5

Date: 2026-07-24

## Source basis

The newest supplied continuation evidence is **Staff Operations Batch 4**. Its explicit next bounded pass is:

- Staff Reviews;
- remaining staff media/credentials;
- remaining field-ownership rules.

The actual Batch 4 source ZIP is not mounted in this runtime. The mounted code baseline is `lsevin-providers-portal-v1.0.0-rc12-built(1).zip`. To avoid knowingly regressing accepted behavior, this batch first reconstructs the Batch 4 behaviors described in the source evidence and then adds the new scope.

This package must therefore be treated as a **source-reconstructed acceptance batch**, not as byte-for-byte continuation of the unavailable Batch 4 source archive.

## Implemented in this batch

### Staff reviews

- Added canonical provider route `/providers/:providerId/reviews`.
- Added staff self route `/staff/:staffId/reviews` scoped by approved active staff ownership.
- Added admin review moderation route `/admin/reviews` protected by `REVIEW_ADMIN`.
- Provider review list supports target, rating, verification, moderation, text, and date filters.
- Staff sees only reviews for the exact approved provider + exact staff profile + `review_target='specialist'`.
- Provider may create one official provider response per review.
- Staff response is disabled by default and requires an explicit provider response policy.
- Provider/staff official responses may require admin moderation before public visibility.
- Reply moderation stores reviewing admin and timestamp.
- Provider/staff can report a review to LSevin administration without opening direct customer chat.
- Review analytics include total, average rating, verified count, moderation count, response count, and rating distribution.
- Legacy `reviews-standalone` provider route redirects to the canonical Reviews module to avoid duplicate behavior.

### Staff media, credentials, and field ownership

- Core Media API/MediaPicker now supports authenticated `scope=user` access for staff-owned media.
- User-scoped media can list/read/upload only files created by the same LSevin user.
- Staff profile image, education evidence, certifications, credentials, and gallery use user-owned media validation server-side.
- Staff can manage own multilingual name/title/specialty/biography after approved ownership.
- Staff can manage own languages, education, unverified certifications, unverified credentials, achievements, and gallery.
- Staff cannot self-verify certifications/credentials.
- Provider relationship editing no longer changes global `category.staff.is_active` or staff-owned profile fields.
- Removing staff from a provider deactivates the provider-staff relationship instead of deleting history.
- Added `src/modules/staff/FIELD_OWNERSHIP.md` defining staff-editable, provider-controlled, and admin-controlled fields.
- Provider-assigned services are visible to staff as read-only relationship data.

### Restored accepted Staff Operations protections

Because the mounted baseline predates the newest source evidence, this batch also reconstructs the accepted protections described by Staff Operations Batch 4:

- Staff self-profile/availability/bookings require approved claim + active staff + active provider-staff relationship + active provider.
- Staff availability uses `provider_portal.generic_availability_rules` with exact provider + staff scope.
- Provider staff availability selection is limited to active linked staff.
- Staff booking list is exact provider + exact assigned staff.
- Staff booking notes derive provider scope server-side and remain internal.
- Booking Management uses canonical booking currency columns, not nonexistent `booking.bookings.currency`.
- Booking reads no longer convert database errors into empty lists.
- Booking assignment validates owned booking, active provider staff, and active owned resource.
- Repeated same assignment is idempotent and previous assignment is retired safely.
- Booking status updates use row locking and reject invalid transitions; terminal states remain terminal.
- Legacy `/providers/:providerId/bookings` redirects to canonical `/providers/:providerId/booking-management`.

## Database change

Added one additive module migration:

`src/modules/reviews/migrations/001_provider_staff_review_workflow.sql`

It:

- creates the `provider_reviews` support schema;
- expands official review reply author roles to provider/staff while preserving customer/admin roles;
- records review-response moderation actor/time;
- adds provider response policy;
- adds review reporting to admin;
- enforces one active official provider/staff response per review;
- prevents duplicate open report submission by the same reporter.

Migration integrity in the mounted fallback tree:

- baseline migrations: 84;
- current migrations: 85;
- existing migrations changed: 0;
- existing migrations removed: 0;
- new migrations: 1.

The newer Staff Operations source evidence reported 88 migrations. The difference is caused by the unavailable newer source archive and is intentionally not hidden.

## QA evidence

| Gate | Result |
|---|---:|
| Staff Reviews & Media focused acceptance | 68/68 passed |
| Changed TS/TSX syntax | 36/36 passed |
| Static architecture | 60 modules / 595 TS/TSX files |
| Core experience | 14 core files + 24 integration assertions passed |
| Route architecture | passed |
| Launch-readiness static scan | 0 errors; 1 DATABASE_URL-guard warning |
| Existing migration immutability | 84/84 unchanged |
| New review migration | present |
| Module/route JSON parsing | passed |
| Invalid `b.currency` regression scan | clean |
| Invalid `provider_members.status` regression scan | clean |
| Clean extracted distributed source | focused/static/core/routes/launch-readiness passed |

### Dependency-backed build gate

A fresh dependency-backed semantic gate is **not claimed**.

`npm ci --no-audit --no-fund` did not complete before the execution wrapper terminated the process. The orphan install process was stopped and partial `node_modules` was removed.

Therefore this batch does **not** claim fresh results for:

- complete TypeScript typecheck;
- ESLint;
- Next.js production build;
- npm audit;
- dependency-backed migration runner.

## Remaining next work

1. Integrate review notifications (PP-134) with the shared LSevin notification infrastructure.
2. Decide/implement the exact policy for staff access to explicitly shared provider media (PP-137); current staff media is intentionally user-owned only.
3. Perform live PostgreSQL authenticated UAT for staff review isolation, media isolation, credential persistence, booking assignment/status concurrency, and staff availability persistence.
4. Re-run dependency-backed `typecheck`, `lint`, `build`, audit, and migration verification in an environment where dependency installation completes.
5. Continue the broader open availability/booking gaps already called out by the prior source: conflict/capacity slot resolution, booking documents, compensation breakdown, rescheduling/cancellation, and booking notifications.
