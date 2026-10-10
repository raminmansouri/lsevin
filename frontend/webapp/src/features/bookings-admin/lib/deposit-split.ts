import type { BookingListItem } from "../types";

const PAID_STATUSES = ["paid", "captured", "succeeded", "completed"];

/**
 * A booking whose online share (the deposit) is paid while the rest is paid at the
 * place is stored with payment_status = 'Paid'. Returns the split for those bookings,
 * or null when the booking is not in that state.
 */
export function getDepositSplit(
  item: Pick<BookingListItem, "paymentStatus" | "paidAmount" | "payableTotal">,
): { paid: number; dueAtPlace: number } | null {
  if (!PAID_STATUSES.includes(String(item.paymentStatus ?? "").trim().toLowerCase())) return null;
  const paid = Number(item.paidAmount ?? 0);
  const total = Number(item.payableTotal ?? 0);
  if (!Number.isFinite(paid) || !Number.isFinite(total)) return null;
  if (paid <= 0 || paid >= total - 0.005) return null;
  return { paid, dueAtPlace: total - paid };
}

export function formatDepositAmount(amount: number, currency?: string | null) {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency ?? ""}`.trim();
}
