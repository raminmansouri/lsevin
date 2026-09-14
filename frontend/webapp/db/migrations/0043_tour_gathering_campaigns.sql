-- ---------------------------------------------------------------------------
-- 0043 — Subscription-gathering tours (item 8, second half).
--
-- The genuinely new piece flagged in 0042's own comment: admin sets a target
-- headcount for a tour with no fixed dates yet; customers join a waitlist;
-- once enough people join, admin confirms specific dates and every joined
-- customer's spot becomes real. Nothing like this exists anywhere else in
-- the schema (no waitlist/quorum concept precedes it).
--
-- Deliberately NOT built on booking-pro's checkout/booking.bookings: that
-- whole path assumes a fixed date is already chosen before payment, which is
-- the opposite of what a gathering campaign is. Instead this mirrors
-- gym.membership_months' own already-vetted shape exactly: a customer
-- "joins" (optionally attaching a payment reference), admin reviews each
-- join request (approve/reject, a note mandatory only to reject -- same
-- convention shop.reviewReturnRequest and gym membership review both use),
-- and once enough are approved admin confirms the campaign with final
-- dates. A participant row IS the booking record here; there is no
-- corresponding booking.bookings row, exactly as gym memberships never
-- created one either.
-- ---------------------------------------------------------------------------
begin;

create schema if not exists tour;

create table if not exists tour.gathering_campaigns (
  id                  uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null,
  provider_service_id uuid not null,
  target_headcount    integer not null,
  price_per_person    numeric(18,2) not null,
  currency            character varying(15) not null default 'IRR',
  join_deadline       date,
  status              character varying(20) not null default 'gathering',
  confirmed_starts_on date,
  confirmed_ends_on   date,
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now(),
  constraint ck_tour_gathering_campaigns_target check (target_headcount > 0),
  constraint ck_tour_gathering_campaigns_status check (status in ('gathering', 'confirmed', 'cancelled')),
  constraint ck_tour_gathering_campaigns_confirmed_dates check (
    status <> 'confirmed'
    or (confirmed_starts_on is not null and confirmed_ends_on is not null and confirmed_ends_on >= confirmed_starts_on)
  )
);
create index if not exists ix_tour_gathering_campaigns_service
  on tour.gathering_campaigns (provider_service_id);

create table if not exists tour.gathering_participants (
  id                 uuid primary key default public.uuid_generate_v4(),
  campaign_id        uuid not null references tour.gathering_campaigns (id) on delete cascade,
  user_id            uuid not null,
  status             character varying(20) not null default 'pending_review',
  amount             numeric(18,2) not null,
  currency           character varying(15) not null default 'IRR',
  payment_reference  text,
  review_note        text,
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  create_date        timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_tour_gathering_participants_status check (status in ('pending_review', 'approved', 'rejected')),
  constraint ck_tour_gathering_participants_amount check (amount >= 0),
  constraint uq_tour_gathering_participants unique (campaign_id, user_id)
);
create index if not exists ix_tour_gathering_participants_campaign
  on tour.gathering_participants (campaign_id, status);

commit;
