-- Provider finance + analytics standalone module for LSevin Providers Portal.
-- Depends on existing schemas: provider_portal, commercial, booking, category, customer, identity, finance.

create schema if not exists provider_portal;

create table if not exists provider_portal.provider_wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  currency_code varchar(10) not null default 'USD',
  available_amount numeric(18,2) not null default 0,
  pending_amount numeric(18,2) not null default 0,
  locked_amount numeric(18,2) not null default 0,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_provider_wallet_amounts_nonnegative check (available_amount >= 0 and pending_amount >= 0 and locked_amount >= 0),
  constraint ck_provider_wallet_status check (status in ('active','disabled','closed')),
  constraint uq_provider_wallet_currency unique (service_provider_id, currency_code)
);

create table if not exists provider_portal.provider_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references provider_portal.provider_wallet_accounts(id) on delete cascade,
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  direction text not null,
  transaction_type text not null,
  status text not null default 'pending',
  amount numeric(18,2) not null,
  currency_code varchar(10) not null,
  counterparty_type text,
  counterparty_user_id uuid,
  customer_id uuid,
  booking_id uuid,
  settlement_batch_id uuid,
  withdrawal_request_id uuid,
  reference_type text,
  reference_id uuid,
  external_reference text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  occurred_at timestamptz not null default now(),
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_provider_wallet_tx_direction check (direction in ('credit','debit')),
  constraint ck_provider_wallet_tx_status check (status in ('pending','approved','completed','failed','cancelled','reversed')),
  constraint ck_provider_wallet_tx_type check (transaction_type in ('booking_earning','settlement_credit','withdrawal','deposit','manual_adjustment','lsevin_fee','customer_refund','provider_chargeback','refund_reversal','transfer')),
  constraint ck_provider_wallet_tx_amount_positive check (amount > 0)
);

create index if not exists ix_provider_wallet_tx_provider_date on provider_portal.provider_wallet_transactions(service_provider_id, create_date desc);
create index if not exists ix_provider_wallet_tx_wallet_status on provider_portal.provider_wallet_transactions(wallet_account_id, status);

create table if not exists provider_portal.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  wallet_account_id uuid not null references provider_portal.provider_wallet_accounts(id),
  payout_account_id uuid references provider_portal.payout_accounts(id),
  amount numeric(18,2) not null,
  currency_code varchar(10) not null,
  status text not null default 'requested',
  requested_by_user_id uuid,
  reviewed_by_user_id uuid,
  review_note text,
  gateway_reference text,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_withdrawal_amount_positive check (amount > 0),
  constraint ck_withdrawal_status check (status in ('requested','in_review','approved','rejected','processing','paid','failed','cancelled'))
);

create index if not exists ix_withdrawal_provider_status on provider_portal.withdrawal_requests(service_provider_id, status, requested_at desc);

create table if not exists provider_portal.settlement_batches (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid not null references category.service_providers(id) on delete cascade,
  settlement_number text not null unique default concat('SET-', to_char(now(), 'YYYYMMDD'), '-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  period_start date not null,
  period_end date not null,
  currency_code varchar(10) not null default 'USD',
  gross_amount numeric(18,2) not null default 0,
  platform_fee_amount numeric(18,2) not null default 0,
  provider_payable_amount numeric(18,2) not null default 0,
  adjustment_amount numeric(18,2) not null default 0,
  payout_amount numeric(18,2) not null default 0,
  status text not null default 'draft',
  approved_by_user_id uuid,
  paid_by_user_id uuid,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_settlement_period check (period_end >= period_start),
  constraint ck_settlement_status check (status in ('draft','approved','processing','paid','cancelled','failed'))
);

create index if not exists ix_settlement_provider_period on provider_portal.settlement_batches(service_provider_id, period_start, period_end);

create table if not exists provider_portal.settlement_batch_items (
  id uuid primary key default gen_random_uuid(),
  settlement_batch_id uuid not null references provider_portal.settlement_batches(id) on delete cascade,
  booking_id uuid,
  booking_child_id uuid,
  charge_line_id uuid,
  ledger_id uuid,
  item_type text not null default 'earning',
  description text not null,
  gross_amount numeric(18,2) not null default 0,
  platform_fee_amount numeric(18,2) not null default 0,
  provider_payable_amount numeric(18,2) not null default 0,
  currency_code varchar(10) not null,
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now(),
  constraint ck_settlement_item_type check (item_type in ('earning','adjustment','reversal','refund','fee','manual'))
);

create index if not exists ix_settlement_items_batch on provider_portal.settlement_batch_items(settlement_batch_id);

create table if not exists provider_portal.money_transfers (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid references category.service_providers(id) on delete set null,
  booking_id uuid,
  source_party_type text not null,
  source_user_id uuid,
  source_wallet_account_id uuid,
  target_party_type text not null,
  target_user_id uuid,
  target_wallet_account_id uuid,
  amount numeric(18,2) not null,
  currency_code varchar(10) not null,
  transfer_type text not null,
  status text not null default 'pending',
  reference_type text,
  reference_id uuid,
  external_reference text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  completed_at timestamptz,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_money_transfer_parties check (source_party_type in ('lsevin','provider','customer','gateway','wallet','bank') and target_party_type in ('lsevin','provider','customer','gateway','wallet','bank')),
  constraint ck_money_transfer_status check (status in ('pending','processing','completed','failed','cancelled','reversed')),
  constraint ck_money_transfer_type check (transfer_type in ('customer_payment','provider_settlement','provider_withdrawal','customer_refund','provider_deposit','manual_adjustment','wallet_topup','wallet_withdrawal')),
  constraint ck_money_transfer_amount_positive check (amount > 0)
);

create index if not exists ix_money_transfer_provider_date on provider_portal.money_transfers(service_provider_id, create_date desc);
create index if not exists ix_money_transfer_status on provider_portal.money_transfers(status, create_date desc);

create table if not exists provider_portal.finance_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid references category.service_providers(id) on delete cascade,
  report_key text not null,
  title text not null,
  period_start date not null,
  period_end date not null,
  currency_code varchar(10) not null default 'USD',
  payload jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  create_date timestamptz not null default now(),
  constraint ck_report_snapshot_period check (period_end >= period_start)
);

create index if not exists ix_report_snapshot_provider_key on provider_portal.finance_report_snapshots(service_provider_id, report_key, period_start desc);

create table if not exists provider_portal.finance_audit_events (
  id uuid primary key default gen_random_uuid(),
  service_provider_id uuid references category.service_providers(id) on delete set null,
  actor_user_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  ip_address text,
  user_agent text,
  create_date timestamptz not null default now()
);

create index if not exists ix_finance_audit_provider_date on provider_portal.finance_audit_events(service_provider_id, create_date desc);
create index if not exists ix_finance_audit_entity on provider_portal.finance_audit_events(entity_type, entity_id);

create or replace function provider_portal.set_finance_module_last_modified_date()
returns trigger language plpgsql as $$
begin
  new.last_modified_date = now();
  return new;
end;
$$;

drop trigger if exists trg_provider_wallet_accounts_touch on provider_portal.provider_wallet_accounts;
create trigger trg_provider_wallet_accounts_touch before update on provider_portal.provider_wallet_accounts
for each row execute function provider_portal.set_finance_module_last_modified_date();

drop trigger if exists trg_provider_wallet_transactions_touch on provider_portal.provider_wallet_transactions;
create trigger trg_provider_wallet_transactions_touch before update on provider_portal.provider_wallet_transactions
for each row execute function provider_portal.set_finance_module_last_modified_date();

drop trigger if exists trg_withdrawal_requests_touch on provider_portal.withdrawal_requests;
create trigger trg_withdrawal_requests_touch before update on provider_portal.withdrawal_requests
for each row execute function provider_portal.set_finance_module_last_modified_date();

drop trigger if exists trg_settlement_batches_touch on provider_portal.settlement_batches;
create trigger trg_settlement_batches_touch before update on provider_portal.settlement_batches
for each row execute function provider_portal.set_finance_module_last_modified_date();

drop trigger if exists trg_money_transfers_touch on provider_portal.money_transfers;
create trigger trg_money_transfers_touch before update on provider_portal.money_transfers
for each row execute function provider_portal.set_finance_module_last_modified_date();

create or replace view provider_portal.provider_wallet_balance_view as
select
  pwa.id as wallet_account_id,
  pwa.service_provider_id,
  pwa.currency_code,
  pwa.available_amount,
  pwa.pending_amount,
  pwa.locked_amount,
  greatest(pwa.available_amount - pwa.locked_amount, 0)::numeric(18,2) as withdrawable_amount,
  pwa.status,
  pwa.last_modified_date
from provider_portal.provider_wallet_accounts pwa;

create or replace view provider_portal.provider_finance_kpis as
select
  sp.id as service_provider_id,
  coalesce(max(cl.payment_currency_code), max(pl.currency_code), 'USD') as currency_code,
  coalesce(sum(cl.payment_gross_amount), 0)::numeric(18,2) as gross_revenue,
  coalesce(sum(cl.net_amount), 0)::numeric(18,2) as net_revenue,
  coalesce(sum(cl.platform_fee_amount), 0)::numeric(18,2) as platform_fee_amount,
  coalesce(sum(cl.provider_payable_amount), 0)::numeric(18,2) as provider_payable_amount,
  coalesce(sum(rl.payment_refund_amount), 0)::numeric(18,2) as refunded_amount,
  count(distinct b.id)::integer as bookings_count,
  count(distinct b.id) filter (where lower(coalesce(b.payment_status, '')) in ('paid','captured','succeeded'))::integer as paid_bookings_count,
  coalesce(sum(pl.amount) filter (where pl.status = 'pending'), 0)::numeric(18,2) as pending_ledger_amount,
  coalesce(sum(pl.amount) filter (where pl.status = 'approved'), 0)::numeric(18,2) as approved_ledger_amount,
  coalesce(sum(abs(pl.amount)) filter (where pl.status = 'paid' or pl.entry_type = 'payout'), 0)::numeric(18,2) as paid_ledger_amount
from category.service_providers sp
left join booking.bookings b on b.provider_id = sp.id
left join commercial.booking_charge_lines cl on cl.booking_id = b.id and cl.provider_id = sp.id
left join commercial.refund_lines rl on rl.booking_id = b.id
left join commercial.provider_ledgers pl on pl.provider_id = sp.id
group by sp.id;

create or replace view provider_portal.provider_daily_report_view as
select
  b.provider_id as service_provider_id,
  date_trunc('day', b.create_date)::date as report_date,
  coalesce(max(cl.payment_currency_code), max(b.currency_code), 'USD') as currency_code,
  count(distinct b.id)::integer as bookings_count,
  coalesce(sum(cl.payment_gross_amount), 0)::numeric(18,2) as gross_revenue,
  coalesce(sum(cl.net_amount), 0)::numeric(18,2) as net_revenue,
  coalesce(sum(cl.provider_payable_amount), 0)::numeric(18,2) as provider_payable_amount,
  coalesce(sum(rl.payment_refund_amount), 0)::numeric(18,2) as refunded_amount
from booking.bookings b
left join commercial.booking_charge_lines cl on cl.booking_id = b.id and cl.provider_id = b.provider_id
left join commercial.refund_lines rl on rl.booking_id = b.id
where b.provider_id is not null
group by b.provider_id, date_trunc('day', b.create_date)::date;
