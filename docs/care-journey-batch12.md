# Batch 12 — Care Journey Studio

## Product goal

Give providers and staff an LSevin-native way to guide customers after interest or booking with preparation, visit, aftercare and follow-up journeys.

## Customer-facing value

- Customers can read approved preparation and aftercare journeys from provider pages.
- Customers can subscribe to reminders and follow the journey inside LSevin.
- Customers can submit follow-up requests when they need help.
- Customers see emergency/red-flag disclaimers before relying on non-emergency guidance.

## Provider/staff value

- Providers can create reusable journey templates.
- Providers can define steps, relative days, CTAs and reminders.
- Providers can see enrollments, events, open follow-ups and urgent follow-ups.

## Admin value

- Admin can approve/reject/publish care journeys.
- Admin can supervise open and urgent follow-up requests.
- Provider launch readiness now includes `care_journey_ready`.

## LSevin front compatibility

Public APIs:

- `GET /api/public/providers/:providerId/care-journey`
- `POST /api/public/providers/:providerId/care-events`
- `POST /api/public/providers/:providerId/care-enrollments`
- `POST /api/public/providers/:providerId/follow-up-requests`

Bridge helper:

- `webapp-care-journey-bridge-patch/src/lib/providerPortalCareJourneyBridge.ts`

## Architecture

The module is standalone in `src/modules/care-journey` and depends only on Core. Notification delivery goes through Core ModuleBus capability `notifications.emit_from_lsevin`.
