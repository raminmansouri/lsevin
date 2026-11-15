import { isIranianMobile, normalizePhone } from "@/features/consultation/schemas";

/**
 * The "ready for in-person pickup" SMS: a MeliPayamak pattern (the account has no free-text sender
 * line), approved in the MeliPayamak panel with three variables, in this order:
 *   {0} order number, {1} pickup code, {2} the seller's place (clinic name, or Lsevin).
 * Template text: SHOP_PICKUP_READY_TEMPLATE.
 */
export const SHOP_PICKUP_READY_PATTERN_ENV = "MELIPAYAMAK_PATTERN_SHOP_PICKUP_READY";

/**
 * The number the pickup SMS goes to: the first candidate that is an Iranian mobile (the only
 * numbers MeliPayamak delivers to), normalized to 09xxxxxxxxx, in the order given.
 */
export function pickupSmsRecipient(candidates: Array<{ phone: string | null | undefined; country?: string | null }>): string | null {
  for (const candidate of candidates) {
    if (!candidate.phone) continue;
    const normalized = normalizePhone(candidate.phone, candidate.country ?? null);
    if (normalized && isIranianMobile(normalized)) return normalized;
  }
  return null;
}

/** The text to submit for approval in the MeliPayamak panel. */
export const SHOP_PICKUP_READY_TEMPLATE =
  "لسوین: سفارش {0} در {2} آماده تحویل حضوری است. کد تحویل شما: {1} — این کد را هنگام تحویل به فروشنده بگویید.";

/** Pattern variables in template order; ';' and newlines would shift the placeholders. */
export function pickupSmsVariables(orderNumber: string, code: string, placeName: string): string[] {
  const place = (placeName ?? "").replace(/[;\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return [orderNumber, code, place || "فروشنده"];
}

/**
 * The "your order has been shipped" SMS, sent for each seller shipment: a MeliPayamak pattern with
 * two variables, in this order: {0} order number, {1} tracking code ("-" if none).
 */
export const SHOP_SHIPPED_PATTERN_ENV = "MELIPAYAMAK_PATTERN_SHOP_SHIPPED";

/** The text to submit for approval in the MeliPayamak panel. */
export const SHOP_SHIPPED_TEMPLATE = "لسوین: مرسوله سفارش {0} توسط فروشنده ارسال شد. کد رهگیری مرسوله: {1}";

/** Pattern variables in template order for the shipped SMS. */
export function shippedSmsVariables(orderNumber: string, trackingNumber: string | null | undefined): string[] {
  const tracking = trackingNumber?.trim();
  return [orderNumber, tracking && tracking !== "-" ? tracking : "-"];
}
