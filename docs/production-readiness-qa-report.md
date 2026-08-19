# Production Readiness QA Report

## Date

2026-07-06

## Scope

This pass addressed the launch-readiness blockers for the LSevin Providers Portal around staff profile ownership, provider/staff monetization, payment integration, admin permission enforcement, and receipt handling.

## Implemented fixes

1. Granular admin authorization
   - `requireAdminUser(permission)` now enforces requested permission classes.
   - Production ignores `PROVIDER_PORTAL_DEV_USER_ID` overrides.

2. Staff profile ownership
   - Added approved-claim guard: `requireStaffProfilePermission`.
   - Staff ownership requires clinic approval, LSevin approval, and paid/waived/not-required payment status.
   - Added `/staff/:staffId/profile` for approved staff self-management.

3. PaymentBilling production hardening
   - Added private receipt file storage with MIME and size validation.
   - Removed public URL-only receipt form inputs.
   - Added configurable ZarinPal and IDPay request/callback/verify adapters.
   - Added payment callback API routes:
     - `GET /api/billing/zarinpal/callback`
     - `GET /api/billing/idpay/callback`
     - `POST /api/billing/idpay/callback`
   - Added gateway event logging tables.

4. PricingPlans hardening
   - Paid profile ownership defaults:
     - `verified-provider`: `9,900,000 IRR`
     - `staff-verified`: `4,900,000 IRR`
     - `free-claim`: `0 IRR`
   - Price and entitlement checks now fail closed when migrations/prices are missing.

5. Production environment guard
   - Added required production env validation for DB, app URL, private storage, and payment gateway configuration.

## QA loop

Ran 10 passes of:

```bash
npm run qa:static
python scripts/launch-readiness-qa.py
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node /tmp/ts_syntax_check.js
```

## Result

All 10 passes succeeded.

```text
Static QA: ok, 24 modules, 220 TypeScript files
Launch-readiness QA: ok, 0 errors, 0 warnings, 319 checked files
TypeScript syntax transpilation: ok, 220 files
```

## Remaining deployment tasks

The sandbox does not have project dependencies installed, so full `npm run typecheck` and `npm run build` still need to be run in your real development or CI environment after `npm install`.

Before production launch:

1. Run migrations on staging PostgreSQL.
2. Configure real ZarinPal and IDPay endpoint/credential values in `.env`.
3. Run live/sandbox payment tests.
4. Validate official Iranian tax invoice output with accountant/tax provider.
5. Run `npm run typecheck` and `npm run build` in CI.
