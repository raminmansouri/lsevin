-- ---------------------------------------------------------------------------
-- 0032_booking_settings.sql  (booking — global feature toggles)
--
-- A single-row settings table for booking-flow feature toggles, mirroring the
-- `support.settings` singleton pattern. First flag: whether the booking wizard
-- shows the "recommended shop products" step. Default false, so the live
-- booking flow is unchanged until an admin turns it on.
--
-- Additive: new schema-guarded table + one seed row. No existing object is
-- touched.
-- ---------------------------------------------------------------------------
set search_path = public;

create schema if not exists booking;

create table if not exists booking.settings (
  id smallint primary key default 1,
  shop_products_step_enabled boolean not null default false,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint booking_settings_singleton check (id = 1)
);

insert into booking.settings (id) values (1)
  on conflict (id) do nothing;
