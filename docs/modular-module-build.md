# Built standalone modules

This build adds the canonical standalone module set requested for LSevin Provider Portal:

- `provider-portal`
- `payment-billing`
- `pricing-plans`
- `ticketing`
- `reviews-standalone`
- `media-library`
- `booking-management`
- `reporting-analytics`
- `notifications-module`

Each module lives in one folder under `src/modules/<module-code>`, includes its own manifest, migrations, contracts, i18n, pages, and README, and depends only on Core.

## Cross-module rule

Modules must not import sibling modules. Use Core contracts:

- `EntityReference`
- `ModuleCapabilityRequest`
- `invokeModuleCapability`
- domain events / outbox events

## Payment/Billing boundary

Provider Portal does not own invoice/payment logic. It should request billing through the Core ModuleBus capability:

```ts
invokeModuleCapability({
  capability: "billing.issue_invoice",
  source: { moduleCode: "provider-portal", entityType: "profile_claim", entityId: claimId },
  payload: { /* IssueInvoicePayload */ }
});
```

PaymentBilling owns invoice templates, receipts, gateways, tax fields, and reconciliation.
