-- Payment and receipt integrity hardening.
-- Append-only migration: existing invoices, intents and receipts are preserved.

alter table if exists payment_billing.payment_intents
  add column if not exists gateway_verification_reference text,
  add column if not exists verified_at timestamptz;

alter table if exists payment_billing.payment_receipts
  add column if not exists receipt_fingerprint text;

create table if not exists payment_billing.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references payment_billing.invoices(id) on delete restrict,
  source_type text not null check (source_type in ('gateway_intent','manual_receipt','bank_reconciliation')),
  source_id uuid not null,
  amount numeric(18,2) not null check (amount > 0),
  currency_code varchar(10) not null,
  processor_reference text,
  allocated_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  unique (source_type, source_id)
);

create unique index if not exists ux_payment_billing_intents_verified_reference
  on payment_billing.payment_intents(method_code, gateway_verification_reference)
  where gateway_verification_reference is not null;

create unique index if not exists ux_payment_billing_receipts_fingerprint
  on payment_billing.payment_receipts(receipt_fingerprint)
  where receipt_fingerprint is not null;

create index if not exists ix_payment_billing_allocations_invoice
  on payment_billing.payment_allocations(invoice_id, allocated_at);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_payment_billing_intent_amount_positive'
      and conrelid = 'payment_billing.payment_intents'::regclass
  ) then
    alter table payment_billing.payment_intents
      add constraint ck_payment_billing_intent_amount_positive check (amount > 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_payment_billing_receipt_amount_positive'
      and conrelid = 'payment_billing.payment_receipts'::regclass
  ) then
    alter table payment_billing.payment_receipts
      add constraint ck_payment_billing_receipt_amount_positive check (amount > 0) not valid;
  end if;
end $$;
