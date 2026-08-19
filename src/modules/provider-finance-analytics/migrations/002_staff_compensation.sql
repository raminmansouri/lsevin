-- Batch 15: provider-defined staff compensation rules and payment acknowledgements.
-- Canonical booking revenue/provider payable continue to come from commercial.* tables.

create table if not exists provider_portal.staff_compensation_rules (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  staff_id uuid not null references category.staff(id) on delete cascade,
  calculation_mode text not null default 'percent',
  percent_value numeric(8,4) not null default 0,
  fixed_amount numeric(18,2) not null default 0,
  currency_code varchar(10) not null default 'USD',
  effective_from date not null default current_date,
  effective_to date,
  is_active boolean not null default true,
  notes text,
  created_by_user_id uuid,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_staff_compensation_rule_mode check (calculation_mode in ('percent','fixed','hybrid')),
  constraint ck_staff_compensation_rule_percent check (percent_value >= 0 and percent_value <= 100),
  constraint ck_staff_compensation_rule_fixed check (fixed_amount >= 0),
  constraint ck_staff_compensation_rule_dates check (effective_to is null or effective_to >= effective_from)
);

create index if not exists ix_staff_compensation_rules_provider_staff
  on provider_portal.staff_compensation_rules(service_provider_id, staff_id, currency_code, effective_from desc);

create unique index if not exists ux_staff_compensation_rules_active_start
  on provider_portal.staff_compensation_rules(service_provider_id, staff_id, currency_code, effective_from)
  where is_active = true;

create table if not exists provider_portal.staff_compensation_payments (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  staff_id uuid not null references category.staff(id) on delete cascade,
  booking_id uuid not null references booking.bookings(id) on delete cascade,
  amount numeric(18,2) not null,
  currency_code varchar(10) not null,
  status text not null default 'paid',
  compensation_rule_id uuid references provider_portal.staff_compensation_rules(id) on delete set null,
  notes text,
  created_by_user_id uuid,
  paid_by_user_id uuid,
  paid_at timestamptz,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_staff_compensation_payment_amount check (amount >= 0),
  constraint ck_staff_compensation_payment_status check (status in ('approved','paid','cancelled')),
  constraint uq_staff_compensation_payment_booking unique (service_provider_id, staff_id, booking_id, currency_code)
);

create index if not exists ix_staff_compensation_payments_staff_date
  on provider_portal.staff_compensation_payments(staff_id, create_date desc);
create index if not exists ix_staff_compensation_payments_provider_date
  on provider_portal.staff_compensation_payments(service_provider_id, create_date desc);

-- Reuse the finance module's standard touch function created by migration 001.
drop trigger if exists trg_staff_compensation_rules_touch on provider_portal.staff_compensation_rules;
create trigger trg_staff_compensation_rules_touch
before update on provider_portal.staff_compensation_rules
for each row execute function provider_portal.set_finance_module_last_modified_date();

drop trigger if exists trg_staff_compensation_payments_touch on provider_portal.staff_compensation_payments;
create trigger trg_staff_compensation_payments_touch
before update on provider_portal.staff_compensation_payments
for each row execute function provider_portal.set_finance_module_last_modified_date();
