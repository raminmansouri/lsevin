# LSevin Providers Portal vNext — Batch 35 Build Report

## Release
- Batch: 35
- Version: vNext 4.3
- Feature: Arrival & Check-in Studio
- Date: 2026-07-09

## Customer capability
Batch 35 adds a secure pre-arrival and check-in workspace for onsite, remote, home-visit, pickup, class, consultation and custom journeys. Customers can review readiness tasks, update ETA, disclose companion/accessibility/language needs, check in, follow queue position and receive a visible service handoff.

## Provider and admin capability
- Moderated arrival policy and reusable readiness templates.
- Provider-created or customer-started check-in visits.
- Blocking task enforcement before readiness and check-in.
- Atomic queue-number allocation using a PostgreSQL advisory transaction lock.
- Late, no-show, blocked-readiness, long-wait and identity-review supervision.
- Customer-visible activities separated from provider-private notes.
- Generic booking, consent, document, payment and household references without sibling imports.
- LSevin frontend bridge and Core ModuleBus notification events.
- Provider readiness key: `arrival_checkin_studio_ready`.

## Architecture
- Module folder: `src/modules/arrival-checkin-studio`
- Module kind: `extended-module`
- Dependency: Core only
- PostgreSQL schema: `arrival_checkin_studio`
- Direct sibling imports: 0
- Install mode: optional

## Public routes and APIs
- Provider: `/providers/:providerId/arrival-checkin`
- Admin: `/admin/arrival-checkin`
- Public: `/providers/:providerId/check-in`
- `GET /api/public/providers/:providerId/check-in/profile`
- `POST /api/public/providers/:providerId/check-in`
- `GET /api/public/providers/:providerId/check-in/item`
- `POST /api/public/providers/:providerId/check-in/responses`
- `POST /api/public/providers/:providerId/check-in-events`

## Security and integrity
- Visit access tokens stored only as SHA-256 hashes.
- Customer matching key stored as a normalized SHA-256 hash.
- Protected APIs read only `x-lsevin-checkin-token`.
- Bridge removes `accessToken` from protected JSON bodies.
- Internal notes are excluded from public DTOs.
- Blocking tasks prevent readiness and check-in until completed or waived.
- Queue allocation is serialized per provider/day by `pg_advisory_xact_lock`.

## Compiler and build
- Arrival & Check-in Studio TypeScript diagnostics: 0
- Repository diagnostics: 92 pre-existing diagnostics, unchanged from Batch 34
- Next.js webpack compilation: successful in 13.4 seconds
- Build type-validation stop: existing `src/core/ui/PortalShell.tsx` `ModuleNavigationItem.moduleId` contract
- Batch 35 files mentioned in build errors: 0

## Remaining external launch work
Real concurrent queue, provider operations, accessibility, language/interpreter, safeguarding, identity, notification-delivery and LSevin frontend staging UAT remains required under LG43.
