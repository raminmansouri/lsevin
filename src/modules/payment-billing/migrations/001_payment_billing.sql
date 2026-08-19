-- Payment & Billing standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists payment_billing;

    create table if not exists payment_billing.billing_profiles (
      id uuid primary key default gen_random_uuid(),
      owner_entity_type text not null,
      owner_entity_id uuid not null,
      legal_name text not null,
      tax_id text,
      economic_code text,
      registration_number text,
      country_code text not null default 'IR',
      default_currency_code varchar(10) not null default 'IRR',
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists payment_billing.invoices (
      id uuid primary key default gen_random_uuid(),
      invoice_number text not null unique,
      invoice_type text not null check (invoice_type in ('standard','tax_ir','proforma','international','subscription','profile_ownership','credit_note')),
      status text not null default 'draft' check (status in ('draft','issued','sent','partially_paid','paid','cancelled','void','overdue')),
      bill_to_entity_type text not null,
      bill_to_entity_id uuid not null,
      source_module text,
      source_entity_type text,
      source_entity_id uuid,
      issue_date date not null default current_date,
      due_date date,
      currency_code varchar(10) not null default 'IRR',
      subtotal_amount numeric(18,2) not null default 0,
      tax_amount numeric(18,2) not null default 0,
      discount_amount numeric(18,2) not null default 0,
      total_amount numeric(18,2) not null default 0,
      paid_amount numeric(18,2) not null default 0,
      fiscal_tax_uid text,
      pdf_url text,
      snapshot jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists payment_billing.invoice_lines (
      id uuid primary key default gen_random_uuid(),
      invoice_id uuid not null references payment_billing.invoices(id) on delete cascade,
      line_no int not null,
      description text not null,
      quantity numeric(18,4) not null default 1,
      unit_amount numeric(18,2) not null default 0,
      tax_percent numeric(8,4) not null default 0,
      line_total numeric(18,2) not null default 0,
      metadata jsonb not null default '{}'
    );
    create table if not exists payment_billing.payment_methods (
      code text primary key,
      title text not null,
      method_kind text not null check (method_kind in ('gateway','manual','bank_sync','international')),
      is_enabled boolean not null default true,
      settings jsonb not null default '{}'
    );
    create table if not exists payment_billing.payment_receipts (
      id uuid primary key default gen_random_uuid(),
      invoice_id uuid references payment_billing.invoices(id),
      method_code text references payment_billing.payment_methods(code),
      amount numeric(18,2) not null,
      currency_code varchar(10) not null default 'IRR',
      payer_note text,
      receipt_file_url text,
      tracking_number text,
      status text not null default 'uploaded' check (status in ('uploaded','under_review','verified','rejected','matched')),
      uploaded_by_user_id uuid,
      verified_by_user_id uuid,
      created_at timestamptz not null default now(),
      verified_at timestamptz
    );
    insert into payment_billing.payment_methods(code,title,method_kind,is_enabled) values
      ('zarinpal','زرین پال','gateway',true),
      ('idpay','آیدی پی','gateway',true),
      ('card_to_card','کارت به کارت','manual',true),
      ('paya','پایا','manual',true),
      ('pol','پل','manual',true),
      ('satna','ساتنا','manual',true),
      ('swift','International bank transfer / SWIFT','international',true)
    on conflict (code) do nothing;

-- Capability integration additions. Kept inside the PaymentBilling module schema.
create sequence if not exists payment_billing.invoice_number_seq start with 1 increment by 1;

create table if not exists payment_billing.payment_intents (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references payment_billing.invoices(id) on delete cascade,
  method_code text not null references payment_billing.payment_methods(code),
  amount numeric(18,2) not null,
  currency_code varchar(10) not null default 'IRR',
  status text not null default 'pending' check (status in ('pending','requires_action','processing','succeeded','failed','cancelled','expired')),
  gateway_reference text,
  return_url text,
  redirect_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_billing.bank_reconciliation_batches (
  id uuid primary key default gen_random_uuid(),
  bank_account_code text not null,
  statement_reference text,
  currency_code varchar(10) not null default 'IRR',
  imported_lines_count int not null default 0,
  matched_lines_count int not null default 0,
  status text not null default 'imported' check (status in ('imported','matched','partially_matched','failed')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_payment_billing_invoices_bill_to on payment_billing.invoices (bill_to_entity_type, bill_to_entity_id);
create index if not exists ix_payment_billing_invoices_source on payment_billing.invoices (source_module, source_entity_type, source_entity_id);
create index if not exists ix_payment_billing_receipts_invoice on payment_billing.payment_receipts (invoice_id, status);
create index if not exists ix_payment_billing_intents_invoice on payment_billing.payment_intents (invoice_id, status);

-- Production hardening additions.
alter table if exists payment_billing.payment_receipts
  add column if not exists metadata jsonb not null default '{}';

create table if not exists payment_billing.payment_gateway_events (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid references payment_billing.payment_intents(id) on delete set null,
  gateway_code text not null,
  event_type text not null check (event_type in ('payment_started','callback_received','payment_verified','payment_failed','webhook_received','refund_started','refund_completed','refund_failed')),
  payload jsonb not null default '{}',
  received_at timestamptz not null default now()
);

create table if not exists payment_billing.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ix_payment_billing_gateway_events_intent on payment_billing.payment_gateway_events (payment_intent_id, event_type);
create index if not exists ix_payment_billing_audit_entity on payment_billing.payment_audit_logs (entity_type, entity_id, created_at desc);
