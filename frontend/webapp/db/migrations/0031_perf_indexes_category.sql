-- ---------------------------------------------------------------------------
-- 0031_perf_indexes_category.sql  (perf — service / provider / specialist / home)
--
-- The service page, provider page and specialist page each load a handful of
-- child rows filtered by a single foreign key. A few of those child tables only
-- carry their primary-key index today (checked against the live schema), so
-- every page load sequentially scans the whole table. This adds the missing
-- FK indexes.
--
-- Purely additive: `create index if not exists`, no data change, no behaviour
-- change, runs inside the migration tx. These tables are small today; if a
-- future dataset makes `booking.bookings` too large to index under a lock,
-- move that one line into a `-- migrate:no-transaction` file with
-- `create index concurrently`.
-- ---------------------------------------------------------------------------
set search_path = public;

-- Provider page: certifications lateral — `where pc.service_provider_id = sp.id`
create index if not exists ix_provider_certifications_service_provider_id
  on category.provider_certifications (service_provider_id);

-- Service page: `where si.service_id = $serviceDef or si.service_id = $providerService`
create index if not exists ix_service_included_service_id
  on category.service_included (service_id);

-- Service page: `where sp.service_id = $serviceDef or sp.service_id = $providerService`
create index if not exists ix_service_process_service_id
  on category.service_process (service_id);

-- Service page: `where sf.service_id = $serviceDef or sf.service_id = $providerService`
create index if not exists ix_service_faqs_service_id
  on category.service_faqs (service_id);

-- Home "trending services": lateral `where b.service_id = ps.id`. The existing
-- composite indexes on booking.bookings all lead with provider_id, so a
-- service-only lookup cannot use them.
create index if not exists ix_booking_bookings_service_id
  on booking.bookings (service_id);
