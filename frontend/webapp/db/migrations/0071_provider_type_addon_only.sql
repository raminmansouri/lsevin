-- Add-on-only provider types.
--
-- Translators and drivers/cars are sold exclusively through the booking wizard's
-- add-ons step, per city. Marking their provider type add-on-only keeps those
-- providers out of search, home, explore, nearby, offers, categories and the
-- main booking provider picker (all of which filter with provider_type_is_public).
--
-- Additive and idempotent: existing provider types default to public, so nothing
-- disappears from any listing until an admin flips the switch on a type.

alter table category.provider_types
  add column if not exists is_addon_only boolean not null default false;

create or replace function category.provider_type_is_public(p_provider_type_id uuid)
returns boolean
language sql
stable
as $$
  select not coalesce(
    (select pt.is_addon_only from category.provider_types pt where pt.id = p_provider_type_id),
    false
  );
$$;

-- Add-on city picker: distinct cities of active providers of one type.
create index if not exists ix_service_providers_type_city_active
  on category.service_providers (provider_type_id, lower(btrim(city)))
  where is_active = true;
