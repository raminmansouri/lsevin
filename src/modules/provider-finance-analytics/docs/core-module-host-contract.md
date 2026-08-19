# Core Module Host Contract

This module assumes the CRM has a stable `core` module with a module registry and route host. Extended modules should never scatter `page.tsx` files into `src/app`.

## Required CRM structure

```text
src/core/
  db/
  auth/
  ui/
  lib/
  modules/
    registry.ts
    ModuleHost.tsx
    routeMatcher.ts

src/modules/
  provider-finance-analytics/
    module.tsx
    components/
    pages/
    repository.ts
    actions.ts
    migrations/
```

## Registry example

```ts
import providerFinanceAnalyticsModule from "@modules/provider-finance-analytics/module";

export const extendedModules = [
  providerFinanceAnalyticsModule,
];
```

## Route-host idea

Core owns the few Next.js filesystem routes once:

```text
src/app/page.tsx + src/app/[...modulePath]/page.tsx
src/app/api/[[...modulePath]]/route.ts
```

Those pages call the core module matcher, find the correct module page by `scope + path`, and render its component with normalized params:

```ts
await renderModulePage({
  scope: "provider",
  path: modulePath.join("/"),
  params: { providerId },
  searchParams,
});
```

That way the route files belong to `core`, and each extended module remains a single folder.

## Why this architecture

- Module zip/unzip is clean: one folder in, one folder out.
- Extended modules depend only on `core`.
- Next.js filesystem routing is isolated in core.
- No installer script is needed.
- No route adapters are copied into CRM routes.
- Future modifications are easy: zip `src/modules/<module-id>`.
