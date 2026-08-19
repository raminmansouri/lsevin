# Integration checklist

## 1. Extract one folder

Place this module at:

```text
src/modules/provider-finance-analytics
```

Do not copy files into `src/app`. Do not run install scripts. This module is intentionally single-folder.

## 2. Register in the core module registry

The CRM core module should have a module registry, for example:

```text
src/core/modules/registry.ts
```

Register this module:

```ts
import providerFinanceAnalyticsModule from "@modules/provider-finance-analytics/module";

export const extendedModules = [
  providerFinanceAnalyticsModule,
];
```

## 3. Core route host

Core should own the Next.js filesystem routes once, for example:

```text
src/app/page.tsx + src/app/[...modulePath]/page.tsx
src/app/api/[[...modulePath]]/route.ts
```

Those core hosts should resolve the requested path against `extendedModules` and render the matched module page/API handler.

## 4. Database

Apply the module migration using your CRM migration runner:

```text
src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql
```

The migration is additive. It does not modify existing commercial, booking, customer, category, or identity tables.

## 5. Core dependencies expected

The CRM project must already provide:

```text
@core/db/client
@core/auth/session
@core/auth/permissions
@core/lib/forms
@core/lib/format
@core/ui/Badge
@core/ui/Button
@core/ui/Card
@core/ui/Field
@core/ui/StatCard
```

## 6. Internal module isolation

The module must remain independent from sibling modules. It should not import:

```text
@modules/providers
@modules/services
@modules/bookings
@modules/staff
@modules/media
@modules/onboarding
```

It reads database tables directly through the core database boundary.

## 7. Permissions

Provider users use existing core permissions:

```text
requireProviderPermission(user.id, providerId, "manageFinance")
requireProviderPermission(user.id, providerId, "viewAnalytics")
```

Admin finance actions check identity roles:

```text
ADMIN
SUPERADMIN
PROVIDER_ADMIN
FINANCE_ADMIN
```

Adjust `requireAdminUser` in `@core/auth/permissions` if your CRM uses different role names.

## 8. Module pages exposed by definition

Provider:

```text
/providers/:providerId/finance
/providers/:providerId/finance/wallet
/providers/:providerId/finance/settlements
/providers/:providerId/reports
```

Admin:

```text
finance
finance/settlements
reports
```

The core route host maps these module paths to real URLs such as:

```text
/providers/:providerId/finance
/admin/finance
```

## 9. Settlement workflow

1. Booking/payment/commercial logic creates `commercial.booking_charge_lines` and `commercial.provider_ledgers`.
2. Admin creates settlement batch from approved provider ledger rows.
3. Admin approves settlement batch.
4. Approval credits provider wallet.
5. Provider requests withdrawal.
6. Admin approves/rejects withdrawal.
7. Admin marks withdrawal paid.
8. Wallet and transfer records are updated.

## 10. Reporting workflow

1. Provider/admin opens report page through the core module host.
2. Module reads booking, charge line, refund, review, service, and staff tables.
3. User can save a snapshot into `provider_portal.finance_report_snapshots`.
4. Snapshot payload stores the exact report state for auditing/exporting later.
