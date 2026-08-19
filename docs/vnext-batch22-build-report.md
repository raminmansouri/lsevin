# vNext Batch 22 Build Report

## Module

Partner Studio (`src/modules/partner-studio`)

## Customer value

Adds a public and moderated provider partner network for hotels, transfers, interpreters, travel agents, labs, pharmacies, gyms, spas, tours, insurance, financing and local support around LSevin journeys.

## Architecture

- Standalone extended module
- Depends only on Core
- No sibling imports
- Notification integration through Core ModuleBus: `notifications.emit_from_lsevin`
- Public DTO/API bridge for LSevin web/mobile front

## Routes

- `/providers/:providerId/partner-studio`
- `/admin/partner-studio`
- `/providers/:providerId/partners`

## APIs

- `GET /api/public/providers/:providerId/partners`
- `POST /api/public/providers/:providerId/partner-events`
- `POST /api/public/providers/:providerId/partner-requests`

## Launch readiness

Adds `partner_studio_ready`.
