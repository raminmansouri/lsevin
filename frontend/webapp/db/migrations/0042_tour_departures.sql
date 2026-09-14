-- ---------------------------------------------------------------------------
-- 0042 — Multi-day tours with fixed departure dates (item 8, first half).
--
-- The tour's content and listing need nothing new: admin authors it as a
-- regular category.provider_services row (rich Lexical description already
-- supported there) via the existing saveProviderServiceAction, and adds
-- itinerary/what's-included/FAQ content through the existing
-- service_faqs/service_included/service_process admin screens
-- (provider-portal's ServiceContentManager). Add-ons and the unified
-- cart/invoice are likewise already-built, already-generic machinery.
--
-- What's missing is fixed departures with shared capacity -- explicitly NOT
-- the same problem hotels solve. A hotel's `date_range` booking
-- (reserveHotelDates -> provider_portal.hotel_date_availability) reserves
-- one EXCLUSIVE night per provider per date: it has no notion of capacity,
-- because a room sleeps one party. A tour departure is the opposite: many
-- customers share the same fixed dates up to a headcount. Reusing
-- `date_range`/hotel machinery for tours would silently cap every departure
-- at one booking and block the provider from running a second, differently-
-- dated departure on overlapping nights -- wrong model entirely. Tours get
-- their own table instead.
--
-- Customers pick a departure from a short, explicit list (not a calendar);
-- picking one just sets the draft's existing selected_date_from/to fields
-- (so pricing/invoice display need no changes) and records which departure
-- was chosen in metadata, the same extension point used for gym... er,
-- for the nursing address (0041) and hotel guest counts alike.
-- ---------------------------------------------------------------------------
begin;

create schema if not exists tour;

create table if not exists tour.departures (
  id                  uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null,
  provider_service_id uuid not null,
  starts_on           date not null,
  ends_on             date not null,
  capacity            integer not null,
  booked_count        integer not null default 0,
  is_active           boolean not null default true,
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now(),
  constraint ck_tour_departures_dates check (ends_on >= starts_on),
  constraint ck_tour_departures_capacity check (capacity > 0),
  constraint ck_tour_departures_booked_count check (booked_count >= 0 and booked_count <= capacity)
);
create index if not exists ix_tour_departures_service
  on tour.departures (provider_service_id, starts_on) where is_active;

commit;
