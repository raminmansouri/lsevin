-- F1: tiered referral commission.
--
-- What already exists is reused, not rebuilt: marketing.referral_codes holds a
-- customer's code, and marketing.referral_invitations already records referrer,
-- referee, status and qualified_at. Neither is touched here.
--
-- What is missing is the money. marketing.referral_reward_rules is a coupon model
-- (discount_type / discount_value, issued as a coupon) and cannot express "a
-- percentage of the platform's commission, paid into the referrer's wallet".
--
-- Two additions:
--   * a tier table, so the percentages are configuration rather than a constant
--     buried in code
--   * a commission ledger, one row per qualifying booking, carrying the rate that
--     applied at the moment it was earned

begin;

-- Percentage of the PLATFORM COMMISSION, not of the transaction total. Bands are
-- closed at the bottom and open at the top: max_referrals null means "and above".
create table if not exists marketing.referral_commission_tiers (
  id uuid primary key default public.uuid_generate_v4(),
  min_referrals integer not null,
  max_referrals integer null,
  commission_percent numeric(5,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_referral_tiers_min_nonnegative check (min_referrals >= 0),
  constraint ck_referral_tiers_range check (max_referrals is null or max_referrals >= min_referrals),
  constraint ck_referral_tiers_percent check (commission_percent >= 0 and commission_percent <= 100)
);

create unique index if not exists ux_referral_commission_tiers_min
  on marketing.referral_commission_tiers (min_referrals)
  where is_active;

-- The agreed ladder: 1-4 => 2%, 5-14 => 4%, 15-29 => 6%, 30-49 => 8%, 50+ => 10%.
-- Seeding a brand-new configuration table, not back-filling user data. Idempotent:
-- re-running changes nothing, and an admin editing a percentage later is not undone.
insert into marketing.referral_commission_tiers (min_referrals, max_referrals, commission_percent)
select v.min_referrals, v.max_referrals, v.commission_percent
from (values
  (1,  4,    2.00),
  (5,  14,   4.00),
  (15, 29,   6.00),
  (30, 49,   8.00),
  (50, null, 10.00)
) as v(min_referrals, max_referrals, commission_percent)
where not exists (
  select 1 from marketing.referral_commission_tiers t
  where t.min_referrals = v.min_referrals
);

-- One row per booking that earned a commission. booking_id is unique, so a
-- retried or replayed settlement cannot pay the same referrer twice.
create table if not exists marketing.referral_commissions (
  id uuid primary key default public.uuid_generate_v4(),
  referrer_customer_id uuid not null,
  referee_customer_id uuid not null,
  booking_id uuid not null references booking.bookings (id) on delete cascade,
  -- The figure the percentage was applied to.
  platform_commission_amount numeric(18,2) not null,
  currency_code varchar(10) not null,
  -- Snapshot. The referrer's tier changes as they invite more people; what they
  -- already earned must not move with it.
  qualified_referrals_at_time integer not null,
  commission_percent numeric(5,2) not null,
  commission_amount numeric(18,2) not null,
  status text not null default 'pending',
  wallet_transaction_id uuid null,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_referral_commissions_status check (status in ('pending', 'paid', 'reversed')),
  constraint ck_referral_commissions_amounts check (commission_amount >= 0 and platform_commission_amount >= 0)
);

create unique index if not exists ux_referral_commissions_booking
  on marketing.referral_commissions (booking_id);

create index if not exists ix_referral_commissions_referrer
  on marketing.referral_commissions (referrer_customer_id, created_at desc);

comment on table marketing.referral_commission_tiers is
  'Referral commission ladder. Percentage applies to the platform commission on a referred user''s booking, never to the transaction total.';
comment on table marketing.referral_commissions is
  'One row per booking that earned a referral commission. commission_percent is the rate at the time it was earned and is never recalculated.';

commit;
