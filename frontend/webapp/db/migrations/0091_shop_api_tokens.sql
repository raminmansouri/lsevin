-- Shop API for client websites (sellers): API tokens, seller-owned products, review of API
-- product content, and an audit log. Safe to run more than once.
--
-- Model: a token belongs to one shop seller. Through the API the seller creates products it
-- owns (shop.products.owner_seller_id) and manages its own offers (price/stock). New products
-- and content edits of approved products wait for an admin; price and stock apply at once.

-- Products a seller owns ---------------------------------------------------------------------
alter table shop.products
  add column if not exists owner_seller_id uuid references shop.sellers(id) on delete set null,
  -- Review of seller (API) content: null = not an API product (admin-managed as before).
  add column if not exists api_review_status text
    check (api_review_status is null or api_review_status in ('pending', 'approved', 'rejected')),
  add column if not exists api_review_note text,
  add column if not exists api_reviewed_at timestamptz;
create index if not exists ix_shop_products_owner_seller
  on shop.products (owner_seller_id, create_date desc) where owner_seller_id is not null;
create index if not exists ix_shop_products_api_review_pending
  on shop.products (create_date) where api_review_status = 'pending' and deleted_at is null;

-- The default seller (L Sevin) must not get an automatic offer on a product another seller
-- owns: 0086's sync triggers created one for every new product, which would put L Sevin's
-- name and price on a client's product.
create or replace function shop.sync_default_offer_from_product() returns trigger
language plpgsql as $$
declare
  seller uuid := shop.default_seller_id();
begin
  if seller is null or new.deleted_at is not null then return new; end if;
  if new.owner_seller_id is not null and new.owner_seller_id <> seller then return new; end if;
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

create or replace function shop.sync_default_offer_from_variant() returns trigger
language plpgsql as $$
declare
  seller uuid := shop.default_seller_id();
  owner uuid;
begin
  if seller is null then return new; end if;
  select p.owner_seller_id into owner from shop.products p where p.id = new.product_id;
  if owner is not null and owner <> seller then return new; end if;

  if new.deleted_at is not null then
    update shop.offers set deleted_at = now(), is_active = false, last_modified_date = now()
     where variant_id = new.id and seller_id = seller and deleted_at is null;
    return new;
  end if;

  update shop.offers
     set price = new.price, compare_at_price = new.compare_at_price,
         allow_backorder = new.allow_backorder, is_preorder = new.is_preorder, last_modified_date = now()
   where variant_id = new.id and seller_id = seller and deleted_at is null;

  if not exists (select 1 from shop.offers where variant_id = new.id and seller_id = seller) then
    insert into shop.offers (product_id, variant_id, seller_id, currency, price, compare_at_price, allow_backorder, is_preorder)
    values (new.product_id, new.id, seller, new.currency, new.price, new.compare_at_price, new.allow_backorder, new.is_preorder)
    on conflict do nothing;
  end if;

  if tg_op = 'INSERT' then
    update shop.offers set deleted_at = now(), is_active = false, last_modified_date = now()
     where product_id = new.product_id and variant_id is null and seller_id = seller and deleted_at is null;
  end if;
  return new;
end $$;

-- API tokens ----------------------------------------------------------------------------------
-- Only a SHA-256 hash of the token is stored; the token itself is shown once, at creation.
create table if not exists shop.api_tokens (
  id                  uuid primary key default uuid_generate_v4(),
  seller_id           uuid not null references shop.sellers(id) on delete cascade,
  name                text not null check (length(btrim(name)) between 1 and 120),
  token_prefix        text not null,
  token_hash          text not null unique,
  scopes              text[] not null default '{}',
  expires_at          timestamptz,
  last_used_at        timestamptz,
  last_used_ip        text,
  revoked_at          timestamptz,
  created_by_user_id  uuid,
  revoked_by_user_id  uuid,
  create_date         timestamptz not null default now()
);
create index if not exists ix_shop_api_tokens_seller on shop.api_tokens (seller_id, create_date desc);

-- Content edits of approved seller products, waiting for review --------------------------------
-- At most one pending request per product: a new edit merges into it.
create table if not exists shop.product_change_requests (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null references shop.products(id) on delete cascade,
  seller_id           uuid not null references shop.sellers(id) on delete cascade,
  token_id            uuid references shop.api_tokens(id) on delete set null,
  changes             jsonb not null default '{}'::jsonb,
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note         text,
  reviewed_by_user_id uuid,
  reviewed_at         timestamptz,
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now()
);
create unique index if not exists uq_shop_product_change_requests_pending
  on shop.product_change_requests (product_id) where status = 'pending';
create index if not exists ix_shop_product_change_requests_status
  on shop.product_change_requests (status, create_date);

-- Audit of API writes -------------------------------------------------------------------------
create table if not exists shop.api_audit_log (
  id           bigserial primary key,
  token_id     uuid references shop.api_tokens(id) on delete set null,
  seller_id    uuid,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  ip           text,
  create_date  timestamptz not null default now()
);
create index if not exists ix_shop_api_audit_log_seller on shop.api_audit_log (seller_id, create_date desc);
