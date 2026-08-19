# PaymentBilling Integration Map

This pass searched all provider-portal modules for payment, billing, invoice, receipt, gateway, finance, wallet, settlement, pricing, plan, and booking payment touchpoints. The payment-sensitive areas were integrated through Core `ModuleBus` capabilities instead of cross-importing the `payment-billing` module.

## Core integration

- `src/core/modules/moduleBus.ts`
  - Added lazy registry loading so server actions can invoke module capabilities even when a page render did not already import the module registry.
- `src/core/modules/contracts.ts`
  - Existing `EntityReference`, `ModuleCapabilityRequest`, and `IssueInvoicePayload` are now used by integrated modules.

## PaymentBilling module

- `src/modules/payment-billing/module.tsx`
  - Registers live capability handlers:
    - `billing.issue_invoice`
    - `billing.issue_proforma`
    - `billing.issue_tax_invoice`
    - `payment.create_payment_intent`
    - `payment.upload_manual_receipt`
    - `payment.verify_manual_receipt`
    - `payment.reconcile_bank_statement`
- `src/modules/payment-billing/repository.ts`
  - Added invoice issue, payment intent creation, manual receipt upload, receipt verification, bank reconciliation import, invoice list, totals, and payment method listing.
- `src/modules/payment-billing/actions.ts`
  - Added UI actions for creating payment intents and uploading/verifying receipts through ModuleBus.
- `src/modules/payment-billing/pages/*`
  - Provider and admin billing pages now show real invoices issued by all integrated modules.
- `src/modules/payment-billing/migrations/001_payment_billing.sql`
  - Added invoice number sequence, payment intents, bank reconciliation batches, and indexes.

## ProviderPortal integration

- `src/modules/provider-portal/actions.ts`
  - Added profile-claim invoice issuing.
  - Calls `plans.calculate_profile_ownership_price` first.
  - Calls `billing.issue_invoice` when a charge is required.
  - Waives claim payment when amount is zero/free.
- `src/modules/provider-portal/repository.ts`
  - Added claim listing, claim lookup, invoice attachment, and payment waiver persistence.
- `src/modules/provider-portal/pages/*`
  - Admin can issue ownership invoices or waive payment from the claim queue.
  - Provider can see claim payment state.

## PricingPlans integration

- `src/modules/pricing-plans/module.tsx`
  - Registers pricing capability handlers:
    - `plans.calculate_profile_ownership_price`
    - `plans.check_entitlement`
    - `plans.enforce_module_access`
- `src/modules/pricing-plans/repository.ts`
  - Added profile ownership price calculation and entitlement checks.
- `src/modules/pricing-plans/actions.ts`
  - Added provider-plan invoice issuing through `billing.issue_invoice`.
- `src/modules/pricing-plans/pages/*`
  - Provider/admin pages now include plan invoice creation.
- `src/modules/pricing-plans/migrations/001_pricing_plans.sql`
  - Added default free/verified provider/staff plans and entitlement seeds.

## Booking payment integration

- `src/modules/bookings/actions.ts`
  - Added booking invoice issuing through `billing.issue_invoice`.
- `src/modules/bookings/repository.ts`
  - Added booking invoice source lookup and invoice metadata attachment.
- `src/modules/bookings/components/BookingsTable.tsx`
  - Each booking row now has an `Issue invoice` action that creates a PaymentBilling invoice.

## Finance/settlement payment integration

- `src/modules/provider-finance-analytics/actions.ts`
  - Added settlement payment document issuing through `billing.issue_invoice`.
- `src/modules/provider-finance-analytics/repository.ts`
  - Added settlement lookup and PaymentBilling invoice attachment to settlement metadata.
- `src/modules/provider-finance-analytics/components/SettlementManager.tsx`
  - Admin settlement rows now expose a `Payment doc` button that issues the PaymentBilling document before/around marking paid.

## Preserved modularity rule

No extended module imports `@modules/payment-billing`. All integrations use:

```ts
invokeModuleCapability({ capability: "billing.issue_invoice", ... })
```

That preserves the rule:

```text
extended module -> Core only
extended module -> no sibling module dependency
```
