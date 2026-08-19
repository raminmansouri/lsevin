# vNext Batch 7 — Referral & Collaboration Growth

Batch 7 adds a standalone ReferralGrowth module so providers/staff can grow inside LSevin using tracked referrals and collaborators instead of sending customers to unmanaged external social channels.

## Customer-driven value

- Customers receive a verified LSevin provider link rather than random off-platform claims.
- Providers can create approved referral programs, tracked collaborator codes and referral links.
- LSevin admin can moderate rewards/terms and inspect share-to-booking growth.
- Public front/app can record share, signup and booking conversion events.
- Conversion events are sent into the portal notification flow through Core ModuleBus.

## Architecture guardrails

- `src/modules/referral-growth` is self-contained.
- It imports only Core, local files and external packages.
- It uses `referral_growth.*` tables.
- It does not import BusinessGrowth, AudienceGrowth, Marketing, PaymentBilling or Notifications directly.

## Front integration

Use `webapp-referral-bridge-patch/src/lib/providerPortalReferralBridge.ts` from the LSevin front for:

- referral program fetch on provider pages
- share button events
- referral signup capture
- booking-created conversion events
