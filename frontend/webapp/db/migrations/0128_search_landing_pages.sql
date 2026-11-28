-- Landing pages for "treatment x city" combinations that are backed by real inventory.
--
-- A combination qualifies only with at least 3 distinct, public providers offering the
-- treatment in that city: anything thinner would be a doorway page that Google ignores or
-- penalises. The page is also required to have a stable English slug for the treatment
-- (the URL is /find/<treatment-slug>/<city-slug>) and a city LSevin can name (search.places);
-- a slug shared by two different treatments is skipped rather than guessed.
--
-- The pages are switched on with SEARCH_LANDING_PAGES=1 on the web app; until then this
-- view is only a report ("which pages would we publish?").

create or replace function search.slugify(value text) returns text
language sql immutable as $$
  select nullif(trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g')), '')
$$;

drop view if exists search.landing_pages;

create view search.landing_pages as
with grouped as (
  select d.service_key,
         d.city,
         count(distinct d.provider_id)                                     as providers,
         count(*)                                                          as offers,
         min(d.price_toman) filter (where d.price_toman > 0)               as min_price_toman,
         max(d.price_toman) filter (where d.price_toman > 0)               as max_price_toman,
         round(avg(d.rating) filter (where d.rating > 0), 2)               as avg_rating,
         max(d.indexed_at)                                                 as updated_at
    from search.documents d
   where d.doc_type = 'offer' and d.is_public
     and d.service_key is not null and d.city is not null and d.provider_id is not null
   group by d.service_key, d.city
  having count(distinct d.provider_id) >= 3
), named as (
  select g.*,
         sd.name_translations                              as service_names,
         search.slugify(sd.name_translations ->> 'en-US')  as service_slug
    from grouped g
    join category.service_definitions sd on sd.id::text = g.service_key and sd.is_active
), slug_owners as (
  select service_slug, count(distinct service_key) as owners
    from named where service_slug is not null group by service_slug
)
select n.service_key, n.service_slug, n.service_names, n.city as city_slug,
       jsonb_build_object('fa-IR', p.name, 'en-US', initcap(coalesce(p.aliases[1], p.city_slug))) as city_names,
       n.providers, n.offers, n.min_price_toman, n.max_price_toman, n.avg_rating, n.updated_at
  from named n
  join slug_owners so on so.service_slug = n.service_slug and so.owners = 1
  join search.places p on p.kind = 'city' and p.city_slug = n.city;
