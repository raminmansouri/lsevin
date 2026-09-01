-- F2: one booking per hotel per day, enforced by the database.
--
-- Date-range services (hotels) were checked with the same capacity counting the
-- hourly engine uses: getBookingDateRangeAvailabilityFromDb sums existing bookings
-- and compares against a capacity. At READ COMMITTED two concurrent checkouts each
-- read the pre-insert state, both pass, and both insert -- the same failure mode the
-- exchange-rate writer already documents. A count cannot serialise itself.
--
-- This table makes the rule structural instead. One row per (hotel, night) that is
-- taken, with a unique index over exactly that pair, so the second checkout gets a
-- unique violation inside its own transaction and rolls back with nothing written.
--
-- Absence of a row means the night is free. There is deliberately no 'available'
-- status: such a row would occupy the unique slot and block the booking it claims to
-- permit. Only what is taken is recorded.

begin;

create table if not exists provider_portal.hotel_date_availability (
  id uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null,
  stay_date date not null,
  -- 'booked' is written by checkout, 'blocked' by an admin closing a date by hand.
  status text not null default 'booked',
  booking_id uuid null references booking.bookings (id) on delete cascade,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_hotel_date_availability_status
    check (status in ('booked', 'blocked'))
);

-- The guard itself. Not merely an index: this is what makes a double booking
-- impossible rather than unlikely.
create unique index if not exists ux_hotel_date_availability_provider_date
  on provider_portal.hotel_date_availability (service_provider_id, stay_date);

-- Releasing a cancelled booking deletes by booking_id.
create index if not exists ix_hotel_date_availability_booking
  on provider_portal.hotel_date_availability (booking_id)
  where booking_id is not null;

comment on table provider_portal.hotel_date_availability is
  'Nights that are taken for a hotel. A row means unavailable; no row means free. The unique index on (service_provider_id, stay_date) is what prevents two concurrent checkouts from booking the same night.';

commit;
