# LSevin Providers Portal — Staff Reviews & Media Acceptance Batch 6

Date: 2026-07-24

## Scope closed in this batch

### PP-134 — Review notifications

Review workflow notifications now use the Core module capability bus (`notifications.send_template`) rather than importing the Notifications module from Reviews.

Implemented behavior:

- provider/staff review reply created -> pending/approved notification as applicable;
- reply moderation -> approved/rejected notification to the reply author;
- review report submitted -> acknowledgement to reporter;
- report moderation -> actioned/dismissed notification to reporter;
- canonical notification templates seeded in all eight portal locales;
- user `preferred_locale` and `notifications_enabled` respected;
- review audience subscription and preferred channel respected;
- in-app items and delivery logs created by the Notifications module;
- unavailable/disabled notification capability never causes the underlying Reviews business action to fail.

### PP-137 — Explicit provider-media sharing for staff

Provider media remains private by default. A provider can explicitly grant one active linked staff profile read-only access to a provider-owned media item and later revoke that grant.

Read access is revalidated against:

- exact provider + staff relationship;
- active staff record;
- active provider;
- approved exact staff claim for the signed-in user;
- provider ownership of the media item.

Staff profile image, education, credential, certification, achievement and gallery fields continue to use strict user-owned media scope. Shared provider media is not silently accepted as staff-owned evidence.

The provider sharing picker now lists provider-owned media only. Server-side ownership validation remains authoritative.

## Architecture

- Shared abstractions and access policy live in `src/core`.
- Reviews does not import Notifications directly; it invokes a Core capability.
- Media sharing does not introduce a sibling-module dependency.
- Existing LSevin media and review tables/contracts are preserved.
- Two additive migrations were introduced; all 85 Batch 5 fallback migration files are byte-for-byte unchanged.

## Verification

| Gate | Result |
|---|---:|
| Batch 6 focused acceptance | 98/98 passed |
| Batch 5 regression | 68/68 passed |
| Static architecture | 60 modules / 598 TS+TSX files |
| Core Experience QA | 14 core files + 24 integration assertions passed |
| Route architecture | passed |
| Launch readiness static scan | 0 errors; existing DATABASE_URL guard warning |
| Changed TS/TSX syntax | 19/19, zero TypeScript diagnostics |
| Migration static verification | 87 total; 85 baseline unchanged; 2 additive |
| Module manifest JSON | 3/3 valid |

## Infrastructure-blocked gates — not claimed

Authenticated PostgreSQL UAT could not run because this execution environment does not provide `DATABASE_URL` or `.env.local`.

A fresh dependency-backed semantic TypeScript check, ESLint, Next.js production build, npm audit and official migration runner are not claimed. `npm ci` could not complete because the dependency registry returned HTTP 503 responses; the partial `node_modules` directory was removed.

## Source parity caveat

The exact Staff Operations Batch 4 source archive is still not available as mounted source bytes. Batch 6 therefore builds directly on the distributed Batch 5 reconstructed fallback. The source evidence recorded a newer 60-module / 620-file / 88-migration state; this package does not claim binary parity with that unavailable source.

## Next product acceptance group

Once infrastructure-backed gates can be executed, continue the remaining customer-driven booking/availability gaps, prioritized as:

1. booking documents and provider/staff visibility;
2. reschedule/cancellation workflow with role/transition rules;
3. booking notifications;
4. compensation/earnings breakdown in provider/staff booking views;
5. availability conflict detection and customer slot/capacity resolution.
