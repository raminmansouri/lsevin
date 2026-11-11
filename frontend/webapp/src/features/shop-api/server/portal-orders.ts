import "server-only";

import sql from "@/config/database/db";
import { formatShopMoney } from "@/features/shop/components/money";

import type { PortalPrincipal } from "./auth";
import { notFound, ShopApiError } from "./errors";
import { writeAudit } from "./repository";

/**
 * Clinic pickup of paid orders (provider shop). A clinic sees the paid orders that contain its
 * own lines (only those lines and their total), and moves its part of each order
 * new -> ready for pickup -> picked up. The order's own state machines stay with the shop admin;
 * an order the admin cancelled or refunded shows as "cancelled" and cannot be changed here.
 */

export type PickupStatus = "new" | "ready_for_pickup" | "picked_up";
export type OrderListStatus = PickupStatus | "cancelled" | "all";

/** Order statuses that mean the customer paid (paid_at covers orders paid then refunded). */
const PAID_STATUSES = ["paid", "processing", "partially_shipped", "shipped", "completed", "partially_refunded", "refunded", "returned"];
const CANCELLED_STATUSES = ["cancelled", "refunded"];

/** Which earlier pickup states each target may come from. */
const PICKUP_TRANSITIONS: Record<Exclude<PickupStatus, "new">, PickupStatus[]> = {
  ready_for_pickup: ["new"],
  picked_up: ["new", "ready_for_pickup"],
};

function requireProvider(principal: PortalPrincipal) {
  if (principal.kind !== "provider" || !principal.providerId)
    throw new ShopApiError("forbidden", "A provider is required.");
  return principal.providerId;
}

async function providerSellerId(providerId: string) {
  const [row] = await sql<{ id: string }[]>`
    select id::text as id from shop.sellers
    where service_provider_id = ${providerId}::uuid and deleted_at is null
    limit 1
  `;
  return row?.id ?? null;
}

const EFFECTIVE_STATUS = sql`
  case when o.status::text = any(${CANCELLED_STATUSES}) then 'cancelled' else coalesce(sp.status, 'new') end
`;

const IS_PAID = sql`(o.paid_at is not null or o.status::text = any(${PAID_STATUSES}))`;

type OrderRow = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  pickup_status: PickupStatus | "cancelled";
  currency: string;
  placed_at: Date | null;
  paid_at: Date | null;
  ready_at: Date | null;
  picked_up_at: Date | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  items: Array<{
    name: Record<string, string> | null;
    variant: Record<string, string> | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    image: string | null;
  }>;
};

const nameOf = (value: Record<string, string> | null) =>
  value ? value.fa || value["fa-IR"] || value.en || value["en-US"] || Object.values(value).find(Boolean) || null : null;

/** The clinic's paid orders (only its own lines), newest first, with a count per tab. */
export async function listPortalOrders(principal: PortalPrincipal, status: OrderListStatus) {
  const sellerId = await providerSellerId(requireProvider(principal));
  const counts = { new: 0, ready_for_pickup: 0, picked_up: 0, cancelled: 0 };
  if (!sellerId) return { status, counts, orders: [] };

  const rows = await sql<OrderRow[]>`
    select o.id::text as id, o.order_number, o.status::text as order_status, o.payment_status::text as payment_status,
           ${EFFECTIVE_STATUS} as pickup_status, o.currency, o.placed_at, o.paid_at, sp.ready_at, sp.picked_up_at,
           nullif(trim(a.full_name), '') as buyer_name,
           nullif(concat_ws('', a.phone_number_country_code, a.phone_number), '') as buyer_phone,
           nullif(o.email, '') as buyer_email,
           (select coalesce(json_agg(json_build_object(
                     'name', oi.product_name_snapshot, 'variant', oi.variant_name_snapshot, 'quantity', oi.quantity,
                     'unit_price', oi.unit_price_snapshot, 'line_total', oi.line_total_snapshot, 'image', oi.image_url_snapshot)
                     order by oi.id), '[]'::json)
              from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid) as items
    from shop.orders o
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ${sellerId}::uuid
    left join lateral (
      select ad.full_name, ad.phone_number_country_code, ad.phone_number from shop.order_addresses ad
      where ad.order_id = o.id order by (ad.address_type = 'shipping') desc limit 1
    ) a on true
    where exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid)
      and ${IS_PAID}
      and (${status} = 'all' or ${EFFECTIVE_STATUS} = ${status})
    order by coalesce(o.paid_at, o.placed_at) desc nulls last, o.id
    limit 200
  `;
  const countRows = await sql<{ status: keyof typeof counts; n: number }[]>`
    select ${EFFECTIVE_STATUS} as status, count(*)::int as n
    from shop.orders o
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ${sellerId}::uuid
    where exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid)
      and ${IS_PAID}
    group by 1
  `;
  for (const row of countRows) if (row.status in counts) counts[row.status] = row.n;

  return {
    status,
    counts,
    orders: rows.map((row) => {
      const items = (row.items ?? []).map((item) => ({
        name: nameOf(item.name) ?? "—",
        variant: nameOf(item.variant),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        lineTotal: Number(item.line_total),
        image: item.image,
      }));
      return {
        id: row.id,
        orderNumber: row.order_number,
        orderStatus: row.order_status,
        paymentStatus: row.payment_status,
        pickupStatus: row.pickup_status,
        currency: row.currency,
        placedAt: row.placed_at,
        paidAt: row.paid_at,
        readyAt: row.ready_at,
        pickedUpAt: row.picked_up_at,
        buyer: { name: row.buyer_name, phone: row.buyer_phone, email: row.buyer_email },
        items,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        total: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
      };
    }),
  };
}

/** The menu badge: paid orders still waiting for the clinic. */
export async function portalOrdersSummary(principal: PortalPrincipal) {
  const sellerId = await providerSellerId(requireProvider(principal));
  if (!sellerId) return { new: 0, readyForPickup: 0 };
  const [row] = await sql<{ new: number; ready: number }[]>`
    select count(*) filter (where ${EFFECTIVE_STATUS} = 'new')::int as new,
           count(*) filter (where ${EFFECTIVE_STATUS} = 'ready_for_pickup')::int as ready
    from shop.orders o
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ${sellerId}::uuid
    where exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid)
      and ${IS_PAID}
  `;
  return { new: row?.new ?? 0, readyForPickup: row?.ready ?? 0 };
}

/**
 * Moves the clinic's part of a paid order forward. The clinic's order lines follow (packed when
 * ready, delivered when picked up); when every line of the order is delivered the order's
 * fulfilment status becomes delivered, so the admin's order view agrees.
 */
export async function updatePortalOrderStatus(
  principal: PortalPrincipal,
  orderId: string,
  status: Exclude<PickupStatus, "new">
) {
  const providerId = requireProvider(principal);
  return sql.begin(async (tx) => {
    const [seller] = await tx<{ id: string }[]>`
      select id::text as id from shop.sellers where service_provider_id = ${providerId}::uuid and deleted_at is null
    `;
    if (!seller) throw new ShopApiError("forbidden", "Request a shop first.", { reason: "no_shop" });
    // Another seller's order is "not found", like one that does not exist.
    const [order] = await tx<{ status: string; paid: boolean }[]>`
      select o.status::text as status, ${IS_PAID} as paid from shop.orders o
      where o.id = ${orderId}::uuid
        and exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${seller.id}::uuid)
      for update of o
    `;
    if (!order) throw notFound("Order");
    if (!order.paid) throw new ShopApiError("conflict", "This order is not paid yet.", { reason: "order_not_paid" });
    if (CANCELLED_STATUSES.includes(order.status))
      throw new ShopApiError("conflict", "This order was cancelled.", { reason: "order_cancelled" });

    const [current] = await tx<{ status: PickupStatus }[]>`
      select status from shop.seller_order_pickups
      where order_id = ${orderId}::uuid and seller_id = ${seller.id}::uuid for update
    `;
    const from = current?.status ?? "new";
    if (!PICKUP_TRANSITIONS[status].includes(from)) {
      throw new ShopApiError("conflict", `This order is already ${from}; it cannot become ${status}.`, { reason: "pickup_transition" });
    }
    await tx`
      insert into shop.seller_order_pickups (order_id, seller_id, status, ready_at, picked_up_at, updated_by_user_id, updated_at)
      values (${orderId}::uuid, ${seller.id}::uuid, ${status},
        ${status === "ready_for_pickup" ? sql`now()` : sql`null`}, ${status === "picked_up" ? sql`now()` : sql`null`},
        ${principal.actorUserId}::uuid, now())
      on conflict (order_id, seller_id) do update set
        status = excluded.status,
        ready_at = coalesce(shop.seller_order_pickups.ready_at, excluded.ready_at),
        picked_up_at = coalesce(excluded.picked_up_at, shop.seller_order_pickups.picked_up_at),
        updated_by_user_id = excluded.updated_by_user_id, updated_at = now()
    `;
    await tx`
      update shop.order_items set fulfillment_status = ${status === "picked_up" ? "delivered" : "packed"}::shop.shipment_status
      where order_id = ${orderId}::uuid and seller_id = ${seller.id}::uuid
    `;
    if (status === "picked_up") {
      await tx`
        update shop.orders set fulfillment_status = 'delivered', last_modified_date = now()
        where id = ${orderId}::uuid
          and not exists (select 1 from shop.order_items oi where oi.order_id = ${orderId}::uuid
                            and oi.fulfillment_status::text <> 'delivered')
      `;
    }
    await writeAudit(tx, {
      tokenId: null,
      sellerId: seller.id,
      actorUserId: principal.actorUserId,
      source: "portal",
      ip: principal.ip,
      action: `order.${status}`,
      entityType: "order",
      entityId: orderId,
    });
    return { orderId, pickupStatus: status };
  });
}

// ------------------------------------------------------------------------------------------------
// "New paid order" notification to the clinic, through the portal's notification bridge
// ------------------------------------------------------------------------------------------------

function bridgeConfig() {
  const origin = (process.env.PROVIDER_PORTAL_ORIGIN ?? "").replace(/\/+$/, "");
  if (!origin) return null;
  return { url: `${origin}/api/public/lsevin/notifications/events`, key: process.env.LSEVIN_NOTIFICATION_BRIDGE_KEY ?? "" };
}

/**
 * After an order is paid: one in-app notification per clinic that sells in it (at most once per
 * clinic and order, via seller_order_pickups.notified_at). Never throws; a failed send is
 * released so a later "paid" event can try again.
 */
export async function notifyClinicsOfPaidOrder(orderId: string): Promise<void> {
  const bridge = bridgeConfig();
  if (!bridge) return;
  try {
    const claimed = await sql<{ seller_id: string }[]>`
      insert into shop.seller_order_pickups (order_id, seller_id, notified_at)
      select distinct ${orderId}::uuid, oi.seller_id, now()
      from shop.order_items oi
      join shop.sellers s on s.id = oi.seller_id and s.service_provider_id is not null and not s.is_default
      where oi.order_id = ${orderId}::uuid
      on conflict (order_id, seller_id) do update set notified_at = now()
        where shop.seller_order_pickups.notified_at is null
      returning seller_id::text as seller_id
    `;
    if (!claimed.length) return;
    const details = await sql<{ seller_id: string; provider_id: string; order_number: string; currency: string; quantity: number; total: string }[]>`
      select s.id::text as seller_id, s.service_provider_id::text as provider_id, o.order_number, o.currency,
             sum(oi.quantity)::int as quantity, sum(oi.line_total_snapshot)::text as total
      from shop.order_items oi
      join shop.orders o on o.id = oi.order_id
      join shop.sellers s on s.id = oi.seller_id
      where oi.order_id = ${orderId}::uuid and oi.seller_id::text = any(${claimed.map((row) => row.seller_id)})
      group by s.id, s.service_provider_id, o.order_number, o.currency
    `;
    for (const row of details) {
      const total = formatShopMoney(Number(row.total), row.currency, "fa");
      try {
        const response = await fetch(bridge.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(bridge.key ? { "x-lsevin-bridge-key": bridge.key } : {}) },
          body: JSON.stringify({
            eventName: "shop.order.paid",
            recipientEntityType: "provider",
            recipientEntityId: row.provider_id,
            title: "سفارش جدید فروشگاه",
            body: `سفارش ${row.order_number}: ${row.quantity} کالا به مبلغ ${total} پرداخت شد. آن را برای تحویل در مرکز آماده کنید.`,
            channel: "in_app",
            sourceModule: "provider-shop",
            sourceEntityType: "shop_order",
            sourceEntityId: orderId,
            locale: "fa-IR",
            metadata: { orderNumber: row.order_number, sellerId: row.seller_id },
          }),
          redirect: "error",
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error(`bridge answered ${response.status}`);
      } catch (error) {
        console.error("[shop-api] clinic order notification failed", { orderId, sellerId: row.seller_id, error: (error as Error)?.message });
        await sql`
          update shop.seller_order_pickups set notified_at = null
          where order_id = ${orderId}::uuid and seller_id = ${row.seller_id}::uuid
        `;
      }
    }
  } catch (error) {
    console.error("[shop-api] clinic order notification failed", { orderId, error: (error as Error)?.message });
  }
}
