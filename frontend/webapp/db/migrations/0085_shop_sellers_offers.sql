-- Marketplace foundation (phase 1): sellers, one offer per seller per sellable item,
-- and offer price history. Nothing reads these tables yet. The backfill gives every
-- current variant (or variant-less product) one offer from the default "L Sevin"
-- seller at its current price, so the storefront behaves exactly as before.
-- Safe to run more than once.

-- Sellers ----------------------------------------------------------------------
create table if not exists shop.sellers (
  id                       uuid primary key default uuid_generate_v4(),
  slug                     text not null unique,
  name_translations        jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  warranty_translations    jsonb not null default '{}'::jsonb,
  logo_url                 text,
  phone                    text,
  email                    text,
  -- Optional link to a site provider (category.service_providers.id); no FK so a
  -- provider can be removed without touching the shop.
  service_provider_id      uuid,
  rating                   numeric(3,2),
  is_default               boolean not null default false,
  is_active                boolean not null default true,
  create_date              timestamptz not null default now(),
  last_modified_date       timestamptz not null default now(),
  deleted_at               timestamptz
);
-- At most one default seller.
create unique index if not exists uq_shop_sellers_default on shop.sellers (is_default) where is_default;

-- Offers: what one seller asks for one sellable item -------------------------------
create table if not exists shop.offers (
  id                    uuid primary key default uuid_generate_v4(),
  product_id            uuid not null references shop.products(id) on delete cascade,
  variant_id            uuid references shop.product_variants(id) on delete cascade,
  seller_id             uuid not null references shop.sellers(id) on delete restrict,
  seller_sku            text,
  currency              varchar(15) not null,
  price                 numeric(18,2) not null check (price >= 0),
  compare_at_price      numeric(18,2) check (compare_at_price is null or compare_at_price >= 0),
  -- null = stock not tracked on the offer (the existing shop.inventory still applies).
  stock_quantity        integer check (stock_quantity is null or stock_quantity >= 0),
  allow_backorder       boolean not null default false,
  is_preorder           boolean not null default false,
  warranty_translations jsonb not null default '{}'::jsonb,
  handling_days         integer check (handling_days is null or handling_days >= 0),
  is_active             boolean not null default true,
  create_date           timestamptz not null default now(),
  last_modified_date    timestamptz not null default now(),
  deleted_at            timestamptz
);
-- One live offer per seller per sellable item (the variant, or the product when it has none).
create unique index if not exists uq_shop_offers_seller_item
  on shop.offers (seller_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where deleted_at is null;
create index if not exists ix_shop_offers_product_live on shop.offers (product_id, price) where deleted_at is null and is_active;
create index if not exists ix_shop_offers_variant on shop.offers (variant_id) where variant_id is not null;
create index if not exists ix_shop_offers_seller on shop.offers (seller_id);

-- Price history (for the price chart) --------------------------------------------
create table if not exists shop.offer_price_history (
  id               bigserial primary key,
  offer_id         uuid not null references shop.offers(id) on delete cascade,
  currency         varchar(15) not null,
  price            numeric(18,2) not null,
  compare_at_price numeric(18,2),
  recorded_at      timestamptz not null default now()
);
create index if not exists ix_shop_offer_price_history_offer on shop.offer_price_history (offer_id, recorded_at desc);

create or replace function shop.record_offer_price() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT'
     or new.price is distinct from old.price
     or new.compare_at_price is distinct from old.compare_at_price
     or new.currency is distinct from old.currency then
    insert into shop.offer_price_history (offer_id, currency, price, compare_at_price)
    values (new.id, new.currency, new.price, new.compare_at_price);
  end if;
  return new;
end $$;

drop trigger if exists trg_shop_offers_price_history on shop.offers;
create trigger trg_shop_offers_price_history
  after insert or update of price, compare_at_price, currency on shop.offers
  for each row execute function shop.record_offer_price();

-- Default seller ------------------------------------------------------------------
insert into shop.sellers (slug, name_translations, is_default)
values ('lsevin', '{"fa": "السوین", "en": "L Sevin", "ar": "السوين"}'::jsonb, true)
on conflict (slug) do nothing;

-- Backfill: one offer per current variant ----------------------------------------
insert into shop.offers (product_id, variant_id, seller_id, currency, price, compare_at_price, allow_backorder, is_preorder)
select v.product_id, v.id, s.id, v.currency, v.price, v.compare_at_price, v.allow_backorder, v.is_preorder
from shop.product_variants v
cross join (select id from shop.sellers where is_default) s
where v.deleted_at is null
on conflict do nothing;

-- ... and one per product that has no variants.
insert into shop.offers (product_id, variant_id, seller_id, currency, price, compare_at_price, allow_backorder, is_preorder)
select p.id, null, s.id, p.base_currency, p.base_price, p.compare_at_price, p.allow_backorder, p.is_preorder
from shop.products p
cross join (select id from shop.sellers where is_default) s
where p.deleted_at is null
  and not exists (select 1 from shop.product_variants v where v.product_id = p.id and v.deleted_at is null)
on conflict do nothing;
