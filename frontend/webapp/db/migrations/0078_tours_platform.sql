-- ---------------------------------------------------------------------------
-- 0078 — Tours platform (docs/designs/tours/Tours.md).
--
-- Builds on 0042 (tour.departures) and 0043 (gathering campaigns) without
-- rewriting them. A tour is now a first-class catalog entity (tour.tours)
-- that owns a backing category.provider_services row — the "booking anchor".
-- The anchor is what booking.bookings.service_id points at, so payments,
-- gateway callbacks, refunds, accounting and "my bookings" are reused as-is
-- (C-081). Everything tour-specific lives in this schema.
--
-- Two applications write this schema: the webapp (customer + admin) and
-- lsevin-portal (providers + guides). Invariants that both must respect are
-- therefore enforced here — constraints, triggers and the functions in
-- 0079_tours_functions.sql — not in either application.
--
-- Date/time contract (S-062/S-064):
--   * date-only values           -> `date` (ISO, calendar-neutral)
--   * a departure's local start  -> local_start_date + local_start_time + timezone (IANA)
--   * an absolute instant        -> timestamptz (starts_at, derived from the three above)
--   Formatted Jalali/Hijri strings are never stored for ordering or inventory.
--   The calendar a rule or a date range was *entered* in is recorded separately
--   (entered_calendar / calendar) as CLDR identifiers: gregory | persian | islamic-umalqura.
--
-- Localized text (S-060/S-061/M-028): tour.content holds one row per
-- (entity, field, BCP 47 locale) with its own workflow status. Numbers, prices,
-- coordinates, capacities and ids are never stored per language.
--
-- Additive only: no existing column, constraint or row is changed except the
-- new nullable columns on tour.departures.
-- ---------------------------------------------------------------------------

create schema if not exists tour;
create extension if not exists btree_gist;

-- Shared value domains -------------------------------------------------------

do $$ begin
  create domain tour.calendar_id as text
    check (value in ('gregory', 'persian', 'islamic-umalqura'));
exception when duplicate_object then null; end $$;

do $$ begin
  create domain tour.locale_tag as text
    check (value ~ '^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$');
exception when duplicate_object then null; end $$;

-- Platform settings (M-025/M-026, Q-005/Q-011/Q-012) -------------------------

create table if not exists tour.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into tour.settings (key, value) values
  ('enabled_locales',            '["fa-IR","en-US","ar-SA","tr-TR","ku-KU","de-DE","fr-FR","es-ES","ru-RU","tg-TJ","zh-CN"]'),
  ('default_locale',             '"fa-IR"'),
  ('content_fallback_order',     '["source","en-US","fa-IR"]'),
  ('default_calendar_by_locale', '{"fa":"persian","ar":"islamic-umalqura","*":"gregory"}'),
  ('hijri_convention',           '{"calendar":"islamic-umalqura","officialOffsets":{}}'),
  ('required_publish_locales',   '["source"]'),
  ('hold_minutes',               '15'),
  ('payment_window_minutes',     '30'),
  ('request_to_book_hours',      '24'),
  ('recent_views_limit',         '20'),
  ('recent_views_retention_days','180'),
  ('recent_searches_limit',      '10'),
  ('tracking_retention_days',    '30'),
  ('tracking_stale_seconds',     '120'),
  ('weather',                    '{"provider":"open-meteo","currentTtlMinutes":30,"forecastTtlMinutes":180,"forecastHorizonDays":15,"attribution":"Weather data by Open-Meteo.com"}'),
  ('service_fee_percent',        '0'),
  ('platform_commission_percent','10')
on conflict (key) do nothing;

-- Taxonomy (M-002) ------------------------------------------------------------

create table if not exists tour.taxonomy_terms (
  id                 uuid primary key default gen_random_uuid(),
  kind               text not null check (kind in ('category','tag','transport_mode','difficulty','amenity','inclusion','badge','suitability','age_rule')),
  code               text not null check (code ~ '^[a-z0-9][a-z0-9_-]{0,62}$'),
  label_translations jsonb not null default '{}'::jsonb,
  icon               text,
  sort_order         integer not null default 0,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (kind, code)
);

insert into tour.taxonomy_terms (kind, code, label_translations, sort_order) values
  ('category','city',      '{"en-US":"City","fa-IR":"شهری","ar-SA":"مدينة","tr-TR":"Şehir"}', 10),
  ('category','nature',    '{"en-US":"Nature","fa-IR":"طبیعت‌گردی","ar-SA":"طبيعة","tr-TR":"Doğa"}', 20),
  ('category','culture',   '{"en-US":"Culture & history","fa-IR":"فرهنگی و تاریخی","ar-SA":"ثقافة وتاريخ","tr-TR":"Kültür"}', 30),
  ('category','adventure', '{"en-US":"Adventure","fa-IR":"ماجراجویی","ar-SA":"مغامرة","tr-TR":"Macera"}', 40),
  ('category','wellness',  '{"en-US":"Wellness","fa-IR":"سلامت و آرامش","ar-SA":"استجمام","tr-TR":"Sağlıklı yaşam"}', 50),
  ('category','religious', '{"en-US":"Pilgrimage","fa-IR":"زیارتی","ar-SA":"زيارة","tr-TR":"Hac / ziyaret"}', 60),
  ('category','walking',   '{"en-US":"Walking","fa-IR":"پیاده‌روی","ar-SA":"مشي","tr-TR":"Yürüyüş"}', 70),
  ('category','food',      '{"en-US":"Food & drink","fa-IR":"غذا و نوشیدنی","ar-SA":"طعام","tr-TR":"Yeme içme"}', 80),
  ('transport_mode','walk',  '{"en-US":"On foot","fa-IR":"پیاده","ar-SA":"سيراً","tr-TR":"Yürüyerek"}', 10),
  ('transport_mode','bus',   '{"en-US":"Bus","fa-IR":"اتوبوس","ar-SA":"حافلة","tr-TR":"Otobüs"}', 20),
  ('transport_mode','van',   '{"en-US":"Van","fa-IR":"ون","ar-SA":"فان","tr-TR":"Minibüs"}', 30),
  ('transport_mode','car',   '{"en-US":"Car","fa-IR":"خودرو","ar-SA":"سيارة","tr-TR":"Araba"}', 40),
  ('transport_mode','boat',  '{"en-US":"Boat","fa-IR":"قایق","ar-SA":"قارب","tr-TR":"Tekne"}', 50),
  ('transport_mode','train', '{"en-US":"Train","fa-IR":"قطار","ar-SA":"قطار","tr-TR":"Tren"}', 60),
  ('transport_mode','flight','{"en-US":"Flight","fa-IR":"پرواز","ar-SA":"طيران","tr-TR":"Uçuş"}', 70),
  ('difficulty','easy',       '{"en-US":"Easy","fa-IR":"آسان","ar-SA":"سهل","tr-TR":"Kolay"}', 10),
  ('difficulty','moderate',   '{"en-US":"Moderate","fa-IR":"متوسط","ar-SA":"متوسط","tr-TR":"Orta"}', 20),
  ('difficulty','challenging','{"en-US":"Challenging","fa-IR":"دشوار","ar-SA":"صعب","tr-TR":"Zor"}', 30),
  ('difficulty','strenuous',  '{"en-US":"Strenuous","fa-IR":"بسیار دشوار","ar-SA":"شاق","tr-TR":"Çok zor"}', 40),
  ('inclusion','admission',  '{"en-US":"Admission tickets","fa-IR":"بلیت ورودی"}', 10),
  ('inclusion','meals',      '{"en-US":"Meals","fa-IR":"وعده‌های غذایی"}', 20),
  ('inclusion','accommodation','{"en-US":"Accommodation","fa-IR":"اقامت"}', 30),
  ('inclusion','flights',    '{"en-US":"Flights","fa-IR":"پرواز"}', 40),
  ('inclusion','local_transport','{"en-US":"Local transport","fa-IR":"حمل‌ونقل محلی"}', 50),
  ('inclusion','equipment',  '{"en-US":"Equipment","fa-IR":"تجهیزات"}', 60),
  ('inclusion','guide',      '{"en-US":"Professional guide","fa-IR":"راهنمای حرفه‌ای"}', 70),
  ('inclusion','taxes',      '{"en-US":"Taxes","fa-IR":"مالیات"}', 80),
  ('suitability','family',      '{"en-US":"Family friendly","fa-IR":"مناسب خانواده"}', 10),
  ('suitability','accessible',  '{"en-US":"Wheelchair accessible","fa-IR":"مناسب ویلچر"}', 20),
  ('suitability','low_mobility','{"en-US":"Low mobility","fa-IR":"تحرک کم"}', 30),
  ('suitability','recovery',    '{"en-US":"Recovery friendly","fa-IR":"مناسب دوران نقاهت"}', 40)
on conflict (kind, code) do nothing;

-- Destinations (M-003) --------------------------------------------------------

create table if not exists tour.destinations (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,80}$'),
  name_translations        jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  region_translations      jsonb not null default '{}'::jsonb,
  country_code             varchar(2),
  latitude                 numeric(10,7),
  longitude                numeric(10,7),
  timezone                 text,
  cover_url                text,
  cover_alt_translations   jsonb not null default '{}'::jsonb,
  is_published             boolean not null default false,
  is_featured              boolean not null default false,
  sort_order               integer not null default 0,
  publish_from             timestamptz,
  publish_until            timestamptz,
  search_text              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint ck_destinations_coordinates check ((latitude is null) = (longitude is null)),
  constraint ck_destinations_window check (publish_until is null or publish_from is null or publish_until > publish_from)
);

-- Tours -----------------------------------------------------------------------

create table if not exists tour.tours (
  id                       uuid primary key default gen_random_uuid(),
  service_provider_id      uuid not null references category.service_providers(id),
  provider_service_id      uuid unique references category.provider_services(id),
  destination_id           uuid references tour.destinations(id),
  slug                     text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,100}$'),
  status                   text not null default 'draft'
                             check (status in ('draft','submitted','approved','published','paused','retired','rejected')),
  tour_type                text not null default 'single_day'
                             check (tour_type in ('single_day','multi_day','self_guided','private_charter','activity')),
  category_codes           text[] not null default '{}',
  tag_codes                text[] not null default '{}',
  transport_modes          text[] not null default '{}',
  difficulty               text check (difficulty in ('easy','moderate','challenging','strenuous')),
  activity_level           smallint check (activity_level between 1 and 5),
  duration_minutes         integer check (duration_minutes > 0),
  duration_days            integer not null default 1 check (duration_days >= 1),
  nights                   integer not null default 0 check (nights >= 0),
  min_participants         integer not null default 1 check (min_participants >= 1),
  max_participants         integer check (max_participants >= 1),
  min_age                  integer check (min_age >= 0),
  max_age                  integer check (max_age >= 0),
  guide_languages          text[] not null default '{}',
  confirmation_mode        text not null default 'instant' check (confirmation_mode in ('instant','request')),
  request_timeout_hours    integer not null default 24 check (request_timeout_hours between 1 and 168),
  booking_cutoff_minutes   integer not null default 120 check (booking_cutoff_minutes >= 0),
  timezone                 text not null default 'Asia/Tehran',
  currency_code            varchar(10) not null,
  from_price               numeric(18,2),
  meeting_lat              numeric(10,7),
  meeting_lng              numeric(10,7),
  end_lat                  numeric(10,7),
  end_lng                  numeric(10,7),
  location_privacy         text not null default 'exact' check (location_privacy in ('exact','approximate')),
  approx_radius_m          integer not null default 1500 check (approx_radius_m between 100 and 50000),
  pickup_available         boolean not null default false,
  private_available        boolean not null default false,
  wheelchair_accessible    boolean not null default false,
  low_mobility_friendly    boolean not null default false,
  family_friendly          boolean not null default false,
  recovery_friendly        boolean not null default false,
  attributes_verified_at   timestamptz,
  attributes_verified_by   uuid,
  source_locale            tour.locale_tag not null default 'fa-IR',
  rating_avg               numeric(3,2),
  review_count             integer not null default 0,
  popularity               integer not null default 0,
  is_featured              boolean not null default false,
  featured_until           timestamptz,
  is_sponsored             boolean not null default false,
  current_policy_version   integer,
  draft_revision           integer not null default 1,
  published_revision       integer,
  published_snapshot       jsonb,
  submitted_at             timestamptz,
  approved_at              timestamptz,
  approved_by              uuid,
  published_at             timestamptz,
  review_note              text,
  duplicated_from          uuid references tour.tours(id),
  created_by               uuid,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  search_text              text,
  constraint ck_tours_participants check (max_participants is null or max_participants >= min_participants),
  constraint ck_tours_ages check (max_age is null or min_age is null or max_age >= min_age),
  constraint ck_tours_meeting check ((meeting_lat is null) = (meeting_lng is null)),
  constraint ck_tours_end check ((end_lat is null) = (end_lng is null))
);
create index if not exists ix_tours_provider on tour.tours (service_provider_id, status);
create index if not exists ix_tours_public on tour.tours (status, destination_id) where status = 'published';
create index if not exists ix_tours_search on tour.tours using gin (search_text gin_trgm_ops);
create index if not exists ix_tours_categories on tour.tours using gin (category_codes);

-- Localized content (S-060/S-061, M-028..M-032, V-062..V-066) ----------------

create table if not exists tour.content (
  id              uuid primary key default gen_random_uuid(),
  tour_id         uuid references tour.tours(id) on delete cascade,
  entity_type     text not null check (entity_type in ('tour','stop','option','addon','faq','guide','notice','policy')),
  entity_id       uuid not null,
  field_key       text not null check (field_key ~ '^[a-z][a-z0-9_]{0,62}$'),
  locale          tour.locale_tag not null,
  draft_value     text,
  published_value text,
  status          text not null default 'draft'
                    check (status in ('missing','draft','submitted','approved','published','outdated')),
  is_source       boolean not null default false,
  revision        integer not null default 1,
  source_revision integer,
  machine_translated boolean not null default false,
  updated_by      uuid,
  updated_at      timestamptz not null default now(),
  approved_by     uuid,
  approved_at     timestamptz,
  published_at    timestamptz,
  unique (entity_type, entity_id, field_key, locale)
);
create index if not exists ix_content_tour on tour.content (tour_id, locale, status);

-- Media (V-014, M-006) ----------------------------------------------------------

create table if not exists tour.media (
  id                   uuid primary key default gen_random_uuid(),
  tour_id              uuid not null references tour.tours(id) on delete cascade,
  kind                 text not null default 'image' check (kind in ('image','video','panorama')),
  url                  text not null check (url ~* '^(https?://|/)'),
  thumbnail_url        text,
  album                text not null default 'main',
  sort_order           integer not null default 0,
  is_cover             boolean not null default false,
  width                integer,
  height               integer,
  byte_size            integer,
  mime_type            text,
  alt_translations     jsonb not null default '{}'::jsonb,
  caption_translations jsonb not null default '{}'::jsonb,
  moderation_status    text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  moderation_note      text,
  created_by           uuid,
  created_at           timestamptz not null default now()
);
create index if not exists ix_media_tour on tour.media (tour_id, album, sort_order);
create unique index if not exists ux_media_one_cover on tour.media (tour_id) where is_cover;

-- Itinerary (V-016, C-050..C-056) -----------------------------------------------

create table if not exists tour.itinerary_stops (
  id                     uuid primary key default gen_random_uuid(),
  tour_id                uuid not null references tour.tours(id) on delete cascade,
  day_number             integer not null check (day_number >= 1),
  position               integer not null check (position >= 1),
  stop_type              text not null default 'activity'
                           check (stop_type in ('meeting','activity','transfer','accommodation','meal','recommendation','finish')),
  latitude               numeric(10,7),
  longitude              numeric(10,7),
  location_exact         boolean not null default true,
  start_time             time,
  duration_minutes       integer check (duration_minutes >= 0),
  transport_mode         text,
  travel_minutes_from_prev integer check (travel_minutes_from_prev >= 0),
  distance_km_from_prev  numeric(8,2) check (distance_km_from_prev >= 0),
  image_url              text,
  included               boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint ck_stops_coordinates check ((latitude is null) = (longitude is null)),
  constraint ux_stops_order unique (tour_id, day_number, position) deferrable initially deferred
);

-- Purchasable options, prices and add-ons (V-018, V-028, C-083/C-084) ----------

create table if not exists tour.options (
  id                  uuid primary key default gen_random_uuid(),
  tour_id             uuid not null references tour.tours(id) on delete cascade,
  code                text not null check (code ~ '^[a-z0-9][a-z0-9_-]{0,40}$'),
  kind                text not null default 'public' check (kind in ('public','private')),
  pickup_included     boolean not null default false,
  guide_language      text,
  min_group           integer not null default 1 check (min_group >= 1),
  max_group           integer check (max_group >= 1),
  private_group_price numeric(18,2) check (private_group_price >= 0),
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  unique (tour_id, code),
  constraint ck_options_private_price check (kind = 'public' or private_group_price is not null),
  constraint ck_options_group check (max_group is null or max_group >= min_group)
);

create table if not exists tour.price_tiers (
  id             uuid primary key default gen_random_uuid(),
  option_id      uuid not null references tour.options(id) on delete cascade,
  traveler_class text not null check (traveler_class in ('adult','child','infant','student','senior')),
  min_age        integer check (min_age >= 0),
  max_age        integer check (max_age >= 0),
  amount         numeric(18,2) not null check (amount >= 0),
  unique (option_id, traveler_class)
);

create table if not exists tour.addons (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid not null references tour.tours(id) on delete cascade,
  code       text not null check (code ~ '^[a-z0-9][a-z0-9_-]{0,40}$'),
  pricing    text not null default 'per_booking' check (pricing in ('per_person','per_booking')),
  amount     numeric(18,2) not null check (amount >= 0),
  max_qty    integer not null default 1 check (max_qty >= 1),
  is_active  boolean not null default true,
  sort_order integer not null default 0,
  unique (tour_id, code)
);

create table if not exists tour.price_rules (
  id               uuid primary key default gen_random_uuid(),
  tour_id          uuid not null references tour.tours(id) on delete cascade,
  option_id        uuid references tour.options(id) on delete cascade,
  date_from        date not null,
  date_to          date not null,
  kind             text not null check (kind in ('percent','amount_delta')),
  value            numeric(18,2) not null,
  entered_calendar tour.calendar_id not null default 'gregory',
  note             text,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  constraint ck_price_rules_range check (date_to >= date_from),
  constraint ck_price_rules_percent check (kind <> 'percent' or value > -100)
);
create index if not exists ix_price_rules_tour on tour.price_rules (tour_id, date_from, date_to);

create table if not exists tour.blackouts (
  id               uuid primary key default gen_random_uuid(),
  tour_id          uuid not null references tour.tours(id) on delete cascade,
  date_from        date not null,
  date_to          date not null,
  reason           text,
  entered_calendar tour.calendar_id not null default 'gregory',
  created_by       uuid,
  created_at       timestamptz not null default now(),
  constraint ck_blackouts_range check (date_to >= date_from)
);
create index if not exists ix_blackouts_tour on tour.blackouts (tour_id, date_from, date_to);

-- Schedules (V-025/V-026, S-065) --------------------------------------------------

create table if not exists tour.schedule_rules (
  id          uuid primary key default gen_random_uuid(),
  tour_id     uuid not null references tour.tours(id) on delete cascade,
  option_id   uuid references tour.options(id) on delete cascade,
  calendar    tour.calendar_id not null,
  kind        text not null check (kind in ('once','weekly','monthly_day')),
  weekdays    smallint[] not null default '{}',   -- ISO weekday 1=Mon..7=Sun
  month_day   smallint check (month_day between 1 and 30),
  local_time  time not null,
  start_date  date not null,
  end_date    date,
  capacity    integer not null check (capacity > 0),
  is_active   boolean not null default true,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  constraint ck_rules_range check (end_date is null or end_date >= start_date),
  constraint ck_rules_kind check (
    (kind = 'once') or
    (kind = 'weekly' and cardinality(weekdays) > 0) or
    (kind = 'monthly_day' and month_day is not null))
);

-- Versioned booking policy (C-040, C-090, M-033, AT-13) -------------------------

create table if not exists tour.policy_versions (
  id                     uuid primary key default gen_random_uuid(),
  tour_id                uuid not null references tour.tours(id) on delete cascade,
  version                integer not null,
  cancellation_rules     jsonb not null default '[]'::jsonb,  -- [{"hoursBefore":48,"refundPercent":100},...]
  no_show_refund_percent integer not null default 0 check (no_show_refund_percent between 0 and 100),
  late_arrival_minutes   integer,
  weather_policy         text not null default 'reschedule_or_refund'
                           check (weather_policy in ('reschedule_or_refund','full_refund','operator_decides','no_refund')),
  texts                  jsonb not null default '{}'::jsonb,   -- {"fa-IR":{"cancellation":"...","rules":"..."}}
  created_by             uuid,
  created_at             timestamptz not null default now(),
  unique (tour_id, version)
);

-- Departures: extend 0042 ---------------------------------------------------------

alter table tour.departures add column if not exists tour_id uuid references tour.tours(id);
alter table tour.departures add column if not exists option_id uuid references tour.options(id);
alter table tour.departures add column if not exists schedule_rule_id uuid references tour.schedule_rules(id) on delete set null;
alter table tour.departures add column if not exists local_start_time time;
alter table tour.departures add column if not exists timezone text;
alter table tour.departures add column if not exists starts_at timestamptz;
alter table tour.departures add column if not exists ends_at timestamptz;
alter table tour.departures add column if not exists booking_cutoff_at timestamptz;
alter table tour.departures add column if not exists held_count integer not null default 0;
alter table tour.departures add column if not exists status text not null default 'scheduled';
alter table tour.departures add column if not exists delay_minutes integer not null default 0;
alter table tour.departures add column if not exists min_to_operate integer;
alter table tour.departures add column if not exists is_blocked boolean not null default false;
alter table tour.departures add column if not exists status_reason text;
alter table tour.departures add column if not exists meeting_override jsonb;
alter table tour.departures add column if not exists itinerary_revision integer;

do $$ begin
  alter table tour.departures add constraint ck_tour_departures_status
    check (status in ('scheduled','delayed','in_progress','completed','cancelled'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table tour.departures add constraint ck_tour_departures_inventory
    check (held_count >= 0 and booked_count + held_count <= capacity);
exception when duplicate_object then null; end $$;

create unique index if not exists ux_departures_slot
  on tour.departures (tour_id, coalesce(option_id, '00000000-0000-0000-0000-000000000000'::uuid), starts_at)
  where tour_id is not null and status <> 'cancelled';
create index if not exists ix_departures_tour_time on tour.departures (tour_id, starts_at) where tour_id is not null;

-- Inventory holds (C-087/C-088, AT-07/AT-08) --------------------------------------

create table if not exists tour.holds (
  id              uuid primary key default gen_random_uuid(),
  departure_id    uuid not null references tour.departures(id),
  user_id         uuid not null,
  seats           integer not null check (seats > 0),
  status          text not null default 'active' check (status in ('active','converted','released','expired')),
  expires_at      timestamptz not null,
  booking_id      uuid,
  idempotency_key text not null unique,
  created_at      timestamptz not null default now(),
  closed_at       timestamptz
);
create index if not exists ix_holds_active_expiry on tour.holds (expires_at) where status = 'active';
create index if not exists ix_holds_user on tour.holds (user_id, created_at desc);

-- Tour bookings: the tour-specific side of booking.bookings ----------------------

create table if not exists tour.bookings (
  booking_id         uuid primary key references booking.bookings(id) on delete cascade,
  tour_id            uuid not null references tour.tours(id),
  departure_id       uuid not null references tour.departures(id),
  option_id          uuid references tour.options(id),
  hold_id            uuid references tour.holds(id),
  user_id            uuid not null,
  service_provider_id uuid not null,
  status             text not null
                       check (status in ('pending_payment','requested','confirmed','declined','cancelled','completed','no_show','expired')),
  confirmation_mode  text not null check (confirmation_mode in ('instant','request')),
  seats              integer not null check (seats > 0),
  travelers          jsonb not null,   -- {"adult":2,"child":1}
  currency_code      varchar(10) not null,
  total_amount       numeric(18,2) not null check (total_amount >= 0),
  price_snapshot     jsonb not null,
  policy_version_id  uuid not null references tour.policy_versions(id),
  policy_snapshot    jsonb not null,
  policy_locale      tour.locale_tag not null,
  policy_accepted_at timestamptz not null,
  content_snapshot   jsonb not null,
  itinerary_revision integer,
  ui_locale          tour.locale_tag not null,
  display_calendar   tour.calendar_id not null,
  buyer              jsonb not null,
  voucher_code       text not null unique,
  qr_token           text not null unique,
  idempotency_key    text not null unique,
  request_expires_at timestamptz,
  payment_deadline_at timestamptz,
  confirmed_at       timestamptz,
  confirmation_notified_at timestamptz,
  cancelled_at       timestamptz,
  cancel_reason      text,
  refund_quote       jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists ix_tour_bookings_user on tour.bookings (user_id, created_at desc);
create index if not exists ix_tour_bookings_departure on tour.bookings (departure_id, status);
create index if not exists ix_tour_bookings_provider on tour.bookings (service_provider_id, status, created_at desc);
create index if not exists ix_tour_bookings_deadlines on tour.bookings (status, payment_deadline_at, request_expires_at);

create table if not exists tour.booking_participants (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references tour.bookings(booking_id) on delete cascade,
  position           integer not null,
  traveler_class     text not null check (traveler_class in ('adult','child','infant','student','senior')),
  first_name         text not null,
  last_name          text not null,
  nationality        varchar(2),
  age                integer check (age between 0 and 120),
  id_document_last4  varchar(4),           -- never the full document number (S-038)
  assistance_request text,                 -- need-to-know only (S-028/S-044)
  is_foreign         boolean not null default false,
  unique (booking_id, position)
);

create table if not exists tour.booking_events (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references tour.bookings(booking_id) on delete cascade,
  event_type    text not null,
  dedupe_key    text unique,
  payload       jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at    timestamptz not null default now()
);
create index if not exists ix_booking_events_booking on tour.booking_events (booking_id, created_at);

-- Check-in (V-039, AT-18) ----------------------------------------------------------

create table if not exists tour.checkins (
  id              uuid primary key default gen_random_uuid(),
  departure_id    uuid not null references tour.departures(id),
  booking_id      uuid references tour.bookings(booking_id),
  scanned_token   text not null,
  result          text not null check (result in ('accepted','duplicate','wrong_departure','invalid','cancelled_booking')),
  seats           integer not null default 0,
  scanned_by      uuid not null,
  device_id       text,
  client_event_id text unique,
  scanned_at      timestamptz not null,
  received_at     timestamptz not null default now()
);
create unique index if not exists ux_checkins_one_accept on tour.checkins (booking_id) where result = 'accepted';

-- Guides, resources and assignments (V-030, V-048..V-055, AT-17) ------------------

create table if not exists tour.guides (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique,
  display_name   text not null,
  photo_url      text,
  languages      jsonb not null default '[]'::jsonb,   -- [{"code":"en","level":"fluent"}]
  destinations   text[] not null default '{}',
  specialties    text[] not null default '{}',
  status         text not null default 'pending' check (status in ('pending','verified','suspended')),
  contact_policy text not null default 'via_platform' check (contact_policy in ('via_platform','phone_during_tour')),
  public_phone   text,
  emergency_trained boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists tour.guide_qualifications (
  id                  uuid primary key default gen_random_uuid(),
  guide_id            uuid not null references tour.guides(id) on delete cascade,
  kind                text not null,
  issuer              text,
  country_code        varchar(2),
  reference_last4     varchar(4),
  document_url        text,             -- private; never rendered to customers
  expires_on          date,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','expired')),
  verified_by         uuid,
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists tour.provider_guides (
  service_provider_id uuid not null references category.service_providers(id),
  guide_id            uuid not null references tour.guides(id) on delete cascade,
  status              text not null default 'invited' check (status in ('invited','active','revoked')),
  publish_bio         boolean not null default true,
  invited_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (service_provider_id, guide_id)
);

create table if not exists tour.resources (
  id                  uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id),
  kind                text not null check (kind in ('vehicle','equipment','other')),
  name                text not null,
  capacity            integer,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table if not exists tour.departure_assignments (
  id            uuid primary key default gen_random_uuid(),
  departure_id  uuid not null references tour.departures(id) on delete cascade,
  guide_id      uuid references tour.guides(id),
  resource_id   uuid references tour.resources(id),
  role          text not null default 'guide' check (role in ('lead_guide','guide','driver','vehicle','equipment')),
  status        text not null default 'assigned' check (status in ('assigned','accepted','declined','revoked')),
  during        tstzrange not null,
  override_reason text,
  assigned_by   uuid,
  assigned_at   timestamptz not null default now(),
  constraint ck_assignment_target check ((guide_id is null) <> (resource_id is null))
);
-- One guide / one resource cannot be in two live assignments that overlap in
-- time, unless the overlap was explicitly overridden (override_reason set).
do $$ begin
  alter table tour.departure_assignments add constraint ex_guide_overlap
    exclude using gist (guide_id with =, during with &&)
    where (guide_id is not null and status in ('assigned','accepted') and override_reason is null);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table tour.departure_assignments add constraint ex_resource_overlap
    exclude using gist (resource_id with =, during with &&)
    where (resource_id is not null and status in ('assigned','accepted') and override_reason is null);
exception when duplicate_object then null; end $$;

-- Live tracking (C-070..C-080, AT-19/AT-20) ----------------------------------------

create table if not exists tour.tracking_sessions (
  id              uuid primary key default gen_random_uuid(),
  departure_id    uuid not null references tour.departures(id),
  started_by      uuid not null,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  end_reason      text check (end_reason in ('manual','completed','cancelled','expired','admin_disabled')),
  retention_until timestamptz,
  last_seq        integer not null default 0,
  last_recorded_at timestamptz
);
create unique index if not exists ux_tracking_one_active on tour.tracking_sessions (departure_id) where ended_at is null;

create table if not exists tour.tracking_points (
  id          bigserial primary key,
  session_id  uuid not null references tour.tracking_sessions(id) on delete cascade,
  seq         integer not null,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude    numeric(10,7) not null check (latitude between -90 and 90),
  longitude   numeric(10,7) not null check (longitude between -180 and 180),
  accuracy_m  numeric(8,2),
  unique (session_id, seq)
);

create table if not exists tour.milestones (
  id            uuid primary key default gen_random_uuid(),
  departure_id  uuid not null references tour.departures(id),
  kind          text not null check (kind in ('departed','arrived_stop','delayed','completed','note')),
  stop_id       uuid references tour.itinerary_stops(id) on delete set null,
  delay_minutes integer,
  note          text,
  created_by    uuid not null,
  created_at    timestamptz not null default now()
);

-- Operator notices (V-042/V-043/V-068, C-077, AT-21/AT-46) -------------------------

create table if not exists tour.notices (
  id            uuid primary key default gen_random_uuid(),
  departure_id  uuid not null references tour.departures(id),
  kind          text not null check (kind in ('delay','cancellation','meeting_point_change','pickup_update','weather_hold','route_substitution','announcement','safety','itinerary_change','guide_change')),
  reason_code   text,
  effective_at  timestamptz not null,
  source_locale tour.locale_tag not null,
  texts         jsonb not null,   -- {"fa-IR":{"title":"..","body":".."},"en-US":{...}}
  payload       jsonb not null default '{}'::jsonb,
  created_by    uuid not null,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

create table if not exists tour.notice_deliveries (
  notice_id       uuid not null references tour.notices(id) on delete cascade,
  booking_id      uuid not null references tour.bookings(booking_id) on delete cascade,
  user_id         uuid not null,
  locale_used     tour.locale_tag not null,
  fell_back       boolean not null default false,
  notification_id uuid,
  created_at      timestamptz not null default now(),
  primary key (notice_id, booking_id)
);

-- Itinerary change log (C-056, V-021) ----------------------------------------------

create table if not exists tour.revisions (
  id          uuid primary key default gen_random_uuid(),
  tour_id     uuid not null references tour.tours(id) on delete cascade,
  revision    integer not null,
  snapshot    jsonb not null,
  material_change boolean not null default false,
  change_summary text,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  unique (tour_id, revision)
);

-- Weather cache (C-063..C-069, AT-05) ----------------------------------------------

create table if not exists tour.weather_cache (
  cache_key   text primary key,      -- "<kind>:<lat3>,<lng3>:<date|now>"
  kind        text not null check (kind in ('current','daily')),
  latitude    numeric(8,3) not null,
  longitude   numeric(8,3) not null,
  target_date date,
  payload     jsonb not null,
  source      text not null,
  fetched_at  timestamptz not null,
  expires_at  timestamptz not null
);

-- Customer state (C-002/C-004, C-009, C-030, C-103/C-104, C-107, C-110) --------------

create table if not exists tour.customer_state (
  user_id                uuid primary key,
  intro_completed_at     timestamptz,
  display_calendar       tour.calendar_id,
  currency_code          varchar(10),
  interests              text[] not null default '{}',
  personalization_opt_in boolean not null default false,
  history_opt_in         boolean not null default true,
  notification_channels  jsonb not null default '{"in_app":true,"email":true,"sms":false,"push":true}'::jsonb,
  marketing_opt_in       boolean not null default false,
  updated_at             timestamptz not null default now()
);

create table if not exists tour.recent_views (
  owner_key  text not null,          -- 'u:<user uuid>' or 'g:<guest cookie>'
  tour_id    uuid not null references tour.tours(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  view_count integer not null default 1,
  primary key (owner_key, tour_id)
);
create index if not exists ix_recent_views_owner on tour.recent_views (owner_key, viewed_at desc);

create table if not exists tour.recent_searches (
  id         uuid primary key default gen_random_uuid(),
  owner_key  text not null,
  query      text not null default '',
  filters    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ix_recent_searches_owner on tour.recent_searches (owner_key, created_at desc);

create table if not exists tour.wishlist (
  user_id    uuid not null,
  tour_id    uuid not null references tour.tours(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tour_id)
);

create table if not exists tour.checklist_items (
  booking_id uuid not null references tour.bookings(booking_id) on delete cascade,
  item_key   text not null,
  label      text not null,
  done       boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (booking_id, item_key)
);

create table if not exists tour.share_links (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references tour.bookings(booking_id) on delete cascade,
  token       text not null unique,
  scope       text[] not null default '{itinerary,meeting_point}',
  created_by  uuid not null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists tour.trip_plan_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  item_type   text not null check (item_type in ('tour_booking','service_booking','note')),
  ref_id      uuid,
  note        text,
  starts_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, item_type, ref_id)
);

-- Reviews (C-047, C-108, C-120, V-024, V-056, M-034) -------------------------------

create table if not exists tour.reviews (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references tour.bookings(booking_id),
  tour_id         uuid not null references tour.tours(id),
  user_id         uuid not null,
  rating          smallint not null check (rating between 1 and 5),
  guide_rating    smallint check (guide_rating between 1 and 5),
  body            text not null default '',
  locale          tour.locale_tag not null,
  status          text not null default 'pending' check (status in ('pending','published','rejected','hidden')),
  moderation_note text,
  provider_reply  text,
  reply_status    text check (reply_status in ('pending','published','rejected')),
  reply_at        timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists ix_reviews_tour on tour.reviews (tour_id, status, created_at desc);

create table if not exists tour.review_translations (
  review_id   uuid not null references tour.reviews(id) on delete cascade,
  locale      tour.locale_tag not null,
  body        text not null,
  is_machine  boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (review_id, locale)
);

create table if not exists tour.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references tour.reviews(id) on delete cascade,
  reporter_id uuid not null,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','upheld','dismissed')),
  created_at  timestamptz not null default now(),
  unique (review_id, reporter_id)
);

-- Waitlist, inquiries (C-100, C-101, V-035) ----------------------------------------

create table if not exists tour.waitlist (
  id               uuid primary key default gen_random_uuid(),
  departure_id     uuid not null references tour.departures(id),
  user_id          uuid not null,
  seats            integer not null check (seats > 0),
  status           text not null default 'waiting' check (status in ('waiting','offered','converted','expired','cancelled')),
  consent_at       timestamptz not null,
  offer_expires_at timestamptz,
  created_at       timestamptz not null default now(),
  unique (departure_id, user_id)
);

create table if not exists tour.inquiries (
  id               uuid primary key default gen_random_uuid(),
  tour_id          uuid not null references tour.tours(id),
  user_id          uuid not null,
  kind             text not null check (kind in ('private_quote','group')),
  party_size       integer not null check (party_size > 0),
  preferred_dates  date[] not null default '{}',
  message          text not null default '',
  status           text not null default 'open' check (status in ('open','quoted','accepted','declined','expired')),
  quote_amount     numeric(18,2),
  quote_currency   varchar(10),
  quote_expires_at timestamptz,
  provider_reply   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Operations: incidents, disputes, commissions, audit (M-015..M-019, V-046) --------

create table if not exists tour.incidents (
  id            uuid primary key default gen_random_uuid(),
  departure_id  uuid references tour.departures(id),
  service_provider_id uuid,
  severity      text not null check (severity in ('low','medium','high','critical')),
  kind          text not null,
  description   text not null,
  status        text not null default 'open' check (status in ('open','escalated','resolved')),
  reported_by   uuid not null,
  escalated_at  timestamptz,
  resolved_at   timestamptz,
  resolution    text,
  created_at    timestamptz not null default now()
);

create table if not exists tour.disputes (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references tour.bookings(booking_id),
  kind           text not null check (kind in ('cancellation','refund_exception','chargeback','complaint')),
  reason_code    text not null,
  status         text not null default 'open' check (status in ('open','pending_approval','approved','rejected','closed')),
  amount         numeric(18,2),
  approval_level text not null default 'agent' check (approval_level in ('agent','manager','finance')),
  notes          text,
  opened_by      uuid not null,
  decided_by     uuid,
  decided_at     timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists tour.commission_agreements (
  id                  uuid primary key default gen_random_uuid(),
  service_provider_id uuid references category.service_providers(id),   -- null = platform default
  commission_percent  numeric(5,2) not null check (commission_percent between 0 and 100),
  effective_from      date not null,
  effective_to        date,
  created_by          uuid,
  created_at          timestamptz not null default now()
);

create table if not exists tour.audit_log (
  id                  bigserial primary key,
  actor_user_id       uuid,
  actor_scope         text not null,             -- 'admin' | 'provider:<id>' | 'guide' | 'customer' | 'system'
  service_provider_id uuid,
  entity_type         text not null,
  entity_id           uuid,
  action              text not null,
  detail              jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists ix_audit_entity on tour.audit_log (entity_type, entity_id, created_at desc);
create index if not exists ix_audit_provider on tour.audit_log (service_provider_id, created_at desc);

-- Editorial (C-010..C-015, M-004, M-009, M-012) -------------------------------------

create table if not exists tour.editorial_modules (
  id                    uuid primary key default gen_random_uuid(),
  kind                  text not null check (kind in ('hero','onboarding','collection','offers','popular_destinations')),
  code                  text not null unique check (code ~ '^[a-z0-9][a-z0-9_-]{0,62}$'),
  title_translations    jsonb not null default '{}'::jsonb,
  subtitle_translations jsonb not null default '{}'::jsonb,
  cta_translations      jsonb not null default '{}'::jsonb,
  image_url             text,
  rules                 jsonb not null default '{}'::jsonb,   -- {"categories":["family"],"maxItems":10}
  tour_ids              uuid[] not null default '{}',
  destination_ids       uuid[] not null default '{}',
  is_sponsored          boolean not null default false,
  experiment            jsonb,                                -- {"key":"hero-copy","variants":["a","b"]}
  sort_order            integer not null default 0,
  status                text not null default 'draft' check (status in ('draft','published')),
  publish_from          timestamptz,
  publish_until         timestamptz,
  updated_by            uuid,
  updated_at            timestamptz not null default now()
);

-- Translation governance (M-030, S-070) ---------------------------------------------

create table if not exists tour.translator_assignments (
  user_id             uuid not null,
  locale              tour.locale_tag not null,
  service_provider_id uuid,              -- null = all providers
  granted_by          uuid,
  created_at          timestamptz not null default now(),
  primary key (user_id, locale)
);

create table if not exists tour.glossary (
  term_key   text not null,
  locale     tour.locale_tag not null,
  value      text not null,
  note       text,
  updated_at timestamptz not null default now(),
  primary key (term_key, locale)
);
