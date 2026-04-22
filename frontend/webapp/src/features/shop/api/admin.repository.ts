import { assertAdmin, sql } from "../lib/db";

export async function getAdminDashboardSummary() {
  await assertAdmin();
  const [sales] = await sql<any[]>`select coalesce(count(*),0)::int as orders_count, coalesce(sum(grand_total),0)::float as revenue, coalesce(avg(grand_total),0)::float as avg_order_value from shop.orders where status in ('paid','processing','partially_shipped','shipped','completed') and placed_at >= date_trunc('month', now())`;
  const [products] = await sql<any[]>`select count(*)::int as product_count, count(*) filter (where status = 'active')::int as active_products from shop.products where deleted_at is null`;
  const [lowStock] = await sql<any[]>`select count(*)::int as low_stock_count from shop.inventory where (on_hand - reserved) <= reorder_threshold`;
  return { ordersCount: +sales?.orders_count, revenue: +sales?.revenue, avgOrderValue: +sales?.avg_order_value, productCount: +products?.product_count, activeProducts: +products?.active_products, lowStockCount: +lowStock?.low_stock_count };
}
export async function listAdminProducts() { await assertAdmin(); return sql<any[]>`select p.id::text as id, common.get_translation_t(p.name_translations, 'en', 'en') as name, p.slug, p.status, p.base_price::float as base_price, p.base_currency as currency, p.published_at::text as published_at from shop.products p where p.deleted_at is null order by p.create_date desc`; }
export async function listAdminOrders() { await assertAdmin(); return sql<any[]>`select o.id::text as id, o.order_number, o.email, o.status, o.payment_status, o.fulfillment_status, o.grand_total::float as grand_total, o.currency, o.placed_at::text as placed_at from shop.orders o order by o.placed_at desc limit 200`; }
export async function listInventoryRows() { await assertAdmin(); return sql<any[]>`select i.id::text as id, common.get_translation_t(p.name_translations, 'en', 'en') as product_name, v.sku, w.name as warehouse_name, i.on_hand, i.reserved, (i.on_hand - i.reserved) as available, i.reorder_threshold from shop.inventory i join shop.products p on p.id = i.product_id left join shop.product_variants v on v.id = i.variant_id join shop.warehouses w on w.id = i.warehouse_id order by available asc, product_name asc`; }
export async function listCoupons() { await assertAdmin(); return sql<any[]>`select id::text as id, code, coupon_type, value::float as value, is_active, stackable, starts_at::text as starts_at, expires_at::text as expires_at, usage_limit, usage_per_customer from shop.coupons order by create_date desc`; }
