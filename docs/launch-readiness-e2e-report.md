# LSevin Providers Portal — Launch Readiness E2E Report

## Verdict

The package is now **code-level launch-ready for staging and payment sandbox validation**. The remaining items are deployment-environment tasks: dependency installation, production build, database migration execution, real gateway credentials/endpoints, accountant/tax validation, and live payment tests.

## E2E journeys checked

### 1. Public acquisition

- `/become-provider` sends clinics/providers into provider application.
- `/become-staff` sends doctors/staff into staff profile claim/application.
- `/applications/new/staff` captures staff title, specialty, existing profile reference, and clinic relation.
- Staff applications use `clinic_confirmation → lsevin_review → payment_or_waiver`.

### 2. Staff ownership

- Staff profile ownership is not granted by login alone.
- `requireStaffProfilePermission` requires an approved `provider_portal_ext.profile_claims` row with:
  - target type `staff`
  - clinic approval
  - LSevin approval
  - paid, waived, or not-required payment status
- Approved staff can use `/staff/:staffId/profile` to manage their own public profile content.

### 3. Admin side

- Admin pages now request granular admin permissions.
- `requireAdminUser(permission)` checks the requested permission instead of accepting any admin-like role.
- Development override is disabled in production.

### 4. Payment and billing

- ProviderPortal, PricingPlans, Booking, Finance/Settlements, and claims integrate through Core ModuleBus capabilities.
- PaymentBilling owns invoice creation, tax/proforma invoice types, payment intents, manual receipt upload, verification, and reconciliation.
- Manual receipts require private uploaded files, not public/text URLs.
- ZarinPal and IDPay adapters support request/callback/verification wiring through configurable production endpoints.

### 5. Pricing and entitlements

- `free-claim` remains free.
- `verified-provider` defaults to `9,900,000 IRR` one-time.
- `staff-verified` defaults to `4,900,000 IRR` one-time.
- Entitlement/price checks fail closed if migrations are missing or plan prices are not configured.

### 6. Security and storage

- Production environment guard checks required DB, app URL, private storage, and payment gateway configuration.
- Receipt upload validates file type and size.
- Private receipt files are stored outside public web assets.

## QA results

Static QA, launch-readiness QA, and TypeScript syntax transpilation checks passed in the sandbox. Full `npm run typecheck` and `npm run build` still require project dependencies to be installed in the real environment.
