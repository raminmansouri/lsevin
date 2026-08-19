# vNext Batch 16 — SlotDrop Studio

## Purpose

Batch 16 adds a customer-driven availability growth loop for providers and staff: LSevin-native last-minute openings, cancellation slots, limited-capacity drops and consultation-day slots.

## Standalone module

- Module folder: `src/modules/slotdrop-studio`
- Schema: `slotdrop_studio`
- Dependency rule: depends only on Core
- Notification bridge: uses Core ModuleBus capability `notifications.emit_from_lsevin`

## Routes

- Provider console: `/providers/:providerId/slotdrop-studio`
- Admin board: `/admin/slotdrop-studio`
- Public page: `/providers/:providerId/slot-drops`

## Public APIs

- `GET /api/public/providers/:providerId/slot-drops`
- `POST /api/public/providers/:providerId/slot-drop-events`
- `POST /api/public/providers/:providerId/slot-drop-watch`
- `POST /api/public/providers/:providerId/slot-drop-requests`

## Customer value

Customers can watch providers for openings, receive notifications through their chosen channel, request urgent/near-term slots and move toward booking intent without leaving LSevin.

## Provider/staff value

Providers can fill cancellation gaps, promote off-peak capacity, announce consultation days, and turn availability into demand while preserving LSevin moderation and safety.

## Admin value

LSevin admin can approve/pause/reject drops, supervise unsafe urgency claims, inspect watchlist/request activity and keep public exposure safe.

## Launch-readiness integration

Adds `slotdrop_studio_ready` to provider launch readiness scoring.
