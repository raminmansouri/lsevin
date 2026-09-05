-- ---------------------------------------------------------------------------
-- 0024_shop_warehouse_allocation.sql  (SHP-V03-001)
--
-- Defines the multi-warehouse allocation policy as data instead of leaving it
-- implicit in a query. Additive and backward-safe: new nullable-with-default
-- columns, existing behaviour is unchanged until an admin sets a priority.
--
--   priority   — lower number is preferred when more than one warehouse can
--                fully fill a line (default 100 = "no preference").
--   is_default — the warehouse a manual stock adjustment / new inventory row
--                targets when none is named.
-- ---------------------------------------------------------------------------
set search_path = public;

alter table shop.warehouses
  add column if not exists priority integer not null default 100,
  add column if not exists is_default boolean not null default false;

-- Promote the oldest active warehouse to default when nothing is set yet, so a
-- single-warehouse store keeps working without any admin action.
do $$
declare v_id uuid;
begin
  if not exists (select 1 from shop.warehouses where is_default) then
    select id into v_id from shop.warehouses where is_active order by create_date asc limit 1;
    if v_id is not null then
      update shop.warehouses set is_default = true where id = v_id;
    end if;
  end if;
end $$;

create index if not exists ix_shop_warehouses_priority
  on shop.warehouses (priority asc) where is_active;
