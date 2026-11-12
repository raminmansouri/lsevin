import "server-only";

import sql from "@/config/database/db";

import { getPickupClinics, type PickupClinic } from "../api/pickup-clinics.repository";
import { assertShopPermission, SHOP_PERMISSIONS } from "../lib/permissions";

/**
 * Partner sellers (e.g. clinics) hand their items to Lsevin; Lsevin then sends the whole order.
 * One row per (order, seller) in shop.seller_order_pickups tracks it:
 *   status       what the seller reports in the portal: new -> ready_for_pickup (ready to hand to
 *                Lsevin) -> picked_up (handed to Lsevin)
 *   received_at  Lsevin's own confirmation that the items arrived (admin "received")
 * A seller's due date is the order's paid date + the longest handling days among its lines.
 * The order can be shipped, or made ready at the office, only once every seller part is received.
 */

/** Paid orders a seller still has to hand to Lsevin are in these order statuses. */
const OPEN_STATUSES = ["paid", "processing"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any;

/** How many partner sellers of this order have not been received yet (0 = all at Lsevin). */
export async function sellerPartsNotReceived(tx: Tx, orderId: string): Promise<number> {
  const [row] = await tx`
    select count(distinct oi.seller_id)::int as n
    from shop.order_items oi
    join shop.sellers s on s.id = oi.seller_id and not s.is_default
    left join shop.seller_order_pickups sp on sp.order_id = oi.order_id and sp.seller_id = oi.seller_id
    where oi.order_id = ${orderId}::uuid and sp.received_at is null
  `;
  return Number(row?.n ?? 0);
}

export type InboundPart = {
  orderId: string;
  orderNumber: string;
  fulfillmentMode: "delivery" | "office_pickup";
  paidAt: string | null;
  dueAt: string | null;
  overdue: boolean;
  sellerStatus: "new" | "ready_for_pickup" | "picked_up";
  items: Array<{ name: string; quantity: number }>;
};
export type InboundSeller = { sellerId: string; seller: PickupClinic | null; sellerName: string; parts: InboundPart[] };

/** Admin "items to receive": every paid, open order part a partner seller has not handed in yet. */
export async function listInboundParts(locale = "fa"): Promise<InboundSeller[]> {
  await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const rows = await sql<{
    order_id: string;
    order_number: string;
    fulfillment_mode: string;
    paid_at: string | null;
    due_at: string | null;
    overdue: boolean;
    seller_id: string;
    seller_name: string | null;
    seller_status: string;
    items: Array<{ name: string; quantity: number }>;
  }[]>`
    select o.id::text as order_id, o.order_number, o.fulfillment_mode, o.paid_at::text as paid_at,
      s.id::text as seller_id,
      nullif(common.get_translation_t(s.name_translations, ${locale}, 'en'), '') as seller_name,
      coalesce(sp.status, 'new') as seller_status,
      (o.paid_at + make_interval(days => max(coalesce(oi.handling_days_snapshot, 1))::int))::text as due_at,
      coalesce(o.paid_at + make_interval(days => max(coalesce(oi.handling_days_snapshot, 1))::int) < now(), false) as overdue,
      json_agg(json_build_object(
        'name', coalesce(nullif(common.get_translation_t(oi.product_name_snapshot, ${locale}, 'en'), ''), '—'),
        'quantity', oi.quantity) order by oi.create_date) as items
    from shop.orders o
    join shop.order_items oi on oi.order_id = o.id
    join shop.sellers s on s.id = oi.seller_id and not s.is_default
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = s.id
    where o.paid_at is not null and o.status::text = any(${OPEN_STATUSES}) and sp.received_at is null
    group by o.id, s.id, sp.status
    order by o.paid_at + make_interval(days => max(coalesce(oi.handling_days_snapshot, 1))::int) asc nulls last, o.order_number
    limit 500
  `;
  const contacts = await getPickupClinics(rows.map((row) => row.seller_id), locale);
  const bySeller = new Map<string, InboundSeller>();
  for (const row of rows) {
    const group =
      bySeller.get(row.seller_id) ??
      { sellerId: row.seller_id, seller: contacts.get(row.seller_id) ?? null, sellerName: row.seller_name ?? "—", parts: [] };
    group.parts.push({
      orderId: row.order_id,
      orderNumber: row.order_number,
      fulfillmentMode: row.fulfillment_mode === "office_pickup" ? "office_pickup" : "delivery",
      paidAt: row.paid_at,
      dueAt: row.due_at,
      overdue: Boolean(row.overdue),
      sellerStatus: (["new", "ready_for_pickup", "picked_up"].includes(row.seller_status) ? row.seller_status : "new") as InboundPart["sellerStatus"],
      items: row.items ?? [],
    });
    bySeller.set(row.seller_id, group);
  }
  return [...bySeller.values()];
}

/** The seller parts of one order, for the admin order page. */
export async function listOrderSellerParts(orderId: string, locale = "fa") {
  await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  return sql<{
    seller_id: string;
    seller_name: string | null;
    seller_status: string;
    received_at: string | null;
    due_at: string | null;
  }[]>`
    select s.id::text as seller_id,
      nullif(common.get_translation_t(s.name_translations, ${locale}, 'en'), '') as seller_name,
      coalesce(sp.status, 'new') as seller_status, sp.received_at::text as received_at,
      (o.paid_at + make_interval(days => max(coalesce(oi.handling_days_snapshot, 1))::int))::text as due_at
    from shop.order_items oi
    join shop.orders o on o.id = oi.order_id
    join shop.sellers s on s.id = oi.seller_id and not s.is_default
    left join shop.seller_order_pickups sp on sp.order_id = oi.order_id and sp.seller_id = s.id
    where oi.order_id = ${orderId}::uuid
    group by s.id, sp.status, sp.received_at, o.paid_at
    order by 2
  `;
}

/**
 * Lsevin received a seller's items for an order. Idempotent: receiving twice keeps the first time.
 * The seller's lines become "ready" (at Lsevin, ready to send).
 */
export async function markSellerPartReceived(input: { orderId: string; sellerId: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  await sql.begin(async (tx) => {
    const [order] = await tx<{ status: string }[]>`
      select o.status::text as status from shop.orders o
      where o.id = ${input.orderId}::uuid
        and exists (select 1 from shop.order_items oi join shop.sellers s on s.id = oi.seller_id and not s.is_default
                    where oi.order_id = o.id and oi.seller_id = ${input.sellerId}::uuid)
      for update of o
    `;
    if (!order) throw new Error("This seller has no items in this order.");
    if (["cancelled", "refunded"].includes(order.status)) throw new Error("This order was cancelled.");
    await tx`
      insert into shop.seller_order_pickups (order_id, seller_id, status, picked_up_at, received_at, received_by_user_id, updated_at)
      values (${input.orderId}::uuid, ${input.sellerId}::uuid, 'picked_up', now(), now(), ${userId ?? null}::uuid, now())
      on conflict (order_id, seller_id) do update set
        status = 'picked_up',
        picked_up_at = coalesce(shop.seller_order_pickups.picked_up_at, now()),
        received_at = coalesce(shop.seller_order_pickups.received_at, now()),
        received_by_user_id = coalesce(shop.seller_order_pickups.received_by_user_id, excluded.received_by_user_id),
        updated_at = now()
    `;
    await tx`
      update shop.order_items set fulfillment_status = 'ready'::shop.shipment_status
      where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
        and fulfillment_status::text in ('pending', 'packed')
    `;
  });
}
