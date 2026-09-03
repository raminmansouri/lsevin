-- ---------------------------------------------------------------------------
-- 0033_perf_indexes_growth_tables.sql  (perf — append-heavy / fan-out tables)
--
-- Follows 0028 (shop) and 0031 (category). Those covered the per-row foreign
-- keys the storefront filters on. This adds the indexes for the tables that
-- *grow without bound* (search history, analytics events) and for the
-- order-lifecycle child tables (returns, invoice lines, redemptions,
-- inventory movements) that currently carry only their primary key, so a
-- lookup by their parent id is a sequential scan.
--
-- Verified against the live schema first — every column referenced below
-- exists and is not already indexed for the access pattern shown.
--
-- Purely additive: `create index if not exists`, no data change, runs inside
-- the migration tx. These tables are small today; if `search.user_search_history`
-- or `shop.analytics_events` grows large enough that a blocking build is a
-- problem, move those two lines to a `-- migrate:no-transaction` file with
-- `create index concurrently`.
-- ---------------------------------------------------------------------------
set search_path = public;

-- Search history — the "trending / popular in the last 7 / 14 days" queries
-- (get-popular-searches) scan by `created_at` alone; the existing indexes all
-- lead with `user_id` or `normalized_term`.
create index if not exists ix_user_search_history_created_at
  on search.user_search_history (created_at desc);

-- Analytics events — the service ↔ product relation report groups by
-- `campaign_key` over a rolling window; the only campaign-aware index is the
-- idempotency one. This table grows on every storefront interaction.
create index if not exists ix_shop_analytics_events_campaign
  on shop.analytics_events (campaign_key, event_name, occurred_at desc)
  where campaign_key is not null;

-- Returns — customer order detail and the admin returns list both start from
-- `return_requests.order_id` and fan out to `return_items` by request / by the
-- order item; none of those columns were indexed.
create index if not exists ix_shop_return_requests_order
  on shop.return_requests (order_id);
create index if not exists ix_shop_return_requests_customer
  on shop.return_requests (customer_id);
create index if not exists ix_shop_return_items_request
  on shop.return_items (return_request_id);
create index if not exists ix_shop_return_items_order_item
  on shop.return_items (order_item_id);

-- Invoice lines — every proforma / invoice render (`getOrderInvoices`, the PDF)
-- reads `where invoice_id = $1`; the table only had its primary key.
create index if not exists ix_payment_billing_invoice_lines_invoice
  on payment_billing.invoice_lines (invoice_id);

-- Coupon redemptions — checkout's per-customer usage guard is
-- `where coupon_id = $1 and customer_id = $2`; only `(coupon_id)` existed.
-- The `(order_id)` lookup backs the order detail view.
create index if not exists ix_shop_coupon_redemptions_coupon_customer
  on shop.coupon_redemptions (coupon_id, customer_id);
create index if not exists ix_shop_coupon_redemptions_order
  on shop.coupon_redemptions (order_id);

-- Inventory movements — the admin stock-audit trail reads
-- `where inventory_id = $1`; primary key only.
create index if not exists ix_shop_inventory_movements_inventory
  on shop.inventory_movements (inventory_id);

-- Provider services — the popular-categories join, the service / specialist
-- pages and the home rails all join on `service_definition_id` and immediately
-- filter `is_active = true`.
create index if not exists ix_provider_services_service_definition_active
  on category.provider_services (service_definition_id)
  where is_active = true;

-- Refresh planner statistics for the tables that just gained indexes so the
-- planner considers them straight away (relevant right after a fresh deploy /
-- bulk import, before autovacuum's next ANALYZE pass).
analyze search.user_search_history;
analyze shop.analytics_events;
analyze shop.return_requests;
analyze shop.return_items;
analyze payment_billing.invoice_lines;
analyze shop.coupon_redemptions;
analyze shop.inventory_movements;
analyze category.provider_services;
