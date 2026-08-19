# Staff Operations Acceptance Batch 4

Date: 2026-07-24

## Scope

This bounded product acceptance batch connects staff self-service scheduling and assigned-booking operations to the ownership foundation completed in Staff Ownership Batch 3.

## Implemented

### Staff availability
- Added `/staff/:staffId/availability`.
- Requires authenticated LSevin identity and approved, paid/waived, active staff profile claim.
- Core permission lookup also requires active `category.staff`, active `category.provider_staffs`, and active provider.
- Staff reads/writes only `provider_portal.generic_availability_rules` with `target_type='staff'`, the exact staff id, and the claim provider id.
- Provider Availability can target only active staff linked to the current provider.
- Staff and provider scheduling use the same canonical generic availability model.

### Staff assigned bookings
- Added localized staff booking page at `/staff/:staffId/bookings`.
- Staff booking reads require both claim provider id and exact active staff assignment.
- Staff note action derives provider id from the approved claim; no provider id is trusted from the form.
- Staff notes are internal and require an active exact staff assignment at write time.

### Provider booking management
- Fixed invalid `booking.bookings.currency` reference; canonical currency fields are used.
- Database errors are no longer swallowed as empty booking lists.
- Booking assignment verifies booking/provider ownership, active linked staff, and active provider-owned resource.
- Same assignment is idempotent; reassignment retires the previous active assignment.
- Status changes use a row lock and explicit transition graph.
- Provider booking notes verify booking/provider ownership.
- Raw staff/resource UUID entry was replaced with provider-owned selectors.

### Canonical product surface
- `booking-management` is the canonical provider booking UI.
- Legacy `/providers/:providerId/bookings` remains as a compatibility redirect.
- Duplicate legacy provider booking navigation is removed.
- Management Hub links to Booking Management.
- Staff self-profile links directly to own availability and assigned bookings in all eight portal locales.

## Verified gates
- Staff Operations acceptance: 79/79
- Staff Ownership regression: 66/66
- Provider Access regression: 70/70
- Provider Journey regression: 44/44
- Availability multilingual/reliability regression: 41/41
- Static architecture: 60 modules / 620 files
- Route layout: passed
- Migration immutability: 88/88 unchanged
- LSevin database contract for this slice: 13/13
- Changed TS/TSX syntax diagnostics: 23/23

## Open release gate
`npm ci` exceeded 120 seconds and was terminated. The partial dependency tree was removed. Therefore fresh semantic TypeScript, ESLint and production build results are not asserted for this batch.

## Deliberately still open
- Availability conflict detection and customer booking slot-resolution acceptance.
- Capacity enforcement through the public booking resolver.
- Booking detail page and secure required documents.
- Provider payable/compensation breakdown.
- Rescheduling and cancellation policy workflows.
- Booking lifecycle notifications.
- Staff reviews and remaining staff field-ownership/media/credential acceptance.
