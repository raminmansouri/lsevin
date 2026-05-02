-- Booking commercial policy and coupon hardening.
-- 1) Makes schedule line types tolerant across current installations.
-- 2) Ensures booking_payment_policies can model free/full/fixed/percent booking collection.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'commercial' and table_name = 'booking_payment_schedule_lines'
  ) then
    alter table commercial.booking_payment_schedule_lines
      drop constraint if exists ck_booking_payment_schedule_lines_type;

    alter table commercial.booking_payment_schedule_lines
      add constraint ck_booking_payment_schedule_lines_type
      check (line_type in (
        'deposit', 'balance',
        'due_now', 'due_later', 'pay_now', 'remaining_balance',
        'full_payment', 'fixed', 'fixed_fee', 'percent',
        'booking_fee', 'advance', 'upfront', 'installment',
        'payment', 'final', 'provider_balance', 'adjustment', 'waived'
      ));
  end if;
end $$;

create table if not exists commercial.booking_payment_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  scope_type text not null default 'global',
  scope_id text,
  collection_mode text not null default 'full',
  payment_currency_code varchar(10),
  deposit_percent numeric(8,4) default 0 not null,
  deposit_fixed_amount numeric(18,2) default 0 not null,
  minimum_pay_now_amount numeric(18,2) default 0 not null,
  balance_due_trigger text default 'provider_collects' not null,
  deposit_refundable_mode text default 'policy_based' not null,
  allow_wallet boolean default true not null,
  allow_online_card boolean default true not null,
  is_online_payment_required boolean default true not null,
  priority integer default 100 not null,
  is_active boolean default true not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint ck_booking_payment_policies_scope_type
    check (scope_type in ('global','provider_type','provider','service_definition','provider_service','addon')),
  constraint ck_booking_payment_policies_collection_mode
    check (collection_mode in ('free','full','fixed','percent','provider_collects')),
  constraint ck_booking_payment_policies_percent_range
    check (deposit_percent >= 0 and deposit_percent <= 100),
  constraint ck_booking_payment_policies_amount_nonnegative
    check (deposit_fixed_amount >= 0 and minimum_pay_now_amount >= 0)
);

alter table commercial.booking_payment_policies
  add column if not exists description text,
  add column if not exists payment_currency_code varchar(10),
  add column if not exists minimum_pay_now_amount numeric(18,2) default 0 not null,
  add column if not exists is_online_payment_required boolean default true not null,
  add column if not exists metadata jsonb default '{}'::jsonb not null,
  add column if not exists updated_at timestamptz default now() not null;

create index if not exists idx_booking_payment_policies_lookup
  on commercial.booking_payment_policies (is_active, scope_type, scope_id, priority, created_at desc);
