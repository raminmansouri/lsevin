import "server-only";

export const TOMAN_CURRENCY_CODE = "IRT";

export type DisplayPrice = {
  value: number;
  currency: string;
  /** True when this is the provider's own admin-set Toman price, not the base price/currency. */
  isNativeToman: boolean;
};

/**
 * Picks which price to show: the provider's admin-set Toman price when the
 * visitor is Iranian and one is set, otherwise the existing base price
 * exactly as before. This is the one place that decision is made -- callers
 * never compare currencies or check isIranian themselves, they just pass in
 * what a row has and get back what to render.
 *
 * Deliberately does not touch convertProviderPrice / the international
 * multiplier / FX conversion at all: those keep working exactly as they do
 * today for every visitor and every row without a Toman price. This is a
 * pure, additive override that sits in front of them.
 */
export function resolveDisplayPrice(
  base: { value: number; currency: string },
  valueToman: number | null | undefined,
  isIranianVisitor: boolean,
): DisplayPrice {
  if (isIranianVisitor && valueToman != null && Number.isFinite(valueToman)) {
    return { value: valueToman, currency: TOMAN_CURRENCY_CODE, isNativeToman: true };
  }
  return { value: base.value, currency: base.currency, isNativeToman: false };
}
