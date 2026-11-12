/**
 * Lsevin fulfils every order ("sent by Lsevin"). Sellers, including clinics, hand their items to
 * Lsevin within their handling days; the customer then gets ONE shipment, by the delivery method
 * they chose: delivery to their address, or pickup at the Lsevin office.
 *
 * The customer is shown ONE estimate for the whole order:
 *   the slowest seller's handling days (time to reach Lsevin)
 *   + the chosen method's longest transit time (0 for office pickup).
 * A line without handling days counts as DEFAULT_HANDLING_DAYS.
 *
 * Pure (no database), so the checkout quote, order placement and their tests share it.
 */

export type OrderFulfilmentMode = "delivery" | "office_pickup";

export const DEFAULT_HANDLING_DAYS = 1;

function handling(days: number | null | undefined): number {
  return days == null || !Number.isFinite(Number(days)) || Number(days) < 0 ? DEFAULT_HANDLING_DAYS : Math.trunc(Number(days));
}

/** Days until every seller's items are at Lsevin: the slowest line. */
export function orderHandlingDays(lines: Array<{ handlingDays: number | null | undefined }>): number {
  return lines.length ? Math.max(...lines.map((line) => handling(line.handlingDays))) : 0;
}

/** The handling days stored on an order line (what the seller's due date is based on). */
export function lineHandlingDays(days: number | null | undefined): number {
  return handling(days);
}

export type FulfilmentOption = { isPickup: boolean; etaMinDays: number | null; etaMaxDays: number | null };

/**
 * The single estimate for the whole order, or null when the chosen delivery method has no transit
 * time (a promise built without it would be wrong). Office pickup adds no transit.
 */
export function promiseDays(handlingDays: number, option: FulfilmentOption | null): number | null {
  if (!option) return null;
  if (option.isPickup) return handlingDays;
  const transit = option.etaMaxDays ?? option.etaMinDays;
  if (transit == null) return null;
  return handlingDays + Math.max(0, Math.trunc(transit));
}

/** What the checkout must ask for, from the chosen method. */
export function checkoutRequirements(option: Pick<FulfilmentOption, "isPickup"> | null) {
  const isPickup = Boolean(option?.isPickup);
  return { needsAddress: !isPickup, needsPhone: isPickup };
}

/** A phone the office can call / the SMS can reach: 8 to 15 digits after folding Persian digits. */
export function hasUsablePhone(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;
  const digits = phoneNumber
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** A seller other than Lsevin itself (e.g. a clinic): "sold by X, sent by Lsevin". */
export function isPartnerSeller(seller: { isDefault: boolean | null | undefined; sellerId: string | null | undefined }): boolean {
  return Boolean(seller.sellerId) && !seller.isDefault;
}
