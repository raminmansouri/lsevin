# vNext Batch 20 — Proposal Studio

## Product value
Proposal Studio closes the gap between consultation and booking. Providers and staff can prepare LSevin-native proposals with inclusions, price ranges, deposits, validity windows and customer-specific next steps. Customers can accept, request changes or decline without leaving LSevin.

## Customer journey
1. Customer sends inquiry or consultation request.
2. Provider/staff prepares a proposal using approved templates.
3. LSevin admin moderates public/sensitive promises.
4. Customer opens proposal on LSevin front.
5. Customer accepts, requests changes, or declines.
6. Accepted proposals can trigger PaymentBilling invoice through Core ModuleBus.
7. Notifications keep provider/admin/customer in the loop.

## Compatibility
- Provider route: `/providers/:providerId/proposal-studio`
- Admin route: `/admin/proposal-studio`
- Public route: `/providers/:providerId/proposals`
- Public APIs under `/api/public/providers/:providerId/...`
- Readiness key: `proposal_studio_ready`

## Architecture
Standalone module under `src/modules/proposal-studio`. No sibling-module imports. Billing and notifications use Core ModuleBus.
