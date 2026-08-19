# LSevin Notification Bridge

The provider portal notification module now accepts product events from the LSevin front/app through:

`POST /api/public/lsevin/notifications/events`

Recommended header for production:

`x-lsevin-bridge-key: $LSEVIN_NOTIFICATION_BRIDGE_KEY`

Example body:

```json
{
  "eventName": "lsevin.booking.created",
  "recipientEntityType": "provider",
  "recipientEntityId": "<provider-uuid>",
  "title": "New booking",
  "body": "A customer submitted a booking request.",
  "templateKey": "lsevin.booking.created",
  "channel": "in_app",
  "sourceModule": "lsevin-webapp",
  "sourceEntityType": "booking",
  "sourceEntityId": "<booking-uuid>",
  "locale": "fa-IR"
}
```

The bridge stores the event in `notifications_ext.external_events`, creates a portal inbox item, and writes a delivery log. Business Growth uses the same notification capability through Core ModuleBus, preserving the one-folder-per-module architecture.
