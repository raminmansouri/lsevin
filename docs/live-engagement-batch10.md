# vNext Batch 10 — Live Engagement Studio

## Goal
Give providers/staff Instagram Live-like business tools inside LSevin: live Q&A, webinars, consultation days, clinic tours, aftercare sessions, replay pages, RSVP reminders, customer questions and conversion CTAs.

## Architecture
- Standalone module: `src/modules/live-engagement`
- Depends only on Core.
- Uses Core `ModuleBus` for notification integration.
- No direct sibling imports from Notifications, ProviderPortal, AudienceGrowth, ContentStudio or ConversionStudio.

## Provider/customer value
- Customers can RSVP, ask questions, join live sessions, watch replays and move to consultation/booking CTAs.
- Providers/staff can plan live events, inspect RSVPs/questions and build trust without sending customers out to Instagram.
- Admin can moderate live sessions before public exposure.

## LSevin front compatibility
Public front/mobile can use:
- `GET /api/public/providers/:providerId/live-program`
- `POST /api/public/providers/:providerId/live-events`
- `POST /api/public/providers/:providerId/live-rsvps`
- `POST /api/public/providers/:providerId/live-questions`

Bridge helper:
- `webapp-live-engagement-bridge-patch/src/lib/providerPortalLiveEngagementBridge.ts`

## Notification integration
Live Engagement publishes notification events through:
- `notifications.emit_from_lsevin`

Templates added:
- `live_engagement.session_approved`
- `live_engagement.rsvp_created`
- `live_engagement.question_created`
- `live_engagement.reminder`

## Launch readiness
Provider launch readiness now includes:
- `live_engagement_ready`

This checks approved sessions, upcoming/live session state, recent RSVPs, open questions and live events.
