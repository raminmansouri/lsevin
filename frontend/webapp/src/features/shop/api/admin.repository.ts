import "server-only";

import { assertShopAdmin } from "../lib/context";
import { sql } from "../lib/db";

/**
 * Admin read model. Every export asserts an admin role first — a `"use server"`
 * / RSC entry point is a public surface (SHP-ADM-017, SHP-ORD-008).
 */

export async function getAdminDashboardSummary() {
  await assertShopAdmin();
  const [sales] = await sql<any[]>`
    select
      count(*) filter (where placed_at >= date_trunc('month', now()))::int as orders_month,
      coalesce(sum(grand_total) filter (where status in ('paid','processing','partially_shipped','shipped','completed')), 0)::float as paid_sales,
      coalesce(avg(grand_total) filter (where status in ('paid','processing','partially_shipped','shipped','completed')), 0)::float as avg_order_value,
      count(*) filter (where status in ('paid','processing') and fulfillment_status = 'pending')::int as pending_fulfilment,
      count(*) filter (where payment_status = 'failed' or review_status = 'pending')::int as exceptions
    from shop.orders
  `;
  const [products] = await sql<any[]>`
    select count(*)::int as product_count, count(*) filter (where status = 'active')::int as active_products
    from shop.products where deleted_at is null
  `;
  const [lowStock] = await sql<any[]>`
    select count(*)::int as low_stock_count from shop.inventory where (on_hand - reserved) <= reorder_threshold
  `;
  const recentOrders = await sql<any[]>`
    select id::text as id, order_number, email, status, payment_status, grand_total::float as grand_total, currency, placed_at::text as placed_at
    from shop.orders order by placed_at desc limit 8
  `;
  return {
    ordersMonth: sales?.orders_month ?? 0,
    paidSales: sales?.paid_sales ?? 0,
    avgOrderValue: sales?.avg_order_value ?? 0,
    pendingFulfilment: sales?.pending_fulfilment ?? 0,
    exceptions: sales?.exceptions ?? 0,
    productCount: products?.product_count ?? 0,
    activeProducts: products?.active_products ?? 0,
    lowStockCount: lowStock?.low_stock_count ?? 0,
    recentOrders,
  };
}

export async function listAdminProducts(q?: string) {
  await assertShopAdmin();
  const like = q ? `%${q}%` : null;
  return sql<any[]>`
    select
      p.id::text as id,
      common.get_translation_t(p.name_translations, 'en', 'en') as name,
      p.slug, p.status, p.base_price::float as base_price, p.base_currency as currency,
      p.is_featured, p.is_best_seller, p.is_new_arrival,
      p.published_at::text as published_at,
      coalesce((select sum(greatest(i.on_hand - i.reserved, 0))::int from shop.inventory i where i.product_id = p.id), 0) as available
    from shop.products p
    where p.deleted_at is null
      and (${like}::text is null or common.get_translation_t(p.name_translations, 'en', 'en') ilike ${like} or p.slug ilike ${like})
    order by p.create_date desc
    limit 200
  `;
}

export type AdminOrderFilters = {
  q?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
};

export async function listAdminOrders(filters: AdminOrderFilters = {}) {
  await assertShopAdmin();
  const like = filters.q ? `%${filters.q}%` : null;
  return sql<any[]>`
    select
      o.id::text as id, o.order_number, o.email, o.status, o.payment_status, o.fulfillment_status,
      o.review_status, o.grand_total::float as grand_total, o.currency, o.placed_at::text as placed_at,
      coalesce((select sum(quantity) from shop.order_items oi where oi.order_id = o.id), 0)::int as item_count
    from shop.orders o
    where (${like}::text is null or o.order_number ilike ${like} or o.email ilike ${like})
      and (${filters.status ?? null}::text is null or o.status::text = ${filters.status ?? null})
      and (${filters.paymentStatus ?? null}::text is null or o.payment_status::text = ${filters.paymentStatus ?? null})
      and (${filters.fulfillmentStatus ?? null}::text is null or o.fulfillment_status::text = ${filters.fulfillmentStatus ?? null})
    order by o.placed_at desc
    limit 200
  `;
}

export async function getAdminOrder(orderId: string) {
  await assertShopAdmin();
  const [order] = await sql<any[]>`
    select
      o.id::text as id, o.order_number, o.email, o.customer_id::text as customer_id,
      o.status, o.payment_status, o.fulfillment_status, o.review_status, o.review_note,
      o.subtotal::float as subtotal, o.discount_total::float as discount_total,
      o.shipping_total::float as shipping_total, o.tax_total::float as tax_total,
      o.grand_total::float as grand_total, o.currency,
      o.source_currency, o.display_currency, o.payment_currency, o.payment_total::float as payment_total,
      o.fx_applied_rate::float as fx_applied_rate, o.fx_snapshot,
      o.coupon_code, o.note, o.placed_at::text as placed_at, o.paid_at::text as paid_at
    from shop.orders o where o.id = ${orderId}::uuid limit 1
  `;
  if (!order) return null;

  const [items, addresses, history, shipments, payments] = await Promise.all([
    sql<any[]>`
      select id::text as id, sku, quantity,
        common.get_translation_t(product_name_snapshot, 'en', 'en') as name,
        nullif(common.get_translation_t(variant_name_snapshot, 'en', 'en'), '') as variant_name,
        unit_price_snapshot::float as unit_price, line_total_snapshot::float as line_total,
        source_currency, source_unit_price::float as source_unit_price, fulfillment_status, image_url_snapshot as image_url
      from shop.order_items where order_id = ${orderId}::uuid order by create_date asc
    `,
    sql<any[]>`
      select address_type, full_name, phone_number, country, city, state_region, address_line_1, address_line_2, postal_code, company
      from shop.order_addresses where order_id = ${orderId}::uuid
    `,
    sql<any[]>`
      select id::text as id, from_status, to_status, note, changed_by::text as changed_by, create_date::text as create_date
      from shop.order_status_history where order_id = ${orderId}::uuid order by create_date desc
    `,
    sql<any[]>`
      select id::text as id, shipment_number, tracking_number, carrier, status, shipped_at::text as shipped_at, delivered_at::text as delivered_at
      from shop.shipments where order_id = ${orderId}::uuid order by create_date desc
    `,
    sql<any[]>`
      select id::text as id, provider, provider_transaction_id, amount::float as amount, currency, status, type, create_date::text as create_date
      from shop.payment_transactions where order_id = ${orderId}::uuid order by create_date desc
    `,
  ]);

  return { ...order, items, addresses, history, shipments, payments };
}

export async function listInventoryRows() {
  await assertShopAdmin();
  return sql<any[]>`
    select
      i.id::text as id,
      common.get_translation_t(p.name_translations, 'en', 'en') as product_name,
      v.sku, w.name as warehouse_name,
      i.on_hand, i.reserved, (i.on_hand - i.reserved) as available, i.reorder_threshold
    from shop.inventory i
    join shop.products p on p.id = i.product_id
    left join shop.product_variants v on v.id = i.variant_id
    join shop.warehouses w on w.id = i.warehouse_id
    order by (i.on_hand - i.reserved) asc, product_name asc
    limit 300
  `;
}

export async function listAdminCategories() {
  await assertShopAdmin();
  return sql<any[]>`
    select id::text as id, common.get_translation_t(name_translations, 'en', 'en') as name, slug, parent_id::text as parent_id
    from shop.categories where deleted_at is null and is_active = true order by display_order asc, name asc
  `;
}

export async function listServiceDefinitionsForPicker(q?: string) {
  await assertShopAdmin();
  const like = q ? `%${q}%` : null;
  return sql<any[]>`
    select id::text as id, common.get_translation_t(name_translations, 'en', 'en') as name, is_active
    from category.service_definitions
    where (${like}::text is null or common.get_translation_t(name_translations, 'en', 'en') ilike ${like})
    order by is_active desc, name asc
    limit 100
  `;
}

export async function getAdminProductForEdit(productId: string) {
  await assertShopAdmin();
  const [p] = await sql<any[]>`
    select
      id::text as id, status, slug, base_price::float as base_price, base_currency,
      name_translations, short_description_translations, description_translations,
      primary_category_id::text as primary_category_id,
      is_featured, is_best_seller, is_new_arrival
    from shop.products where id = ${productId}::uuid and deleted_at is null limit 1
  `;
  if (!p) return null;
  const [categories, links, media, variants] = await Promise.all([
    sql<any[]>`select category_id::text as category_id, is_primary from shop.product_categories where product_id = ${productId}::uuid`,
    sql<any[]>`
      select psl.id::text as id, psl.service_definition_id::text as service_definition_id, psl.relation_type, psl.display_order,
        coalesce(common.get_translation_t(sd.name_translations, 'en', 'en'), '(missing service)') as service_name,
        (sd.id is null) as broken
      from shop.product_service_links psl
      left join category.service_definitions sd on sd.id = psl.service_definition_id
      where psl.product_id = ${productId}::uuid
      order by psl.display_order asc
    `,
    sql<any[]>`select url from shop.product_media where product_id = ${productId}::uuid and variant_id is null order by is_primary desc, display_order asc`,
    sql<any[]>`
      select v.id::text as id, v.sku, v.option_key, v.price::float as price, v.compare_at_price::float as compare_at_price,
        v.currency, v.is_active, v.allow_backorder, v.title_translations,
        common.get_translation_t(v.title_translations, 'en', 'en') as title,
        coalesce((select sum(greatest(i.on_hand - i.reserved, 0))::int from shop.inventory i where i.variant_id = v.id), 0) as available
      from shop.product_variants v
      where v.product_id = ${productId}::uuid and v.deleted_at is null
      order by v.price asc
    `,
  ]);
  return {
    ...p,
    categoryIds: categories.map((c) => c.category_id),
    serviceLinks: links,
    galleryUrls: media.map((m) => m.url),
    variants,
  };
}

// ======================================================================
// Brands (SHP-ADM-007)
// ======================================================================
export async function listBrandsAdmin() {
  await assertShopAdmin();
  return sql<any[]>`
    select id::text as id, slug, is_active, logo_url, website_url,
      name_translations, description_translations,
      common.get_translation_t(name_translations, 'en', 'en') as name
    from shop.brands where deleted_at is null order by name asc
  `;
}

// ======================================================================
// Categories (SHP-ADM-006)
// ======================================================================
export async function listCategoriesAdminFull() {
  await assertShopAdmin();
  return sql<any[]>`
    select
      c.id::text as id, c.slug, c.parent_id::text as parent_id, c.display_order, c.is_active,
      c.image_url, c.banner_url, c.icon, c.gradient,
      c.name_translations, c.description_translations,
      common.get_translation_t(c.name_translations, 'en', 'en') as name,
      coalesce(pc.n, 0)::int as product_count
    from shop.categories c
    left join (select category_id, count(*) n from shop.product_categories group by category_id) pc on pc.category_id = c.id
    where c.deleted_at is null
    order by c.display_order asc, name asc
  `;
}

export async function getCategoryForEdit(id: string) {
  await assertShopAdmin();
  const [c] = await sql<any[]>`
    select id::text as id, slug, parent_id::text as parent_id, display_order, is_active,
      image_url, banner_url, icon, gradient, name_translations, description_translations
    from shop.categories where id = ${id}::uuid and deleted_at is null limit 1
  `;
  if (!c) return null;
  const links = await sql<any[]>`
    select csl.id::text as id, csl.service_definition_id::text as service_definition_id, csl.relation_type,
      coalesce(common.get_translation_t(sd.name_translations, 'en', 'en'), '(missing service)') as service_name,
      (sd.id is null) as broken
    from shop.category_service_links csl
    left join category.service_definitions sd on sd.id = csl.service_definition_id
    where csl.shop_category_id = ${id}::uuid
    order by csl.display_order asc
  `;
  return { ...c, serviceLinks: links };
}

// ======================================================================
// Returns (SHP-V03-006/007/008)
// ======================================================================
export async function listReturnRequests(status = "requested") {
  await assertShopAdmin();
  return sql<any[]>`
    select rr.id::text as id, rr.status, rr.reason, rr.review_note as review_note,
      rr.requested_at::text as requested_at, rr.reviewed_at::text as reviewed_at,
      o.order_number, o.id::text as order_id,
      coalesce(jsonb_agg(jsonb_build_object(
        'name', common.get_translation_t(oi.product_name_snapshot, 'en', 'en'),
        'quantity', ri.quantity,
        'reason', ri.reason
      )) filter (where ri.id is not null), '[]'::jsonb) as items
    from shop.return_requests rr
    join shop.orders o on o.id = rr.order_id
    left join shop.return_items ri on ri.return_request_id = rr.id
    left join shop.order_items oi on oi.id = ri.order_item_id
    where (${status}::text = 'all' or rr.status::text = ${status})
    group by rr.id, o.order_number, o.id
    order by rr.requested_at desc
    limit 200
  `;
}

// ======================================================================
// Exception queues (SHP-V03-013, SHP-ADM-001)
// ======================================================================
export async function getExceptionQueues() {
  await assertShopAdmin();
  // Every sub-select is wrapped so one bad row or a not-yet-migrated column
  // degrades a single tile to 0 instead of throwing the whole dashboard.
  const [row] = await sql<any[]>`
    select
      coalesce((select count(*)::int from shop.orders where status = 'awaiting_payment' and placed_at < now() - interval '2 days'), 0) as stuck_payments,
      coalesce((select count(*)::int from shop.orders where status in ('paid','processing') and fulfillment_status = 'pending' and paid_at < now() - interval '1 day'), 0) as unfulfilled_paid,
      coalesce((select count(*)::int from shop.payment_transactions where status = 'failed' and create_date > now() - interval '7 days'), 0) as recent_failed_payments,
      coalesce((select count(*)::int from shop.return_requests where status = 'requested'), 0) as pending_returns,
      coalesce((select count(*)::int from shop.orders where coalesce(meta->>'refundPending', '') = 'true'), 0) as refund_pending,
      coalesce((select count(*)::int from shop.shipments where status in ('pending','ready','packed') and create_date < now() - interval '2 days'), 0) as stalled_shipments
  `;
  return row ?? {};
}

// ======================================================================
// Reviews + questions moderation (SHP-V02-017/018)
// ======================================================================
export async function listReviewsForModeration(status = "pending") {
  await assertShopAdmin();
  return sql<any[]>`
    select r.id::text as id, r.rating, r.title, r.body, r.status, r.is_verified_purchase,
      r.create_date::text as create_date,
      common.get_translation_t(p.name_translations, 'en', 'en') as product_name, p.slug as product_slug,
      concat_ws(' ', c.first_name, c.last_name) as customer_name
    from shop.product_reviews r
    join shop.products p on p.id = r.product_id
    left join customer.customers c on c.id = r.customer_id
    where (${status}::text = 'all' or r.status::text = ${status})
    order by r.create_date desc
    limit 200
  `;
}

export async function listQuestionsForModeration(status = "open") {
  await assertShopAdmin();
  return sql<any[]>`
    select q.id::text as id, q.question, q.answer, q.status, q.create_date::text as create_date,
      common.get_translation_t(p.name_translations, 'en', 'en') as product_name, p.slug as product_slug,
      concat_ws(' ', c.first_name, c.last_name) as customer_name
    from shop.product_questions q
    join shop.products p on p.id = q.product_id
    left join customer.customers c on c.id = q.customer_id
    where (${status}::text = 'all' or q.status::text = ${status})
    order by q.create_date desc
    limit 200
  `;
}

// ======================================================================
// Coupons (SHP-V02-004)
// ======================================================================
export async function listCouponsAdmin() {
  await assertShopAdmin();
  return sql<any[]>`
    select c.id::text as id, c.code, c.coupon_type, c.value::float as value, c.currency, c.is_active,
      c.scope::text as scope, c.min_subtotal::float as min_subtotal, c.max_discount_amount::float as max_discount_amount,
      c.usage_limit, c.usage_per_customer, c.stackable,
      c.starts_at::text as starts_at, c.expires_at::text as expires_at, c.title_translations,
      coalesce((select count(*)::int from shop.coupon_redemptions r where r.coupon_id = c.id), 0) as redemptions
    from shop.coupons c order by c.is_active desc, c.create_date desc
  `;
}

// ======================================================================
// Home merchandising (SHP-ADM-018)
// ======================================================================
export async function listHomeSectionsAdmin() {
  await assertShopAdmin();
  return sql<any[]>`
    select id::text as id, key, section_type, query_source, query_config, display_order, is_active,
      title_translations, subtitle_translations,
      common.get_translation_t(title_translations, 'en', 'en') as title,
      (select count(*)::int from shop.home_section_items i where i.section_id = s.id) as item_count
    from shop.home_sections s order by display_order asc
  `;
}

export async function getHomeSectionWithItems(id: string) {
  await assertShopAdmin();
  const [section] = await sql<any[]>`
    select id::text as id, key, section_type, query_source, query_config, display_order, is_active,
      title_translations, subtitle_translations
    from shop.home_sections where id = ${id}::uuid limit 1
  `;
  if (!section) return null;
  const items = await sql<any[]>`
    select i.id::text as id, i.product_id::text as product_id, i.category_id::text as category_id,
      i.image_url, i.link_url, i.display_order,
      common.get_translation_t(i.label_translations, 'en', 'en') as label,
      coalesce(common.get_translation_t(p.name_translations, 'en', 'en'), common.get_translation_t(c.name_translations, 'en', 'en')) as target_name
    from shop.home_section_items i
    left join shop.products p on p.id = i.product_id
    left join shop.categories c on c.id = i.category_id
    where i.section_id = ${id}::uuid
    order by i.display_order asc
  `;
  return { ...section, items };
}

// ======================================================================
// Product <-> service relation analytics (SHP-V02-019)
// ======================================================================
export async function getServiceRelationReport(days = 90) {
  await assertShopAdmin();
  const window = Math.min(Math.max(Math.trunc(days) || 90, 1), 365);
  const rows = await sql<any[]>`
    select
      e.campaign_key as service_definition_id,
      coalesce(common.get_translation_t(sd.name_translations, 'en', 'en'), '(unknown service)') as service_name,
      coalesce(sum(e.quantity) filter (where e.event_name = 'shop_related_service_product_impression'), 0)::int as impressions,
      count(*) filter (where e.event_name = 'shop_related_service_product_impression')::int as impression_events,
      count(*) filter (where e.event_name = 'shop_related_service_product_click')::int as clicks
    from shop.analytics_events e
    left join category.service_definitions sd on sd.id::text = e.campaign_key
    where e.event_name in ('shop_related_service_product_impression','shop_related_service_product_click')
      and e.campaign_key is not null
      and e.occurred_at > now() - (${window} || ' days')::interval
    group by e.campaign_key, service_name
    order by impressions desc, clicks desc
    limit 200
  `;
  return rows.map((r) => ({
    ...r,
    ctr: r.impressions > 0 ? r.clicks / r.impressions : null,
  }));
}

export async function getShopSettingsView() {
  await assertShopAdmin();
  const rows = await sql<{ key: string; value: string | null }[]>`
    select key, value ->> 'value' as value from finance.settings where key in ('shop_pricing_mode','shop_default_currency')
  `;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const currencies = await sql<any[]>`
    select code, name, symbol, is_display_enabled, is_payment_enabled
    from finance.currencies where is_active = true order by sort_order asc
  `;
  const countryDefaults = await sql<any[]>`
    select country_code, currency_code from finance.country_currency_defaults where is_active = true order by country_code
  `;
  return {
    pricingMode: (map["shop_pricing_mode"] as string) || "market_default_with_selector",
    defaultCurrency: (map["shop_default_currency"] as string) || "USD",
    currencies,
    countryDefaults,
  };
}
