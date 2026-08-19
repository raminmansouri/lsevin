# Launch Blockers Checklist

## P0 blockers

- [x] Harden `requireAdminUser` to enforce the requested admin permission, not only broad admin role.
- [x] Add staff-specific permission checks for staff profile ownership.
- [x] Add staff-owned profile route: `/staff/:staffId/profile`.
- [x] Add private receipt upload validation for JPG/PNG/WebP/PDF files.
- [x] Remove URL-only receipt submission from provider/admin billing forms.
- [x] Implement gateway adapter scaffolding for ZarinPal and IDPay request/callback/verify flows using configurable production endpoints.
- [x] Add public payment callback API routes for ZarinPal and IDPay.
- [x] Configure non-zero default paid pricing for `verified-provider` and `staff-verified`.
- [x] Change PricingPlans entitlement and price lookup to fail closed instead of granting fallback-free access.
- [x] Add production environment guard for required payment/storage/auth variables.
- [x] Run static QA and launch-readiness QA 10 times.

## Still required in the deployment environment

- [ ] Install dependencies and pass `npm run typecheck` in the real project environment.
- [ ] Pass `npm run build` in the real project environment.
- [ ] Run all migrations against staging PostgreSQL before production.
- [ ] Replace gateway endpoint placeholders in `.env` with real merchant production endpoints.
- [ ] Validate Iranian tax invoice legal/fiscal output with accountant/tax provider before issuing official tax invoices.
- [ ] Perform live sandbox/production payment transactions for ZarinPal, IDPay, and manual receipt verification.

## P1 hardening after launch

- [ ] Add richer clinic confirmation/rejection UI for staff claims.
- [ ] Add admin UI to link staff applications to existing staff profiles or create a new staff profile.
- [ ] Add notification templates for application, claim, payment, ticket, review, and booking state changes.
- [ ] Consolidate legacy reviews/support modules versus standalone modules.
- [ ] Add full moderation workflow for public-facing profile/service/staff content edits.
- [ ] Add exportable audit reports for every admin approval, payment verification, claim status change, and pricing change.
