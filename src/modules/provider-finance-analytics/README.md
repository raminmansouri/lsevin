# Provider Finance & Analytics Module

Standalone LSevin CRM extended module for:

- قسمت مالی provider
- LSevin compensation / platform fees
- provider wallet / کیف پول
- deposits, withdrawals, adjustments, and settlements
- money movement between LSevin, provider, customer, gateway, and bank
- detailed statistics and reports

## Architecture decision

This module is designed as a **single-folder extended module**.

```text
src/modules/provider-finance-analytics/
  module.tsx
  index.ts
  actions.ts
  repository.ts
  types.ts
  components/
  pages/
  migrations/
  docs/
  README.md
  MODULE_MANIFEST.json
```

It does **not** contain `route-segments` and does **not** require bash install/export scripts.

The CRM `core` module should provide the stable route host and module registry. This keeps extended modules portable and independently zip-able.

## Dependencies

Only core imports are used:

```text
@core/db/client
@core/auth/session
@core/auth/permissions
@core/lib/*
@core/ui/*
```

No sibling module imports are used.

## Install into CRM

Copy or unzip this folder into:

```text
src/modules/provider-finance-analytics
```

Then register it in the core module registry:

```ts
import providerFinanceAnalyticsModule from "@modules/provider-finance-analytics/module";

export const extendedModules = [
  providerFinanceAnalyticsModule,
];
```

Run the migration using your normal CRM migration method:

```text
src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql
```

## How routes are exposed

The module exports route definitions from `module.tsx`.

Provider pages:

```text
/providers/:providerId/finance
/providers/:providerId/finance/wallet
/providers/:providerId/finance/settlements
/providers/:providerId/reports
```

Admin pages:

```text
/admin/finance
/admin/finance/settlements
/admin/reports
```

The CRM core route host maps these paths to module page components. The module itself does not create files in `src/app`.

## Zip this module for future modifications

From the CRM root, compress only this folder:

```text
src/modules/provider-finance-analytics
```

For command line usage:

```bash
zip -r lsevin-provider-finance-analytics-module.zip src/modules/provider-finance-analytics \
  -x "*/node_modules/*" "*/.next/*" "*/dist/*" "*/coverage/*"
```

No bash helper files are required by the module.

## Database notes

The module reuses existing LSevin schemas where possible:

- `commercial.compensation_policies`
- `commercial.provider_ledgers`
- `commercial.booking_charge_lines`
- `commercial.refund_lines`
- `provider_portal.payout_accounts`
- `customer.wallet_accounts`
- `customer.wallet_transactions`

The migration only adds missing provider-facing wallet, withdrawal, settlement, transfer, and report snapshot structures under `provider_portal`.
