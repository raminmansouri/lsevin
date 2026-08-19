# providers module

Provider profile management for `category.service_providers`. Provider-owned writes require membership permission from the Core authentication boundary.

## Routes

- `/providers` — providers available to the current user.
- `/providers/:providerId/profile` — provider profile management.
- `/admin/providers` — global provider catalog for `PROVIDER_ADMIN`, `ADMIN`, or `SUPERADMIN`.

The admin catalog supports search, provider-type/status filters, operational totals, provider activation, accreditation, sponsorship, and audited reasons through `provider_portal.admin_catalog_actions`.
