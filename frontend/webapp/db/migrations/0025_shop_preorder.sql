-- ---------------------------------------------------------------------------
-- 0025_shop_preorder.sql  (SHP-DB-004, SHP-V02-010/011/012)
--
-- Explicit preorder metadata on products and variants. All columns are
-- nullable / defaulted, so existing catalogue and checkout code is unaffected
-- until an admin flips `is_preorder`.
--
--   is_preorder             — this product/variant is sold as a preorder
--   preorder_release_at     — customer-facing estimated availability / ship-from
--   preorder_limit          — total units sellable before release (null = no cap)
--   preorder_payment_policy — full | deposit | proforma
--   preorder_deposit_percent— deposit % when policy = 'deposit'
-- ---------------------------------------------------------------------------
set search_path = public;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'preorder_payment_policy' and typnamespace = 'shop'::regnamespace) then
    create type shop.preorder_payment_policy as enum ('full', 'deposit', 'proforma');
  end if;
end $$;

alter table shop.products
  add column if not exists is_preorder             boolean not null default false,
  add column if not exists preorder_release_at     timestamptz,
  add column if not exists preorder_limit          integer,
  add column if not exists preorder_payment_policy shop.preorder_payment_policy not null default 'full',
  add column if not exists preorder_deposit_percent numeric(5,2);

alter table shop.product_variants
  add column if not exists is_preorder             boolean not null default false,
  add column if not exists preorder_release_at     timestamptz,
  add column if not exists preorder_limit          integer,
  add column if not exists preorder_payment_policy shop.preorder_payment_policy not null default 'full',
  add column if not exists preorder_deposit_percent numeric(5,2);

-- Flag preorder order-items so the fulfilment guard and the sold-count query
-- do not have to re-derive it from the (possibly since-changed) product.
alter table shop.order_items
  add column if not exists is_preorder boolean not null default false;

create index if not exists ix_shop_order_items_preorder
  on shop.order_items (product_id) where is_preorder;
