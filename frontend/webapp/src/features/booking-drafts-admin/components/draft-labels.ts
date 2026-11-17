/** Draft statuses the booking flow writes (booking.booking_drafts.status). */
const DRAFT_STATUS_KEYS = {
  draft: "draft",
  inprogress: "inProgress",
  submitted: "submitted",
  cancelled: "cancelled",
  canceled: "cancelled",
  completed: "completed",
} as const;

export type DraftStatusKey = (typeof DRAFT_STATUS_KEYS)[keyof typeof DRAFT_STATUS_KEYS];

/** Translation key for a raw draft status, or null for an unknown one (shown raw). */
export function draftStatusKey(status: string | null | undefined): DraftStatusKey | null {
  const normalized = String(status ?? "").replace(/[\s_-]/g, "").toLowerCase();
  return (DRAFT_STATUS_KEYS as Record<string, DraftStatusKey>)[normalized] ?? null;
}

const PAYMENT_METHOD_KEYS = {
  pay_on_delivery: "payOnDelivery",
  bank_receipt: "bankReceipt",
  wallet: "wallet",
  online: "online",
  gateway_card: "gatewayCard",
  zarinpal: "zarinpal",
  btcpay: "btcpay",
} as const;

export type PaymentMethodKey = (typeof PAYMENT_METHOD_KEYS)[keyof typeof PAYMENT_METHOD_KEYS];

export function paymentMethodKey(method: string | null | undefined): PaymentMethodKey | null {
  const normalized = String(method ?? "").trim().toLowerCase();
  return (PAYMENT_METHOD_KEYS as Record<string, PaymentMethodKey>)[normalized] ?? null;
}
