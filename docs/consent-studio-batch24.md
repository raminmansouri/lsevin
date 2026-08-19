# vNext Batch 24 — Consent Studio

Consent Studio adds provider-managed consent forms, risk acknowledgements, travel/service permissions, signed consent records, notification hooks and admin moderation.

## Module

`src/modules/consent-studio`

## Routes

- `/providers/:providerId/consent-studio`
- `/admin/consent-studio`
- `/providers/:providerId/consent`

## Public APIs

- `GET /api/public/providers/:providerId/consent`
- `POST /api/public/providers/:providerId/consent-events`
- `POST /api/public/providers/:providerId/consent-records`

## Launch readiness

Provider launch readiness now includes `consent_studio_ready` with evidence for approved forms, public clauses, open records, signed records, declined/expired/voided records, guardian forms, travel/treatment forms and 30-day events.
