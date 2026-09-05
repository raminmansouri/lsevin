-- ---------------------------------------------------------------------------
-- 0028_shop_perf_indexes.sql  (SHP-NFR-009)
--
-- Covering indexes for the shop's hot read paths. The base schema shipped
-- indexes for products(status/brand/featured/search), product_media(product),
-- reviews(product,status), variants(product), orders(customer,status) and
-- categories(parent) — but not for the per-row foreign keys the order,
-- fulfilment, cart, inventory and personalisation queries all filter on, which
-- were doing sequential scans.
--
-- Plain `create index if not exists` (runs inside the migration tx). These
-- tables are small; if a future dataset makes the build too slow, split this
-- into a `-- migrate:no-transaction` file with `create index concurrently`.
-- ---------------------------------------------------------------------------
set search_path = public;

-- Orders & their children -------------------------------------------------
create index if not exists ix_shop_orders_email_lower on shop.orders (lower(email));
create index if not exists ix_shop_orders_placed_at on shop.orders (placed_at desc);
create index if not exists ix_shop_order_items_order on shop.order_items (order_id);
create index if not exists ix_shop_order_items_product on shop.order_items (product_id);
create index if not exists ix_shop_order_addresses_order on shop.order_addresses (order_id);
create index if not exists ix_shop_order_status_history_order on shop.order_status_history (order_id);
create index if not exists ix_shop_shipments_order on shop.shipments (order_id);
create index if not exists ix_shop_shipment_items_order_item on shop.shipment_items (order_item_id);
create index if not exists ix_shop_payment_transactions_order on shop.payment_transactions (order_id);
create index if not exists ix_shop_refunds_order on shop.refunds (order_id);

-- Catalogue -------------------------------------------------------------------
create index if not exists ix_shop_inventory_product on shop.inventory (product_id);
create index if not exists ix_shop_inventory_variant on shop.inventory (variant_id) where variant_id is not null;
create index if not exists ix_shop_product_categories_category on shop.product_categories (category_id);
create index if not exists ix_shop_product_categories_product on shop.product_categories (product_id);
create index if not exists ix_shop_product_questions_product on shop.product_questions (product_id);
create index if not exists ix_shop_products_active on shop.products (status) where deleted_at is null;

-- Cart / personalisation ----------------------------------------------------
create index if not exists ix_shop_cart_items_cart on shop.cart_items (cart_id);
create index if not exists ix_shop_cart_items_cart_live on shop.cart_items (cart_id) where saved_for_later = false;
create index if not exists ix_shop_carts_customer on shop.carts (customer_id) where customer_id is not null;
create index if not exists ix_shop_carts_guest on shop.carts (guest_token) where guest_token is not null;
create index if not exists ix_shop_wishlists_customer on shop.wishlists (customer_id);
create index if not exists ix_shop_wishlist_items_wishlist on shop.wishlist_items (wishlist_id);
create index if not exists ix_shop_wishlist_items_product on shop.wishlist_items (product_id);
create index if not exists ix_shop_recently_viewed_customer on shop.recently_viewed_products (customer_id, viewed_at desc) where customer_id is not null;
create index if not exists ix_shop_recently_viewed_guest on shop.recently_viewed_products (guest_token, viewed_at desc) where guest_token is not null;
create index if not exists ix_shop_compare_list_items_list on shop.compare_list_items (compare_list_id);

-- Coupons & abandoned carts ----------------------------------------------
create index if not exists ix_shop_coupon_redemptions_coupon on shop.coupon_redemptions (coupon_id);
create index if not exists ix_shop_abandoned_carts_cart on shop.abandoned_carts (cart_id);
