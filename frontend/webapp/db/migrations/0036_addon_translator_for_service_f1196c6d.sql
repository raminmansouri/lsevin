-- Offer the translator add-on on service f1196c6d-473c-46a2-9b19-c1aaa6b09ae9.
--
-- Step 4 of the booking wizard ("خدمات جانبی") lists the provider types
-- whitelisted for the booked service's DEFINITION, in
-- category.service_definition_addon_provider_types. With no row there the step
-- renders its heading and nothing else, which is what this service does today.
--
-- The id in the service URL is matched the way the app matches it: a
-- provider_services id first, falling back to a service_definitions id.
--
-- Skips rather than fails when the pieces are missing -- migrations run
-- unattended on deploy, and a missing provider type is a catalogue gap, not a
-- reason to stop a release. Read the NOTICE output to see what happened.
--
-- Idempotent: the whitelist row is inserted only if it is not already there.

begin;

do $$
declare
  v_service_id   uuid := 'f1196c6d-473c-46a2-9b19-c1aaa6b09ae9';
  v_definition_id uuid;
  v_provider_type_id uuid;
  v_provider_type_name text;
  v_bookable_count integer;
begin
  -- Same resolution order as getServicePageByIdFromDb.
  select ps.service_definition_id into v_definition_id
  from category.provider_services ps
  where ps.id = v_service_id;

  if v_definition_id is null then
    select sd.id into v_definition_id
    from category.service_definitions sd
    where sd.id = v_service_id;
  end if;

  if v_definition_id is null then
    raise notice 'No provider service or service definition matches % -- nothing done.', v_service_id;
    return;
  end if;

  -- The translator provider type, by name in either locale. Narrow on purpose:
  -- picking the wrong provider type would put the wrong add-on on a live
  -- service, so no match is better than a loose guess.
  select pt.id,
         coalesce(pt.name_translations ->> 'fa-IR', pt.name_translations ->> 'en-US')
    into v_provider_type_id, v_provider_type_name
  from category.provider_types pt
  where jsonb_typeof(pt.name_translations) = 'object'
    and (
      pt.name_translations ->> 'fa-IR' like '%مترجم%'
      or lower(coalesce(pt.name_translations ->> 'en-US', '')) like '%translator%'
      or lower(coalesce(pt.name_translations ->> 'en-US', '')) like '%interpreter%'
    )
  order by pt.is_active desc, pt.create_date asc
  limit 1;

  if v_provider_type_id is null then
    raise notice
      'No provider type named like "مترجم"/"translator" exists. Create one under admin > provider types, then re-run this file.';
    return;
  end if;

  if exists (
    select 1
    from category.service_definition_addon_provider_types
    where service_definition_id = v_definition_id
      and provider_type_id = v_provider_type_id
  ) then
    raise notice 'Service definition % already offers provider type % (%) -- nothing done.',
      v_definition_id, v_provider_type_id, v_provider_type_name;
    return;
  end if;

  insert into category.service_definition_addon_provider_types (
    id, service_definition_id, provider_type_id, icon, display_order, is_required, metadata
  ) values (
    public.uuid_generate_v4(),
    v_definition_id,
    v_provider_type_id,
    null,
    0,
    false,          -- optional: the customer can finish the booking without it
    '{}'::jsonb
  );

  raise notice 'Service definition % now offers add-on provider type % (%).',
    v_definition_id, v_provider_type_id, v_provider_type_name;

  -- The whitelist only makes the card appear. The card is still empty unless
  -- somebody of that type actually sells something, so say so here rather than
  -- letting it be discovered on a live booking.
  select count(*) into v_bookable_count
  from category.provider_services ps
  join category.service_providers sp on sp.id = ps.service_provider_id
  where sp.provider_type_id = v_provider_type_id
    and ps.is_active = true
    and sp.is_active = true;

  if v_bookable_count = 0 then
    raise notice
      'WARNING: no active provider of type % has an active service, so the add-on card will list nothing.',
      v_provider_type_name;
  else
    raise notice '% bookable service(s) available for this add-on.', v_bookable_count;
  end if;
end $$;

commit;
