/**
 * Every seller fulfils its own items. At checkout the customer picks:
 *   shipping  each seller ships its part: a cart from N sellers = N shipments, each with that
 *             seller's fee and delivery days (Lsevin's default seller uses the admin delivery
 *             methods). The free-shipping threshold applies per shipment, on that seller's subtotal.
 *   pickup    only when every item is from ONE seller: collected at that seller's place.
 *
 * Estimates: a shipment takes the seller's handling days (slowest line) + its longest delivery
 * days; a pickup takes the handling days. The order's one estimate is the latest shipment.
 * A line without handling days counts as DEFAULT_HANDLING_DAYS.
 *
 * The seller's part of an order (shop.seller_order_pickups) moves through SELLER_PART_TRANSITIONS;
 * "delivery_requested" waits for an admin, who approves it (completed) or sends it back.
 *
 * Pure (no database), so the checkout quote, order placement, the portal, admin and tests share it.
 */

export type OrderFulfilmentMode = "delivery" | "pickup";
export type FulfilmentChoice = "shipping" | "pickup";

export const DEFAULT_HANDLING_DAYS = 1;
/** A clinic that has not set its delivery days yet. */
export const DEFAULT_SELLER_DELIVERY_DAYS = { min: 1, max: 3 } as const;

function handling(days: number | null | undefined): number {
  return days == null || !Number.isFinite(Number(days)) || Number(days) < 0 ? DEFAULT_HANDLING_DAYS : Math.trunc(Number(days));
}

/** Days until a seller's items are ready: the slowest line. */
export function orderHandlingDays(lines: Array<{ handlingDays: number | null | undefined }>): number {
  return lines.length ? Math.max(...lines.map((line) => handling(line.handlingDays))) : 0;
}

/** The handling days stored on an order line. */
export function lineHandlingDays(days: number | null | undefined): number {
  return handling(days);
}

/** Days until one shipment / pickup reaches the customer; null when the transit time is unknown. */
export function shipmentPromiseDays(
  handlingDays: number,
  option: { isPickup: boolean; etaMinDays: number | null; etaMaxDays: number | null } | null,
): number | null {
  if (!option) return null;
  if (option.isPickup) return handlingDays;
  const transit = option.etaMaxDays ?? option.etaMinDays;
  if (transit == null) return null;
  return handlingDays + Math.max(0, Math.trunc(transit));
}

/** The order's one estimate: the latest shipment; null if any shipment has no estimate. */
export function overallPromiseDays(shipments: Array<{ promiseDays: number | null }>): number | null {
  if (!shipments.length || shipments.some((s) => s.promiseDays == null)) return null;
  return Math.max(...shipments.map((s) => s.promiseDays as number));
}

/** What a seller charges for a shipment (rial): its own fee, never above the admin cap. */
export function sellerShippingFee(sellerFee: number | null | undefined, cap: number | null | undefined): number {
  const fee = sellerFee == null || !Number.isFinite(Number(sellerFee)) || Number(sellerFee) < 0 ? 0 : Number(sellerFee);
  if (cap == null || !Number.isFinite(Number(cap)) || Number(cap) < 0) return fee;
  return Math.min(fee, Number(cap));
}

/** A seller's delivery days, with the default for a seller that has not set them. */
export function sellerDeliveryDays(min: number | null | undefined, max: number | null | undefined) {
  const lo = min == null || Number(min) < 0 ? null : Math.trunc(Number(min));
  const hi = max == null || Number(max) < 0 ? null : Math.trunc(Number(max));
  if (lo == null && hi == null) return { min: DEFAULT_SELLER_DELIVERY_DAYS.min, max: DEFAULT_SELLER_DELIVERY_DAYS.max };
  return { min: lo ?? hi!, max: Math.max(hi ?? lo!, lo ?? 0) };
}

/** Group cart lines by seller (a line without a seller belongs to the default seller). */
export function groupBySeller<T extends { sellerId: string | null | undefined }>(lines: T[], defaultSellerId: string | null) {
  const groups = new Map<string, T[]>();
  for (const line of lines) {
    const key = line.sellerId || defaultSellerId || "default";
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  return groups;
}

/** In-person pickup is allowed only when every line is from one seller. */
export function pickupAllowed(lines: Array<{ sellerId: string | null | undefined }>, defaultSellerId: string | null): boolean {
  return lines.length > 0 && groupBySeller(lines, defaultSellerId).size === 1;
}

/** What the checkout must ask for, from the chosen option. */
export function checkoutRequirements(option: { isPickup: boolean } | null) {
  const isPickup = Boolean(option?.isPickup);
  return { needsAddress: !isPickup, needsPhone: isPickup };
}

/** A phone the seller can call / the SMS can reach: 8 to 15 digits after folding Persian digits. */
export function hasUsablePhone(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;
  const digits = phoneNumber
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** A seller other than Lsevin itself (e.g. a clinic). */
export function isPartnerSeller(seller: { isDefault: boolean | null | undefined; sellerId: string | null | undefined }): boolean {
  return Boolean(seller.sellerId) && !seller.isDefault;
}

// ------------------------------------------------------------------------------------------------
// The seller's part of an order
// ------------------------------------------------------------------------------------------------

export type SellerPartStatus = "new" | "preparing" | "shipped" | "ready_for_pickup" | "delivery_requested" | "completed";
export type SellerPartTarget = "preparing" | "shipped" | "ready_for_pickup" | "delivery_requested";
export const SELLER_PART_STATUSES: SellerPartStatus[] = ["new", "preparing", "shipped", "ready_for_pickup", "delivery_requested", "completed"];

/** Which states each step may come from, per fulfilment type. Missing = not allowed for that type. */
export const SELLER_PART_TRANSITIONS: Record<FulfilmentChoice, Partial<Record<SellerPartTarget, SellerPartStatus[]>>> = {
  shipping: {
    preparing: ["new"],
    shipped: ["new", "preparing"],
    delivery_requested: ["shipped"],
  },
  pickup: {
    preparing: ["new"],
    ready_for_pickup: ["new", "preparing"],
    // Reached only through the customer's pickup code.
    delivery_requested: ["ready_for_pickup"],
  },
};

export function canMoveSellerPart(type: FulfilmentChoice, from: SellerPartStatus, to: SellerPartTarget): boolean {
  return Boolean(SELLER_PART_TRANSITIONS[type]?.[to]?.includes(from));
}

/** The customer may cancel until any seller has shipped or made its part ready for pickup. */
export function customerCanCancel(parts: Array<{ status: SellerPartStatus }>): boolean {
  return parts.every((part) => part.status === "new" || part.status === "preparing");
}

/** A tracking code a seller can enter: 3..64 visible characters. */
export function normalizeTrackingCode(value: string | null | undefined): string | null {
  const code = (value ?? "").trim();
  return code.length >= 3 && code.length <= 64 ? code : null;
}
