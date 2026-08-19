# Provider Onboarding module

Allows any authenticated LSevin user to submit a provider or staff ownership application.

## Admin routes

- `/admin/applications` — queue, filters, status counts and orphaned provider-type detection.
- `/admin/applications/:applicationId` — review details, mark in review, request changes, reject, create a provider or attach an existing provider.

Provider approval creates or attaches a `category.service_providers` row, adds an `owner` row to `provider_portal.provider_members`, updates the onboarding application and writes an immutable review event.

Staff-profile applications continue through `/admin/provider-claims`, because they require clinic confirmation, LSevin review and optional billing/waiver.
