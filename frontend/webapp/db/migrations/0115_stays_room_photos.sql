-- Stays: room photos for stays imported from Lsevin service providers.
--
-- 0113 imported each provider's nightly services as room types but only copied the provider's own
-- photos, so every room card repeated the hotel's front-door picture. The providers' services carry
-- their own photo (category.provider_services.image_url) and sometimes a gallery
-- (category.provider_service_gallery_items). This migration adds stay.import_room_photos(), which
-- attaches those photos to the matching room type, and runs it for every imported property.
--
-- A room type matches a service of the same provider when the Persian name and the nightly price
-- are the same (that is how stay.import_provider created it). Re-runnable: a photo already attached
-- to the room type is not added twice, and rooms an admin has given photos are left alone.

create or replace function stay.import_room_photos(p_property uuid) returns int
language plpgsql as $$
declare
  v_provider uuid;
  v_added int := 0;
  r record;
  v_url text;
  v_order int;
begin
  select service_provider_id into v_provider from stay.properties where id = p_property;
  if v_provider is null then return 0; end if;

  for r in
    select rt.id as room_type_id, rt.name as room_name,
           (select ps.id
              from category.provider_services ps
              join category.service_definitions sd on sd.id = ps.service_definition_id
             where ps.service_provider_id = v_provider and sd.booking_ui_mode = 'date_range'
               and ps.value = rp.base_price
               and btrim(coalesce(ps.display_name_translations ->> 'fa-IR', sd.name_translations ->> 'fa-IR', '')) = btrim(coalesce(rt.name ->> 'fa-IR', ''))
             order by ps.is_active desc, (ps.image_url is not null and btrim(ps.image_url) <> '') desc, ps.create_date
             limit 1) as service_id
      from stay.room_types rt
      join lateral (select base_price from stay.rate_plans where room_type_id = rt.id order by sort_order, created_at limit 1) rp on true
     where rt.property_id = p_property
       and not exists (select 1 from stay.media m where m.room_type_id = rt.id)
  loop
    continue when r.service_id is null;
    v_order := 0;
    for v_url in
      select u from (
        select btrim(ps.image_url) as u, 0 as o1, 0::bigint as o2 from category.provider_services ps where ps.id = r.service_id
        union all
        select btrim(g.url), 1, row_number() over (order by g.is_primary desc, g.display_order, g.create_date)
          from category.provider_service_gallery_items g
         where g.provider_service_id = r.service_id and coalesce(g.media_type, 'image') ilike 'image%'
      ) s
       where u is not null and u <> '' and (u ~ '^(https://|/)' or u ~ '^[A-Za-z0-9]')
       group by u
       order by min(o1), min(o2)
       limit 12
    loop
      if v_url ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        if to_regclass('media.media_library') is null then continue; end if;
        execute 'select nullif(btrim(file_url), '''') from media.media_library where id::text = $1' into v_url using v_url;
        continue when v_url is null;
      end if;
      v_order := v_order + 1;
      insert into stay.media (property_id, room_type_id, url, alt, sort_order, is_cover)
      values (p_property, r.room_type_id, v_url, r.room_name, v_order, false);
      v_added := v_added + 1;
    end loop;
  end loop;

  if v_added > 0 then
    insert into stay.audit_log (actor_user_id, property_id, entity_type, entity_id, action, detail)
    values (null, p_property, 'property', p_property, 'room_photos_imported', jsonb_build_object('photos', v_added));
  end if;
  return v_added;
end $$;

do $$
declare
  r record;
begin
  for r in select id from stay.properties where service_provider_id is not null loop
    perform stay.import_room_photos(r.id);
  end loop;
end $$;
