import type { CartTotals } from "../types/domain";

/**
 * Tax + shipping helpers. These are intentionally simple for V0.1 — the
 * authoritative calculation lives server-side in one place (SHP-CHK-001) and is
 * snapshotted onto the order. Tax rate policy is configurable per tax class and
 * the resulting amount is snapped on the order (SHP-CHK-004).
 */

const TAX_RATES: Record<string, number> = {
  standard: 0.0,
  reduced: 0.0,
  zero: 0.0,
};

export function calculateTax(subtotalAfterDiscount: number, taxClass = "standard") {
  const rate = TAX_RATES[taxClass] ?? 0;
  return { rate, amount: Number((subtotalAfterDiscount * rate).toFixed(2)) };
}

/**
 * Free shipping from 3,000,000 toman (= 30,000,000 rial) of shipped items. Kept in rial, the
 * shop's stored unit; the checkout converts it to the customer's display currency (rial, toman,
 * USD, ...) before comparing, because the subtotal it compares against is in that currency.
 */
export const FREE_SHIPPING_THRESHOLD_RIAL = 30_000_000;

/**
 * @param subtotalAfterDiscount the shipped items' subtotal, in the display currency
 * @param freeThreshold the free-shipping threshold in the SAME currency; null = no free shipping
 */
export function calculateShipping(subtotalAfterDiscount: number, deliveryBaseFee: number, freeThreshold: number | null) {
  if (freeThreshold != null && freeThreshold > 0 && subtotalAfterDiscount >= freeThreshold) {
    return { amount: 0, label: "free" };
  }
  return { amount: Number(deliveryBaseFee.toFixed(2)), label: "standard" };
}

export function buildCartTotals(params: {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  currency: string;
  couponCode?: string | null;
  hasUnavailablePrice?: boolean;
}): CartTotals {
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const grandTotal = round(params.subtotal - params.discountTotal + params.shippingTotal + params.taxTotal);
  return {
    subtotal: round(params.subtotal),
    discountTotal: round(params.discountTotal),
    shippingTotal: round(params.shippingTotal),
    taxTotal: round(params.taxTotal),
    grandTotal,
    currency: params.currency,
    couponCode: params.couponCode ?? null,
    hasUnavailablePrice: Boolean(params.hasUnavailablePrice),
  };
}
