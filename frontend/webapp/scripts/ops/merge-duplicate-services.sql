-- Duplicate provider services ("-2", "-3" slugs). NOT a migration: run by hand
-- after review, on B, once migration 0127 is applied.
-- Analysis of production on 2026-11-28 (read-only):
--   266 active services end in -N; 33 are not duplicates (room numbers, tooth
--   numbers, sizes). 223 are the same provider + same name as the service that
--   owns the base slug:
--     88 are identical (same definition, price, duration) and nothing references
--        them (no bookings, offers, packages, stays, tours, comments, gallery)
--        -> section 1 merges them.
--     135 differ in price/duration/definition (1 has a booking)
--        -> section 2 lists them; each needs a distinguishing name, or a decision.

-- 1) Preview, then merge the 88 identical duplicates (switch off + redirect).
create temporary view dup_identical as
select e.id as dup_id, e.slug as dup_slug, o.id as original_id, o.slug as original_slug
  from category.provider_services e
  join category.provider_services o
    on o.service_provider_id = e.service_provider_id
   and o.id <> e.id
   and o.slug = regexp_replace(e.slug, '-[0-9]+$', '')
 where e.is_active and o.is_active
   and e.slug ~ '-[0-9]+$'
   and e.display_name_translations = o.display_name_translations
   and e.service_definition_id = o.service_definition_id
   and e.value is not distinct from o.value
   and e.duration_minutes is not distinct from o.duration_minutes
   and not exists (select 1 from booking.bookings b where b.service_id = e.id)
   and not exists (select 1 from marketing.offers x where x.provider_service_id = e.id)
   and not exists (select 1 from marketing.special_packages x where x.provider_service_id = e.id)
   and not exists (select 1 from stay.properties x where x.provider_service_id = e.id)
   and not exists (select 1 from tour.tours x where x.provider_service_id = e.id);

select count(*) as will_merge from dup_identical;   -- expect 88

begin;
update category.provider_services s
   set is_active = false, merged_into_service_id = d.original_id
  from dup_identical d
 where s.id = d.dup_id;
-- check, then commit (or rollback)
-- commit;

-- 2) The services that differ: needs a human (price/definition differs).
select e.slug as duplicate, o.slug as original,
       e.value as price, o.value as original_price,
       e.duration_minutes, o.duration_minutes as original_duration,
       e.service_definition_id = o.service_definition_id as same_definition,
       exists (select 1 from booking.bookings b where b.service_id = e.id) as has_booking
  from category.provider_services e
  join category.provider_services o
    on o.service_provider_id = e.service_provider_id and o.id <> e.id
   and o.slug = regexp_replace(e.slug, '-[0-9]+$', '')
 where e.is_active and o.is_active and e.slug ~ '-[0-9]+$'
   and e.display_name_translations = o.display_name_translations
   and not (e.service_definition_id = o.service_definition_id
        and e.value is not distinct from o.value
        and e.duration_minutes is not distinct from o.duration_minutes)
 order by 2, 1;
