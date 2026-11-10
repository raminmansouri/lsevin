-- Marketplace phase 3: the storefront prices products from their live offers.
-- 1) An offer's currency always follows its item, so offers of one product compare directly.
-- 2) The default seller's offers follow the product/variant price edited in the existing admin
--    forms, so a single-seller product prices the same on its card and in the cart.
-- 3) shop.v_product_price_summary (read by listings, search and the product page) is rebuilt
--    on live offers, with the same columns plus seller_count and best_offer_id.
-- Safe to run more than once.

create or replace function shop.default_seller_id() returns uuid
language sql stable as $$ select id from shop.sellers where is_default and deleted_at is null limit 1 $$;

-- 1) Offer currency follows its variant, else its product -------------------------------
create or replace function shop.offers_lock_currency() returns trigger
language plpgsql as $$
begin
  new.currency := coalesce(
    (select v.currency from shop.product_variants v where v.id = new.variant_id),
    (select p.base_currency from shop.products p where p.id = new.product_id),
    new.currency);
  return new;
end $$;
drop trigger if exists trg_shop_offers_lock_currency on shop.offers;
create trigger trg_shop_offers_lock_currency
  before insert or update on shop.offers
  for each row execute function shop.offers_lock_currency();

-- 2a) Default seller follows variant edits ------------------------------------------------
create or replace function shop.sync_default_offer_from_variant() returns trigger
language plpgsql as $$
declare
  seller uuid := shop.default_seller_id();
begin
  if seller is null then return new; end if;

  if new.deleted_at is not null then
    update shop.offers set deleted_at = now(), is_active = false, last_modified_date = now()
     where variant_id = new.id and seller_id = seller and deleted_at is null;
    return new;
  end if;

  update shop.offers
     set price = new.price, compare_at_price = new.compare_at_price,
         allow_backorder = new.allow_backorder, is_preorder = new.is_preorder, last_modified_date = now()
   where variant_id = new.id and seller_id = seller and deleted_at is null;

  -- Create it only if the default seller never had one (an offer removed on purpose stays removed).
  if not exists (select 1 from shop.offers where variant_id = new.id and seller_id = seller) then
    insert into shop.offers (product_id, variant_id, seller_id, currency, price, compare_at_price, allow_backorder, is_preorder)
    values (new.product_id, new.id, seller, new.currency, new.price, new.compare_at_price, new.allow_backorder, new.is_preorder)
    on conflict do nothing;
  end if;

  -- A product that gains its first variant sells the variants, not itself.
  if tg_op = 'INSERT' then
    update shop.offers set deleted_at = now(), is_active = false, last_modified_date = now()
     where product_id = new.product_id and variant_id is null and seller_id = seller and deleted_at is null;
  end if;
  return new;
end $$;
drop trigger if exists trg_shop_variants_default_offer on shop.product_variants;
create trigger trg_shop_variants_default_offer
  after insert or update of price, compare_at_price, currency, allow_backorder, is_preorder, deleted_at on shop.product_variants
  for each row execute function shop.sync_default_offer_from_variant();

-- 2b) Default seller follows product edits (products without variants) -------------------
create or replace function shop.sync_default_offer_from_product() returns trigger
language plpgsql as $$
declare
  seller uuid := shop.default_seller_id();
begin
  if seller is null or new.deleted_at is not null then return new; end if;
  if exists (select 1 from shop.product_variants v where v.product_id = new.id and v.deleted_at is null) then
    return new;
  end if;

  update shop.offers
     set price = new.base_price, compare_at_price = new.compare_at_price,
         allow_backorder = new.allow_backorder, is_preorder = new.is_preorder, last_modified_date = now()
   where product_id = new.id and variant_id is null and seller_id = seller and deleted_at is null;

  if not exists (select 1 from shop.offers where product_id = new.id and variant_id is null and seller_id = seller) then
    insert into shop.offers (product_id, variant_id, seller_id, currency, price, compare_at_price, allow_backorder, is_preorder)
    values (new.id, null, seller, new.base_currency, new.base_price, new.compare_at_price, new.allow_backorder, new.is_preorder)
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_shop_products_default_offer on shop.products;
create trigger trg_shop_products_default_offer
  after insert or update of base_price, compare_at_price, base_currency, allow_backorder, is_preorder on shop.products
  for each row execute function shop.sync_default_offer_from_product();

-- 3) Storefront price summary from live offers --------------------------------------------
create or replace view shop.v_product_price_summary as
with product_inventory as (
  select i.product_id, coalesce(sum(i.on_hand - i.reserved), 0)::int as available_qty
  from shop.inventory i where i.variant_id is null group by i.product_id
), variant_inventory as (
  select i.variant_id, coalesce(sum(i.on_hand - i.reserved), 0)::int as available_qty
  from shop.inventory i where i.variant_id is not null group by i.variant_id
), live_offers as (
  -- A live offer: not removed, active, from an active seller, for an active item.
  -- Stock: the offer's own stock when set, else the shop inventory as before.
  select o.id, o.product_id, o.seller_id, o.price, o.handling_days,
    (case
       when o.stock_quantity is not null then o.stock_quantity > 0
       when o.variant_id is not null then coalesce(vi.available_qty, 0) > 0
       else coalesce(pi.available_qty, 0) > 0
     end) or o.allow_backorder or coalesce(pv.allow_backorder, p.allow_backorder) as in_stock
  from shop.offers o
  join shop.sellers s on s.id = o.seller_id and s.deleted_at is null and s.is_active
  join shop.products p on p.id = o.product_id
  left join shop.product_variants pv on pv.id = o.variant_id
  left join variant_inventory vi on vi.variant_id = o.variant_id
  left join product_inventory pi on pi.product_id = o.product_id
  where o.deleted_at is null and o.is_active
    and (o.variant_id is null or (pv.deleted_at is null and pv.is_active))
), offer_summary as (
  -- Prices shown: the in-stock offers when there are any, otherwise all of them.
  select product_id,
    coalesce(min(price) filter (where in_stock), min(price)) as min_price,
    coalesce(max(price) filter (where in_stock), max(price)) as max_price,
    bool_or(in_stock) as has_stock,
    count(distinct seller_id)::int as seller_count
  from live_offers group by product_id
), best_offer as (
  -- The "buy box" winner: in stock first, then cheapest, then fastest to ship.
  select distinct on (product_id) product_id, id as best_offer_id
  from live_offers
  order by product_id, in_stock desc, price asc, handling_days asc nulls last, id
)
select p.id as product_id,
  coalesce(os.min_price, p.base_price) as min_price,
  coalesce(os.max_price, p.base_price) as max_price,
  coalesce(os.has_stock, coalesce(pi.available_qty, 0) > 0 or p.allow_backorder) as has_stock,
  coalesce(os.seller_count, 0) as seller_count,
  bo.best_offer_id
from shop.products p
left join offer_summary os on os.product_id = p.id
left join best_offer bo on bo.product_id = p.id
left join product_inventory pi on pi.product_id = p.id;
