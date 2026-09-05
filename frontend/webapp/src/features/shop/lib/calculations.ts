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

export function calculateShipping(subtotalAfterDiscount: number, deliveryBaseFee: number, freeThreshold = 75) {
  if (freeThreshold > 0 && subtotalAfterDiscount >= freeThreshold) {
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
