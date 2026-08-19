# staff module

Creates staff records in `category.staff` and links them to providers through `category.provider_staffs`.

## Routes

- `/providers/:providerId/staff` — provider-owned staff management.
- `/admin/staff` — global staff/provider-link catalog for `PROVIDER_ADMIN`, `ADMIN`, or `SUPERADMIN`.

Global profile status and provider-link status are controlled independently and audited. Staff self-claim and clinic/LSevin confirmation remain in the dedicated provider-claims workflow.
