# Notifications page + notification subsystem

This package includes:

- `page.tsx`: server page entry
- `NotificationsClient.tsx`: UI preserving the accepted prototype layout
- `notifications.data.ts`: loads live app notifications from `notify.notifications`
- `notifications.actions.ts`: mark-one-read + mark-all-read server actions
- `notification-service.ts`: backend helper to queue in-app/email/SMS/push/call deliveries
- `notifications.schema.sql`: schema for application notifications and delivery tracking
- `loading.tsx`: route skeleton

## Important integration steps

1. Run `notifications.schema.sql`
2. Wire `resolveCurrentCustomerId()` in both `notifications.data.ts` and `notifications.actions.ts`
3. Call `createNotification(...)` or `queueBookingCreatedNotifications(...)` from your booking flow
4. Build actual workers/providers for:
   - email
   - sms
   - push
   - phone calls

The UI page itself only reads `notify.notifications` and marks rows as read.
Channel delivery attempts are tracked in `notify.notification_deliveries`.
