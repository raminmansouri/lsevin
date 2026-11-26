-- Location lookups by name (2026-11-26 performance audit).
--
-- active-location.ts resolves a visitor's location given as text (the IP
-- lookup's country/city names, a saved location) by comparing the text with
-- every translation of every city: jsonb_each_text over 1.95 million
-- category.locations rows. Measured on a copy of production: 4.3 s per lookup
-- uncontended, 45 s while several pages asked at once (the map page and the
-- home page's location detection both do).
--
-- category.location_name_keys(value_translations) is the set of a location's
-- names, trimmed and lower-cased; a GIN index over it for cities turns the scan
-- into an index lookup (9 ms, same rows). The whole table is indexed (cities
-- are 99.8% of it): the queries pass the location type as a parameter, which a
-- partial index's predicate cannot be proven against in a generic plan.
--
-- In-transaction: CREATE INDEX blocks writes to category.locations (not reads)
-- for about 30 s on production-sized data; the table is written only by admin
-- location edits and replication.

create or replace function category.location_name_keys(translations jsonb)
returns text[]
language sql
immutable
parallel safe
as $$
  select coalesce(array_agg(distinct lower(btrim(v))), '{}')
    from jsonb_each_text(case when jsonb_typeof(translations) = 'object' then translations else '{}'::jsonb end) as x(k, v)
   where nullif(btrim(v), '') is not null
$$;

comment on function category.location_name_keys(jsonb) is
  'A location''s names in every language, trimmed and lower-cased: matched with @> array[lower(btrim(name))].';

create index if not exists ix_locations_city_name_keys
  on category.locations using gin (category.location_name_keys(value_translations));
