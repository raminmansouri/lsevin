export type DeliveryToSend = {
  id: string;
  notificationId: string;
  channel: "email" | "sms" | "push" | "whatsapp" | "bale";
  recipientEmail: string | null;
  recipientPhone: string | null;
  /** identity.asp_net_users.id, resolved from notify.notifications' recipient_user_id or customer_id */
  recipientUserId: string | null;
  title: string;
  body: string;
  channelContent: Record<string, { title?: string; subject?: string; body?: string } | undefined>;
};

/**
 * Flat rather than a discriminated union: this project compiles with `strict: false`
 * (see melipayamak.ts's SmsSendResult for the same reasoning), so `result.error` after
 * an `if (!result.ok)` doesn't narrow reliably without strictNullChecks.
 */
export type SendResult = {
  ok: boolean;
  providerResponse?: string;
  error?: string;
};
