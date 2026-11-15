-- Provider shop: every seller fulfils its own items (replaces 0099's "sent by Lsevin" model).
--
-- The customer picks one of two options at checkout:
--   shipping  each seller ships its own items: a cart from N sellers = N shipments, each with that
--             seller's fee and delivery time. Lsevin's default seller uses the admin delivery methods.
--   pickup    only when every item is from ONE seller: collected at that seller's place (a clinic's
--             address and opening hours; for the default seller, the office on the office pickup
--             delivery method). shop.orders.pickup_seller_id records the seller.
--
-- shop.seller_order_pickups (0098) is now the seller's part of an order, one row per (order, seller),
-- written at checkout. The seller moves it (the default seller's part is moved by an admin):
--   shipping  new -> preparing -> shipped (tracking code required) -> delivery_requested
--   pickup    new -> ready_for_pickup (6-digit code issued) -> delivery_requested (customer's code)
-- delivery_requested needs an admin's approval: approve -> completed; reject (with a reason) ->
-- back to requested_from_status. The order completes when every part is completed.
--
-- shop.sellers gets the seller's own shipping fee (rial) and delivery days; shop.shipping_settings
-- holds the admin's optional cap on a seller's fee (charged = min(seller fee, cap)).
-- Safe to run more than once.

-- 1) Seller shipping settings --------------------------------------------------------------------
alter table shop.sellers add column if not exists shipping_fee numeric(18,2);
alter table shop.sellers add column if not exists delivery_days_min integer;
alter table shop.sellers add column if not exists delivery_days_max integer;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_sellers_shipping') then
    alter table shop.sellers add constraint ck_shop_sellers_shipping check (
      (shipping_fee is null or shipping_fee >= 0)
      and (delivery_days_min is null or delivery_days_min >= 0)
      and (delivery_days_max is null or delivery_days_max >= 0)
      and (delivery_days_min is null or delivery_days_max is null or delivery_days_min <= delivery_days_max));
  end if;
end $$;

create table if not exists shop.shipping_settings (
  id                  boolean primary key default true,
  seller_fee_cap      numeric(18,2),
  updated_by_user_id  uuid,
  updated_at          timestamptz not null default now(),
  constraint ck_shop_shipping_settings_single check (id),
  constraint ck_shop_shipping_settings_cap check (seller_fee_cap is null or seller_fee_cap >= 0)
);
insert into shop.shipping_settings (id) values (true) on conflict (id) do nothing;

-- 2) Orders: 'pickup' (at the one seller's place) replaces 'office_pickup' ------------------------
alter table shop.orders add column if not exists pickup_seller_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'fk_shop_orders_pickup_seller') then
    alter table shop.orders add constraint fk_shop_orders_pickup_seller
      foreign key (pickup_seller_id) references shop.sellers(id) on delete set null;
  end if;
end $$;
alter table shop.orders drop constraint if exists ck_shop_orders_fulfillment_mode;
update shop.orders o set fulfillment_mode = 'pickup',
  pickup_seller_id = coalesce(o.pickup_seller_id, (select id from shop.sellers where is_default limit 1))
where o.fulfillment_mode = 'office_pickup';
alter table shop.orders add constraint ck_shop_orders_fulfillment_mode check (fulfillment_mode in ('delivery', 'pickup'));

-- 3) The seller's part of an order -------------------------------------------------------------------
alter table shop.seller_order_pickups add column if not exists fulfilment_type text not null default 'shipping';
alter table shop.seller_order_pickups add column if not exists delivery_method_id uuid;
alter table shop.seller_order_pickups add column if not exists shipping_fee numeric(18,2) not null default 0;
alter table shop.seller_order_pickups add column if not exists handling_days integer;
alter table shop.seller_order_pickups add column if not exists delivery_days_min integer;
alter table shop.seller_order_pickups add column if not exists delivery_days_max integer;
alter table shop.seller_order_pickups add column if not exists preparing_at timestamptz;
alter table shop.seller_order_pickups add column if not exists tracking_code text;
alter table shop.seller_order_pickups add column if not exists carrier text;
alter table shop.seller_order_pickups add column if not exists shipped_at timestamptz;
alter table shop.seller_order_pickups add column if not exists pickup_code_hash text;
alter table shop.seller_order_pickups add column if not exists pickup_code_cipher text;
alter table shop.seller_order_pickups add column if not exists pickup_code_attempts integer not null default 0;
alter table shop.seller_order_pickups add column if not exists pickup_code_locked_at timestamptz;
alter table shop.seller_order_pickups add column if not exists pickup_code_issued_at timestamptz;
alter table shop.seller_order_pickups add column if not exists customer_notified_at timestamptz;
alter table shop.seller_order_pickups add column if not exists delivery_requested_at timestamptz;
alter table shop.seller_order_pickups add column if not exists requested_from_status text;
alter table shop.seller_order_pickups add column if not exists approved_at timestamptz;
alter table shop.seller_order_pickups add column if not exists approved_by_user_id uuid;
alter table shop.seller_order_pickups add column if not exists rejected_at timestamptz;
alter table shop.seller_order_pickups add column if not exists rejection_reason text;

alter table shop.seller_order_pickups drop constraint if exists ck_shop_seller_order_pickups_status;
-- 0098/0099 rows: 'picked_up' meant "handed to Lsevin" (done once Lsevin received it), and
-- 'ready_for_pickup' meant "ready to hand to Lsevin"; under the new model both are shipping parts.
update shop.seller_order_pickups set status = case when received_at is not null then 'completed' else 'preparing' end
where status = 'picked_up';
update shop.seller_order_pickups sp set status = 'preparing'
where sp.status = 'ready_for_pickup' and sp.fulfilment_type = 'shipping' and sp.pickup_code_hash is null;
alter table shop.seller_order_pickups add constraint ck_shop_seller_order_pickups_status check (
  status in ('new', 'preparing', 'shipped', 'ready_for_pickup', 'delivery_requested', 'completed'));

alter table shop.seller_order_pickups drop constraint if exists ck_shop_seller_order_pickups_type;
alter table shop.seller_order_pickups add constraint ck_shop_seller_order_pickups_type check (fulfilment_type in ('shipping', 'pickup'));
alter table shop.seller_order_pickups drop constraint if exists ck_shop_seller_order_pickups_amounts;
alter table shop.seller_order_pickups add constraint ck_shop_seller_order_pickups_amounts check (
  shipping_fee >= 0 and pickup_code_attempts >= 0
  and (handling_days is null or handling_days >= 0)
  and (delivery_days_min is null or delivery_days_min >= 0)
  and (delivery_days_max is null or delivery_days_max >= 0));
-- A shipped part always carries its tracking code.
alter table shop.seller_order_pickups drop constraint if exists ck_shop_seller_order_pickups_tracking;
alter table shop.seller_order_pickups add constraint ck_shop_seller_order_pickups_tracking check (
  status <> 'shipped' or fulfilment_type <> 'shipping' or nullif(btrim(tracking_code), '') is not null) not valid;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'fk_shop_seller_order_pickups_method') then
    alter table shop.seller_order_pickups add constraint fk_shop_seller_order_pickups_method
      foreign key (delivery_method_id) references shop.delivery_methods(id) on delete set null;
  end if;
end $$;

-- Admin "waiting for approval" list.
create index if not exists ix_shop_seller_order_pickups_requested
  on shop.seller_order_pickups (delivery_requested_at) where status = 'delivery_requested';
-- 0099's "items to receive" index is no longer used.
drop index if exists shop.ix_shop_seller_order_pickups_open;
