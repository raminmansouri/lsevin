# Providers Portal modular architecture

## Architectural decision

The providers portal is now a **core-hosted modular CRM**.

The old Next.js pattern of adding one `page.tsx` per feature under `src/app` was removed. `src/app` now contains only core route hosts. Feature modules declare their own pages, navigation, API routes and migrations inside their own module folder.

## Folder boundaries

```txt
src/core                 shared infrastructure, route host and UI primitives
src/core/modules         module contract, registry, route matcher and host
src/core/migrations      core/shared migrations
src/modules/<module>     self-contained extended module
```

## Core responsibilities

Core owns:

1. LSevin session resolution.
2. Provider and admin permission checks.
3. Database client and translation helpers.
4. Shared UI primitives and layout shell.
5. The module contract.
6. Route and API hosting.
7. Navigation composition from registered modules.
8. Migration discovery.
9. Provider switcher data for the shell.

Core does **not** own feature data-entry logic.

## Extended module responsibilities

Each extended module owns:

1. Its `module.tsx` definition.
2. Its pages.
3. Its components.
4. Its server actions.
5. Its repository/queries.
6. Its local types.
7. Its migrations, docs and README.

A module can be zipped by compressing only its folder.

## Module contract

A module exports an `ExtendedModuleDefinition`:

```ts
export type ExtendedModuleDefinition = {
  id: string;
  name: string;
  version: string;
  kind: "extended-module";
  dependsOn: ["core"];
  basePath: `src/modules/${string}`;
  routes: ModuleRoute[];
  apiRoutes?: ModuleApiRoute[];
  navigation?: ModuleNavigationItem[];
  migrations?: string[];
};
```

## Routing model

Only these route files exist:

```txt
src/app/page.tsx + src/app/[...modulePath]/page.tsx
src/app/api/[[...modulePath]]/route.ts
```

The core host matches the incoming path against the registered modules. For provider routes, it automatically checks `providerId` and runs `requireProviderPermission`.

## Dependency rules

1. Extended modules may import `@core/*`.
2. Extended modules may import their own files using relative imports.
3. Extended modules must not import sibling modules.
4. Core may import modules only in `src/core/modules/registry.ts`.
5. `src/app` must not contain feature SQL or feature UI.
6. Module migrations must live inside the module folder.

## Database alignment

The modules use the existing LSevin schemas:

- `identity` for LSevin users.
- `provider_portal` for provider members, onboarding, operating hours, payout accounts, resources and support.
- `category` for providers, provider services, staff, gallery, reviews and service definitions.
- `booking` for provider bookings.
- `commercial` for compensation policies, charge lines, ledgers, refunds and settlement data.
- `finance` for currencies, FX rates and quotes.
- `customer` for wallet compatibility and customer-side money movement.

## Recommended future improvements

1. Add a UI in core to enable/disable registered modules without code edits.
2. Add a migration runner that executes `discoverModuleMigrations()` output.
3. Add module-level smoke tests under each module folder.
4. Add a formal event bus in core for cross-module communication without direct imports.
5. Move any future shared contract into `src/core`, not into another feature module.
