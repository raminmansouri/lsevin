import "server-only";

/**
 * One order can hold a shipped part (sent by the shop) and pickup parts (one per clinic). The
 * order is complete only when every line has reached the customer: shipped lines delivered and
 * pickup lines picked up (both end as order_items.fulfillment_status = 'delivered').
 *
 * Called after either side finishes its part, inside that side's transaction. Moves the order
 * to completed (and its fulfilment to delivered) once nothing is left, and records the change.
 * Returns whether the order was completed by this call.
 */
const COMPLETABLE = ["paid", "processing", "partially_shipped", "shipped"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function completeOrderIfFullyHandedOver(tx: any, orderId: string, actorUserId: string | null, note: string): Promise<boolean> {
  const [row] = await tx<{ status: string; open_lines: number; lines: number }[]>`
    select o.status::text as status,
      (select count(*)::int from shop.order_items oi where oi.order_id = o.id and oi.fulfillment_status::text <> 'delivered') as open_lines,
      (select count(*)::int from shop.order_items oi where oi.order_id = o.id) as lines
    from shop.orders o where o.id = ${orderId}::uuid
    for update of o
  `;
  if (!row || row.lines === 0 || row.open_lines > 0 || !COMPLETABLE.includes(row.status)) return false;
  await tx`
    update shop.orders set status = 'completed', fulfillment_status = 'delivered', last_modified_date = now()
    where id = ${orderId}::uuid
  `;
  await tx`
    insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
    values (${orderId}::uuid, ${row.status}::shop.order_status, 'completed', ${note}, ${actorUserId}::uuid)
  `;
  return true;
}
