# Ticketing

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `ticketing.create_ticket`
- `ticketing.reply`
- `ticketing.assign`
- `ticketing.close`
- `ticketing.add_internal_note`

## Main entities

- `Ticket`
- `TicketMessage`
- `TicketAttachment`
- `TicketDepartment`
- `SlaPolicy`

## Zip/unzip

Zip this folder only:

```text
src/modules/ticketing
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
