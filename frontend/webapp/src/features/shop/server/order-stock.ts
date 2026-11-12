import "server-only";

/**
 * Gives an order's held stock back when the order is cancelled or rejected.
 *
 * A line bought from an offer that keeps its own stock (a marketplace seller, e.g. a clinic)
 * took its units from that offer at checkout, never from the shop inventory, so they go back
 * to the offer. Any other line (the default seller) holds a shop.inventory reservation, which
 * is released.
 *
 * Shared by the admin cancel/reject path and the customer cancellation, so both put stock
 * back in the same place.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function releaseOrderReservations(tx: any, orderId: string, note: string) {
  const items: Array<{ product_id: string; variant_id: string | null; quantity: number; offer_id: string | null; seller_stock: boolean }> = await tx`
    select oi.product_id, oi.variant_id, oi.quantity, oi.offer_id::text as offer_id,
      (oi.offer_id is not null and o.stock_quantity is not null) as seller_stock
    from shop.order_items oi left join shop.offers o on o.id = oi.offer_id
    where oi.order_id = ${orderId}::uuid
  `;
  for (const it of items) {
    if (it.seller_stock) {
      await tx`update shop.offers set stock_quantity = stock_quantity + ${it.quantity}, last_modified_date = now() where id = ${it.offer_id}::uuid`;
      continue;
    }
    const [inv] = await tx<{ id: string }[]>`
      select i.id::text as id from shop.inventory i
      where (${it.variant_id}::uuid is not null and i.variant_id = ${it.variant_id}::uuid)
         or (${it.variant_id}::uuid is null and i.product_id = ${it.product_id}::uuid and i.variant_id is null)
      limit 1
    `;
    if (!inv) continue;
    await tx`update shop.inventory set reserved = greatest(reserved - ${it.quantity}, 0), last_modified_date = now() where id = ${inv.id}::uuid`;
    await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note)
             values (${inv.id}::uuid, 'release', ${it.quantity}, 'shop.order', ${orderId}::uuid, ${note})`;
  }
}
