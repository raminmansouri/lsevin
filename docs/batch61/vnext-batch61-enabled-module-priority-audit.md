# Batch 61 — Enabled Module Priority Audit

Release: `v1.0.0-rc.24`

## Scope

The registry contains 60 modules. Release safety blocks 36 modules whose LSevin customer frontend is missing or incomplete. The remaining 24 modules are approved to remain enabled and are the focus of production hardening.

## Immediate result

`booking-management` was the first priority because its provider route could return 404 from a stale runtime state. It also contained operational defects that could hide real bookings or trust manually entered UUIDs.

Batch 61 completed:

- Core migration `008_enable_release_approved_modules.sql` explicitly restores all 24 approved modules to enabled after upgrade.
- The 36 release-safety modules are never enabled by migration 008.
- The exact route `/providers/:providerId/booking-management` is verified in a production server fixture.
- Booking Management now has complete page copy for Persian, English, Arabic, Turkish, Spanish, Kurdish, German and French.
- Raw booking/staff/resource/provider UUID fields were replaced by provider-scoped searchable selections.
- The invalid `booking.bookings.currency` reference was removed. Currency now resolves from real LSevin booking currency columns.
- Assignment, note and status mutations now validate provider/staff/resource ownership server-side.
- Staff notes derive the provider from the current assignment rather than trusting a posted provider ID.
- Provider status transitions are restricted; administrators retain an audited override.
- A unique current-assignment index prevents multiple active assignments for one booking/provider pair.

## Enabled module priority map

### Priority 1 — financial and commercial correctness

1. `payment-billing`
   - Verify real gateway initiation/callback/idempotency.
   - Verify invoice, receipt and payment state reconciliation.
   - Complete eight-language operator/customer messages.

2. `provider-finance-analytics`
   - Verify wallet, ledger, settlement, reversal and payout invariants.
   - Remove any client-trusted financial values.
   - Test provider/customer/LSevin isolation and real multi-currency reconciliation.

3. `finance`
   - Decide whether this legacy module remains an adapter or is retired in favor of Provider Finance & Analytics.
   - Do not extend two independent finance sources of truth.

### Priority 2 — reporting and commercial entitlements

4. `reporting-analytics`
   - Complete locale-specific labels and exports.
   - Verify real-data aggregation, time-zone behavior and large-range performance.

5. `pricing-plans`
   - Connect plans and entitlements to actual module/feature access.
   - Verify upgrade/downgrade, expiry and billing synchronization.

### Priority 3 — duplicate-module consolidation

6. `media-library` versus `media`
   - Retain one authoritative provider media workflow.
   - Preserve media ownership and private-file access rules.

7. `reviews-standalone` versus `reviews`
   - Retain one review/moderation/reply implementation and migrate references.

8. `ticketing` versus `support`
   - Retain one provider support conversation/ticket workflow.

### Main enabled modules — continue regression and live UAT

The following are structurally aligned with the main LSevin/provider workflows and remain enabled:

- `admin-governance`
- `provider-portal`
- `availability`
- `bookings`
- `dashboard`
- `manage`
- `media`
- `offers`
- `onboarding`
- `provider-access`
- `providers`
- `reviews`
- `services`
- `staff`
- `support`

They have passed static, build and fixture gates, but production approval still requires restored PostgreSQL, real SSO, storage, messaging/payment integrations, provider A/B isolation and live workflow evidence.

## Honest lifecycle status

- 36 modules: disabled by release safety.
- 1 module: Booking Management hardened in Batch 61 and production-build/runtime verified.
- 15 main enabled modules: code/fixture ready; live-environment verification still open.
- 4 financial/reporting/entitlement modules: prioritized for deeper hardening.
- 4 duplicate/legacy modules: consolidation decision required before further feature expansion.

No module should be labelled fully production-approved until the real-environment launch gate is signed.
