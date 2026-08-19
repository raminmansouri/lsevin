# availability module

Provider operating hours, generic availability rules, and bookable-resource availability.

## Routes

- `/providers/:providerId/availability` — provider scheduling management.
- `/admin/availability` — global scheduling supervision for `PROVIDER_ADMIN`, `ADMIN`, or `SUPERADMIN`.

The admin catalog can disable or restore rules, resources, and operating days while retaining target, timezone, capacity and provider context. Administrative changes are written to `provider_portal.admin_catalog_actions`.
