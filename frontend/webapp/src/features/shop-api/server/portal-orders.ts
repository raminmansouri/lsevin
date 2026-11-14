import "server-only";

import sql from "@/config/database/db";
import { formatShopMoney } from "@/features/shop/components/money";

import type { PortalOrderStatusUpdate, PortalShippingInput } from "@/features/shop-api/schemas";
import { sellerShippingFee, type SellerPartStatus } from "@/features/shop/lib/fulfilment";
import { PICKUP_CODE_MAX_ATTEMPTS } from "@/features/shop/server/pickup-code";
import {
  advanceSellerPart,
  confirmSellerPickupCode,
  SellerFulfilmentError,
} from "@/features/shop/server/seller-fulfilment.service";

import type { PortalPrincipal } from "./auth";
import { notFound, ShopApiError } from "./errors";
import { writeAudit } from "./repository";

/**
 * The clinic's part of paid orders (provider shop). Every seller fulfils its own items: a clinic
 * sees the paid orders that contain its lines (only those lines, their total, its shipping fee and,
 * to send them, the customer's name / mobile / address) and moves its part:
 *   shipping  new -> preparing -> shipped (tracking code; the customer gets an SMS) -> delivery_requested
 *   pickup    new -> ready_for_pickup (the customer gets a 6-digit code) -> the customer's code -> delivery_requested
 * delivery_requested waits for Lsevin's admin approval (completed), or comes back with a reason.
 * Due date = paid date + the longest handling days among its lines.
 * An order the admin cancelled or refunded shows as "cancelled" and cannot be changed here.
 * The state machine and its side effects live in shop/server/seller-fulfilment.service.
 */

export type PartStatus = SellerPartStatus;
export type OrderListStatus = PartStatus | "cancelled" | "all";
export const PORTAL_ORDER_TABS: Array<PartStatus | "cancelled"> = [
  "new",
  "preparing",
  "shipped",
  "ready_for_pickup",
  "delivery_requested",
  "completed",
  "cancelled",
];

/** Order statuses that mean the customer paid (paid_at covers orders paid then refunded). */
const PAID_STATUSES = ["paid", "processing", "partially_shipped", "shipped", "completed", "partially_refunded", "refunded", "returned"];
const CANCELLED_STATUSES = ["cancelled", "refunded"];

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
  part_status: PartStatus | "cancelled";
  fulfilment_type: "shipping" | "pickup";
  shipping_fee: string | null;
  tracking_code: string | null;
  carrier: string | null;
  rejection_reason: string | null;
  code_locked: boolean | null;
  attempts: number | null;
  currency: string;
  placed_at: Date | null;
  paid_at: Date | null;
  ready_at: Date | null;
  shipped_at: Date | null;
  delivery_requested_at: Date | null;
  approved_at: Date | null;
  due_at: Date | null;
  customer: { name: string | null; phone: string | null; address: string | null; city: string | null; postal_code: string | null } | null;
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
  const counts = Object.fromEntries(PORTAL_ORDER_TABS.map((tab) => [tab, 0])) as Record<PartStatus | "cancelled", number>;
  if (!sellerId) return { status, counts, orders: [] };

  const rows = await sql<OrderRow[]>`
    select o.id::text as id, o.order_number, o.status::text as order_status, o.payment_status::text as payment_status,
           ${EFFECTIVE_STATUS} as part_status,
           coalesce(sp.fulfilment_type, case when o.fulfillment_mode = 'pickup' then 'pickup' else 'shipping' end) as fulfilment_type,
           sp.shipping_fee::text as shipping_fee, sp.tracking_code, sp.carrier, sp.rejection_reason,
           sp.pickup_code_locked_at is not null as code_locked, sp.pickup_code_attempts as attempts,
           o.currency, o.placed_at, o.paid_at, sp.ready_at, sp.shipped_at, sp.delivery_requested_at, sp.approved_at,
           (select o.paid_at + make_interval(days => max(coalesce(oi.handling_days_snapshot, 1))::int)
              from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid) as due_at,
           (select json_build_object('name', a.full_name,
                     'phone', nullif(concat_ws('', a.phone_number_country_code, a.phone_number), ''),
                     'address', case when o.fulfillment_mode = 'pickup' then null
                                     else nullif(concat_ws(', ', a.state_region, a.address_line_1, a.address_line_2), '') end,
                     'city', case when o.fulfillment_mode = 'pickup' then null else a.city end,
                     'postal_code', case when o.fulfillment_mode = 'pickup' then null else a.postal_code end)
              from shop.order_addresses a where a.order_id = o.id and a.address_type = 'shipping' limit 1) as customer,
           (select coalesce(json_agg(json_build_object(
                     'name', oi.product_name_snapshot, 'variant', oi.variant_name_snapshot, 'quantity', oi.quantity,
                     'unit_price', oi.unit_price_snapshot, 'line_total', oi.line_total_snapshot, 'image', oi.image_url_snapshot)
                     order by oi.id), '[]'::json)
              from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid) as items
    from shop.orders o
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ${sellerId}::uuid
    where exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid)
      and ${IS_PAID}
      and (${status} = 'all' or ${EFFECTIVE_STATUS} = ${status})
    order by coalesce(o.paid_at, o.placed_at) desc nulls last, o.id
    limit 200
  `;
  const countRows = await sql<{ status: PartStatus | "cancelled"; n: number }[]>`
    select ${EFFECTIVE_STATUS} as status, count(*)::int as n
    from shop.orders o
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ${sellerId}::uuid
    where exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid)
      and ${IS_PAID}
    group by 1
  `;
  for (const row of countRows) if (row.status in counts) counts[row.status] = row.n;

  const now = Date.now();
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
      const open = row.part_status === "new" || row.part_status === "preparing";
      return {
        id: row.id,
        orderNumber: row.order_number,
        orderStatus: row.order_status,
        paymentStatus: row.payment_status,
        partStatus: row.part_status,
        fulfilmentType: row.fulfilment_type,
        shippingFee: Number(row.shipping_fee ?? 0),
        trackingCode: row.tracking_code,
        carrier: row.carrier,
        // The admin sent a "delivered" request back, with this reason.
        rejectionReason: row.rejection_reason,
        codeLocked: Boolean(row.code_locked),
        attemptsLeft: Math.max(PICKUP_CODE_MAX_ATTEMPTS - Number(row.attempts ?? 0), 0),
        currency: row.currency,
        placedAt: row.placed_at,
        paidAt: row.paid_at,
        readyAt: row.ready_at,
        shippedAt: row.shipped_at,
        deliveryRequestedAt: row.delivery_requested_at,
        approvedAt: row.approved_at,
        // Ship it (or have it ready) by this date.
        dueAt: row.due_at,
        overdue: Boolean(open && row.due_at && new Date(row.due_at).getTime() < now),
        // Who to send it to (pickup: the name and mobile only).
        customer: row.customer
          ? {
              name: row.customer.name ?? null,
              phone: row.customer.phone ?? null,
              address: row.customer.address ?? null,
              city: row.customer.city ?? null,
              postalCode: row.customer.postal_code ?? null,
            }
          : null,
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
  if (!sellerId) return { new: 0, readyForPickup: 0, preparing: 0 };
  const [row] = await sql<{ new: number; ready: number; preparing: number }[]>`
    select count(*) filter (where ${EFFECTIVE_STATUS} = 'new')::int as new,
           count(*) filter (where ${EFFECTIVE_STATUS} = 'ready_for_pickup')::int as ready,
           count(*) filter (where ${EFFECTIVE_STATUS} = 'preparing')::int as preparing
    from shop.orders o
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ${sellerId}::uuid
    where exists (select 1 from shop.order_items oi where oi.order_id = o.id and oi.seller_id = ${sellerId}::uuid)
      and ${IS_PAID}
  `;
  return { new: row?.new ?? 0, readyForPickup: row?.ready ?? 0, preparing: row?.preparing ?? 0 };
}

const REASON_CODE: Record<SellerFulfilmentError["reason"], "not_found" | "conflict" | "validation_error"> = {
  not_found: "not_found",
  order_not_paid: "conflict",
  order_cancelled: "conflict",
  transition: "conflict",
  tracking_required: "validation_error",
  not_pickup: "conflict",
  not_requested: "conflict",
  reason_required: "validation_error",
};

/**
 * Moves the clinic's part of a paid order one step. For a pickup, "delivery_requested" needs the
 * customer's code (a wrong code answers ok:false with the tries left, it is not an error).
 */
export async function updatePortalOrderStatus(principal: PortalPrincipal, orderId: string, update: PortalOrderStatusUpdate) {
  const providerId = requireProvider(principal);
  const sellerId = await providerSellerId(providerId);
  if (!sellerId) throw new ShopApiError("forbidden", "Request a shop first.", { reason: "no_shop" });
  try {
    const [part] = await sql<{ type: string }[]>`
      select fulfilment_type as type from shop.seller_order_pickups where order_id = ${orderId}::uuid and seller_id = ${sellerId}::uuid
    `;
    let result: { ok: boolean; status?: string; reason?: string; attemptsLeft?: number };
    if (update.status === "delivery_requested" && part?.type === "pickup") {
      if (!update.code) throw new ShopApiError("validation_error", "Enter the customer's pickup code.", { reason: "code_required" });
      const outcome = await confirmSellerPickupCode({ orderId, sellerId, code: update.code, actorUserId: principal.actorUserId });
      result = outcome.ok ? { ok: true, status: "delivery_requested" } : { ok: false, reason: outcome.reason, attemptsLeft: outcome.attemptsLeft };
    } else {
      const moved = await advanceSellerPart({
        orderId,
        sellerId,
        to: update.status,
        trackingCode: update.trackingCode ?? null,
        carrier: update.carrier ?? null,
        actorUserId: principal.actorUserId,
      });
      result = { ok: true, status: moved.status };
    }
    if (result.ok) {
      await sql.begin((tx) =>
        writeAudit(tx, {
          tokenId: null,
          sellerId,
          actorUserId: principal.actorUserId,
          source: "portal",
          ip: principal.ip,
          action: `order.${update.status}`,
          entityType: "order",
          entityId: orderId,
        }),
      );
    }
    return { orderId, partStatus: result.status ?? null, ok: result.ok, reason: result.reason ?? null, attemptsLeft: result.attemptsLeft ?? null };
  } catch (error) {
    if (error instanceof SellerFulfilmentError)
      throw new ShopApiError(REASON_CODE[error.reason], error.message, { reason: error.reason });
    throw error;
  }
}

/** The clinic's own shipping settings: fee (rial) and delivery days, and Lsevin's cap on the fee. */
export async function getPortalShipping(principal: PortalPrincipal) {
  const sellerId = await providerSellerId(requireProvider(principal));
  if (!sellerId) throw new ShopApiError("forbidden", "Request a shop first.", { reason: "no_shop" });
  const [row] = await sql<{ fee: string | null; min: number | null; max: number | null; cap: string | null }[]>`
    select s.shipping_fee::text as fee, s.delivery_days_min as min, s.delivery_days_max as max,
      (select seller_fee_cap::text from shop.shipping_settings where id) as cap
    from shop.sellers s where s.id = ${sellerId}::uuid
  `;
  const fee = row?.fee == null ? null : Number(row.fee);
  const cap = row?.cap == null ? null : Number(row.cap);
  return {
    shippingFee: fee,
    deliveryDaysMin: row?.min ?? null,
    deliveryDaysMax: row?.max ?? null,
    feeCap: cap,
    // What a customer is charged per shipment (before the free-shipping threshold).
    chargedFee: sellerShippingFee(fee, cap),
  };
}

export async function updatePortalShipping(principal: PortalPrincipal, input: PortalShippingInput) {
  const sellerId = await providerSellerId(requireProvider(principal));
  if (!sellerId) throw new ShopApiError("forbidden", "Request a shop first.", { reason: "no_shop" });
  await sql.begin(async (tx) => {
    await tx`
      update shop.sellers set shipping_fee = ${input.shippingFee}, delivery_days_min = ${input.deliveryDaysMin},
        delivery_days_max = ${input.deliveryDaysMax}, last_modified_date = now()
      where id = ${sellerId}::uuid
    `;
    await writeAudit(tx, {
      tokenId: null,
      sellerId,
      actorUserId: principal.actorUserId,
      source: "portal",
      ip: principal.ip,
      action: "shop.shipping.update",
      entityType: "seller",
      entityId: sellerId,
    });
  });
  return getPortalShipping(principal);
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
    const details = await sql<{ seller_id: string; provider_id: string; order_number: string; currency: string; quantity: number; total: string; days: number }[]>`
      select s.id::text as seller_id, s.service_provider_id::text as provider_id, o.order_number, o.currency,
             sum(oi.quantity)::int as quantity, sum(oi.line_total_snapshot)::text as total,
             max(coalesce(oi.handling_days_snapshot, 1))::int as days
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
            body: `سفارش ${row.order_number}: ${row.quantity} کالا به مبلغ ${total} پرداخت شد. لطفاً حداکثر تا ${row.days} روز آن را برای مشتری ارسال کنید یا برای تحویل حضوری آماده کنید.`,
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
