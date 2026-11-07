-- Marketplace phase 5 (data): cart lines and order lines point at the offer they buy from.
-- Existing cart lines are tied to the default seller's offer for the same item, so their
-- price doesn't change; past order lines are attributed to the default seller (the shop
-- had a single seller until now). Nothing reads these columns until the cart/checkout
-- code is switched over. Safe to run more than once.

alter table shop.cart_items
  add column if not exists offer_id uuid references shop.offers(id) on delete set null;
create index if not exists ix_shop_cart_items_offer on shop.cart_items (offer_id) where offer_id is not null;

alter table shop.order_items
  add column if not exists offer_id uuid references shop.offers(id) on delete set null,
  add column if not exists seller_id uuid references shop.sellers(id) on delete set null,
  add column if not exists seller_name_snapshot jsonb not null default '{}'::jsonb;
create index if not exists ix_shop_order_items_seller on shop.order_items (seller_id) where seller_id is not null;

-- Existing cart lines: the default seller's offer for the same item.
update shop.cart_items ci
   set offer_id = o.id
  from shop.offers o
 where ci.offer_id is null
   and o.product_id = ci.product_id
   and o.variant_id is not distinct from ci.variant_id
   and o.seller_id = shop.default_seller_id()
   and o.deleted_at is null;

-- Past order lines: sold by the default seller.
update shop.order_items
   set seller_id = shop.default_seller_id(),
       seller_name_snapshot = coalesce((select name_translations from shop.sellers where is_default limit 1), '{}'::jsonb)
 where seller_id is null;
