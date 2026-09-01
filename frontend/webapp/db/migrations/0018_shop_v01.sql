-- ---------------------------------------------------------------------------
-- 0018 — Shop V0.1 schema deltas.
--
-- The `shop` schema already exists (created by hand on the server; see
-- auto_backups/schema_backup.sql). This migration adds ONLY the gaps that
-- V0.1 of docs/LSEVIN_SHOP_REQUIREMENTS_FEATURES.md calls for and that are
-- absent from that baseline:
--
--   §3.2 SHP-DB-001  product <-> service-definition many-to-many
--   §3.2 SHP-DB-002  shop-category <-> service-definition many-to-many
--   §3.2 SHP-DB-003  configurable home/merchandising sections
--   §3.2 SHP-DB-005  explicit order review/acceptance state
--   §3.2 SHP-DB-007  source/display/payment FX snapshots on cart + order lines
--   §3.2 SHP-DB-008  production query indexes
--   §7.4 SHP-CHK-007 checkout idempotency ledger
--
-- Forward-safe: every statement is `if not exists` / additive. It drops and
-- recreates nothing, so existing Shop data and historical orders are untouched
-- (SHP-NFR-013). Rollback = `0018_shop_v01_down.sql` (kept beside this file).
--
-- Note on indexes: created non-concurrently because this migration runs in one
-- transaction and the shop tables are small at V0.1. For a large production
-- cut-over, split the CREATE INDEX statements into a `-- migrate:no-transaction`
-- follow-up using CREATE INDEX CONCURRENTLY.
-- ---------------------------------------------------------------------------
begin;

-- ======================================================================
-- SHP-DB-001 / SHP-DB-002 — service-definition relationship tables
-- Shop owns these links. External modules read them through Shop contracts,
-- never by querying these tables directly (§3.3 modularity rule). The service
-- reference is a soft, application-validated UUID — no cross-schema FK.
-- ======================================================================
create table if not exists shop.product_service_links (
  id                    uuid primary key default public.uuid_generate_v4(),
  product_id            uuid not null references shop.products(id) on delete cascade,
  service_definition_id uuid not null,
  relation_type         text not null default 'general'
                          check (relation_type in ('general','recommended_before','recommended_after','compatible','required','optional_addon')),
  display_order         integer not null default 0,
  is_active             boolean not null default true,
  metadata              jsonb not null default '{}'::jsonb,
  create_date           timestamptz not null default now(),
  last_modified_date    timestamptz not null default now(),
  constraint uq_shop_product_service_links unique (product_id, service_definition_id, relation_type)
);
create index if not exists ix_shop_product_service_links_service
  on shop.product_service_links (service_definition_id) where is_active;
create index if not exists ix_shop_product_service_links_product
  on shop.product_service_links (product_id) where is_active;

create table if not exists shop.category_service_links (
  id                    uuid primary key default public.uuid_generate_v4(),
  shop_category_id      uuid not null references shop.categories(id) on delete cascade,
  service_definition_id uuid not null,
  relation_type         text not null default 'general'
                          check (relation_type in ('general','recommended_before','recommended_after','compatible','required','optional_addon')),
  display_order         integer not null default 0,
  is_active             boolean not null default true,
  metadata              jsonb not null default '{}'::jsonb,
  create_date           timestamptz not null default now(),
  last_modified_date    timestamptz not null default now(),
  constraint uq_shop_category_service_links unique (shop_category_id, service_definition_id, relation_type)
);
create index if not exists ix_shop_category_service_links_service
  on shop.category_service_links (service_definition_id) where is_active;

-- ======================================================================
-- SHP-DB-003 — data-driven Shop home / merchandising sections
-- ======================================================================
create table if not exists shop.home_sections (
  id                  uuid primary key default public.uuid_generate_v4(),
  key                 text not null unique,
  section_type        text not null default 'product_rail'
                        check (section_type in ('shortcut_rail','promo_cards','product_rail','category_rail','service_related_rail')),
  title_translations  jsonb not null default '{}'::jsonb,
  subtitle_translations jsonb not null default '{}'::jsonb,
  -- how a product_rail fills itself when it has no explicit items
  query_source        text not null default 'manual'
                        check (query_source in ('manual','featured','best_seller','new_arrival','discounted','category','service_related')),
  query_config        jsonb not null default '{}'::jsonb,
  display_order        integer not null default 0,
  is_active           boolean not null default true,
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now()
);

create table if not exists shop.home_section_items (
  id                  uuid primary key default public.uuid_generate_v4(),
  section_id          uuid not null references shop.home_sections(id) on delete cascade,
  -- exactly one of these is set depending on the parent section_type
  product_id          uuid references shop.products(id) on delete cascade,
  category_id         uuid references shop.categories(id) on delete cascade,
  label_translations  jsonb not null default '{}'::jsonb,
  image_url           text,
  link_url            text,
  badge_translations  jsonb not null default '{}'::jsonb,
  display_order       integer not null default 0,
  is_active           boolean not null default true,
  create_date         timestamptz not null default now()
);
create index if not exists ix_shop_home_section_items_section
  on shop.home_section_items (section_id, display_order) where is_active;

-- ======================================================================
-- SHP-DB-005 — explicit order review / acceptance state, tracked separately
-- from payment_status and fulfillment_status (SHP-ORD-005).
-- ======================================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'order_review_status' and typnamespace = 'shop'::regnamespace) then
    create type shop.order_review_status as enum ('not_required','pending','accepted','rejected');
  end if;
end $$;

alter table shop.orders
  add column if not exists review_status        shop.order_review_status not null default 'not_required',
  add column if not exists review_note          text,
  add column if not exists reviewed_by          uuid,
  add column if not exists reviewed_at          timestamptz,
  -- SHP-DB-007 / SHP-CHK-016 — commercial-fact snapshot at placement
  add column if not exists source_currency      varchar(15),
  add column if not exists display_currency     varchar(15),
  add column if not exists payment_currency     varchar(15),
  add column if not exists payment_total        numeric(18,2),
  add column if not exists fx_quote_id          uuid,
  add column if not exists fx_applied_rate      numeric(24,12),
  add column if not exists fx_snapshot          jsonb not null default '{}'::jsonb,
  -- SHP-CHK-007 — idempotency key of the checkout intent that created the order
  add column if not exists idempotency_key      text,
  add column if not exists source_surface       text;

create unique index if not exists uq_shop_orders_idempotency_key
  on shop.orders (idempotency_key) where idempotency_key is not null;

-- order line FX snapshot (SHP-DB-007 / SHP-CHK-016)
alter table shop.order_items
  add column if not exists source_currency        varchar(15),
  add column if not exists source_unit_price      numeric(18,2),
  add column if not exists display_currency       varchar(15),
  add column if not exists fx_applied_rate        numeric(24,12);

-- cart line resolved-display snapshot (informational only; checkout re-quotes)
alter table shop.cart_items
  add column if not exists source_currency        varchar(15),
  add column if not exists source_unit_price      numeric(18,2),
  add column if not exists display_currency       varchar(15);

-- ======================================================================
-- SHP-CHK-007 — checkout idempotency ledger
-- ======================================================================
create table if not exists shop.checkout_intents (
  id                  uuid primary key default public.uuid_generate_v4(),
  idempotency_key     text not null,
  -- scope so one caller's key can never return another's order (SHP-CHK-007)
  scope_kind          text not null check (scope_kind in ('customer','guest')),
  scope_id            text not null,
  cart_id             uuid,
  order_id            uuid references shop.orders(id) on delete set null,
  status              text not null default 'started' check (status in ('started','completed','failed')),
  request_hash        text,
  response_snapshot   jsonb not null default '{}'::jsonb,
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now(),
  constraint uq_shop_checkout_intents_key unique (scope_kind, scope_id, idempotency_key)
);

-- ======================================================================
-- SHP-DB-008 — production query-pattern indexes
-- ======================================================================
create index if not exists ix_shop_products_published_feed
  on shop.products (published_at desc nulls last, create_date desc)
  where deleted_at is null and status = 'active';
create index if not exists ix_shop_products_status
  on shop.products (status) where deleted_at is null;
create index if not exists ix_shop_products_primary_category
  on shop.products (primary_category_id) where deleted_at is null and status = 'active';
create index if not exists ix_shop_products_featured
  on shop.products (is_featured) where deleted_at is null and status = 'active' and is_featured;
create index if not exists ix_shop_products_best_seller
  on shop.products (is_best_seller) where deleted_at is null and status = 'active' and is_best_seller;
create index if not exists ix_shop_products_new_arrival
  on shop.products (is_new_arrival) where deleted_at is null and status = 'active' and is_new_arrival;
create index if not exists ix_shop_products_search_vector
  on shop.products using gin (search_vector);
create index if not exists ix_shop_products_slug
  on shop.products (slug) where deleted_at is null;

create index if not exists ix_shop_product_categories_category
  on shop.product_categories (category_id);
create index if not exists ix_shop_product_media_product
  on shop.product_media (product_id, is_primary desc, display_order);
create index if not exists ix_shop_product_variants_product
  on shop.product_variants (product_id) where deleted_at is null and is_active;

create index if not exists ix_shop_inventory_product
  on shop.inventory (product_id);
create index if not exists ix_shop_inventory_variant
  on shop.inventory (variant_id) where variant_id is not null;

create index if not exists ix_shop_carts_customer_active
  on shop.carts (customer_id) where status = 'active' and customer_id is not null;
create index if not exists ix_shop_carts_guest_active
  on shop.carts (guest_token) where status = 'active' and guest_token is not null;
create index if not exists ix_shop_cart_items_cart
  on shop.cart_items (cart_id);

create index if not exists ix_shop_orders_customer
  on shop.orders (customer_id, placed_at desc) where customer_id is not null;
create index if not exists ix_shop_orders_status
  on shop.orders (status, placed_at desc);
create index if not exists ix_shop_orders_payment_status
  on shop.orders (payment_status, placed_at desc);
create index if not exists ix_shop_orders_placed_at
  on shop.orders (placed_at desc);
create index if not exists ix_shop_order_items_order
  on shop.order_items (order_id);
create index if not exists ix_shop_order_items_product
  on shop.order_items (product_id) where product_id is not null;

create index if not exists ix_shop_shipments_order
  on shop.shipments (order_id, status);
create index if not exists ix_shop_payment_transactions_order
  on shop.payment_transactions (order_id, status);
create index if not exists ix_shop_payment_transactions_provider_ref
  on shop.payment_transactions (provider, provider_transaction_id)
  where provider_transaction_id is not null;

commit;
