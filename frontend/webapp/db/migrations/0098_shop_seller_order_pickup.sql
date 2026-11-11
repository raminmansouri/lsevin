-- Provider shop: clinic pickup of paid orders.
-- One order can hold lines from several sellers, so each seller (clinic) needs its own pickup
-- state for its part of the order: new -> ready_for_pickup -> picked_up. shop.orders keeps its
-- order / payment / fulfilment state machines unchanged. A missing row means "new" (rows are
-- written on the first status change or when the clinic is notified of the paid order).
-- notified_at makes the "new paid order" notification to the clinic happen at most once.
-- Safe to run more than once.

create table if not exists shop.seller_order_pickups (
  order_id            uuid not null references shop.orders(id) on delete cascade,
  seller_id           uuid not null references shop.sellers(id) on delete cascade,
  status              text not null default 'new',
  ready_at            timestamptz,
  picked_up_at        timestamptz,
  updated_by_user_id  uuid,
  notified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (order_id, seller_id),
  constraint ck_shop_seller_order_pickups_status check (status in ('new', 'ready_for_pickup', 'picked_up'))
);

-- The clinic's order list and its "new orders" badge.
create index if not exists ix_shop_seller_order_pickups_seller on shop.seller_order_pickups (seller_id, status);
