# Payment & Billing

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `billing.issue_invoice`
- `billing.issue_proforma`
- `billing.issue_tax_invoice`
- `payment.create_payment_intent`
- `payment.verify_manual_receipt`
- `payment.reconcile_bank_statement`

## Main entities

- `BillingProfile`
- `TaxProfile`
- `Invoice`
- `InvoiceLine`
- `PaymentIntent`
- `PaymentReceipt`
- `BankStatement`
- `ReconciliationMatch`

## Zip/unzip

Zip this folder only:

```text
src/modules/payment-billing
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
