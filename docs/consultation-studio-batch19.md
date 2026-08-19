# vNext Batch 19 — Consultation Studio

Batch 19 adds a standalone `consultation-studio` module for LSevin-native high-intent consultation funnels.

## Product value

Customers can understand which consultation path fits them, answer provider-defined intake questions, submit their context and move toward consultation or booking without leaving LSevin.

## Routes

- Provider: `/providers/:providerId/consultation-studio`
- Admin: `/admin/consultation-studio`
- Public: `/providers/:providerId/consultation`

## Public APIs

- `GET /api/public/providers/:providerId/consultation`
- `POST /api/public/providers/:providerId/consultation-events`
- `POST /api/public/providers/:providerId/consultation-requests`

## Architecture

- One standalone module folder under `src/modules/consultation-studio`.
- Depends only on Core.
- Notification delivery is through Core ModuleBus capability `notifications.emit_from_lsevin`.
- Launch-readiness integration key: `consultation_studio_ready`.
