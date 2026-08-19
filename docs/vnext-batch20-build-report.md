# vNext Batch 20 Build Report — Proposal Studio

## Built

- Standalone module: `src/modules/proposal-studio`
- Provider route: `/providers/:providerId/proposal-studio`
- Admin route: `/admin/proposal-studio`
- Public route: `/providers/:providerId/proposals`
- Public APIs:
  - `GET /api/public/providers/:providerId/proposals`
  - `POST /api/public/providers/:providerId/proposal-events`
  - `POST /api/public/providers/:providerId/proposal-requests`
  - `POST /api/public/providers/:providerId/proposal-responses`
- PaymentBilling integration through Core ModuleBus capability `billing.issue_invoice`
- Notification bridge through Core ModuleBus capability `notifications.emit_from_lsevin`
- LSevin webapp bridge patch:
  - `webapp-proposal-studio-bridge-patch/src/lib/providerPortalProposalStudioBridge.ts`
- Launch readiness key: `proposal_studio_ready`

## Customer value

Proposal Studio closes the gap between consultation and booking. Providers/staff can prepare customer-specific proposals with line items, price ranges, deposits and validity windows. Customers can accept, request changes or decline inside LSevin. Accepted proposals can trigger PaymentBilling invoice creation through Core ModuleBus.

## Architecture compliance

- One standalone module folder.
- Depends only on Core.
- No sibling-module imports.
- Billing and notification cross-module work uses Core ModuleBus capabilities.
- Public APIs expose approved/published proposal content.
- Admin moderation exists before public/sensitive proposal exposure.
