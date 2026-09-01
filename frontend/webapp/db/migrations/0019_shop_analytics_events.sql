-- ---------------------------------------------------------------------------
-- 0019 — Shop commerce analytics sink.
--
-- §12 of docs/LSEVIN_SHOP_REQUIREMENTS_FEATURES.md: every commercial event
-- (shop_product_view, shop_add_to_cart, shop_checkout_started, shop_order_placed,
-- shop_payment_succeeded, ...) is emitted through one mechanism with a
-- privacy-safe payload — no address, phone, payment payload or health data.
--
-- The platform has no general-purpose event bus the webapp writes to, so Shop
-- owns this narrow, append-only table. It is deliberately minimal; a later
-- release can forward these rows to reporting_analytics or an external sink.
-- ---------------------------------------------------------------------------
begin;

create table if not exists shop.analytics_events (
  id             bigint generated always as identity primary key,
  event_name     text not null,
  occurred_at    timestamptz not null default now(),
  -- pseudonymous actor: customer id when known, else the guest cart token hash
  actor_kind     text not null default 'guest' check (actor_kind in ('customer','guest','system')),
  actor_key      text,
  session_surface text,
  locale         text,
  country_code   text,
  currency       text,
  product_id     uuid,
  category_id    uuid,
  cart_id        uuid,
  order_id       uuid,
  campaign_key   text,
  value_amount   numeric(18,2),
  quantity       integer,
  idempotency_key text,
  payload        jsonb not null default '{}'::jsonb
);

create index if not exists ix_shop_analytics_events_name_time
  on shop.analytics_events (event_name, occurred_at desc);
create index if not exists ix_shop_analytics_events_order
  on shop.analytics_events (order_id) where order_id is not null;
create unique index if not exists uq_shop_analytics_events_idem
  on shop.analytics_events (event_name, idempotency_key) where idempotency_key is not null;

commit;
