# LSevin Providers Portal vNext — Batch 32 Build Report

## Release
- Batch: 32
- Launch label: vNext 4.0
- Module: Class & Group Session Studio
- Readiness key: `class_group_studio_ready`

## Product scope
Batch 32 adds provider/customer/admin workflows for recurring classes, one-off group sessions, capacity, waitlists, dependent enrollment, seat promotion, attendance and no-show management. Customers can securely enroll themselves or household members, join bounded waitlists and accept time-limited seat offers. Providers can publish moderated programs and sessions, supervise enrollment and record attendance. Admins can review capacity, expired offers, minor guardian verification and financial risks.

## Public routes and APIs
- Provider: `/providers/:providerId/class-group-studio`
- Admin: `/admin/class-group-studio`
- Customer: `/providers/:providerId/classes`
- Public APIs: class studio, enrollment start/get, participant add, responses and events.

## Security and capacity controls
- Enrollment access tokens are stored only as SHA-256 hashes.
- Protected APIs use `x-lsevin-class-token`.
- Secrets are not accepted from query strings by the public API bridge.
- Session allocation locks capacity before calculating active enrollment and seat holds.
- Enrollment fails when capacity is unavailable and waitlisting is not permitted.
- Waitlists are bounded by program/session configuration.
- Seat-promotion offers expire and cannot be accepted after capacity or hold validity is lost.
- Minor participants can require guardian verification.
- Customer timelines require `customer_visible=true` and `is_internal_note=false`.

## Validation
- Feature/security QA: 10/10 passed.
- Static modularity QA: 10/10 passed.
- Launch-readiness QA: 10/10 passed.
- Registered modules: 54.
- TypeScript files checked: 505.
- Readiness files checked: 796.
- Class & Group Session Studio TypeScript diagnostics: 0.
- Repository diagnostics: unchanged 92 pre-existing diagnostics.
- Next.js webpack build compiled successfully, then stopped on the existing `ModuleNavigationItem.moduleId` contract in `src/core/ui/PortalShell.tsx`.

## External launch gate
Real provider, customer, finance, safeguarding, legal, security and frontend staging UAT remains required before public rollout.
