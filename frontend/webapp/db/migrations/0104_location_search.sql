-- One search box for "where are you / where are you going": a city or a country,
-- found by any of its names in any language, in a few milliseconds.
--
-- category.locations holds about two million places (every GeoNames hamlet), and
-- the old picker searched a computed, per-language label with ILIKE '%...%' under
-- three dropdowns. "Turkey" found nothing (the English name is "Türkiye") and
-- "istanbul" did not match "İstanbul".
--
-- category.location_search is a local materialized view (SymmetricDS does not
-- replicate it; each site builds its own) of the places worth offering: every
-- country, every city curated by hand (no GeoNames record, e.g. Tehran) and
-- every GeoNames place of at least 1,000 people (named places only), with
--   * search_text: every name and the code, normalized (lower case; Turkish and
--     Latin accents folded; Arabic/Persian letter variants unified), plus the
--     country's names so "istanbul turkey" matches;
--   * rank: population, curated places and countries first.
-- Refresh after bulk location changes: select category.refresh_location_search();

create or replace function category.location_search_norm(value text)
returns text
language sql
immutable
parallel safe
as $$
  select btrim(regexp_replace(
    translate(
      lower(replace(replace(coalesce(value, ''), 'İ', 'i'), 'I', 'i')),
      -- Latin/Turkish accents folded, Arabic/Persian variants unified (yeh, kaf,
      -- teh marbuta, alef and hamza forms); the trailing characters (harakat and
      -- tatweel) have no counterpart and are dropped.
      'ışğüöçâàáäãåāêèéëēîìíïīôòóõøōûùúūñيكةأإآٱؤئى‌َُِّْـًٌٍ',
      'isguocaaaaaaaeeeeeiiiiioooooouuuunیکهااااویی '
    ),
    '[[:space:][:punct:]،؛؟«»]+', ' ', 'g'
  ));
$$;

comment on function category.location_search_norm(text) is
  'Lower case, accents folded and Arabic/Persian variants unified, for location search.';

-- English exonyms the GeoNames/CLDR names lack.
create table if not exists category.location_search_aliases (
  country_code text not null,
  alias        text not null,
  primary key (country_code, alias)
);

insert into category.location_search_aliases (country_code, alias) values
  ('TR', 'turkey'), ('TR', 'turkiye'), ('TR', 'türkiye'),
  ('IR', 'persia'),
  ('AE', 'uae'), ('AE', 'emirates'), ('AE', 'emarat'),
  ('US', 'usa'), ('US', 'america'),
  ('GB', 'uk'), ('GB', 'england'), ('GB', 'britain'),
  ('RU', 'russia'), ('KR', 'korea'), ('NL', 'holland')
on conflict do nothing;

drop materialized view if exists category.location_search;

create materialized view category.location_search as
with recursive country_of as (
  select l.id, l.id as country_id
    from category.locations l
   where l.location_type_id = 1
  union all
  select child.id, c.country_id
    from category.locations child
    join country_of c on c.id = child.parent_id
   where child.location_type_id in (2, 3)
),
countries as (
  select l.id,
         upper(l.code) as country_code,
         l.value_translations,
         category.location_search_norm(
           concat_ws(' ', l.code,
             (select string_agg(v, ' ') from jsonb_each_text(l.value_translations) as t(k, v)),
             (select string_agg(a.alias, ' ') from category.location_search_aliases a where a.country_code = upper(l.code)))
         ) as names
    from category.locations l
   where l.location_type_id = 1
),
candidates as (
  select l.id, l.location_type_id, l.code, l.value_translations, l.parent_id,
         r.location_id is null as curated,
         coalesce((r.source_metadata ->> 'population')::bigint, 0) as population,
         (r.source_metadata ->> 'latitude')::double precision as latitude,
         (r.source_metadata ->> 'longitude')::double precision as longitude
    from category.locations l
    left join category.location_geonames_refs r on r.location_id = l.id
   where l.location_type_id = 2
     and (r.location_id is null or coalesce((r.source_metadata ->> 'population')::bigint, 0) >= 1000)
     -- A place with no name in any language would show as its bare code.
     and exists (select 1 from jsonb_each_text(l.value_translations) as t(k, v) where btrim(t.v) <> '')
)
select c.id,
       2 as location_type_id,
       co.country_id,
       ct.country_code,
       c.parent_id,
       c.latitude,
       c.longitude,
       -- Curated places are the ones the business added; rank them like a large city.
       (case when c.curated then 2000000 else 0 end + c.population) as rank,
       category.location_search_norm(
         concat_ws(' ', c.code, (select string_agg(v, ' ') from jsonb_each_text(c.value_translations) as t(k, v)))
       ) as names,
       category.location_search_norm(
         concat_ws(' ', c.code, (select string_agg(v, ' ') from jsonb_each_text(c.value_translations) as t(k, v)))
       ) || ' ' || ct.names as search_text
  from candidates c
  join country_of co on co.id = c.id
  join countries ct on ct.id = co.country_id
union all
select ct.id, 1, ct.id, ct.country_code, null, null, null,
       -- A country outranks every city of the same name.
       100000000,
       ct.names,
       ct.names
  from countries ct;

create unique index location_search_id_uq on category.location_search (id);
create index location_search_text_trgm on category.location_search using gin (search_text gin_trgm_ops);
create index location_search_rank on category.location_search (rank desc);

create or replace function category.refresh_location_search()
returns void
language sql
as $$
  refresh materialized view concurrently category.location_search;
$$;

comment on materialized view category.location_search is
  'Searchable countries and cities (>= 1,000 people or curated) with normalized names; refresh with category.refresh_location_search().';
