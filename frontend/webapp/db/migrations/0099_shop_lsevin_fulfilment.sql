-- Provider shop: Lsevin fulfils every order (the "sent by Lsevin" model).
--
-- Clinics (marketplace sellers) never ship to customers and customers never go to a clinic. Each
-- clinic hands its items to Lsevin within its handling days; Lsevin then either delivers the
-- whole order to the customer's address or hands it over at the Lsevin office. One order, one
-- payment, one shipment for the customer.
--
-- 1) shop.orders
--      delivery_method_id   the method the customer chose (delivery, or the office pickup method)
--      fulfillment_mode     'delivery' (to the address) or 'office_pickup' (at the Lsevin office)
--      promised_days / promised_ready_at
--                           the one estimate shown at checkout: the slowest seller's handling days
--                           + the method's longest transit (0 for office pickup); kept so it never
--                           changes afterwards
-- 2) shop.order_items.handling_days_snapshot: the offer's handling days at checkout, i.e. how long
--    the seller has to hand the item to Lsevin (the clinic's due date = paid date + this).
-- 3) shop.seller_order_pickups (0098) now tracks the clinic -> Lsevin handover. Its statuses keep
--    their 0098 values: 'new', 'ready_for_pickup' (= ready to hand to Lsevin), 'picked_up'
--    (= handed to Lsevin, as the clinic reports it). received_at / received_by_user_id record
--    Lsevin's own confirmation that the items arrived; the order ships only after that.
-- 4) shop.delivery_methods gets the office details (address, phone, opening hours), editable in
--    admin, and an office pickup method is added (inactive until an admin fills it in).
-- 5) shop.order_office_pickups: an order picked up at the Lsevin office. "ready" issues the
--    customer's pickup code (sent by SMS, shown on their order page); "picked_up" needs that code.
--      pickup_code_hash      HMAC of the code (what the admin's entry is checked against)
--      pickup_code_cipher    the code encrypted for the customer's order page
--      pickup_code_attempts  wrong entries since the code was issued
--      pickup_code_locked_at set after too many wrong entries; issuing a new code clears it
-- Safe to run more than once.

-- 1) Orders ------------------------------------------------------------------------------------
alter table shop.orders add column if not exists delivery_method_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'fk_shop_orders_delivery_method') then
    alter table shop.orders add constraint fk_shop_orders_delivery_method
      foreign key (delivery_method_id) references shop.delivery_methods(id) on delete set null;
  end if;
end $$;

alter table shop.orders add column if not exists fulfillment_mode text not null default 'delivery';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_orders_fulfillment_mode') then
    alter table shop.orders add constraint ck_shop_orders_fulfillment_mode
      check (fulfillment_mode in ('delivery', 'office_pickup'));
  end if;
end $$;

-- The overall promise shown at checkout (null for orders placed before this migration).
alter table shop.orders add column if not exists promised_days integer;
alter table shop.orders add column if not exists promised_ready_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_orders_promised_days') then
    alter table shop.orders add constraint ck_shop_orders_promised_days check (promised_days is null or promised_days >= 0);
  end if;
end $$;

-- 2) Seller handling time per line --------------------------------------------------------------
alter table shop.order_items add column if not exists handling_days_snapshot integer;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_shop_order_items_handling_days') then
    alter table shop.order_items add constraint ck_shop_order_items_handling_days
      check (handling_days_snapshot is null or handling_days_snapshot >= 0);
  end if;
end $$;

-- 3) Clinic -> Lsevin handover --------------------------------------------------------------------
alter table shop.seller_order_pickups add column if not exists received_at timestamptz;
alter table shop.seller_order_pickups add column if not exists received_by_user_id uuid;
-- Admin "items to receive" list: parts not received yet.
create index if not exists ix_shop_seller_order_pickups_open on shop.seller_order_pickups (seller_id) where received_at is null;

-- 4) Office details on delivery methods, and the office pickup method ----------------------------
alter table shop.delivery_methods add column if not exists pickup_address_translations jsonb not null default '{}'::jsonb;
alter table shop.delivery_methods add column if not exists pickup_phone text;
alter table shop.delivery_methods add column if not exists pickup_hours_translations jsonb not null default '{}'::jsonb;

insert into shop.delivery_methods (code, name_translations, description_translations, is_active, base_fee,
                                   estimated_days_min, estimated_days_max, supports_pickup, rules)
values ('lsevin_office_pickup',
        '{"fa": "تحویل حضوری از دفتر لسوین", "fa-IR": "تحویل حضوری از دفتر لسوین", "en": "Pickup at the Lsevin office", "en-US": "Pickup at the Lsevin office"}'::jsonb,
        '{"fa": "سفارش را با کد تحویل از دفتر لسوین تحویل بگیرید.", "en": "Collect your order at the Lsevin office with your pickup code."}'::jsonb,
        false, 0, 0, 0, true, '{}'::jsonb)
on conflict (code) do nothing;

-- 5) Office pickup of an order ------------------------------------------------------------------------
create table if not exists shop.order_office_pickups (
  order_id               uuid primary key references shop.orders(id) on delete cascade,
  status                 text not null default 'ready',
  ready_at               timestamptz not null default now(),
  picked_up_at           timestamptz,
  pickup_code_hash       text,
  pickup_code_cipher     text,
  pickup_code_attempts   integer not null default 0,
  pickup_code_locked_at  timestamptz,
  pickup_code_issued_at  timestamptz,
  customer_notified_at   timestamptz,
  updated_by_user_id     uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint ck_shop_order_office_pickups_status check (status in ('ready', 'picked_up')),
  constraint ck_shop_order_office_pickups_attempts check (pickup_code_attempts >= 0)
);
