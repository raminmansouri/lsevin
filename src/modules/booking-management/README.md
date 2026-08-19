# Booking Management

Standalone extended module for LSevin Providers Portal.

## Rules

- This module depends only on `Core`.
- The module owns its own folder, manifest, migrations, routes, repositories, contracts, i18n, templates/assets where needed.
- It must not import from sibling modules.
- Cross-module communication must use Core contracts, EntityReference, events, or ModuleBus capabilities.

## Main capabilities

- `booking.read_provider_bookings`
- `booking.update_status`
- `booking.assign_staff`
- `booking.add_provider_note`
- `booking.export_calendar`

## Main entities

- `BookingView`
- `BookingStatusChange`
- `BookingAssignment`
- `BookingNote`

## Zip/unzip

Zip this folder only:

```text
src/modules/booking-management
```

Extract it back to the same path and register `module.tsx` in `src/core/modules/registry.ts`.
