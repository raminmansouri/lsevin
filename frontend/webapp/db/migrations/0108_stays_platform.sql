-- ---------------------------------------------------------------------------
-- 0108 — Stays platform: hotels and اقامتگاه (docs/designs/hotel-booking/Stays.md).
--
-- Same architecture as the tours platform (0078..0083):
--   * a property owns a hidden category.provider_services row — the "booking
--     anchor" — so booking.bookings, booking.payments, payment intents, gateway
--     callbacks, refunds and accounting are reused unchanged;
--   * everything stay-specific lives in schema `stay`;
--   * inventory invariants live in SQL functions, so no caller can oversell.
--
-- Inventory model (03-customer-requirements.md, "Nonnegotiable business rules"):
--   * a stay occupies nights [check_in, check_out) — the departure day is free;
--   * stock is per room type and night (stay.inventory). A hotel room type has
--     N units; an entire-place listing (villa, suite, apartment...) has exactly 1;
--   * refundable / non-refundable / breakfast rate plans of one room type share
--     the same stock;
--   * a hold locks every night of the range in date order (deterministic lock
--     order → no deadlocks), checks all of them and increments `held` in one
--     statement block; any failing night aborts the whole hold.
--
-- Money: numeric(18,2) in the property currency (IRR by default, shown as
-- toman by the UI). Prices are never computed in floating point server-side
-- beyond what the existing tours pricing already does (integer-rounded rial).
--
-- Additive only. No existing table is altered.
-- ---------------------------------------------------------------------------

create schema if not exists stay;
create extension if not exists pg_trgm;

-- Settings -------------------------------------------------------------------

create table if not exists stay.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into stay.settings (key, value) values
  ('hold_minutes',           '15'),
  ('payment_window_minutes', '30'),
  ('request_timeout_hours',  '24'),
  ('service_fee_percent',    '0'),
  ('max_nights',             '30'),
  ('max_rooms',              '5'),
  ('booking_window_days',    '365'),
  ('enabled_locales',        '["fa-IR","en-US","ar-SA"]')
on conflict (key) do nothing;

-- Amenity vocabulary -----------------------------------------------------------

create table if not exists stay.amenities (
  code       text primary key check (code ~ '^[a-z][a-z0-9_]{1,40}$'),
  grp        text not null check (grp in ('general','room','bathroom','food','wellness','family','accessibility','medical','business','outdoor')),
  label      jsonb not null,
  icon       text,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

insert into stay.amenities (code, grp, label, icon, sort_order) values
  ('wifi',               'general',       '{"fa-IR":"اینترنت وای‌فای","en-US":"Wi-Fi","ar-SA":"واي فاي"}', 'wifi', 10),
  ('parking',            'general',       '{"fa-IR":"پارکینگ","en-US":"Parking","ar-SA":"موقف سيارات"}', 'car', 20),
  ('reception_24h',      'general',       '{"fa-IR":"پذیرش ۲۴ ساعته","en-US":"24-hour reception","ar-SA":"استقبال على مدار الساعة"}', 'clock', 30),
  ('elevator',           'general',       '{"fa-IR":"آسانسور","en-US":"Elevator","ar-SA":"مصعد"}', 'arrow-up-down', 40),
  ('airport_shuttle',    'general',       '{"fa-IR":"ترانسفر فرودگاهی","en-US":"Airport shuttle","ar-SA":"نقل من المطار"}', 'plane', 50),
  ('prayer_room',        'general',       '{"fa-IR":"نمازخانه","en-US":"Prayer room","ar-SA":"مصلى"}', 'moon', 60),
  ('luggage_storage',    'general',       '{"fa-IR":"نگهداری چمدان","en-US":"Luggage storage","ar-SA":"تخزين الأمتعة"}', 'luggage', 70),
  ('laundry',            'general',       '{"fa-IR":"خشکشویی","en-US":"Laundry","ar-SA":"غسيل الملابس"}', 'shirt', 80),
  ('air_conditioning',   'room',          '{"fa-IR":"کولر/تهویه مطبوع","en-US":"Air conditioning","ar-SA":"تكييف"}', 'snowflake', 110),
  ('heating',            'room',          '{"fa-IR":"سیستم گرمایش","en-US":"Heating","ar-SA":"تدفئة"}', 'flame', 120),
  ('tv',                 'room',          '{"fa-IR":"تلویزیون","en-US":"TV","ar-SA":"تلفاز"}', 'tv', 130),
  ('fridge',             'room',          '{"fa-IR":"یخچال","en-US":"Refrigerator","ar-SA":"ثلاجة"}', 'refrigerator', 140),
  ('kitchen',            'room',          '{"fa-IR":"آشپزخانه","en-US":"Kitchen","ar-SA":"مطبخ"}', 'cooking-pot', 150),
  ('safe_box',           'room',          '{"fa-IR":"صندوق امانات","en-US":"Safe","ar-SA":"خزنة"}', 'lock', 160),
  ('private_bathroom',   'bathroom',      '{"fa-IR":"سرویس بهداشتی اختصاصی","en-US":"Private bathroom","ar-SA":"حمام خاص"}', 'bath', 210),
  ('western_toilet',     'bathroom',      '{"fa-IR":"سرویس فرنگی","en-US":"Western toilet","ar-SA":"مرحاض غربي"}', 'bath', 220),
  ('breakfast',          'food',          '{"fa-IR":"صبحانه","en-US":"Breakfast","ar-SA":"إفطار"}', 'coffee', 310),
  ('restaurant',         'food',          '{"fa-IR":"رستوران","en-US":"Restaurant","ar-SA":"مطعم"}', 'utensils', 320),
  ('coffee_shop',        'food',          '{"fa-IR":"کافی‌شاپ","en-US":"Coffee shop","ar-SA":"مقهى"}', 'coffee', 330),
  ('room_service',       'food',          '{"fa-IR":"سرویس اتاق","en-US":"Room service","ar-SA":"خدمة الغرف"}', 'bell', 340),
  ('pool',               'wellness',      '{"fa-IR":"استخر","en-US":"Swimming pool","ar-SA":"مسبح"}', 'waves', 410),
  ('gym',                'wellness',      '{"fa-IR":"باشگاه بدنسازی","en-US":"Gym","ar-SA":"صالة رياضية"}', 'dumbbell', 420),
  ('sauna',              'wellness',      '{"fa-IR":"سونا و جکوزی","en-US":"Sauna & jacuzzi","ar-SA":"ساونا وجاكوزي"}', 'thermometer', 430),
  ('family_rooms',       'family',        '{"fa-IR":"اتاق خانوادگی","en-US":"Family rooms","ar-SA":"غرف عائلية"}', 'users', 510),
  ('crib',               'family',        '{"fa-IR":"تخت نوزاد","en-US":"Baby cot","ar-SA":"سرير أطفال"}', 'baby', 520),
  ('step_free',          'accessibility', '{"fa-IR":"دسترسی بدون پله","en-US":"Step-free access","ar-SA":"دخول بدون درج"}', 'accessibility', 610),
  ('wheelchair_bathroom','accessibility', '{"fa-IR":"سرویس مناسب ویلچر","en-US":"Wheelchair-accessible bathroom","ar-SA":"حمام مناسب للكراسي المتحركة"}', 'accessibility', 620),
  ('near_hospital',      'medical',       '{"fa-IR":"نزدیک بیمارستان","en-US":"Near a hospital","ar-SA":"قريب من مستشفى"}', 'hospital', 710),
  ('companion_beds',     'medical',       '{"fa-IR":"مناسب همراه بیمار","en-US":"Suitable for patient companions","ar-SA":"مناسب لمرافقي المرضى"}', 'heart-handshake', 720),
  ('meeting_room',       'business',      '{"fa-IR":"سالن جلسات","en-US":"Meeting room","ar-SA":"قاعة اجتماعات"}', 'presentation', 810),
  ('garden',             'outdoor',       '{"fa-IR":"حیاط و باغ","en-US":"Garden / courtyard","ar-SA":"حديقة / فناء"}', 'trees', 910),
  ('bbq',                'outdoor',       '{"fa-IR":"باربیکیو","en-US":"Barbecue","ar-SA":"شواء"}', 'flame', 920),
  ('sea_view',           'outdoor',       '{"fa-IR":"منظره دریا","en-US":"Sea view","ar-SA":"إطلالة على البحر"}', 'sunset', 930)
on conflict (code) do nothing;

-- Cities (SEO landing pages /stays/city/<slug>) -----------------------------------

create table if not exists stay.cities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  name         jsonb not null check (jsonb_typeof(name) = 'object' and name <> '{}'::jsonb),
  region       jsonb not null default '{}'::jsonb,
  intro        jsonb not null default '{}'::jsonb,
  cover_url    text check (cover_url is null or cover_url ~ '^(https://|/)'),
  cover_alt    jsonb not null default '{}'::jsonb,
  cover_credit text,
  latitude     numeric(10,7),
  longitude    numeric(10,7),
  timezone     text not null default 'Asia/Tehran',
  is_published boolean not null default true,
  is_featured  boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint ck_stay_cities_coords check ((latitude is null) = (longitude is null)),
  constraint ck_stay_cities_cover_alt check (cover_url is null or cover_alt <> '{}'::jsonb)
);

-- Properties ------------------------------------------------------------------

create table if not exists stay.properties (
  id                    uuid primary key default gen_random_uuid(),
  service_provider_id   uuid not null references category.service_providers(id),
  provider_service_id   uuid unique references category.provider_services(id),
  city_id               uuid not null references stay.cities(id),
  slug                  text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,100}$'),
  status                text not null default 'draft' check (status in ('draft','published','paused','archived')),
  kind                  text not null default 'hotel'
                          check (kind in ('hotel','hotel_apartment','boutique','traditional','motel','hostel','guesthouse',
                                          'villa','apartment','suite','cottage','ecolodge')),
  inventory_model       text not null default 'rooms' check (inventory_model in ('rooms','entire_place')),
  star_rating           smallint check (star_rating between 1 and 5),
  name                  jsonb not null check (jsonb_typeof(name) = 'object' and name <> '{}'::jsonb),
  summary               jsonb not null default '{}'::jsonb,
  description           jsonb not null default '{}'::jsonb,
  house_rules           jsonb not null default '{}'::jsonb,
  address               jsonb not null default '{}'::jsonb,
  latitude              numeric(10,7),
  longitude             numeric(10,7),
  location_privacy      text not null default 'exact' check (location_privacy in ('exact','approximate')),
  check_in_time         time not null default '14:00',
  check_out_time        time not null default '12:00',
  amenity_codes         text[] not null default '{}',
  nearby                jsonb not null default '[]'::jsonb,   -- [{"kind":"hospital","name":{..},"distanceM":800}]
  step_free_access      boolean not null default false,
  accessible_bathroom   boolean not null default false,
  accessibility_verified_at timestamptz,
  medical_friendly      boolean not null default false,
  pets_allowed          boolean not null default false,
  smoking_allowed       boolean not null default false,
  parties_allowed       boolean not null default false,
  families_only         boolean not null default false,
  id_required           boolean not null default true,
  child_free_under_age  smallint not null default 5 check (child_free_under_age between 0 and 17),
  confirmation_mode     text not null default 'instant' check (confirmation_mode in ('instant','request')),
  request_timeout_hours integer not null default 24 check (request_timeout_hours between 1 and 168),
  booking_cutoff_hours  integer not null default 0 check (booking_cutoff_hours between 0 and 168),
  currency_code         varchar(10) not null default 'IRR',
  tax_percent           numeric(5,2) not null default 0 check (tax_percent between 0 and 50),
  timezone              text not null default 'Asia/Tehran',
  contact_phone         text,
  source_locale         text not null default 'fa-IR',
  rating_avg            numeric(3,2),
  review_count          integer not null default 0,
  popularity            integer not null default 0,
  is_featured           boolean not null default false,
  from_price            numeric(18,2),
  current_policy_id     uuid,
  search_text           text,
  published_at          timestamptz,
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint ck_stay_properties_coords check ((latitude is null) = (longitude is null))
);
create index if not exists ix_stay_properties_city on stay.properties (city_id, status);
create index if not exists ix_stay_properties_provider on stay.properties (service_provider_id);
create index if not exists ix_stay_properties_public on stay.properties (status, popularity desc) where status = 'published';
create index if not exists ix_stay_properties_search on stay.properties using gin (search_text gin_trgm_ops);
create index if not exists ix_stay_properties_amenities on stay.properties using gin (amenity_codes);

-- Room types (sellable units) ------------------------------------------------------

create table if not exists stay.room_types (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references stay.properties(id) on delete cascade,
  code           text not null check (code ~ '^[a-z0-9][a-z0-9-]{0,40}$'),
  name           jsonb not null check (jsonb_typeof(name) = 'object' and name <> '{}'::jsonb),
  description    jsonb not null default '{}'::jsonb,
  units          integer not null default 1 check (units between 1 and 1000),
  base_occupancy integer not null default 2 check (base_occupancy between 1 and 30),
  max_adults     integer not null default 2 check (max_adults between 1 and 30),
  max_children   integer not null default 0 check (max_children between 0 and 20),
  max_occupancy  integer not null default 2 check (max_occupancy between 1 and 40),
  extra_beds     integer not null default 0 check (extra_beds between 0 and 10),
  bed_config     jsonb not null default '[]'::jsonb,   -- [{"type":"double","count":1}]
  size_m2        integer check (size_m2 between 1 and 5000),
  bedrooms       integer check (bedrooms between 0 and 50),
  bathrooms      integer check (bathrooms between 0 and 50),
  amenity_codes  text[] not null default '{}',
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (property_id, code),
  constraint ck_stay_room_types_occupancy check (base_occupancy <= max_occupancy and max_adults <= max_occupancy)
);

-- Media ------------------------------------------------------------------------

create table if not exists stay.media (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references stay.properties(id) on delete cascade,
  room_type_id uuid references stay.room_types(id) on delete cascade,
  url          text not null check (url ~ '^(https://|/)' or url ~ '^[A-Za-z0-9]'),
  alt          jsonb not null default '{}'::jsonb,
  credit       text,
  sort_order   integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists ix_stay_media_property on stay.media (property_id, sort_order);
create unique index if not exists ux_stay_media_one_cover on stay.media (property_id) where is_cover;

-- Cancellation policies (immutable versions) -------------------------------------------

create table if not exists stay.policies (
  id                     uuid primary key default gen_random_uuid(),
  property_id            uuid not null references stay.properties(id) on delete cascade,
  version                integer not null check (version >= 1),
  rules                  jsonb not null,   -- [{"hoursBefore":72,"refundPercent":100},...]
  no_show_refund_percent integer not null default 0 check (no_show_refund_percent between 0 and 100),
  texts                  jsonb not null default '{}'::jsonb,
  created_by             uuid,
  created_at             timestamptz not null default now(),
  unique (property_id, version)
);

-- Rate plans + dated prices --------------------------------------------------------

create table if not exists stay.rate_plans (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references stay.properties(id) on delete cascade,
  room_type_id       uuid not null references stay.room_types(id) on delete cascade,
  code               text not null check (code ~ '^[a-z0-9][a-z0-9-]{0,40}$'),
  name               jsonb not null default '{}'::jsonb,
  meal_plan          text not null default 'room_only' check (meal_plan in ('room_only','breakfast','half_board','full_board')),
  refundable         boolean not null default true,
  base_price         numeric(18,2) not null check (base_price >= 0),
  extra_adult_price  numeric(18,2) not null default 0 check (extra_adult_price >= 0),
  child_price        numeric(18,2) not null default 0 check (child_price >= 0),
  min_nights         integer not null default 1 check (min_nights between 1 and 60),
  max_nights         integer not null default 30 check (max_nights between 1 and 365),
  long_stay_nights   integer check (long_stay_nights between 2 and 365),
  long_stay_percent  numeric(5,2) check (long_stay_percent > 0 and long_stay_percent < 100),
  sort_order         integer not null default 0,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (room_type_id, code),
  constraint ck_stay_rate_plans_nights check (max_nights >= min_nights),
  constraint ck_stay_rate_plans_long_stay check ((long_stay_nights is null) = (long_stay_percent is null))
);
create index if not exists ix_stay_rate_plans_property on stay.rate_plans (property_id, is_active);

create table if not exists stay.rate_overrides (
  rate_plan_id uuid not null references stay.rate_plans(id) on delete cascade,
  stay_date    date not null,
  price        numeric(18,2) not null check (price >= 0),
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  primary key (rate_plan_id, stay_date)
);

-- Inventory: one row per room type and night (created lazily) ----------------------

create table if not exists stay.inventory (
  room_type_id      uuid not null references stay.room_types(id) on delete cascade,
  stay_date         date not null,
  units_override    integer check (units_override between 0 and 1000),
  sold              integer not null default 0 check (sold >= 0),
  held              integer not null default 0 check (held >= 0),
  stop_sell         boolean not null default false,
  closed_to_arrival boolean not null default false,
  min_nights        integer check (min_nights between 1 and 60),
  updated_at        timestamptz not null default now(),
  primary key (room_type_id, stay_date)
);

-- Holds -------------------------------------------------------------------------

create table if not exists stay.holds (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  property_id     uuid not null references stay.properties(id),
  room_type_id    uuid not null references stay.room_types(id),
  rate_plan_id    uuid not null references stay.rate_plans(id),
  check_in        date not null,
  check_out       date not null,
  rooms           integer not null check (rooms between 1 and 20),
  status          text not null default 'active' check (status in ('active','converted','released','expired')),
  expires_at      timestamptz not null,
  booking_id      uuid,
  idempotency_key text not null unique,
  created_at      timestamptz not null default now(),
  closed_at       timestamptz,
  constraint ck_stay_holds_range check (check_out > check_in)
);
create index if not exists ix_stay_holds_active on stay.holds (expires_at) where status = 'active';

-- Bookings: the stay-specific side of booking.bookings -----------------------------

create table if not exists stay.bookings (
  booking_id          uuid primary key references booking.bookings(id) on delete cascade,
  property_id         uuid not null references stay.properties(id),
  room_type_id        uuid not null references stay.room_types(id),
  rate_plan_id        uuid not null references stay.rate_plans(id),
  hold_id             uuid references stay.holds(id),
  user_id             uuid not null,
  service_provider_id uuid not null,
  status              text not null check (status in ('pending_payment','requested','confirmed','declined','cancelled','completed','no_show','expired')),
  confirmation_mode   text not null check (confirmation_mode in ('instant','request')),
  check_in            date not null,
  check_out           date not null,
  nights              integer not null check (nights >= 1),
  rooms               integer not null check (rooms >= 1),
  adults              integer not null check (adults >= 1),
  children            integer not null default 0 check (children >= 0),
  child_ages          smallint[] not null default '{}',
  currency_code       varchar(10) not null,
  total_amount        numeric(18,2) not null check (total_amount >= 0),
  price_snapshot      jsonb not null,
  policy_id           uuid references stay.policies(id),
  policy_snapshot     jsonb not null,
  policy_accepted_at  timestamptz not null,
  content_snapshot    jsonb not null,
  ui_locale           text not null,
  display_calendar    text not null check (display_calendar in ('gregory','persian','islamic-umalqura')),
  buyer               jsonb not null,
  guests              jsonb not null default '[]'::jsonb,
  special_requests    text check (char_length(special_requests) <= 1000),
  arrival_time        text check (arrival_time is null or arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  voucher_code        text not null unique,
  idempotency_key     text not null unique,
  request_expires_at  timestamptz,
  payment_deadline_at timestamptz,
  confirmed_at        timestamptz,
  cancelled_at        timestamptz,
  cancel_reason       text,
  refund_quote        jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint ck_stay_bookings_range check (check_out > check_in),
  constraint ck_stay_bookings_children check (cardinality(child_ages) = children)
);
create index if not exists ix_stay_bookings_user on stay.bookings (user_id, created_at desc);
create index if not exists ix_stay_bookings_property on stay.bookings (property_id, check_in);
create index if not exists ix_stay_bookings_deadlines on stay.bookings (status, payment_deadline_at, request_expires_at);

create table if not exists stay.booking_events (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references stay.bookings(booking_id) on delete cascade,
  event_type    text not null,
  dedupe_key    text unique,
  payload       jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at    timestamptz not null default now()
);
create index if not exists ix_stay_booking_events on stay.booking_events (booking_id, created_at);

-- Reviews (only completed stays, one per booking) --------------------------------------

create table if not exists stay.reviews (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null unique references stay.bookings(booking_id),
  property_id       uuid not null references stay.properties(id) on delete cascade,
  user_id           uuid not null,
  rating            smallint not null check (rating between 1 and 5),
  cleanliness       smallint check (cleanliness between 1 and 5),
  location          smallint check (location between 1 and 5),
  staff             smallint check (staff between 1 and 5),
  value             smallint check (value between 1 and 5),
  body              text check (char_length(body) <= 3000),
  locale            text not null default 'fa-IR',
  author_name       text,
  status            text not null default 'pending' check (status in ('pending','published','hidden','rejected')),
  moderation_reason text,
  provider_reply    text check (char_length(provider_reply) <= 2000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists ix_stay_reviews_property on stay.reviews (property_id, status, created_at desc);

-- Customer state --------------------------------------------------------------------

create table if not exists stay.customer_state (
  user_id            uuid primary key,
  intro_completed_at timestamptz,
  updated_at         timestamptz not null default now()
);

create table if not exists stay.wishlist (
  user_id     uuid not null,
  property_id uuid not null references stay.properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table if not exists stay.recent_views (
  owner_key   text not null,
  property_id uuid not null references stay.properties(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (owner_key, property_id)
);
create index if not exists ix_stay_recent_views_owner on stay.recent_views (owner_key, viewed_at desc);

create table if not exists stay.audit_log (
  id            bigint generated by default as identity primary key,
  actor_user_id uuid,
  property_id   uuid,
  entity_type   text not null,
  entity_id     uuid,
  action        text not null,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists ix_stay_audit_entity on stay.audit_log (entity_type, entity_id, created_at desc);
create index if not exists ix_stay_audit_property on stay.audit_log (property_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Booking anchor
-- ---------------------------------------------------------------------------

do $$
declare
  v_category uuid;
  v_definition constant uuid := '0190a7e0-7a11-7c00-8000-000000005701';
begin
  select id into v_category
    from category.categories
   where parent_id is null
     and (name_translations->>'en-US' ilike 'tourism' or name_translations->>'fa-IR' = 'گردشگری')
   order by create_date
   limit 1;
  if v_category is null then
    -- Created by 0079 on bare databases; fall back to its fixed id.
    v_category := '0190a7e0-7a11-7c00-8000-000000007040';
  end if;

  insert into category.service_definitions
    (id, name_translations, description_translations, category_id, duration_minutes,
     pricing_model, is_active, currency, value, create_date, requires_specialist, booking_ui_mode)
  values
    (v_definition,
     '{"en-US":"Accommodation stay","fa-IR":"رزرو اقامت","ar-SA":"حجز إقامة"}',
     '{"en-US":"Bookable hotel or accommodation stay","fa-IR":"رزرو هتل یا اقامتگاه"}',
     v_category, 0, 'fixed', true, 'IRR', 0, now(), false, 'custom_form')
  on conflict (id) do nothing;

  insert into stay.settings (key, value) values ('booking_service_definition_id', to_jsonb(v_definition::text))
  on conflict (key) do nothing;
end $$;

-- Creates or refreshes the inactive provider_service row bookings reference
-- (inactive so the generic catalog and booking-pro wizard never sell it).
create or replace function stay.ensure_booking_anchor(p_property_id uuid)
returns uuid
language plpgsql
as $$
declare
  p stay.properties%rowtype;
  v_definition uuid;
  v_anchor uuid;
begin
  select * into p from stay.properties where id = p_property_id for update;
  if not found then raise exception 'PROPERTY_NOT_FOUND' using errcode = 'P0002'; end if;
  select (value #>> '{}')::uuid into v_definition from stay.settings where key = 'booking_service_definition_id';

  if p.provider_service_id is null then
    v_anchor := gen_random_uuid();
    insert into category.provider_services
      (id, service_definition_id, display_name_translations, description_translations, is_active,
       service_provider_id, currency, value, create_date, duration_minutes, tags)
    values
      (v_anchor, v_definition, p.name, '{}'::jsonb, false,
       p.service_provider_id, p.currency_code, coalesce(p.from_price, 0), now(), 1440, array['stay', 'stay-booking-anchor']);
    update stay.properties set provider_service_id = v_anchor where id = p.id;
  else
    v_anchor := p.provider_service_id;
    update category.provider_services
       set display_name_translations = p.name, is_active = false, currency = p.currency_code,
           value = coalesce(p.from_price, 0), tags = array['stay', 'stay-booking-anchor'], last_modified_date = now()
     where id = v_anchor;
  end if;
  return v_anchor;
end $$;

-- ---------------------------------------------------------------------------
-- Inventory functions
-- ---------------------------------------------------------------------------

-- Locks every night of [p_check_in, p_check_out) for a room type, in date order.
-- Missing inventory rows are created first so there is always a row to lock.
create or replace function stay.lock_nights(p_room_type uuid, p_check_in date, p_check_out date)
returns setof stay.inventory
language plpgsql
as $$
begin
  insert into stay.inventory (room_type_id, stay_date)
  select p_room_type, d::date from generate_series(p_check_in, p_check_out - 1, interval '1 day') d
  on conflict do nothing;
  return query
    select * from stay.inventory
     where room_type_id = p_room_type and stay_date >= p_check_in and stay_date < p_check_out
     order by stay_date
     for update;
end $$;

-- Places a hold. Idempotent per key. Raises:
--   ROOM_TYPE_NOT_FOUND, PROPERTY_UNAVAILABLE, INVALID_DATES, MIN_NIGHTS, MAX_NIGHTS,
--   CLOSED_TO_ARRIVAL, STOP_SELL, INSUFFICIENT_INVENTORY, IDEMPOTENCY_KEY_CONFLICT
create or replace function stay.place_hold(
  p_room_type uuid, p_rate_plan uuid, p_user uuid, p_check_in date, p_check_out date,
  p_rooms integer, p_minutes integer, p_key text)
returns stay.holds
language plpgsql
as $$
declare
  h stay.holds%rowtype;
  rt stay.room_types%rowtype;
  rp stay.rate_plans%rowtype;
  pr stay.properties%rowtype;
  inv stay.inventory%rowtype;
  v_nights integer := p_check_out - p_check_in;
  v_min integer;
begin
  select * into h from stay.holds where idempotency_key = p_key;
  if found then
    if h.user_id <> p_user or h.room_type_id <> p_room_type or h.check_in <> p_check_in
       or h.check_out <> p_check_out or h.rooms <> p_rooms then
      raise exception 'IDEMPOTENCY_KEY_CONFLICT';
    end if;
    return h;
  end if;

  select * into rt from stay.room_types where id = p_room_type;
  if not found or not rt.is_active then raise exception 'ROOM_TYPE_NOT_FOUND'; end if;
  select * into rp from stay.rate_plans where id = p_rate_plan and room_type_id = p_room_type;
  if not found or not rp.is_active then raise exception 'ROOM_TYPE_NOT_FOUND'; end if;
  select * into pr from stay.properties where id = rt.property_id;
  if pr.status <> 'published' then raise exception 'PROPERTY_UNAVAILABLE'; end if;

  if p_check_out <= p_check_in or p_rooms < 1 then raise exception 'INVALID_DATES'; end if;
  if p_check_in < (now() at time zone pr.timezone)::date then raise exception 'INVALID_DATES'; end if;
  if pr.inventory_model = 'entire_place' and p_rooms <> 1 then raise exception 'INSUFFICIENT_INVENTORY'; end if;
  if v_nights > rp.max_nights then raise exception 'MAX_NIGHTS'; end if;

  -- Legacy booking-pro may still sell an imported entire-place provider by night
  -- (provider_portal.hotel_date_availability, 0020). Respect its locks.
  if pr.inventory_model = 'entire_place' and to_regclass('provider_portal.hotel_date_availability') is not null then
    if exists (select 1 from provider_portal.hotel_date_availability
                where service_provider_id = pr.service_provider_id
                  and stay_date >= p_check_in and stay_date < p_check_out) then
      raise exception 'INSUFFICIENT_INVENTORY';
    end if;
  end if;

  v_min := rp.min_nights;
  for inv in select * from stay.lock_nights(p_room_type, p_check_in, p_check_out) loop
    if inv.stay_date = p_check_in then
      if inv.closed_to_arrival then raise exception 'CLOSED_TO_ARRIVAL'; end if;
      v_min := greatest(v_min, coalesce(inv.min_nights, 0));
    end if;
    if inv.stop_sell then raise exception 'STOP_SELL'; end if;
    if coalesce(inv.units_override, rt.units) - inv.sold - inv.held < p_rooms then
      raise exception 'INSUFFICIENT_INVENTORY';
    end if;
  end loop;
  if v_nights < v_min then raise exception 'MIN_NIGHTS'; end if;

  update stay.inventory set held = held + p_rooms, updated_at = now()
   where room_type_id = p_room_type and stay_date >= p_check_in and stay_date < p_check_out;

  insert into stay.holds (user_id, property_id, room_type_id, rate_plan_id, check_in, check_out, rooms, expires_at, idempotency_key)
  values (p_user, pr.id, p_room_type, p_rate_plan, p_check_in, p_check_out, p_rooms,
          now() + make_interval(mins => greatest(p_minutes, 1)), p_key)
  returning * into h;
  return h;
end $$;

-- Releases an active hold (customer abandoned checkout). Returns true if released.
create or replace function stay.release_hold(p_hold uuid, p_user uuid, p_status text default 'released')
returns boolean
language plpgsql
as $$
declare h stay.holds%rowtype;
begin
  select * into h from stay.holds where id = p_hold for update;
  if not found or h.status <> 'active' or (p_user is not null and h.user_id <> p_user) then return false; end if;
  perform 1 from stay.lock_nights(h.room_type_id, h.check_in, h.check_out);
  update stay.inventory set held = greatest(held - h.rooms, 0), updated_at = now()
   where room_type_id = h.room_type_id and stay_date >= h.check_in and stay_date < h.check_out;
  update stay.holds set status = p_status, closed_at = now() where id = h.id;
  return true;
end $$;

create or replace function stay.expire_holds()
returns integer
language plpgsql
as $$
declare r record; n integer := 0;
begin
  for r in select id from stay.holds where status = 'active' and expires_at <= now() order by expires_at limit 500 loop
    if stay.release_hold(r.id, null, 'expired') then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- Turns an active, unexpired hold into sold inventory for a booking.
create or replace function stay.convert_hold(p_hold uuid, p_user uuid, p_booking uuid)
returns void
language plpgsql
as $$
declare h stay.holds%rowtype;
begin
  select * into h from stay.holds where id = p_hold for update;
  if not found or h.user_id <> p_user then raise exception 'HOLD_NOT_FOUND'; end if;
  if h.status <> 'active' or h.expires_at <= now() then raise exception 'HOLD_EXPIRED'; end if;
  perform 1 from stay.lock_nights(h.room_type_id, h.check_in, h.check_out);
  update stay.inventory set held = greatest(held - h.rooms, 0), sold = sold + h.rooms, updated_at = now()
   where room_type_id = h.room_type_id and stay_date >= h.check_in and stay_date < h.check_out;
  update stay.holds set status = 'converted', booking_id = p_booking, closed_at = now() where id = h.id;
end $$;

-- Closes a live booking (cancelled / declined / expired / no_show) and returns its
-- nights to inventory exactly once. Returns 1 if this call made the transition.
create or replace function stay.close_booking(p_booking uuid, p_status text, p_reason text)
returns integer
language plpgsql
as $$
declare b stay.bookings%rowtype;
begin
  if p_status not in ('cancelled','declined','expired','no_show') then raise exception 'INVALID_TERMINAL_STATUS'; end if;
  select * into b from stay.bookings where booking_id = p_booking for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if b.status not in ('pending_payment','requested','confirmed') then return 0; end if;
  if p_status <> 'no_show' then
    perform 1 from stay.lock_nights(b.room_type_id, b.check_in, b.check_out);
    update stay.inventory set sold = greatest(sold - b.rooms, 0), updated_at = now()
     where room_type_id = b.room_type_id and stay_date >= b.check_in and stay_date < b.check_out;
  end if;
  update stay.bookings
     set status = p_status, cancelled_at = case when p_status in ('cancelled','declined','expired') then now() else cancelled_at end,
         cancel_reason = p_reason, updated_at = now()
   where booking_id = p_booking;
  insert into stay.booking_events (booking_id, event_type, dedupe_key, payload)
  values (p_booking, p_status, p_status || ':' || p_booking, jsonb_build_object('reason', p_reason))
  on conflict (dedupe_key) do nothing;
  return 1;
end $$;

-- Admin capacity edit for a date range: never below what is sold + held.
create or replace function stay.set_inventory(
  p_room_type uuid, p_from date, p_to date, p_units integer, p_stop_sell boolean,
  p_closed_to_arrival boolean, p_min_nights integer)
returns integer
language plpgsql
as $$
declare inv stay.inventory%rowtype; n integer := 0;
begin
  if p_to <= p_from or p_to - p_from > 400 then raise exception 'INVALID_DATES'; end if;
  for inv in select * from stay.lock_nights(p_room_type, p_from, p_to) loop
    if p_units is not null and p_units < inv.sold + inv.held then
      raise exception 'UNITS_BELOW_BOOKED' using detail = inv.stay_date::text;
    end if;
    n := n + 1;
  end loop;
  update stay.inventory
     set units_override = coalesce(p_units, units_override),
         stop_sell = coalesce(p_stop_sell, stop_sell),
         closed_to_arrival = coalesce(p_closed_to_arrival, closed_to_arrival),
         min_nights = case when p_min_nights = 0 then null else coalesce(p_min_nights, min_nights) end,
         updated_at = now()
   where room_type_id = p_room_type and stay_date >= p_from and stay_date < p_to;
  return n;
end $$;

-- Room-type unit reductions must not strand existing bookings.
create or replace function stay.guard_room_type_units()
returns trigger
language plpgsql
as $$
begin
  if new.units < old.units and exists (
    select 1 from stay.inventory i
     where i.room_type_id = new.id and i.units_override is null
       and i.stay_date >= current_date and i.sold + i.held > new.units) then
    raise exception 'UNITS_BELOW_BOOKED';
  end if;
  return new;
end $$;

drop trigger if exists trg_stay_room_type_units on stay.room_types;
create trigger trg_stay_room_type_units before update of units on stay.room_types
for each row execute function stay.guard_room_type_units();

-- Search text: every translation of the name, summary and address, plus slug and kind.
create or replace function stay.properties_search_text()
returns trigger
language plpgsql
as $$
begin
  -- Folded like normalizeSearchText(): Arabic yeh/kaf/alef/teh-marbuta variants -> Persian forms.
  new.search_text := translate(lower(concat_ws(' ', new.slug, new.kind,
    (select string_agg(value, ' ') from jsonb_each_text(coalesce(new.name, '{}'::jsonb))),
    (select string_agg(value, ' ') from jsonb_each_text(coalesce(new.summary, '{}'::jsonb))),
    (select string_agg(value, ' ') from jsonb_each_text(coalesce(new.address, '{}'::jsonb))))), 'يىكأإآٱةؤ', 'ییکااااهو');
  return new;
end $$;

drop trigger if exists trg_stay_properties_search on stay.properties;
create trigger trg_stay_properties_search before insert or update of name, summary, address, slug, kind on stay.properties
for each row execute function stay.properties_search_text();

-- "From" price: the cheapest active rate plan of an active room type.
create or replace function stay.refresh_from_price(p_property uuid)
returns void
language sql
as $$
  update stay.properties p
     set from_price = (select min(rp.base_price) from stay.rate_plans rp join stay.room_types rt on rt.id = rp.room_type_id
                        where rp.property_id = p_property and rp.is_active and rt.is_active)
   where p.id = p_property
$$;

create or replace function stay.rate_plans_from_price()
returns trigger
language plpgsql
as $$
begin
  perform stay.refresh_from_price(coalesce(new.property_id, old.property_id));
  return null;
end $$;

drop trigger if exists trg_stay_rate_plans_from_price on stay.rate_plans;
create trigger trg_stay_rate_plans_from_price after insert or update or delete on stay.rate_plans
for each row execute function stay.rate_plans_from_price();
drop trigger if exists trg_stay_room_types_from_price on stay.room_types;
create trigger trg_stay_room_types_from_price after update of is_active on stay.room_types
for each row execute function stay.rate_plans_from_price();

-- Review aggregates follow published reviews.
create or replace function stay.refresh_rating(p_property uuid)
returns void
language sql
as $$
  update stay.properties p
     set rating_avg = r.avg, review_count = r.n, updated_at = p.updated_at
    from (select round(avg(rating)::numeric, 2) as avg, count(*)::int as n
            from stay.reviews where property_id = p_property and status = 'published') r
   where p.id = p_property
$$;

-- ---------------------------------------------------------------------------
-- Cities: real destinations only (properties are added by admins; the platform
-- never ships invented listings). Cities with no published property stay
-- hidden from customers automatically.
-- ---------------------------------------------------------------------------

insert into stay.cities (slug, name, region, cover_url, cover_alt, cover_credit, latitude, longitude, is_featured, sort_order) values
  ('tehran',  '{"fa-IR":"تهران","en-US":"Tehran","ar-SA":"طهران"}', '{"fa-IR":"استان تهران","en-US":"Tehran Province"}', null, '{}', null, 35.6892, 51.3890, true, 10),
  ('mashhad', '{"fa-IR":"مشهد","en-US":"Mashhad","ar-SA":"مشهد"}', '{"fa-IR":"خراسان رضوی","en-US":"Razavi Khorasan"}', null, '{}', null, 36.2605, 59.6168, true, 20),
  ('shiraz',  '{"fa-IR":"شیراز","en-US":"Shiraz","ar-SA":"شيراز"}', '{"fa-IR":"استان فارس","en-US":"Fars Province"}',
     '/images/tours/shiraz-nasir-al-mulk.webp', '{"fa-IR":"نور رنگی شیشه‌های مسجد نصیرالملک شیراز","en-US":"Coloured light from the stained glass of Nasir al-Mulk Mosque, Shiraz"}',
     'Ayyoubsabawiki · CC BY-SA 4.0', 29.5918, 52.5837, true, 30),
  ('isfahan', '{"fa-IR":"اصفهان","en-US":"Isfahan","ar-SA":"أصفهان"}', '{"fa-IR":"استان اصفهان","en-US":"Isfahan Province"}',
     '/images/tours/isfahan-si-o-se-pol.webp', '{"fa-IR":"پل سی‌وسه‌پل اصفهان","en-US":"Si-o-se Pol bridge, Isfahan"}',
     'Diego Delso · CC BY-SA 4.0', 32.6539, 51.6660, true, 40),
  ('yazd',    '{"fa-IR":"یزد","en-US":"Yazd","ar-SA":"يزد"}', '{"fa-IR":"استان یزد","en-US":"Yazd Province"}',
     '/images/stays/yazd-traditional-courtyard.webp', '{"fa-IR":"حیاط و حوض یک اقامتگاه سنتی در یزد","en-US":"Courtyard pool of a traditional hotel in Yazd"}',
     'Julia Maudlin · CC BY 2.0', 31.8974, 54.3569, true, 50),
  ('kish',    '{"fa-IR":"کیش","en-US":"Kish Island","ar-SA":"كيش"}', '{"fa-IR":"استان هرمزگان","en-US":"Hormozgan Province"}',
     '/images/tours/kish-beach.webp', '{"fa-IR":"ساحل شنی جزیره کیش","en-US":"Sand beach on Kish Island"}',
     'Ivan Mlinaric · CC BY 2.0', 26.5578, 54.0194, true, 60),
  ('tabriz',  '{"fa-IR":"تبریز","en-US":"Tabriz","ar-SA":"تبريز"}', '{"fa-IR":"آذربایجان شرقی","en-US":"East Azerbaijan"}', null, '{}', null, 38.0800, 46.2919, false, 70),
  ('qom',     '{"fa-IR":"قم","en-US":"Qom","ar-SA":"قم"}', '{"fa-IR":"استان قم","en-US":"Qom Province"}', null, '{}', null, 34.6416, 50.8746, false, 80)
on conflict (slug) do nothing;
