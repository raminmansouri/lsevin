-- Proposed rewards / loyalty schema additions
create schema if not exists loyalty;

create table if not exists loyalty.tiers (
  id uuid primary key default public.uuid_generate_v4(),
  name text not null unique,
  min_points integer not null,
  cashback_percent numeric(5,2) not null default 0,
  benefits jsonb not null default '[]'::jsonb,
  color_from text,
  color_to text,
  icon text,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz
);

create table if not exists loyalty.accounts (
  customer_id uuid primary key references customer.customers(id) on delete cascade,
  points_balance integer not null default 0,
  lifetime_points integer not null default 0,
  current_tier_id uuid references loyalty.tiers(id),
  referral_code text not null unique,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz
);

create table if not exists loyalty.ledger (
  id uuid primary key default public.uuid_generate_v4(),
  customer_id uuid not null references customer.customers(id) on delete cascade,
  booking_id uuid,
  entry_type text not null,
  points_delta integer not null,
  money_delta numeric(18,2),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now()
);
create index if not exists ix_loyalty_ledger_customer_date on loyalty.ledger(customer_id, create_date desc);

create table if not exists loyalty.referrals (
  id uuid primary key default public.uuid_generate_v4(),
  referrer_customer_id uuid not null references customer.customers(id) on delete cascade,
  referred_customer_id uuid references customer.customers(id) on delete set null,
  referral_code text not null,
  status text not null default 'Pending',
  reward_amount numeric(18,2) not null default 0,
  reward_points integer not null default 0,
  qualified_at timestamptz,
  create_date timestamptz not null default now()
);
create index if not exists ix_loyalty_referrals_referrer on loyalty.referrals(referrer_customer_id, create_date desc);

create table if not exists loyalty.coupons (
  id uuid primary key default public.uuid_generate_v4(),
  code text not null unique,
  title text not null,
  description text,
  discount_type text not null,
  discount_value numeric(18,2) not null,
  min_purchase numeric(18,2) not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  is_active boolean not null default true,
  provider_service_id uuid references category.provider_services(id),
  create_date timestamptz not null default now(),
  last_modified_date timestamptz
);

create table if not exists loyalty.customer_coupons (
  id uuid primary key default public.uuid_generate_v4(),
  customer_id uuid not null references customer.customers(id) on delete cascade,
  coupon_id uuid not null references loyalty.coupons(id) on delete cascade,
  status text not null default 'Available',
  assigned_at timestamptz not null default now(),
  redeemed_at timestamptz,
  booking_id uuid,
  unique (customer_id, coupon_id)
);
create index if not exists ix_loyalty_customer_coupons_customer on loyalty.customer_coupons(customer_id, status, assigned_at desc);
