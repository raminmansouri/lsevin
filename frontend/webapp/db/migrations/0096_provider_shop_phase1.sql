-- Provider shop, phase 1 (docs/provider-shop/phase1-spec.md).
-- A clinic (service provider) requests a shop from the provider portal; an admin approves it with
-- the categories it may sell in; the clinic then lists catalog products (price + stock) that go
-- live only after an admin approves each listing.
--
-- 1) shop.offers gets an admin review state. Every existing offer is 'approved' (the default),
--    so the storefront is unchanged; only offers created from the provider portal start 'pending'.
-- 2) shop.sellers gets a shop state (existing sellers stay 'active'), the fulfilment mode, and a
--    unique link to a service provider.
-- 3) shop.seller_categories: the categories an approved provider seller may list in.
-- 4) Provider sellers must track stock on their offers.
-- 5) shop.api_audit_log records who acted and through which channel.
-- 6) shop.v_product_price_summary only counts approved offers of active shops.
-- Safe to run more than once.

-- 1) Offer review state ---------------------------------------------------------------------
alter table shop.offers add column if not exists admin_status text not null default 'approved';
alter table shop.offers add column if not exists admin_status_reason text;
alter table shop.offers add column if not exists admin_reviewed_at timestamptz;
alter table shop.offers add column if not exists admin_reviewed_by_user_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_offers_admin_status') then
    alter table shop.offers add constraint ck_shop_offers_admin_status
      check (admin_status in ('pending', 'approved', 'rejected', 'blocked'));
  end if;
end $$;
-- The admin queue reads the non-approved offers.
create index if not exists ix_shop_offers_admin_status on shop.offers (admin_status, last_modified_date desc)
  where deleted_at is null and admin_status <> 'approved';

-- 2) Seller shop state ----------------------------------------------------------------------
-- Stop (instead of guessing which one wins) if two live sellers already point at one provider.
do $$
declare dup text;
begin
  select string_agg(service_provider_id::text || ' (' || n || ' sellers)', ', ') into dup
  from (select service_provider_id, count(*) as n from shop.sellers
        where service_provider_id is not null and deleted_at is null
        group by service_provider_id having count(*) > 1) d;
  if dup is not null then
    raise exception 'shop.sellers has more than one live seller for service provider(s): %. Resolve them before applying this migration.', dup;
  end if;
end $$;
create unique index if not exists uq_shop_sellers_service_provider on shop.sellers (service_provider_id)
  where service_provider_id is not null and deleted_at is null;

alter table shop.sellers add column if not exists shop_status text not null default 'active';
alter table shop.sellers add column if not exists shop_status_reason text;
alter table shop.sellers add column if not exists shop_requested_at timestamptz;
alter table shop.sellers add column if not exists shop_requested_by_user_id uuid;
alter table shop.sellers add column if not exists shop_reviewed_at timestamptz;
alter table shop.sellers add column if not exists shop_reviewed_by_user_id uuid;
alter table shop.sellers add column if not exists fulfillment_mode text not null default 'clinic_pickup';
-- Shop activation details the admin reviews (wanted categories, licence file).
alter table shop.sellers add column if not exists shop_request jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_sellers_shop_status') then
    alter table shop.sellers add constraint ck_shop_sellers_shop_status
      check (shop_status in ('requested', 'active', 'suspended'));
  end if;
end $$;

-- 3) Categories a seller may list in -------------------------------------------------------
create table if not exists shop.seller_categories (
  seller_id          uuid not null references shop.sellers(id) on delete cascade,
  category_id        uuid not null references shop.categories(id) on delete cascade,
  created_at         timestamptz not null default now(),
  created_by_user_id uuid,
  primary key (seller_id, category_id)
);
create index if not exists ix_shop_seller_categories_category on shop.seller_categories (category_id);

-- "Allowed" = the product has at least one category (shop.product_categories, or its primary
-- category) that is an allowed category or a descendant of one. Approving a parent category
-- therefore also allows its child categories.
create or replace function shop.seller_may_list_product(p_seller_id uuid, p_product_id uuid) returns boolean
language sql stable as $$
  with recursive allowed as (
    select c.id from shop.seller_categories sc
    join shop.categories c on c.id = sc.category_id and c.deleted_at is null
    where sc.seller_id = p_seller_id
    union
    select c.id from shop.categories c join allowed a on c.parent_id = a.id
    where c.deleted_at is null
  )
  select exists (
    select 1 from (
      select pc.category_id from shop.product_categories pc where pc.product_id = p_product_id
      union
      select p.primary_category_id from shop.products p where p.id = p_product_id and p.primary_category_id is not null
    ) pcat
    join allowed a on a.id = pcat.category_id
  )
$$;

-- 4) Stock is required on provider sellers' offers ----------------------------------------
-- Enforced for sellers linked to a service provider (the portal's sellers). Sellers that use the
-- Bearer-token Shop API may still leave stock untracked (that API documents stockQuantity as
-- optional), and the default seller keeps using shop.inventory.
create or replace function shop.offers_require_provider_stock() returns trigger
language plpgsql as $$
begin
  if new.stock_quantity is null and new.deleted_at is null and exists (
    select 1 from shop.sellers s
    where s.id = new.seller_id and s.service_provider_id is not null and not s.is_default
  ) then
    raise exception 'Stock quantity is required for provider sellers.'
      using errcode = '23514', constraint = 'ck_shop_offers_provider_stock';
  end if;
  return new;
end $$;
drop trigger if exists trg_shop_offers_provider_stock on shop.offers;
create trigger trg_shop_offers_provider_stock
  before insert or update on shop.offers
  for each row execute function shop.offers_require_provider_stock();

-- 5) Audit actor and channel ----------------------------------------------------------------
alter table shop.api_audit_log add column if not exists actor_user_id uuid;
alter table shop.api_audit_log add column if not exists source text not null default 'api_token';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_api_audit_log_source') then
    alter table shop.api_audit_log add constraint ck_shop_api_audit_log_source check (source in ('api_token', 'portal'));
  end if;
end $$;
-- Portal decisions also carry a reason.
alter table shop.api_audit_log add column if not exists note text;

-- 6) Storefront price summary: only approved offers of active shops are live ---------------
-- Copied from 0086_shop_offer_pricing.sql; only the live_offers filter changed.
create or replace view shop.v_product_price_summary as
with product_inventory as (
  select i.product_id, coalesce(sum(i.on_hand - i.reserved), 0)::int as available_qty
  from shop.inventory i where i.variant_id is null group by i.product_id
), variant_inventory as (
  select i.variant_id, coalesce(sum(i.on_hand - i.reserved), 0)::int as available_qty
  from shop.inventory i where i.variant_id is not null group by i.variant_id
), live_offers as (
  -- A live offer: not removed, active, approved by an admin, from an active seller whose shop is
  -- active, for an active item.
  -- Stock: the offer's own stock when set, else the shop inventory as before.
  select o.id, o.product_id, o.seller_id, o.price, o.handling_days,
    (case
       when o.stock_quantity is not null then o.stock_quantity > 0
       when o.variant_id is not null then coalesce(vi.available_qty, 0) > 0
       else coalesce(pi.available_qty, 0) > 0
     end) or o.allow_backorder or coalesce(pv.allow_backorder, p.allow_backorder) as in_stock
  from shop.offers o
  join shop.sellers s on s.id = o.seller_id and s.deleted_at is null and s.is_active and s.shop_status = 'active'
  join shop.products p on p.id = o.product_id
  left join shop.product_variants pv on pv.id = o.variant_id
  left join variant_inventory vi on vi.variant_id = o.variant_id
  left join product_inventory pi on pi.product_id = o.product_id
  where o.deleted_at is null and o.is_active and o.admin_status = 'approved'
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
