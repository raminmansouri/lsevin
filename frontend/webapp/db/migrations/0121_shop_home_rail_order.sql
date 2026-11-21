-- Shop home: show the product rails in the order
--   1) New arrivals (جدیدترین‌ها)  2) Best sellers (پرفروش‌ها)  3) Featured in health (منتخب سلامت)
-- (bug BUG-20261121-10A97E9D). They were seeded as featured=30, best sellers=40, new=50.
--
-- The three rails keep the display_order slots they already hold between them, only
-- shuffled, so any other section an admin placed before, after or between them stays
-- where it is. Rails that are missing are skipped. Safe to run more than once.

with wanted(key, pos) as (
  values ('hc_new_arrivals', 1), ('hc_best_sellers', 2), ('hc_featured', 3)
),
present as (
  select s.key, w.pos, s.display_order
  from shop.home_sections s
  join wanted w on w.key = s.key
),
slots as (
  select display_order, row_number() over (order by display_order) as rn
  from present
),
ranked as (
  select key, row_number() over (order by pos) as rn
  from present
)
update shop.home_sections s
set display_order = slots.display_order
from ranked
join slots on slots.rn = ranked.rn
where s.key = ranked.key;
