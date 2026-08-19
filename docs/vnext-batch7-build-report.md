# vNext Batch 7 Build Report — Referral & Collaboration Growth

## Built

- New standalone module: `src/modules/referral-growth`
- Provider route: `/providers/:providerId/referral-growth`
- Admin route: `/admin/referral-growth`
- Public route: `/providers/:providerId/referral`
- Public APIs:
  - `GET /api/public/providers/:providerId/referral-program`
  - `POST /api/public/providers/:providerId/referral-shares`
  - `POST /api/public/providers/:providerId/referral-signups`
  - `POST /api/public/providers/:providerId/referral-conversions`
- LSevin webapp bridge patch: `webapp-referral-bridge-patch/src/lib/providerPortalReferralBridge.ts`
- Launch readiness integration: `referral_growth_ready`

## Product value

Provider/staff pages can now grow through tracked referrals, collaborator links, public share flows, signup attribution, booking conversion attribution, and reward state tracking while keeping customers inside LSevin.

## Architecture

- Module depends only on Core.
- No `@modules/*` sibling imports.
- Notification flow uses Core `ModuleBus` capability `notifications.emit_from_lsevin`.
- Module database schema is `referral_growth`.
