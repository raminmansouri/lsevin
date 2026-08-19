# LSevin Providers Portal vNext Batch 5 Build Report

Date: 2026-07-07

## Batch focus

Customer/provider growth features, not infrastructure. This batch adds Instagram-like business tools inside LSevin so providers and staff can grow, publish approved updates, collect followers, request LSevin promotion, and send notification-powered campaigns without pushing customers to external social channels.

## Built modules and changes

### New standalone module: BusinessGrowth

Folder: `src/modules/business-growth`

Routes:

- `/providers/:providerId/growth-tools`
- `/admin/business-growth`
- `/providers/:providerId/updates`

Public APIs:

- `GET /api/public/providers/:providerId/growth`
- `POST /api/public/providers/:providerId/follow`
- `POST /api/public/providers/:providerId/growth-events`

Database schema:

- `business_growth.growth_profiles`
- `business_growth.growth_posts`
- `business_growth.follower_subscriptions`
- `business_growth.notification_campaigns`
- `business_growth.promotion_requests`
- `business_growth.growth_events`

### NotificationsModule bridge extension

Added LSevin platform bridge:

- `POST /api/public/lsevin/notifications/events`
- `notifications.emit_from_lsevin`
- `notifications.subscribe_audience`

Bridge tables:

- `notifications_ext.external_events`
- `notifications_ext.audience_subscriptions`

Docs:

- `docs/lsevin-notification-bridge.md`

### LSevin webapp patch helper

Folder included in package:

- `webapp-notification-bridge-patch/src/lib/providerPortalNotificationBridge.ts`

Use this helper inside the LSevin front/app after booking, review, inquiry, follow, shortlist, and payment events.

## Architecture compliance

- BusinessGrowth is one standalone module folder.
- It depends only on Core.
- It does not import NotificationsModule directly.
- Notification delivery is requested through Core ModuleBus capabilities.
- NotificationsModule accepts LSevin platform events through a public signed bridge endpoint.

## External launch requirements

- Configure `LSEVIN_NOTIFICATION_BRIDGE_KEY` in provider portal.
- Configure `PROVIDER_PORTAL_NOTIFICATION_BRIDGE_URL` in LSevin webapp.
- Configure `PROVIDER_PORTAL_NOTIFICATION_BRIDGE_KEY` in LSevin webapp.
- Run migrations on staging PostgreSQL.
- Wire actual LSevin webapp events to the helper.
- Run public follow/update/campaign UAT.
