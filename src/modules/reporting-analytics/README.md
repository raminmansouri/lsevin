# Reporting & Analytics

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `reports.view_provider_dashboard`
- `reports.create_snapshot`
- `reports.export`
- `reports.view_admin_analytics`

## Main entities

- `ReportSnapshot`
- `MetricDefinition`
- `ExportJob`
- `DashboardWidget`

## Zip/unzip

Zip this folder only:

```text
src/modules/reporting-analytics
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
