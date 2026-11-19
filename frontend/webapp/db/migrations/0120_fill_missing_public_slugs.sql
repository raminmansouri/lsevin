-- Slugs for the catalog rows that still have none (2026-11-19).
--
-- 0093 gave every public catalog row a slug and added the trigger that names new
-- rows. On B, 1 provider (مرکز جراحی حکیمان نور), 6 specialists and 21 services
-- created on 2026-11-09, the day of the URL cutover, still had slug = null:
-- rows written in replica mode (SymmetricDS) do not fire the trigger, and these
-- arrived after 0093's one-time backfill. Their links fell back to the id
-- (/fa/providers/96c0b1f2-...), and the id path only redirects to a slug, so
-- search, the map and /providers led to a 404.
--
-- Same rule and order as 0093: each slug-less row, oldest first, is touched with
-- slug = null and category.fill_public_slug() names it. Providers go before
-- services, because a service slug starts with its provider's. Rows that have a
-- slug are not touched; on a site with none missing this does nothing.

do $$
declare
  tbl text;
  row_id uuid;
begin
  foreach tbl in array array[
    'category.service_providers', 'category.provider_types', 'category.staff',
    'marketing.special_packages', 'category.categories', 'category.provider_services'
  ] loop
    for row_id in execute format('select id from %s where coalesce(slug, '''') = '''' order by create_date nulls last, id', tbl) loop
      execute format('update %s set slug = null where id = $1', tbl) using row_id;
    end loop;
  end loop;
end;
$$;

-- Report anything still missing in the deploy log (a warning, not a failed
-- release; e2e/seo-filter-links.spec.ts fails on it).
do $$
declare
  missing text;
begin
  select string_agg(t || ': ' || n, ', ') into missing from (
    select 'category.service_providers' t, count(*) n from category.service_providers where coalesce(slug, '') = ''
    union all select 'category.provider_types', count(*) from category.provider_types where coalesce(slug, '') = ''
    union all select 'category.staff', count(*) from category.staff where coalesce(slug, '') = ''
    union all select 'marketing.special_packages', count(*) from marketing.special_packages where coalesce(slug, '') = ''
    union all select 'category.categories', count(*) from category.categories where coalesce(slug, '') = ''
    union all select 'category.provider_services', count(*) from category.provider_services where coalesce(slug, '') = ''
  ) c where n > 0;
  if missing is not null then
    raise warning 'catalog rows still without a slug: %', missing;
  end if;
end;
$$;
