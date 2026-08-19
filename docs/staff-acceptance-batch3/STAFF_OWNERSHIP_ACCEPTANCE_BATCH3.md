# Staff Ownership Acceptance — Batch 3

Scope: staff application → provider relationship → admin provisioning → profile claim → clinic/LSevin moderation → activation → staff self-profile/media ownership.

## Verified
- Staff Ownership acceptance: 66/66.
- Provider Access regression: 70/70.
- Provider Journey regression: passed.
- Route layout: passed.
- Static architecture: 60 modules / 614 files.
- Migrations: 88/88 unchanged from Provider Access Batch 2.

## Implemented
- Staff-specific save/resume/submit workflow.
- Only active LSevin providers are selectable and server validated.
- User-owned staff evidence via Core MediaPicker and server ownership validation.
- Admin approval provisions an inactive staff profile and provider relationship.
- Onboarding invokes `provider_portal.claim_profile` through the Core capability bus.
- Claim creation is advisory-lock/idempotency protected.
- Clinic review is scoped to the authorized provider.
- Claim moderation uses a row lock so concurrent clinic/LSevin decisions cannot leave stale aggregate status.
- Staff/provider link activates only after the claim reaches approved state.
- Staff self-profile uses only media uploaded by the authenticated LSevin user.

## Explicitly still open
- Live PostgreSQL transaction/UAT.
- Deployed SSO/browser test.
- Staff personal availability acceptance.
- Staff assigned bookings acceptance.
- Staff reviews/replies acceptance.
- Full semantic typecheck/lint/build was not asserted because dependencies are not installed in this extraction.
