import "server-only";

import { createHash } from "node:crypto";

import sql from "@/config/database/db";

import { getShopContext } from "./context";

/**
 * Commerce telemetry (§2.1 / §12). Fire-and-forget and privacy-safe: the actor
 * is pseudonymous (customer id, or a hash of the guest token), and no address /
 * phone / payment payload / health data is ever written here (SHP-NFR-012).
 * Failures never break a customer flow.
 */

export type CommerceEventName =
  | "shop_product_view"
  | "shop_add_to_cart"
  | "shop_checkout_started"
  | "shop_order_placed"
  | "shop_payment_succeeded"
  | "shop_payment_failed"
  | "shop_purchase_completed"
  | "shop_refund_completed"
  | "shop_related_service_product_click"
  | "shop_currency_changed"
  | "shop_search";

export type CommerceEventInput = {
  productId?: string | null;
  categoryId?: string | null;
  cartId?: string | null;
  orderId?: string | null;
  campaignKey?: string | null;
  value?: number | null;
  currency?: string | null;
  quantity?: number | null;
  surface?: string | null;
  idempotencyKey?: string | null;
  extra?: Record<string, string | number | boolean | null>;
};

function pseudonymize(kind: string, key: string | null): string | null {
  if (!key) return null;
  return createHash("sha256").update(`${kind}:${key}`).digest("hex").slice(0, 32);
}

export async function emitCommerceEvent(name: CommerceEventName, input: CommerceEventInput = {}): Promise<void> {
  try {
    const ctx = await getShopContext();
    const actorKind = ctx.customerId ? "customer" : "guest";
    const actorKey = ctx.customerId
      ? pseudonymize("customer", ctx.customerId)
      : pseudonymize("guest", ctx.guestToken || null);

    await sql`
      insert into shop.analytics_events (
        event_name, actor_kind, actor_key, session_surface, locale, country_code, currency,
        product_id, category_id, cart_id, order_id, campaign_key, value_amount, quantity, idempotency_key, payload
      ) values (
        ${name}, ${actorKind}, ${actorKey}, ${input.surface ?? null}, ${ctx.locale}, ${ctx.countryCode}, ${input.currency ?? null},
        ${input.productId ?? null}::uuid, ${input.categoryId ?? null}::uuid, ${input.cartId ?? null}::uuid, ${input.orderId ?? null}::uuid,
        ${input.campaignKey ?? null}, ${input.value ?? null}, ${input.quantity ?? null}, ${input.idempotencyKey ?? null},
        ${sql.json(input.extra ?? {})}
      )
      on conflict do nothing
    `;
  } catch {
    // telemetry must never surface to the customer
  }
}
