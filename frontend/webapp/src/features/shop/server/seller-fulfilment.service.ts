import "server-only";

import sql from "@/config/database/db";

import { getPickupClinics } from "../api/pickup-clinics.repository";
import {
  canMoveSellerPart,
  normalizeTrackingCode,
  type FulfilmentChoice,
  type SellerPartStatus,
  type SellerPartTarget,
} from "../lib/fulfilment";
import { completeOrderIfFullyHandedOver } from "./order-fulfilment";
import { decryptPickupCode, issuePickupCode, PICKUP_CODE_MAX_ATTEMPTS, pickupCodeMatches } from "./pickup-code";

/**
 * The seller's part of an order (shop.seller_order_pickups, one row per order and seller, written
 * at checkout). Every seller fulfils its own items; a clinic moves its part in the portal, an
 * admin moves the default seller's (Lsevin's) part in the admin order page:
 *   shipping  new -> preparing -> shipped (tracking code; "shipped" SMS) -> delivery_requested
 *   pickup    new -> ready_for_pickup (6-digit code; "ready" SMS) -> customer's code -> delivery_requested
 * delivery_requested waits for an admin: approve -> completed (the order completes when every part
 * is completed); reject with a reason -> back to the state it came from.
 *
 * These functions do NOT check who is calling: the portal resolves the clinic's own seller id
 * from its principal, and the admin actions assert the shop permission first.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any;

export class SellerFulfilmentError extends Error {
  constructor(
    readonly reason:
      | "not_found"
      | "order_not_paid"
      | "order_cancelled"
      | "transition"
      | "tracking_required"
      | "not_pickup"
      | "not_requested"
      | "reason_required",
    message: string,
  ) {
    super(message);
    this.name = "SellerFulfilmentError";
  }
}

const CANCELLED = ["cancelled", "refunded"];
/** The order statuses a seller part may still move in. */
const OPEN_ORDER = ["paid", "processing", "partially_shipped", "shipped"];

/** A line without a seller belongs to the default seller (Lsevin). */
export const LINE_SELLER = sql`coalesce(oi.seller_id, (select ds.id from shop.sellers ds where ds.is_default limit 1))`;

export type PartRow = {
  status: SellerPartStatus;
  type: FulfilmentChoice;
  requestedFrom: SellerPartStatus | null;
  hash: string | null;
  attempts: number;
  locked: boolean;
};

/**
 * Locks the order and the seller's part (creating the part for an older order without one) and
 * checks the order can move. Another seller's order is "not found".
 */
async function lockPart(tx: Tx, orderId: string, sellerId: string): Promise<{ orderStatus: string; part: PartRow }> {
  const [order] = await tx<{ status: string; paid: boolean; mode: string }[]>`
    select o.status::text as status, o.paid_at is not null as paid, o.fulfillment_mode as mode
    from shop.orders o
    where o.id = ${orderId}::uuid
      and exists (select 1 from shop.order_items oi where oi.order_id = o.id and ${LINE_SELLER} = ${sellerId}::uuid)
    for update of o
  `;
  if (!order) throw new SellerFulfilmentError("not_found", "Order not found.");
  if (CANCELLED.includes(order.status)) throw new SellerFulfilmentError("order_cancelled", "This order was cancelled.");
  if (!order.paid || !OPEN_ORDER.includes(order.status))
    throw new SellerFulfilmentError("order_not_paid", "This order is not paid yet, or already finished.");
  await tx`
    insert into shop.seller_order_pickups (order_id, seller_id, fulfilment_type)
    values (${orderId}::uuid, ${sellerId}::uuid, ${order.mode === "pickup" ? "pickup" : "shipping"})
    on conflict (order_id, seller_id) do nothing
  `;
  const [part] = await tx<PartRow[]>`
    select status, fulfilment_type as type, requested_from_status as "requestedFrom", pickup_code_hash as hash,
      pickup_code_attempts as attempts, pickup_code_locked_at is not null as locked
    from shop.seller_order_pickups where order_id = ${orderId}::uuid and seller_id = ${sellerId}::uuid
    for update
  `;
  return { orderStatus: order.status, part };
}

async function history(tx: Tx, orderId: string, status: string, to: string, note: string, userId: string | null) {
  await tx`
    insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
    values (${orderId}::uuid, ${status}::shop.order_status, ${to}::shop.order_status, ${note}, ${userId}::uuid)
  `;
}

/** The default seller's lines left the shop inventory: reservations become outbound movements. */
async function convertSellerReservations(tx: Tx, orderId: string, sellerId: string) {
  const lines = await tx<{ product_id: string; variant_id: string | null; quantity: number; seller_stock: boolean }[]>`
    select oi.product_id::text as product_id, oi.variant_id::text as variant_id, oi.quantity,
      (oi.offer_id is not null and o.stock_quantity is not null) as seller_stock
    from shop.order_items oi left join shop.offers o on o.id = oi.offer_id
    where oi.order_id = ${orderId}::uuid and ${LINE_SELLER} = ${sellerId}::uuid and not oi.is_preorder
  `;
  for (const line of lines) {
    // A seller-stock line already left the seller's offer at checkout.
    if (line.seller_stock) continue;
    const [inv] = await tx<{ id: string }[]>`
      select i.id::text as id from shop.inventory i
      where (${line.variant_id}::uuid is not null and i.variant_id = ${line.variant_id}::uuid)
         or (${line.variant_id}::uuid is null and i.product_id = ${line.product_id}::uuid and i.variant_id is null)
      limit 1
    `;
    if (!inv) continue;
    await tx`
      update shop.inventory
      set reserved = greatest(reserved - ${line.quantity}, 0), on_hand = greatest(on_hand - ${line.quantity}, 0), last_modified_date = now()
      where id = ${inv.id}::uuid
    `;
    await tx`
      insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note)
      values (${inv.id}::uuid, 'outbound', ${line.quantity}, 'shop.order', ${orderId}::uuid, 'shipped by seller')
    `;
  }
}

export type AdvanceInput = {
  orderId: string;
  sellerId: string;
  to: Exclude<SellerPartTarget, "delivery_requested"> | "delivery_requested";
  trackingCode?: string | null;
  carrier?: string | null;
  actorUserId: string | null;
};

/**
 * Moves a seller's part one step: preparing, shipped (needs a tracking code), ready_for_pickup
 * (issues the pickup code; again = a new code) or, for a shipped part, delivery_requested.
 * Pickup parts reach delivery_requested only through confirmSellerPickupCode.
 */
export async function advanceSellerPart(input: AdvanceInput): Promise<{ status: SellerPartStatus }> {
  const tracking = input.to === "shipped" ? normalizeTrackingCode(input.trackingCode) : null;
  if (input.to === "shipped" && !tracking)
    throw new SellerFulfilmentError("tracking_required", "Enter the tracking code of the shipment.");

  const outcome = await sql.begin(async (tx: Tx) => {
    const { orderStatus, part } = await lockPart(tx, input.orderId, input.sellerId);
    const reissue = input.to === "ready_for_pickup" && part.type === "pickup" && part.status === "ready_for_pickup";
    if (input.to === "delivery_requested" && part.type === "pickup")
      throw new SellerFulfilmentError("transition", "A pickup is confirmed with the customer's pickup code.");
    if (!reissue && !canMoveSellerPart(part.type, part.status, input.to))
      throw new SellerFulfilmentError("transition", `This part is ${part.status}; it cannot become ${input.to}.`);

    let code: string | null = null;
    if (input.to === "preparing") {
      await tx`
        update shop.seller_order_pickups set status = 'preparing', preparing_at = now(),
          updated_by_user_id = ${input.actorUserId}::uuid, updated_at = now()
        where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
      `;
      await tx`
        update shop.order_items oi set fulfillment_status = 'packed'::shop.shipment_status
        where oi.order_id = ${input.orderId}::uuid and ${LINE_SELLER} = ${input.sellerId}::uuid and oi.fulfillment_status::text = 'pending'
      `;
    } else if (input.to === "shipped") {
      await tx`
        update shop.seller_order_pickups set status = 'shipped', tracking_code = ${tracking},
          carrier = ${input.carrier?.trim() || null}, shipped_at = now(), preparing_at = coalesce(preparing_at, now()),
          rejected_at = null, rejection_reason = null, updated_by_user_id = ${input.actorUserId}::uuid, updated_at = now()
        where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
      `;
      await tx`
        update shop.order_items oi set fulfillment_status = 'shipped'::shop.shipment_status
        where oi.order_id = ${input.orderId}::uuid and ${LINE_SELLER} = ${input.sellerId}::uuid
          and oi.fulfillment_status::text in ('pending', 'packed', 'ready')
      `;
      await convertSellerReservations(tx, input.orderId, input.sellerId);
      // The order is shipped once every seller has shipped (or is further along).
      const [{ open }] = await tx<{ open: number }[]>`
        select count(distinct ${LINE_SELLER})::int as open
        from shop.order_items oi
        left join shop.seller_order_pickups sp on sp.order_id = oi.order_id and sp.seller_id = ${LINE_SELLER}
        where oi.order_id = ${input.orderId}::uuid and coalesce(sp.status, 'new') in ('new', 'preparing', 'ready_for_pickup')
      `;
      const next = open > 0 ? "partially_shipped" : "shipped";
      if (orderStatus !== next && ["paid", "processing", "partially_shipped"].includes(orderStatus)) {
        await tx`
          update shop.orders set status = ${next}::shop.order_status,
            fulfillment_status = ${open > 0 ? "packed" : "shipped"}::shop.shipment_status, last_modified_date = now()
          where id = ${input.orderId}::uuid
        `;
        await history(tx, input.orderId, orderStatus, next, `Seller shipped (tracking ${tracking})`, input.actorUserId);
      }
    } else if (input.to === "ready_for_pickup") {
      const issued = issuePickupCode(input.orderId, `seller:${input.sellerId}`);
      code = issued.code;
      await tx`
        update shop.seller_order_pickups set status = 'ready_for_pickup', ready_at = coalesce(ready_at, now()),
          pickup_code_hash = ${issued.hash}, pickup_code_cipher = ${issued.cipher}, pickup_code_attempts = 0,
          pickup_code_locked_at = null, pickup_code_issued_at = now(), customer_notified_at = null,
          rejected_at = null, rejection_reason = null, updated_by_user_id = ${input.actorUserId}::uuid, updated_at = now()
        where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
      `;
      await tx`
        update shop.order_items oi set fulfillment_status = 'ready'::shop.shipment_status
        where oi.order_id = ${input.orderId}::uuid and ${LINE_SELLER} = ${input.sellerId}::uuid
          and oi.fulfillment_status::text in ('pending', 'packed')
      `;
      if (!reissue && orderStatus === "paid") {
        await tx`update shop.orders set status = 'processing', fulfillment_status = 'ready', last_modified_date = now() where id = ${input.orderId}::uuid`;
        await history(tx, input.orderId, orderStatus, "processing", "Ready for pickup at the seller", input.actorUserId);
      }
    } else {
      await tx`
        update shop.seller_order_pickups set status = 'delivery_requested', delivery_requested_at = now(),
          requested_from_status = ${part.status}, updated_by_user_id = ${input.actorUserId}::uuid, updated_at = now()
        where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
      `;
    }
    return { status: input.to as SellerPartStatus, code };
  });

  // After commit; neither throws.
  const notifications = await import("./shop-notifications");
  if (input.to === "shipped") await notifications.notifySellerPartShipped({ orderId: input.orderId, trackingCode: tracking });
  if (outcome.code) await notifications.notifySellerPickupReady({ orderId: input.orderId, sellerId: input.sellerId, code: outcome.code });
  return { status: outcome.status };
}

// Flat (not a discriminated union): this repo compiles without strictNullChecks.
export type PickupCodeResult = { ok: boolean; reason?: "wrong_code" | "code_locked"; attemptsLeft?: number };

/** The customer is at the seller's place: their code moves the part to delivery_requested. */
export async function confirmSellerPickupCode(input: {
  orderId: string;
  sellerId: string;
  code: string;
  actorUserId: string | null;
}): Promise<PickupCodeResult> {
  return sql.begin(async (tx: Tx) => {
    const { part } = await lockPart(tx, input.orderId, input.sellerId);
    if (part.type !== "pickup") throw new SellerFulfilmentError("not_pickup", "This part is shipped, not picked up.");
    if (part.status !== "ready_for_pickup")
      throw new SellerFulfilmentError("transition", "Mark the order ready for pickup first.");
    if (part.locked) return { ok: false, reason: "code_locked" as const, attemptsLeft: 0 };
    if (!pickupCodeMatches(input.orderId, `seller:${input.sellerId}`, input.code, part.hash)) {
      const attempts = Number(part.attempts ?? 0) + 1;
      const locked = attempts >= PICKUP_CODE_MAX_ATTEMPTS;
      await tx`
        update shop.seller_order_pickups
        set pickup_code_attempts = ${attempts}, pickup_code_locked_at = ${locked ? sql`now()` : sql`null`}, updated_at = now()
        where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
      `;
      // Returned, not thrown, so the counted attempt is committed.
      return {
        ok: false,
        reason: locked ? ("code_locked" as const) : ("wrong_code" as const),
        attemptsLeft: Math.max(PICKUP_CODE_MAX_ATTEMPTS - attempts, 0),
      };
    }
    await tx`
      update shop.seller_order_pickups
      set status = 'delivery_requested', delivery_requested_at = now(), requested_from_status = 'ready_for_pickup',
          picked_up_at = now(), pickup_code_attempts = 0, updated_by_user_id = ${input.actorUserId}::uuid, updated_at = now()
      where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
    `;
    return { ok: true };
  });
}

/**
 * THE hook for the seller's money: called once, inside the approval transaction, when an admin
 * approves that a seller's part reached the customer. Commission and seller payout posting will go
 * here; today it only records the approval in the order history.
 */
export async function onSellerPartDeliveryApproved(
  tx: Tx,
  part: { orderId: string; sellerId: string; orderStatus: string; approvedByUserId: string | null },
): Promise<void> {
  await history(tx, part.orderId, part.orderStatus, part.orderStatus, `Seller part delivered (seller ${part.sellerId})`, part.approvedByUserId);
}

async function lockRequestedPart(tx: Tx, orderId: string, sellerId: string) {
  const [order] = await tx<{ status: string }[]>`select status::text as status from shop.orders where id = ${orderId}::uuid for update`;
  if (!order) throw new SellerFulfilmentError("not_found", "Order not found.");
  const [part] = await tx<{ status: string; from: SellerPartStatus | null; type: FulfilmentChoice }[]>`
    select status, requested_from_status as "from", fulfilment_type as type from shop.seller_order_pickups
    where order_id = ${orderId}::uuid and seller_id = ${sellerId}::uuid for update
  `;
  if (!part) throw new SellerFulfilmentError("not_found", "This seller has no part in this order.");
  if (part.status !== "delivery_requested")
    throw new SellerFulfilmentError("not_requested", "The seller has not asked for delivery approval.");
  return { orderStatus: order.status, part };
}

/** Admin: the seller's part reached the customer. Completes the order when it was the last part. */
export async function approveSellerPart(input: { orderId: string; sellerId: string; adminUserId: string | null }) {
  const completed = await sql.begin(async (tx: Tx) => {
    const { orderStatus } = await lockRequestedPart(tx, input.orderId, input.sellerId);
    await tx`
      update shop.seller_order_pickups
      set status = 'completed', approved_at = now(), approved_by_user_id = ${input.adminUserId}::uuid,
          received_at = coalesce(received_at, now()), pickup_code_cipher = null, updated_at = now()
      where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
    `;
    await tx`
      update shop.order_items oi set fulfillment_status = 'delivered'::shop.shipment_status
      where oi.order_id = ${input.orderId}::uuid and ${LINE_SELLER} = ${input.sellerId}::uuid
    `;
    await onSellerPartDeliveryApproved(tx, { ...input, orderStatus, approvedByUserId: input.adminUserId });
    const [{ open }] = await tx<{ open: number }[]>`
      select count(distinct ${LINE_SELLER})::int as open
      from shop.order_items oi
      left join shop.seller_order_pickups sp on sp.order_id = oi.order_id and sp.seller_id = ${LINE_SELLER}
      where oi.order_id = ${input.orderId}::uuid and coalesce(sp.status, 'new') <> 'completed'
    `;
    if (open > 0) return false;
    // Every line delivered: an order still "paid"/"processing" (pickup only) completes too.
    return completeOrderIfFullyHandedOver(tx, input.orderId, input.adminUserId, "Every seller part delivered");
  });
  if (completed) {
    const { notifyShopOrderEvent } = await import("./shop-notifications");
    await notifyShopOrderEvent({ orderId: input.orderId, event: "order.delivered" });
  }
  return { orderCompleted: completed };
}

/** Admin: not delivered after all; the part goes back to where it was, with the reason. */
export async function rejectSellerPart(input: { orderId: string; sellerId: string; reason: string; adminUserId: string | null }) {
  const reason = input.reason?.trim();
  if (!reason) throw new SellerFulfilmentError("reason_required", "A reason is required.");
  await sql.begin(async (tx: Tx) => {
    const { part } = await lockRequestedPart(tx, input.orderId, input.sellerId);
    const back = part.from ?? (part.type === "pickup" ? "ready_for_pickup" : "shipped");
    await tx`
      update shop.seller_order_pickups
      set status = ${back}, rejected_at = now(), rejection_reason = ${reason.slice(0, 500)},
          delivery_requested_at = null, updated_by_user_id = ${input.adminUserId}::uuid, updated_at = now()
      where order_id = ${input.orderId}::uuid and seller_id = ${input.sellerId}::uuid
    `;
  });
}

// ------------------------------------------------------------------------------------------------
// Read models
// ------------------------------------------------------------------------------------------------

export type SellerPartView = {
  sellerId: string;
  sellerName: string;
  isDefault: boolean;
  type: FulfilmentChoice;
  status: SellerPartStatus;
  shippingFee: number;
  deliveryMethodName: string | null;
  handlingDays: number | null;
  deliveryDaysMax: number | null;
  dueAt: string | null;
  trackingCode: string | null;
  carrier: string | null;
  shippedAt: string | null;
  readyAt: string | null;
  deliveryRequestedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  codeLocked: boolean;
  attemptsLeft: number;
  /** Decrypted only for the customer's own order page, while ready. */
  pickupCodeCipher: string | null;
  itemIds: string[];
};

/** Every seller part of one order (rows for older orders without one read as "new" shipping). */
export async function readOrderSellerParts(orderId: string, locale = "fa"): Promise<SellerPartView[]> {
  const lang = locale.split("-")[0] || "fa";
  const rows = await sql<any[]>`
    select ls.seller_id::text as "sellerId", s.is_default as "isDefault",
      coalesce(nullif(common.get_translation_t(s.name_translations, ${lang}, 'en'), ''), '—') as "sellerName",
      coalesce(sp.fulfilment_type, case when o.fulfillment_mode = 'pickup' then 'pickup' else 'shipping' end) as type,
      coalesce(sp.status, 'new') as status, coalesce(sp.shipping_fee, 0)::float as "shippingFee",
      nullif(common.get_translation_t(dm.name_translations, ${lang}, 'en'), '') as "deliveryMethodName",
      sp.handling_days as "handlingDays", sp.delivery_days_max as "deliveryDaysMax",
      (o.paid_at + make_interval(days => ls.handling::int))::text as "dueAt",
      sp.tracking_code as "trackingCode", sp.carrier, sp.shipped_at::text as "shippedAt", sp.ready_at::text as "readyAt",
      sp.delivery_requested_at::text as "deliveryRequestedAt", sp.approved_at::text as "approvedAt",
      sp.rejection_reason as "rejectionReason", sp.pickup_code_locked_at is not null as "codeLocked",
      coalesce(sp.pickup_code_attempts, 0) as attempts, sp.pickup_code_cipher as "pickupCodeCipher", ls.item_ids as "itemIds"
    from (
      select ${LINE_SELLER} as seller_id, max(coalesce(oi.handling_days_snapshot, 1)) as handling,
        array_agg(oi.id::text order by oi.create_date) as item_ids
      from shop.order_items oi where oi.order_id = ${orderId}::uuid
      group by 1
    ) ls
    join shop.orders o on o.id = ${orderId}::uuid
    join shop.sellers s on s.id = ls.seller_id
    left join shop.seller_order_pickups sp on sp.order_id = o.id and sp.seller_id = ls.seller_id
    left join shop.delivery_methods dm on dm.id = sp.delivery_method_id
    order by s.is_default desc, 3
  `;
  return rows.map((row) => ({
    ...row,
    shippingFee: Number(row.shippingFee ?? 0),
    attemptsLeft: Math.max(PICKUP_CODE_MAX_ATTEMPTS - Number(row.attempts ?? 0), 0),
    itemIds: row.itemIds ?? [],
  }));
}

/** Where a pickup part is collected: the clinic's address / phone / hours, or Lsevin's office. */
export async function pickupPlaces(sellerIds: string[], locale = "fa") {
  const lang = locale.split("-")[0] || "fa";
  const clinics = await getPickupClinics(sellerIds, locale);
  const [office] = await sql<{ address: string | null; phone: string | null; hours: string | null }[]>`
    select nullif(common.get_translation_t(pickup_address_translations, ${lang}, 'fa'), '') as address,
      nullif(pickup_phone, '') as phone,
      nullif(common.get_translation_t(pickup_hours_translations, ${lang}, 'fa'), '') as hours
    from shop.delivery_methods where supports_pickup order by is_active desc, code = 'lsevin_office_pickup' desc limit 1
  `;
  const defaults = await sql<{ id: string }[]>`select id::text as id from shop.sellers where is_default`;
  const out = new Map<string, { name: string; address: string | null; phone: string | null; hours: string | null }>();
  for (const id of sellerIds) {
    if (defaults.some((d) => d.id === id)) {
      out.set(id, { name: clinics.get(id)?.name || "Lsevin", address: office?.address ?? null, phone: office?.phone ?? null, hours: office?.hours ?? null });
      continue;
    }
    const clinic = clinics.get(id);
    if (!clinic) continue;
    out.set(id, { name: clinic.name, address: clinic.address, phone: clinic.phone, hours: formatOpeningHours(clinic.openingHours, lang) });
  }
  return out;
}

const DAY_NAMES: Record<string, string[]> = {
  fa: ["", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه"],
  en: ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

/** "شنبه 09:00–17:00، ..." from the clinic's weekly hours (closed days left out). */
export function formatOpeningHours(hours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean }>, lang: string) {
  const names = DAY_NAMES[lang] ?? DAY_NAMES.en;
  // Iranian week order: Saturday first.
  const order = [6, 7, 1, 2, 3, 4, 5];
  const open = order
    .map((day) => hours.find((h) => h.dayOfWeek === day))
    .filter((h): h is NonNullable<typeof h> => Boolean(h && !h.isClosed && h.opensAt && h.closesAt))
    .map((h) => `${names[h.dayOfWeek]} ${h.opensAt}–${h.closesAt}`);
  return open.length ? open.join(lang === "fa" ? "، " : ", ") : null;
}

/** The customer's view of a part's code: only while it waits for them. */
export function visiblePickupCode(part: Pick<SellerPartView, "status" | "pickupCodeCipher">): string | null {
  return part.status === "ready_for_pickup" ? decryptPickupCode(part.pickupCodeCipher) : null;
}

/** Admin "waiting for approval" list. */
export async function listPartsAwaitingApproval(locale = "fa") {
  const lang = locale.split("-")[0] || "fa";
  return sql<{
    orderId: string;
    orderNumber: string;
    sellerId: string;
    sellerName: string;
    type: FulfilmentChoice;
    trackingCode: string | null;
    requestedAt: string;
  }[]>`
    select o.id::text as "orderId", o.order_number as "orderNumber", sp.seller_id::text as "sellerId",
      coalesce(nullif(common.get_translation_t(s.name_translations, ${lang}, 'en'), ''), '—') as "sellerName",
      sp.fulfilment_type as type, sp.tracking_code as "trackingCode", sp.delivery_requested_at::text as "requestedAt"
    from shop.seller_order_pickups sp
    join shop.orders o on o.id = sp.order_id
    join shop.sellers s on s.id = sp.seller_id
    where sp.status = 'delivery_requested' and o.status::text <> all(${CANCELLED})
    order by sp.delivery_requested_at asc
    limit 500
  `;
}
