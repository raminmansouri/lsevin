import "server-only";

import sql from "@/config/database/db";
import { convertMoney } from "@/features/finance/lib/server/currency-queries";
import { normalizeCurrencyCode, roundMoney } from "@/features/finance/lib/money";

/**
 * Coupon evaluation (SHP-CHK-002, SHP-V02-004). Deterministic and auditable: one
 * function decides eligibility and the exact discount, always in the request's
 * resolved display currency (SHP-CHK-013). It never trusts a client-supplied
 * amount. Coupon `value` / `min_subtotal` / `max_discount_amount` are stored in
 * the coupon's own currency (or, when null, treated as the display currency) and
 * converted through the platform Finance policy here.
 *
 * V0.1 supports `cart` and `shipping` scope. `product` / `category` / `brand`
 * scoped coupons are recognised but applied at cart level with a note, until the
 * line-level discount engine lands.
 */

export type CouponEvaluation = {
  code: string;
  valid: boolean;
  reason: string | null;
  couponId: string | null;
  couponType: "fixed" | "percentage" | "free_shipping" | null;
  scope: string | null;
  /** discount amount in the display currency (0 for a pure free-shipping coupon) */
  discountAmount: number;
  freeShipping: boolean;
  title: string | null;
};

const INVALID = (code: string, reason: string): CouponEvaluation => ({
  code,
  valid: false,
  reason,
  couponId: null,
  couponType: null,
  scope: null,
  discountAmount: 0,
  freeShipping: false,
  title: null,
});

async function toDisplay(amount: number, from: string | null, displayCurrency: string): Promise<number> {
  const src = normalizeCurrencyCode(from || displayCurrency);
  const tgt = normalizeCurrencyCode(displayCurrency);
  if (src === tgt) return amount;
  try {
    const r = await convertMoney({ amount, sourceCurrencyCode: src, targetCurrencyCode: tgt });
    return roundMoney(r.targetAmount, tgt);
  } catch {
    return amount; // fall back to face value rather than blocking checkout
  }
}

export async function evaluateCoupon(input: {
  code: string;
  subtotal: number;
  displayCurrency: string;
  customerId: string | null;
  locale?: string;
}): Promise<CouponEvaluation> {
  const code = input.code.trim();
  if (!code) return INVALID(code, "empty");

  const rows = await sql<any[]>`
    select
      id::text as id, code, coupon_type, value::float as value, currency, is_active,
      starts_at, expires_at, min_subtotal::float as min_subtotal, max_discount_amount::float as max_discount_amount,
      usage_limit, usage_per_customer, stackable, scope::text as scope,
      common.get_translation_t(title_translations, ${input.locale ?? "en"}, 'en') as title
    from shop.coupons
    where lower(code) = lower(${code})
    limit 1
  `;
  const c = rows[0];
  if (!c) return INVALID(code, "not_found");
  if (!c.is_active) return INVALID(code, "inactive");

  const now = Date.now();
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return INVALID(code, "not_started");
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return INVALID(code, "expired");

  // usage limits
  if (c.usage_limit != null) {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from shop.coupon_redemptions where coupon_id = ${c.id}::uuid`;
    if (n >= c.usage_limit) return INVALID(code, "usage_limit_reached");
  }
  if (c.usage_per_customer != null && input.customerId) {
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int as n from shop.coupon_redemptions where coupon_id = ${c.id}::uuid and customer_id = ${input.customerId}::uuid
    `;
    if (n >= c.usage_per_customer) return INVALID(code, "per_customer_limit_reached");
  }

  const minSubtotal = await toDisplay(Number(c.min_subtotal) || 0, c.currency, input.displayCurrency);
  if (input.subtotal < minSubtotal) return INVALID(code, "below_min_subtotal");

  let discountAmount = 0;
  let freeShipping = false;

  if (c.coupon_type === "free_shipping") {
    freeShipping = true;
  } else if (c.coupon_type === "percentage") {
    discountAmount = (input.subtotal * Number(c.value)) / 100;
    if (c.max_discount_amount != null) {
      const cap = await toDisplay(Number(c.max_discount_amount), c.currency, input.displayCurrency);
      discountAmount = Math.min(discountAmount, cap);
    }
  } else {
    // fixed
    discountAmount = await toDisplay(Number(c.value), c.currency, input.displayCurrency);
  }

  discountAmount = Math.max(0, Math.min(discountAmount, input.subtotal));
  discountAmount = roundMoney(discountAmount, input.displayCurrency);

  return {
    code,
    valid: true,
    reason: null,
    couponId: c.id,
    couponType: c.coupon_type,
    scope: c.scope,
    discountAmount,
    freeShipping,
    title: c.title || null,
  };
}

/** Records a redemption after an order is placed (SHP-CHK-002 audit trail). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordCouponRedemption(tx: any, input: {
  couponId: string;
  code: string;
  orderId: string;
  cartId: string | null;
  customerId: string | null;
  amount: number;
}): Promise<void> {
  await tx`
    insert into shop.coupon_redemptions (coupon_id, order_id, cart_id, customer_id, code, amount)
    values (${input.couponId}::uuid, ${input.orderId}::uuid, ${input.cartId ?? null}::uuid, ${input.customerId ?? null}::uuid, ${input.code}, ${input.amount})
  `;
}
