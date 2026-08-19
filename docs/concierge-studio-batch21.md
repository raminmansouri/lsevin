# vNext Batch 21 — Concierge Studio

## Goal

Add LSevin-native concierge support for provider/staff growth and customer confidence: travel support, local visit help, hotel/transfer/interpreter/visa coordination, preparation and aftercare items, and concierge request capture.

## Customer surfaces

- `/providers/:providerId/concierge`
- `GET /api/public/providers/:providerId/concierge`
- `POST /api/public/providers/:providerId/concierge-events`
- `POST /api/public/providers/:providerId/concierge-requests`

## Provider/admin surfaces

- `/providers/:providerId/concierge-studio`
- `/admin/concierge-studio`

## Launch readiness

Provider launch readiness now includes `concierge_studio_ready`.

## Architecture

The module is standalone under `src/modules/concierge-studio`, depends only on Core, and uses Core ModuleBus for notification delivery.
