-- ---------------------------------------------------------------------------
-- 0079 — Tours: shared invariants (functions + triggers).
--
-- The webapp and lsevin-portal both write the tour schema. Inventory, booking
-- anchors, publication rules and translation freshness are implemented once,
-- here, so neither application can oversell a departure, publish an incomplete
-- listing, or leave a stale translation marked current.
-- ---------------------------------------------------------------------------

-- Booking anchor: the category.service_definitions row every tour's backing
-- provider_service points at. Looked up by name in the existing Tourism root
-- category (production has one); created only when absent.
do $$
declare
  v_category uuid;
  v_definition constant uuid := '0190a7e0-7a11-7c00-8000-000000007041';
begin
  select id into v_category
    from category.categories
   where parent_id is null
     and (name_translations->>'en-US' ilike 'tourism' or name_translations->>'fa-IR' = 'گردشگری')
   order by create_date
   limit 1;

  if v_category is null then
    v_category := '0190a7e0-7a11-7c00-8000-000000007040';
    insert into category.categories (id, name_translations, description_translations, is_active, create_date)
    values (v_category,
            '{"en-US":"Tourism","fa-IR":"گردشگری","ar-SA":"السياحة","tr-TR":"Turizm"}',
            '{"en-US":"Tours and travel experiences","fa-IR":"تورها و تجربه‌های سفر"}',
            true, now())
    on conflict (id) do nothing;
  end if;

  insert into category.service_definitions
    (id, name_translations, description_translations, category_id, duration_minutes,
     pricing_model, is_active, currency, value, create_date, requires_specialist, booking_ui_mode)
  values
    (v_definition,
     '{"en-US":"Tour package","fa-IR":"بسته تور","ar-SA":"باقة جولة","tr-TR":"Tur paketi"}',
     '{"en-US":"Bookable tour departure","fa-IR":"رزرو حرکت تور"}',
     v_category, 0, 'fixed', true, 'IRR', 0, now(), false, 'custom_form')
  on conflict (id) do nothing;

  insert into tour.settings (key, value) values
    ('tourism_category_id', to_jsonb(v_category::text)),
    ('booking_service_definition_id', to_jsonb(v_definition::text))
  on conflict (key) do nothing;
end $$;

-- Creates or refreshes the provider_service row that bookings reference.
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
      (v_anchor, v_definition, v_names, '{}'::jsonb, t.status = 'published',
       t.service_provider_id, t.currency_code, coalesce(t.from_price, 0), now(),
       coalesce(t.duration_minutes, t.duration_days * 1440), array['tour']);
    update tour.tours set provider_service_id = v_anchor where id = t.id;
  else
    v_anchor := t.provider_service_id;
    update category.provider_services
       set display_name_translations = v_names,
           is_active = (t.status = 'published'),
           currency = t.currency_code,
           value = coalesce(t.from_price, 0),
           last_modified_date = now()
     where id = v_anchor;
  end if;
  return v_anchor;
end $$;

-- Hold expiry: releases every lapsed hold exactly once. Safe to call from any
-- process, any number of times, concurrently, and after a restart — the status
-- transition active -> expired is the idempotency guard.
create or replace function tour.expire_holds(p_departure_id uuid default null)
returns integer
language plpgsql
as $$
declare
  v_count integer := 0;
begin
  with lapsed as (
    update tour.holds h
       set status = 'expired', closed_at = now()
     where h.status = 'active'
       and h.expires_at <= now()
       and (p_departure_id is null or h.departure_id = p_departure_id)
    returning h.departure_id, h.seats
  ), per_departure as (
    select departure_id, sum(seats)::int as seats, count(*)::int as n from lapsed group by departure_id
  ), applied as (
    update tour.departures d
       set held_count = d.held_count - p.seats, last_modified_date = now()
      from per_departure p
     where d.id = p.departure_id
    returning p.n
  )
  select coalesce(sum(n), 0) into v_count from applied;
  return v_count;
end $$;

-- Places (or returns, for a repeated idempotency key) an inventory hold.
-- Raises: DEPARTURE_NOT_FOUND, DEPARTURE_UNAVAILABLE, BOOKING_CUTOFF_PASSED,
--         INSUFFICIENT_CAPACITY, GROUP_SIZE_INVALID.
create or replace function tour.place_hold(
  p_departure_id uuid, p_user_id uuid, p_seats integer, p_ttl_minutes integer, p_idempotency_key text)
returns tour.holds
language plpgsql
as $$
declare
  d tour.departures%rowtype;
  t tour.tours%rowtype;
  h tour.holds%rowtype;
begin
  select * into h from tour.holds where idempotency_key = p_idempotency_key;
  if found then
    if h.user_id <> p_user_id then raise exception 'IDEMPOTENCY_KEY_CONFLICT' using errcode = 'P0001'; end if;
    return h;
  end if;

  if p_seats is null or p_seats < 1 then raise exception 'GROUP_SIZE_INVALID' using errcode = 'P0001'; end if;

  perform tour.expire_holds(p_departure_id);

  select * into d from tour.departures where id = p_departure_id for update;
  if not found then raise exception 'DEPARTURE_NOT_FOUND' using errcode = 'P0002'; end if;
  select * into t from tour.tours where id = d.tour_id;
  if not found or t.status <> 'published' or not d.is_active or d.is_blocked
     or d.status not in ('scheduled','delayed') then
    raise exception 'DEPARTURE_UNAVAILABLE' using errcode = 'P0001';
  end if;
  -- A blackout covers departures created before or after it was entered.
  if exists (select 1 from tour.blackouts b where b.tour_id = d.tour_id and d.starts_on between b.date_from and b.date_to) then
    raise exception 'DEPARTURE_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if coalesce(d.booking_cutoff_at, d.starts_at) <= now() then
    raise exception 'BOOKING_CUTOFF_PASSED' using errcode = 'P0001';
  end if;
  if t.max_participants is not null and p_seats > t.max_participants then
    raise exception 'GROUP_SIZE_INVALID' using errcode = 'P0001';
  end if;
  if d.capacity - d.booked_count - d.held_count < p_seats then
    raise exception 'INSUFFICIENT_CAPACITY' using errcode = 'P0001';
  end if;

  update tour.departures
     set held_count = held_count + p_seats, last_modified_date = now()
   where id = d.id;

  insert into tour.holds (departure_id, user_id, seats, expires_at, idempotency_key)
  values (d.id, p_user_id, p_seats, now() + make_interval(mins => greatest(p_ttl_minutes, 1)), p_idempotency_key)
  returning * into h;
  return h;
end $$;

-- Releases an active hold early (customer abandoned checkout). Exactly once.
create or replace function tour.release_hold(p_hold_id uuid, p_user_id uuid)
returns boolean
language plpgsql
as $$
declare
  v_departure uuid; v_seats integer;
begin
  update tour.holds set status = 'released', closed_at = now()
   where id = p_hold_id and user_id = p_user_id and status = 'active'
  returning departure_id, seats into v_departure, v_seats;
  if not found then return false; end if;
  update tour.departures set held_count = held_count - v_seats, last_modified_date = now() where id = v_departure;
  return true;
end $$;

-- Converts an active, unexpired hold into booked seats. Raises HOLD_EXPIRED if
-- the hold lapsed (capacity is then re-checked by placing a new hold).
create or replace function tour.convert_hold(p_hold_id uuid, p_user_id uuid, p_booking_id uuid)
returns tour.holds
language plpgsql
as $$
declare
  h tour.holds%rowtype;
begin
  select * into h from tour.holds where id = p_hold_id for update;
  if not found or h.user_id <> p_user_id then raise exception 'HOLD_NOT_FOUND' using errcode = 'P0002'; end if;
  if h.status = 'converted' and h.booking_id = p_booking_id then return h; end if;
  if h.status <> 'active' or h.expires_at <= now() then raise exception 'HOLD_EXPIRED' using errcode = 'P0001'; end if;

  perform 1 from tour.departures where id = h.departure_id for update;
  update tour.departures
     set held_count = held_count - h.seats,
         booked_count = booked_count + h.seats,
         last_modified_date = now()
   where id = h.departure_id;
  update tour.holds set status = 'converted', booking_id = p_booking_id, closed_at = now()
   where id = h.id
  returning * into h;
  return h;
end $$;

-- Moves a live booking to a terminal state and returns its seats to inventory
-- exactly once. Returns the number of seats released (0 if it was already final).
create or replace function tour.close_booking(p_booking_id uuid, p_status text, p_reason text)
returns integer
language plpgsql
as $$
declare
  v_departure uuid; v_seats integer;
begin
  if p_status not in ('cancelled','declined','expired','no_show','completed') then
    raise exception 'INVALID_TERMINAL_STATUS' using errcode = 'P0001';
  end if;
  update tour.bookings
     set status = p_status,
         cancelled_at = case when p_status in ('cancelled','declined','expired') then now() else cancelled_at end,
         cancel_reason = coalesce(p_reason, cancel_reason),
         updated_at = now()
   where booking_id = p_booking_id
     and status in ('pending_payment','requested','confirmed')
  returning departure_id, seats into v_departure, v_seats;
  if not found then return 0; end if;
  if p_status in ('cancelled','declined','expired') then
    update tour.departures set booked_count = booked_count - v_seats, last_modified_date = now()
     where id = v_departure;
    return v_seats;
  end if;
  return 0;
end $$;

-- Publication requirements (AT-16, V-019, M-029). Severity 'error' blocks.
create or replace function tour.publish_requirements(p_tour_id uuid)
returns table (code text, severity text, detail text)
language plpgsql
stable
as $$
declare
  t tour.tours%rowtype;
  v_locales text[];
  v_locale text;
  v_field text;
  v_required_fields constant text[] := array['title','summary','description','meeting_instructions','cancellation_policy','safety_notes'];
begin
  select * into t from tour.tours where id = p_tour_id;
  if not found then
    return query select 'tour_not_found'::text, 'error'::text, null::text; return;
  end if;

  select array(select case when x = 'source' then t.source_locale::text else x end
                 from jsonb_array_elements_text(coalesce((select value from tour.settings where key = 'required_publish_locales'), '["source"]')) x)
    into v_locales;

  foreach v_locale in array v_locales loop
    foreach v_field in array v_required_fields loop
      if not exists (
        select 1 from tour.content c
         where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = v_field and c.locale = v_locale
           and nullif(btrim(coalesce(c.draft_value, c.published_value, '')), '') is not null
           and c.status <> 'missing') then
        return query select ('missing_' || v_field)::text, 'error'::text, v_locale;
      end if;
    end loop;
  end loop;

  if not exists (select 1 from tour.media m where m.tour_id = t.id and m.kind = 'image' and m.moderation_status <> 'rejected') then
    return query select 'missing_media'::text, 'error'::text, null::text;
  end if;
  if not exists (
    select 1 from tour.options o
     where o.tour_id = t.id and o.is_active
       and (o.kind = 'private' or exists (select 1 from tour.price_tiers p where p.option_id = o.id and p.traveler_class = 'adult'))) then
    return query select 'missing_price'::text, 'error'::text, null::text;
  end if;
  if not exists (select 1 from tour.policy_versions pv where pv.tour_id = t.id) then
    return query select 'missing_policy'::text, 'error'::text, null::text;
  end if;
  if t.meeting_lat is null then
    return query select 'missing_meeting_point'::text, 'error'::text, null::text;
  end if;
  if t.duration_minutes is null and t.duration_days < 1 then
    return query select 'missing_duration'::text, 'error'::text, null::text;
  end if;
  if not exists (select 1 from category.service_providers sp where sp.id = t.service_provider_id and sp.is_active) then
    return query select 'provider_not_active'::text, 'error'::text, null::text;
  end if;
  if not exists (select 1 from tour.itinerary_stops s where s.tour_id = t.id) then
    return query select 'missing_itinerary'::text, 'warning'::text, null::text;
  end if;
  if not exists (select 1 from tour.departures d where d.tour_id = t.id and d.starts_at > now() and d.status in ('scheduled','delayed') and d.is_active and not d.is_blocked) then
    return query select 'no_bookable_departures'::text, 'warning'::text, null::text;
  end if;
  if exists (select 1 from tour.content c where c.tour_id = t.id and c.status = 'outdated') then
    return query select 'outdated_translations'::text, 'warning'::text, null::text;
  end if;
end $$;

-- Translation freshness (M-031, AT-37): when the source-language text of a
-- field changes, every other locale of that field whose translation was based
-- on an older source revision is flagged 'outdated'. The approved/published
-- value stays live until a reviewer replaces it.
create or replace function tour.content_source_changed()
returns trigger
language plpgsql
as $$
begin
  if new.is_source and (tg_op = 'INSERT' or new.draft_value is distinct from old.draft_value) then
    if tg_op = 'UPDATE' then new.revision := old.revision + 1; end if;
    update tour.content c
       set status = 'outdated', updated_at = now()
     where c.entity_type = new.entity_type and c.entity_id = new.entity_id and c.field_key = new.field_key
       and c.locale <> new.locale and not c.is_source
       and c.status in ('approved','published','submitted','draft')
       and coalesce(c.source_revision, 0) < new.revision
       and tg_op = 'UPDATE';
  end if;
  return new;
end $$;

drop trigger if exists trg_content_source_changed on tour.content;
create trigger trg_content_source_changed
  before insert or update of draft_value on tour.content
  for each row execute function tour.content_source_changed();

-- Keeps derived columns of a departure consistent no matter which app wrote it.
create or replace function tour.departure_derive()
returns trigger
language plpgsql
as $$
declare t tour.tours%rowtype;
begin
  if new.tour_id is not null then
    select * into t from tour.tours where id = new.tour_id;
    new.timezone := coalesce(new.timezone, t.timezone);
    new.service_provider_id := t.service_provider_id;
    new.provider_service_id := coalesce(new.provider_service_id, t.provider_service_id);
    if new.local_start_time is not null and new.starts_at is null then
      new.starts_at := (new.starts_on + new.local_start_time) at time zone new.timezone;
    end if;
    if new.ends_at is null and new.starts_at is not null then
      new.ends_at := new.starts_at + make_interval(mins => coalesce(t.duration_minutes, t.duration_days * 1440));
    end if;
    if new.booking_cutoff_at is null and new.starts_at is not null then
      new.booking_cutoff_at := new.starts_at - make_interval(mins => t.booking_cutoff_minutes);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_departure_derive on tour.departures;
create trigger trg_departure_derive
  before insert or update of starts_on, local_start_time, starts_at, timezone, tour_id on tour.departures
  for each row execute function tour.departure_derive();

-- Search text: every translation of title/summary + destination names + tags.
create or replace function tour.refresh_search_text(p_tour_id uuid)
returns void
language sql
as $$
  update tour.tours t
     set search_text = lower(concat_ws(' ',
           t.slug,
           (select string_agg(coalesce(c.published_value, c.draft_value), ' ')
              from tour.content c
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key in ('title','summary','highlights')),
           (select string_agg(v, ' ') from tour.destinations d, jsonb_each_text(d.name_translations) as e(k, v) where d.id = t.destination_id),
           (select string_agg(v, ' ') from tour.destinations d, jsonb_each_text(d.region_translations) as e(k, v) where d.id = t.destination_id),
           (select sp_name from (select string_agg(v, ' ') as sp_name from category.service_providers sp, jsonb_each_text(sp.name_translations) as e(k, v) where sp.id = t.service_provider_id) x),
           array_to_string(t.category_codes, ' '),
           array_to_string(t.tag_codes, ' ')))
   where t.id = p_tour_id;
$$;
