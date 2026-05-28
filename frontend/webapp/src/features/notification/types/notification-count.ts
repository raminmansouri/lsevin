export type NotificationTypeKey = "booking" | "offer" | "system";

export type NotificationCountResponse = {
  /** Backward-compatible field used by the current NotificationsBar badge. */
  count: number;
  /** Same value as count, clearer name for new code. */
  unreadCount: number;
  totalCount: number;
  bookingCount: number;
  offerCount: number;
  systemCount: number;
  byType: Record<NotificationTypeKey, number>;
};

export const EMPTY_NOTIFICATION_COUNT: NotificationCountResponse = {
  count: 0,
  unreadCount: 0,
  totalCount: 0,
  bookingCount: 0,
  offerCount: 0,
  systemCount: 0,
  byType: {
    booking: 0,
    offer: 0,
    system: 0,
  },
};
