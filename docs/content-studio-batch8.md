# Batch 8 — Content Studio

Customer-driven release that adds LSevin-native provider/staff content tools.

## Product intent

Providers and staff should grow inside LSevin, not force customers to leave to Instagram. This module provides verified native stories, highlights, educational posts, offer explainers, service launches, trust signals, public feeds and notification subscriptions.

## Architecture

- Module: `src/modules/content-studio`
- Database schema: `content_studio`
- Depends only on Core
- Notification delivery through Core ModuleBus capability `notifications.emit_from_lsevin`
- Audience subscription through Core ModuleBus capability `notifications.subscribe_audience`
- Public front integration helper: `webapp-content-studio-bridge-patch/src/lib/providerPortalContentStudioBridge.ts`

## Routes

- `/providers/:providerId/content-studio`
- `/admin/content-studio`
- `/providers/:providerId/stories`

## Public APIs

- `GET /api/public/providers/:providerId/content-feed`
- `POST /api/public/providers/:providerId/content-events`
- `POST /api/public/providers/:providerId/content-subscriptions`

## Launch readiness

Provider launch readiness now includes `content_studio_ready`, scored by approved content items, highlight collections, subscribers and recent content events.
