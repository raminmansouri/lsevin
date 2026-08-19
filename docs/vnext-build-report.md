# LSevin Providers Portal vNext Build Report

## Build scope

This iteration converts the vNext PRD/tracker into customer-facing and admin-facing features while preserving the modular architecture rule: extended modules stay in one folder and depend only on Core.

## Implemented customer/admin features

- Provider/staff claims: clinic confirmation, LSevin review, payment/waiver state and audit events.
- Profile/content self-service: provider submits provider/service/staff content drafts in fa-IR, en-US, ar, tr-TR.
- Moderation queue: LSevin approves/rejects drafts and publishes snapshots consumed by the public front.
- Booking operations: provider booking list, staff/resource assignment, provider notes, safe status transitions, staff-scoped assigned booking view.
- Media library: provider media registration, entity attachment, primary media selection, admin approval/rejection, public visibility state.
- Reviews: provider replies to reviews; admin moderates reviews and replies before public display.
- Ticketing: provider opens/replies to support tickets; admin replies, assigns, changes priority/status and uses internal notes.
- Notifications: multilingual event templates for claim, payment, booking, review, ticket; provider inbox and delivery logs.
- Analytics: provider/admin dashboards with bookings, paid bookings, profile views, invoices, reviews and tickets; snapshots and export jobs.
- Payment/Billing: admin can issue standard, Iranian tax, proforma, and international invoices directly from PaymentBilling.
- Public front contracts: stable DTO definitions for provider/service/staff/review/media payloads.

## Production launch principle

Every implemented story now has a route-level UI, repository layer, server action, and migration support where needed. Real production launch still requires dependency install, real CI typecheck/build, staging migrations, payment sandbox/production gateway UAT, accountant validation for official tax invoice output, and front contract tests against the actual LSevin front repository.
