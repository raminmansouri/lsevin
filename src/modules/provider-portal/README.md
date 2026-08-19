# Provider Portal

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `provider_portal.claim_profile`
- `provider_portal.approve_claim`
- `provider_portal.manage_profile`
- `provider_portal.manage_staff_schedule`

## Main entities

- `ProfileClaim`
- `ProviderMembership`
- `StaffOwnership`
- `EditableProfileSection`
- `ProviderPortalAudit`

## Zip/unzip

Zip this folder only:

```text
src/modules/provider-portal
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
