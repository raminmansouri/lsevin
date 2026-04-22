import type { CartTotals } from "../types/domain";
export function calculateTax(subtotalAfterDiscount: number, taxClass = "standard") {
  const rate = taxClass === "reduced" ? 0.05 : 0.1;
  return { rate, amount: Number((subtotalAfterDiscount * rate).toFixed(2)) };
}
export function calculateShipping(subtotalAfterDiscount: number, deliveryBaseFee: number) {
  if (subtotalAfterDiscount >= 250) return { amount: 0, label: "Free shipping" };
  return { amount: Number(deliveryBaseFee.toFixed(2)), label: "Standard shipping" };
}
export function buildCartTotals(params: { subtotal: number; discountTotal: number; shippingTotal: number; taxTotal: number; currency: string; couponCode?: string | null; }): CartTotals {
  const grandTotal = Number((params.subtotal - params.discountTotal + params.shippingTotal + params.taxTotal).toFixed(2));
  return { subtotal: +params.subtotal.toFixed(2), discountTotal: +params.discountTotal.toFixed(2), shippingTotal: +params.shippingTotal.toFixed(2), taxTotal: +params.taxTotal.toFixed(2), grandTotal, currency: params.currency, couponCode: params.couponCode ?? null };
}
