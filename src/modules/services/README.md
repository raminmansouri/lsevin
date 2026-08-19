# services module

Provider-owned services in `category.provider_services`, with lookups against global `category.service_definitions`.

## Routes

- `/providers/:providerId/services` — provider service management.
- `/admin/services` — global service catalog for `PROVIDER_ADMIN`, `ADMIN`, or `SUPERADMIN`.

The admin catalog exposes provider, definition, price, duration, activity and popularity controls. Administrative changes are reasoned and written to `provider_portal.admin_catalog_actions`.
