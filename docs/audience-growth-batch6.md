# vNext Batch 6 — Audience Growth CRM

Batch 6 adds customer-driven audience growth features after providers/staff can already manage their pages and publish growth updates.

## Product goal

Give providers/staff a LSevin-native growth loop similar to business tools in social platforms, while keeping customer consent and LSevin moderation in the center:

1. Capture customer interest from LSevin front/app events.
2. Turn followers, shortlisters, inquiries and bookings into an owned audience.
3. Segment that audience by lifecycle and source.
4. Send approved, useful campaigns through the portal notification bridge.
5. Let customers subscribe, mute or unsubscribe from provider updates.

## Architecture

Module folder:

```text
src/modules/audience-growth
```

The module depends only on Core. It does not import ProviderPortal, BusinessGrowth, Notifications or any sibling module. Delivery is requested via Core `ModuleBus` capability:

```text
notifications.emit_from_lsevin
notifications.subscribe_audience
```

## Routes

```text
/providers/:providerId/audience-growth
/admin/audience-growth
/providers/:providerId/campaigns
```

## Public APIs for LSevin front/app

```text
GET  /api/public/providers/:providerId/audience-profile
POST /api/public/providers/:providerId/audience-events
POST /api/public/providers/:providerId/audience-preferences
POST /api/public/providers/:providerId/campaigns/:campaignId/interactions
```

## Events to send from LSevin front

```text
profile_view
campaign_view
follow
save
share
cta_click
inquiry
booking_started
booking_created
review_request
unsubscribe
```

## Launch readiness integration

Provider Launch Readiness now includes:

```text
audience_growth_ready
```

This checks subscribed audience contacts, active segments, and sent audience campaigns.
