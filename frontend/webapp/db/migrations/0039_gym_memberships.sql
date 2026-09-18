-- ---------------------------------------------------------------------------
-- 0039 — Gym membership subscriptions (new domain, additive).
--
-- "Admin can define those gyms" is already covered by the existing generic
-- category.provider_types / category.service_providers admin (create a
-- "Gym" provider type, then create gym businesses as providers of that
-- type — no schema change needed for that part).
--
-- What's genuinely new here is recurring/prepaid membership billing, which
-- doesn't fit booking.bookings (a discrete date/slot booking) or any
-- existing shop/booking table. New schema `gym`, three tables:
--   gym.membership_plans   — a gym's monthly price (admin/provider-set)
--   gym.memberships        — one customer's subscription to a plan
--   gym.membership_months  — one row per calendar month owed/paid, so
--                            "pay 12 months at once" is 12 rows inserted
--                            together and "due months" is just querying
--                            unpaid rows whose period_month has passed.
--
-- Cross-schema references to category.service_providers are soft
-- (application-validated uuid, no FK) — same modularity rule already
-- established for shop/provider_portal (see 0018_shop_v01.sql, 0020's
-- hotel_date_availability.service_provider_id).
--
-- Payment review mirrors shop.reviewReturnRequest's existing convention
-- exactly: decision approved/rejected, a note mandatory only to reject.
-- ---------------------------------------------------------------------------
begin;

create schema if not exists gym;

create table if not exists gym.membership_plans (
  id                 uuid primary key default public.uuid_generate_v4(),
  service_provider_id uuid not null,
  name_translations  jsonb not null default '{}'::jsonb,
  monthly_price      numeric(18,2) not null,
  currency           character varying(15) not null default 'IRR',
  is_active          boolean not null default true,
  create_date        timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_gym_membership_plans_monthly_price check (monthly_price >= 0)
);
create index if not exists ix_gym_membership_plans_provider
  on gym.membership_plans (service_provider_id) where is_active;

create table if not exists gym.memberships (
  id                  uuid primary key default public.uuid_generate_v4(),
  user_id             uuid not null,
  membership_plan_id  uuid not null references gym.membership_plans (id) on delete restrict,
  service_provider_id uuid not null,
  status              character varying(20) not null default 'active',
  create_date         timestamptz not null default now(),
  last_modified_date  timestamptz not null default now(),
  constraint ck_gym_memberships_status check (status in ('active', 'cancelled'))
);
create index if not exists ix_gym_memberships_user on gym.memberships (user_id);
create index if not exists ix_gym_memberships_provider on gym.memberships (service_provider_id);
-- One active membership per (user, plan) at a time; re-subscribing after
-- cancellation is fine (a new row), just never two concurrently active ones.
create unique index if not exists ux_gym_memberships_active_user_plan
  on gym.memberships (user_id, membership_plan_id) where status = 'active';

create table if not exists gym.membership_months (
  id                 uuid primary key default public.uuid_generate_v4(),
  membership_id      uuid not null references gym.memberships (id) on delete cascade,
  -- Always the first of the month, e.g. 2026-09-01 for September 2026 --
  -- the ck below is what actually enforces that, not just convention.
  period_month       date not null,
  amount             numeric(18,2) not null,
  currency           character varying(15) not null default 'IRR',
  status             character varying(20) not null default 'pending_review',
  payment_reference  text,
  review_note        text,
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  create_date        timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_gym_membership_months_status check (status in ('pending_review', 'approved', 'rejected')),
  constraint ck_gym_membership_months_amount check (amount >= 0),
  constraint ck_gym_membership_months_period_month check (period_month = date_trunc('month', period_month)::date),
  constraint uq_gym_membership_months unique (membership_id, period_month)
);
create index if not exists ix_gym_membership_months_membership
  on gym.membership_months (membership_id, period_month);
-- The admin review queue's own query: every month still awaiting a decision.
create index if not exists ix_gym_membership_months_pending
  on gym.membership_months (create_date) where status = 'pending_review';

commit;
