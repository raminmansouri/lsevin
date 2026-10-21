-- ---------------------------------------------------------------------------
-- 0082 — Tours: keep booking anchors out of the generic catalog.
--
-- A tour's booking anchor (category.provider_services row, 0079) exists only so
-- booking.bookings / booking.payments can reference it. 0079 marked it active
-- when the tour was published, which made it visible to the generic service
-- catalog and the booking-pro wizard — a path that books without tour holds,
-- party-size pricing or policy snapshots. It also replicates to the other site
-- (category tables are replicated), where the tour rows may not exist.
--
-- Anchors are now always inactive; the Tours checkout never required the
-- service to be active (it writes booking.bookings directly), and payment
-- intents, gateway callbacks and refunds key on the booking, not the service.
-- ---------------------------------------------------------------------------

create or replace function tour.ensure_booking_anchor(p_tour_id uuid)
returns uuid
language plpgsql
as $$
declare
  t tour.tours%rowtype;
  v_definition uuid;
  v_names jsonb;
  v_anchor uuid;
begin
  select * into t from tour.tours where id = p_tour_id for update;
  if not found then raise exception 'TOUR_NOT_FOUND' using errcode = 'P0002'; end if;

  select (value #>> '{}')::uuid into v_definition from tour.settings where key = 'booking_service_definition_id';

  select coalesce(jsonb_object_agg(c.locale, coalesce(c.published_value, c.draft_value)), '{}'::jsonb)
    into v_names
    from tour.content c
   where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title'
     and coalesce(c.published_value, c.draft_value) is not null;
  if v_names = '{}'::jsonb then v_names := jsonb_build_object(t.source_locale, t.slug); end if;

  if t.provider_service_id is null then
    v_anchor := gen_random_uuid();
    insert into category.provider_services
      (id, service_definition_id, display_name_translations, description_translations, is_active,
       service_provider_id, currency, value, create_date, duration_minutes, tags)
    values
      (v_anchor, v_definition, v_names, '{}'::jsonb, false,
       t.service_provider_id, t.currency_code, coalesce(t.from_price, 0), now(),
       coalesce(t.duration_minutes, t.duration_days * 1440), array['tour', 'tour-booking-anchor']);
    update tour.tours set provider_service_id = v_anchor where id = t.id;
  else
    v_anchor := t.provider_service_id;
    update category.provider_services
       set display_name_translations = v_names,
           is_active = false,
           currency = t.currency_code,
           value = coalesce(t.from_price, 0),
           tags = array['tour', 'tour-booking-anchor'],
           last_modified_date = now()
     where id = v_anchor;
  end if;
  return v_anchor;
end $$;

-- Existing anchors (none in production at the time of writing) are hidden too.
update category.provider_services ps
   set is_active = false, tags = array['tour', 'tour-booking-anchor'], last_modified_date = now()
  from tour.tours t
 where t.provider_service_id = ps.id
   and (ps.is_active or not (ps.tags @> array['tour-booking-anchor']));
