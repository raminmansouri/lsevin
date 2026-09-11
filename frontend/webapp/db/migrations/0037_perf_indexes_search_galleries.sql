-- ---------------------------------------------------------------------------
-- 0037_perf_indexes_search_galleries.sql  (perf — customer search)
--
-- The customer search resolves a picture for every row it returns by taking the
-- first gallery item of the service / provider / specialist:
--
--   ... where psgi.provider_service_id = ps.id
--       order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
--       limit 1
--
-- Those three gallery tables only carry their primary-key index (same gap
-- 0031 closed for the other child tables), so each of those lookups is a
-- sequential scan of the whole gallery table. Measured against a 30k-service /
-- 4k-provider / 6k-specialist dataset, adding these three indexes took the
-- termless "browse" search from 37s to 11s on its own — and together with the
-- query restructure in the same change, to ~0.1s.
--
-- Purely additive: `create index if not exists`, no data change, no behaviour
-- change, runs inside the migration tx. Building an index takes a SHARE lock,
-- which blocks writes to that table (not reads) for the duration. These gallery
-- tables are small, so that is a blink; if a future dataset makes one of them
-- too large to lock, move that line into its own `-- migrate:no-transaction`
-- file and use `create index concurrently`.
-- ---------------------------------------------------------------------------
set search_path = public;

-- Search results, service rows: first gallery item of a provider service.
create index if not exists ix_provider_service_gallery_items_provider_service_id
  on category.provider_service_gallery_items (provider_service_id);

-- Search results, provider rows: first gallery item of a provider.
create index if not exists ix_provider_gallery_items_service_provider_id
  on category.provider_gallery_items (service_provider_id);

-- Search results, specialist rows: first image gallery item of a staff member.
create index if not exists ix_staff_gallery_items_staff_id
  on category.staff_gallery_items (staff_id);
