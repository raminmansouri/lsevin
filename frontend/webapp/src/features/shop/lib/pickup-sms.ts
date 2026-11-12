import { isIranianMobile, normalizePhone } from "@/features/consultation/schemas";

/**
 * The "ready for pickup at the Lsevin office" SMS: a MeliPayamak pattern (the account has no
 * free-text sender line), approved in the MeliPayamak panel with two variables, in this order:
 *   {0} order number, {1} pickup code.
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

/** Pattern variables in template order; ';' and newlines would shift the placeholders. */
export function pickupSmsVariables(orderNumber: string, code: string): string[] {
  return [orderNumber, code];
}
