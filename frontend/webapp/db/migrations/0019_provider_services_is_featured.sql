-- B6: guarantee provider_services.is_featured exists.
--
-- The reported symptom was that every service a provider registers shows up in the
-- Featured Services shelf. The application side of that is already in place: the admin
-- form has a Featured checkbox, saveProviderServiceAction writes is_featured, and both
-- the home shelf (get-home-page.ts) and the Explore shelf (explore.data.ts) filter on
-- `coalesce(ps.is_featured, false) = true`.
--
-- What could not be confirmed from the repository is whether the column exists on the
-- target database: the newest schema dump in git (backup/2026-04-16) does not list it,
-- while the queries above clearly depend on it. Other columns are in the same position
-- (display_in_home_page, gradient), so that dump is demonstrably stale rather than
-- authoritative.
--
-- `if not exists` settles it either way: a no-op where the column is already there, and
-- the missing piece where it is not. Default false, so nothing becomes featured on its
-- own -- an admin has to tick it, which is exactly the behaviour that was asked for.
-- Nothing is back-filled.

begin;

alter table category.provider_services
  add column if not exists is_featured boolean not null default false;

comment on column category.provider_services.is_featured is
  'Editorial flag for the Featured Services shelves on the home page and Explore. Written only by the admin service form. is_popular and trending_score affect ordering only, never membership.';

-- The featured shelves select a handful of rows out of the whole catalogue, so index
-- the featured ones rather than scanning. Partial: the false rows are never selected on.
create index if not exists ix_provider_services_featured
  on category.provider_services (service_provider_id)
  where is_featured;

commit;
