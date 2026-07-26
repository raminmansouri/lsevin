-- Fixes city ordering in the location pickers.
--
-- 0006 wrote each city's POPULATION into display_order. Every consumer sorts that
-- column ascending (it is the manual "put this first" column used across the app),
-- so the list came out smallest-first: picking Tehran province offered Pīshvā and
-- Malard before Tehran itself.
--
-- Convert those populations into a population RANK within the country: 1 = largest.
-- Ascending order then means most-populous-first, which is what the pickers want and
-- what the column's contract already implies.
--
-- Idempotent by construction: only rows whose display_order is still large enough to
-- be a population are converted, and a rank is always far below that threshold, so a
-- second run matches nothing.

with ranked as (
  select
    city.id,
    row_number() over (
      partition by coalesce(country.id, parent.id)
      order by city.display_order desc, city.code asc
    ) as population_rank
  from category.locations city
  left join category.locations parent on parent.id = city.parent_id
  left join category.locations country
    on country.location_type_id = 1
   and country.id = coalesce(
         case when parent.location_type_id = 1 then parent.id end,
         parent.parent_id
       )
  where city.location_type_id = 2
    and city.display_order >= 10000
)
update category.locations as target
set display_order = ranked.population_rank,
    last_modified_date = now()
from ranked
where target.id = ranked.id;
