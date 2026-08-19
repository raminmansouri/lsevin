# vNext Batch 12 Build Report

## Module

`src/modules/care-journey`

## Scope

Care Journey Studio adds provider/staff preparation, visit, aftercare and follow-up journey tools with public LSevin front APIs and admin moderation.

## Routes

- `/providers/:providerId/care-journey`
- `/admin/care-journey`
- `/providers/:providerId/care`

## Public APIs

- `GET /api/public/providers/:providerId/care-journey`
- `POST /api/public/providers/:providerId/care-events`
- `POST /api/public/providers/:providerId/care-enrollments`
- `POST /api/public/providers/:providerId/follow-up-requests`

## Notification integration

Uses Core ModuleBus capability `notifications.emit_from_lsevin` and adds notification templates in `src/modules/notifications-module/migrations/007_care_journey_templates.sql`.

## Launch readiness

Provider launch readiness now includes `care_journey_ready`.

## QA

- static-qa: passed
- launch-readiness-qa: passed
- vNext-batch12-feature-qa: passed 10/10 loops
- Batch 1–11 compatibility spot-checks: passed
