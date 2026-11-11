-- Provider shop: a provider proposes a brand-new product (one that is not in the catalog yet).
-- The clinic sends name, description, category (one of its allowed categories), brand, images,
-- price and stock. An admin approves it (the catalog product and the clinic's approved offer are
-- created in one transaction, and created_product_id points at the product) or rejects it with a
-- reason. Nothing existing changes. Safe to run more than once.

create table if not exists shop.product_proposals (
  id                       uuid primary key default gen_random_uuid(),
  seller_id                uuid not null references shop.sellers(id) on delete cascade,
  created_by_user_id       uuid not null,
  name_translations        jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  category_id              uuid not null references shop.categories(id),
  brand                    text,
  -- Image URLs in display order; on approval they become shop.product_media rows (first = primary).
  image_urls               text[] not null default '{}',
  currency                 text not null default 'IRR',
  suggested_price          numeric(18, 2) not null,
  stock_quantity           integer not null,
  status                   text not null default 'pending',
  status_reason            text,
  reviewed_at              timestamptz,
  reviewed_by_user_id      uuid,
  created_product_id       uuid references shop.products(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint ck_shop_product_proposals_status check (status in ('pending', 'approved', 'rejected')),
  constraint ck_shop_product_proposals_name check (
    jsonb_typeof(name_translations) = 'object' and coalesce(nullif(trim(name_translations->>'fa'), ''), nullif(trim(name_translations->>'en'), '')) is not null),
  constraint ck_shop_product_proposals_price check (suggested_price >= 0),
  constraint ck_shop_product_proposals_stock check (stock_quantity > 0),
  constraint ck_shop_product_proposals_images check (cardinality(image_urls) <= 10),
  -- A rejection always carries the reason shown to the clinic.
  constraint ck_shop_product_proposals_reason check (status <> 'rejected' or nullif(trim(status_reason), '') is not null)
);

-- The provider's own list, newest first.
create index if not exists ix_shop_product_proposals_seller on shop.product_proposals (seller_id, created_at desc);
-- The admin queue by status.
create index if not exists ix_shop_product_proposals_status on shop.product_proposals (status, created_at desc);
create index if not exists ix_shop_product_proposals_category on shop.product_proposals (category_id);
create index if not exists ix_shop_product_proposals_product on shop.product_proposals (created_product_id)
  where created_product_id is not null;
