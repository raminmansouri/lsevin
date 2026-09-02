import "server-only";

import sql from "@/config/database/db";

import { assertShopAdmin } from "../lib/context";
import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";
import { notifyCartAbandoned } from "./shop-notifications";

/**
 * Abandoned-cart detection + recovery (SHP-V03-011). Uses the existing
 * `shop.abandoned_carts` table as the ledger, so a cart is recorded — and
 * notified — at most once (no spam). Only carts belonging to a known customer
 * are notified; guests are recorded but never messaged (no consent path).
 *
 * There is no in-app scheduler, so `runCartRecovery` is invoked from the admin
 * dashboard; a cron can later call the same function through a thin route.
 */

const IDLE_MIN = 1;
const IDLE_MAX = 168;

export async function getCartRecoveryStats(idleHours = 4) {
  await assertShopAdmin();
  const hours = clampHours(idleHours);
  const [row] = await sql<
    { recoverable: number; recorded: number; awaiting_notification: number; recovered: number }[]
  >`
    with candidate as (
      select c.id,
        exists (select 1 from shop.abandoned_carts a where a.cart_id = c.id) as recorded
      from shop.carts c
      where c.status = 'active' and c.converted_order_id is null
        and c.last_modified_date < now() - (${hours} || ' hours')::interval
        and exists (select 1 from shop.cart_items ci where ci.cart_id = c.id and ci.saved_for_later = false)
    )
    select
      count(*) filter (where not recorded)::int as recoverable,
      (select count(*)::int from shop.abandoned_carts) as recorded,
      (select count(*)::int from shop.abandoned_carts where notification_status = 'pending' and recovered_at is null) as awaiting_notification,
      (select count(*)::int from shop.abandoned_carts where recovered_at is not null) as recovered
    from candidate
  `;
  return row ?? { recoverable: 0, recorded: 0, awaiting_notification: 0, recovered: 0 };
}

export async function runCartRecovery(opts: { idleHours?: number; limit?: number } = {}) {
  await assertShopPermission(SHOP_PERMISSIONS.merchandisingManage);
  const hours = clampHours(opts.idleHours ?? 4);
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? 200) || 200, 1), 500);

  // 1. Detect: record newly-idle carts that hold at least one live item.
  const detected = await sql<{ id: string }[]>`
    insert into shop.abandoned_carts (cart_id, customer_id, recovery_token, notification_status)
    select c.id, c.customer_id,
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'pending'
    from shop.carts c
    where c.status = 'active' and c.converted_order_id is null
      and c.last_modified_date < now() - (${hours} || ' hours')::interval
      and exists (select 1 from shop.cart_items ci where ci.cart_id = c.id and ci.saved_for_later = false)
      and not exists (select 1 from shop.abandoned_carts a where a.cart_id = c.id)
    limit ${limit}
    returning id::text as id
  `;

  // 2. Notify: pending records whose cart is still open and owned by a customer.
  const pending = await sql<
    { id: string; cartId: string; recoveryToken: string | null; customerId: string; currency: string; itemCount: number }[]
  >`
    select a.id::text as id, a.cart_id::text as "cartId", a.recovery_token as "recoveryToken",
      c.customer_id::text as "customerId", c.currency,
      (select count(*)::int from shop.cart_items ci where ci.cart_id = c.id and ci.saved_for_later = false) as "itemCount"
    from shop.abandoned_carts a
    join shop.carts c on c.id = a.cart_id
    where a.notification_status = 'pending' and a.recovered_at is null and a.customer_id is not null
      and c.status = 'active' and c.converted_order_id is null
    order by a.detected_at asc
    limit ${limit}
  `;

  let notified = 0;
  for (const p of pending) {
    const ok = await notifyCartAbandoned(p);
    await sql`
      update shop.abandoned_carts set notification_status = ${ok ? "notified" : "failed"}
      where id = ${p.id}::uuid
    `;
    if (ok) notified += 1;
  }

  return { detected: detected.length, notified, pending: pending.length };
}

/** Called from `placeOrder` when a cart converts, so recovery reporting is accurate. */
export async function markCartRecovered(cartId: string): Promise<void> {
  try {
    await sql`
      update shop.abandoned_carts set recovered_at = now(), notification_status = 'recovered'
      where cart_id = ${cartId}::uuid and recovered_at is null
    `;
  } catch {
    // best-effort; never block checkout
  }
}

function clampHours(h: number) {
  const n = Math.trunc(h) || 4;
  return Math.min(Math.max(n, IDLE_MIN), IDLE_MAX);
}
