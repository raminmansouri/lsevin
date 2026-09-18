-- ---------------------------------------------------------------------------
-- 0040 — purchase and sales invoices, and the document each one posts.
--
-- The panel could record what the books owed but not what the paperwork said. A
-- supplier bill or a customer invoice had to be re-keyed as a journal document,
-- which meant the amount lived in two places and the counterparty statement had no
-- way back to the piece of paper it came from.
--
-- An invoice here is the paperwork. Issuing it writes exactly one journal document
-- — the same kind a person types by hand, entering the same draft → temporary →
-- approved → posted ladder with the same approval control — and the two are linked
-- both ways: invoices.journal_entry_id, and journal_entries.source_type = 'invoice'
-- with source_id pointing back.
--
--   sale     debit  the receivable account (what the customer owes)
--            credit each line's income account, plus tax
--
--   purchase debit  each line's expense or asset account, plus recoverable tax
--            credit the payable account (what is owed to the supplier)
--
-- The counterparty is stored twice on purpose. `party_name` is always filled, so an
-- invoice can be raised against a supplier the platform has no row for. `party_type`
-- and `party_id` are filled only when the counterparty really is one of the party
-- kinds journal_lines already accepts ('user', 'provider', 'gateway', 'platform') —
-- and only then are they copied onto the lines, which is what puts the invoice on
-- accounting.v_party_balances, the صورت‌حساب of that party.
--
-- Nothing existing is altered: two new tables, one new sequence.
-- ---------------------------------------------------------------------------

begin;

create sequence if not exists accounting.invoice_number_seq as bigint start 1;

create table if not exists accounting.invoices (
  id               uuid        primary key default gen_random_uuid(),
  invoice_number   bigint      not null unique default nextval('accounting.invoice_number_seq'),
  kind             text        not null check (kind in ('purchase', 'sale')),
  status           text        not null default 'draft'
                     check (status in ('draft', 'issued', 'cancelled')),

  invoice_date     date        not null,
  due_date         date,

  -- The counterparty. party_name always; party_type/party_id only when it maps onto
  -- a kind journal_lines accepts, and both together or neither.
  party_name       text        not null,
  party_type       text        check (party_type in ('user', 'provider', 'gateway', 'platform')),
  party_id         uuid,
  party_tax_id     text,

  currency_code    varchar     not null references finance.currencies(code),

  -- Receivable for a sale, payable for a purchase: the one account that faces the
  -- counterparty, and the account the settlement document will later clear.
  counterparty_account_id uuid not null references accounting.accounts(id),

  tax_amount       numeric(38,18) not null default 0 check (tax_amount >= 0),
  tax_account_id   uuid        references accounting.accounts(id),

  -- Totals are stored rather than summed on read: an issued invoice is a statement
  -- of what was agreed, and it must not move when a price list does.
  subtotal_amount  numeric(38,18) not null default 0 check (subtotal_amount >= 0),
  total_amount     numeric(38,18) not null default 0 check (total_amount >= 0),

  description      text,
  -- The counterparty's own number for this document, not ours.
  reference_number text,

  journal_entry_id uuid        references accounting.journal_entries(id),

  created_by       uuid,
  created_at       timestamptz not null default now(),
  issued_by        uuid,
  issued_at        timestamptz,
  cancelled_by     uuid,
  cancelled_at     timestamptz,
  cancel_reason    text,
  updated_at       timestamptz not null default now(),

  constraint invoices_party_pair check ((party_type is null) = (party_id is null)),
  constraint invoices_tax_needs_account check (tax_amount = 0 or tax_account_id is not null),
  constraint invoices_due_after_issue check (due_date is null or due_date >= invoice_date)
);

create index if not exists ix_accounting_invoices_kind_status
  on accounting.invoices (kind, status, invoice_date desc);
create index if not exists ix_accounting_invoices_party
  on accounting.invoices (party_type, party_id);
create index if not exists ix_accounting_invoices_entry
  on accounting.invoices (journal_entry_id);

create table if not exists accounting.invoice_lines (
  id             uuid     primary key default gen_random_uuid(),
  invoice_id     uuid     not null references accounting.invoices(id) on delete cascade,
  line_no        smallint not null,
  description    text     not null,
  quantity       numeric(38,18) not null default 1 check (quantity > 0),
  unit_price     numeric(38,18) not null check (unit_price >= 0),
  line_amount    numeric(38,18) generated always as (quantity * unit_price) stored,

  -- Where the value lands: an income account on a sale, an expense or asset account
  -- on a purchase. Only postable accounts, the same rule a journal line follows.
  account_id     uuid     not null references accounting.accounts(id),
  cost_center_id uuid     references accounting.dimensions(id),
  project_id     uuid     references accounting.dimensions(id),

  unique (invoice_id, line_no)
);

create index if not exists ix_accounting_invoice_lines_invoice
  on accounting.invoice_lines (invoice_id);

-- ---------------------------------------------------------------------------
-- An issued invoice is evidence, and evidence does not change.
--
-- The same rule the ledger runs on: while it is a draft it is a working document,
-- and once it is issued the only thing that may still change is its own status
-- (cancelled) and the stamps that go with it.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_block_invoice_mutation() returns trigger
language plpgsql as $$
declare
  v_status text;
begin
  if tg_table_name = 'invoices' then
    if tg_op = 'DELETE' then
      if old.status = 'draft' then
        return old;
      end if;
    end if;

    if tg_op = 'UPDATE' then
      if old.status = 'draft' then
        return new;
      end if;

      if to_jsonb(new) - 'status' - 'cancelled_by' - 'cancelled_at' - 'cancel_reason'
           - 'updated_at'
         = to_jsonb(old) - 'status' - 'cancelled_by' - 'cancelled_at' - 'cancel_reason'
           - 'updated_at'
         and new.status in ('issued', 'cancelled')
      then
        return new;
      end if;
    end if;
  end if;

  if tg_table_name = 'invoice_lines' then
    select status into v_status
      from accounting.invoices
     where id = coalesce(new.invoice_id, old.invoice_id);

    -- The parent is already gone when an invoice cascades away; let the cascade run.
    if v_status is null or v_status = 'draft' then
      return coalesce(new, old);
    end if;
  end if;

  raise exception
    'accounting.% cannot be changed once the invoice is issued (attempted %). Cancel it and raise a new one.',
    tg_table_name, tg_op
    using errcode = 'restrict_violation';
end $$;

drop trigger if exists trg_accounting_invoices_immutable on accounting.invoices;
create trigger trg_accounting_invoices_immutable
  before update or delete on accounting.invoices
  for each row execute function accounting.fn_block_invoice_mutation();

drop trigger if exists trg_accounting_invoice_lines_immutable on accounting.invoice_lines;
create trigger trg_accounting_invoice_lines_immutable
  before update or delete on accounting.invoice_lines
  for each row execute function accounting.fn_block_invoice_mutation();

-- ---------------------------------------------------------------------------
-- The counterparty statement (صورت‌حساب): every invoice raised against a party,
-- alongside the state of the document it posted.
--
-- Deliberately not filtered to `fn_status_is_in_books`. An invoice that is issued
-- but whose document is still awaiting approval is exactly what someone asking
-- "what does this supplier have outstanding" needs to see; the document's status is
-- on the row so the two are never confused.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_invoice_statement as
select
  i.id,
  i.invoice_number,
  i.kind,
  i.status,
  i.invoice_date,
  i.due_date,
  i.party_name,
  i.party_type,
  i.party_id,
  i.currency_code,
  i.subtotal_amount,
  i.tax_amount,
  i.total_amount,
  i.reference_number,
  i.description,
  i.journal_entry_id,
  e.entry_number       as journal_entry_number,
  e.status             as journal_entry_status,
  a.code               as counterparty_account_code,
  a.name_translations  as counterparty_account_name
from accounting.invoices i
left join accounting.journal_entries e on e.id = i.journal_entry_id
join accounting.accounts a on a.id = i.counterparty_account_id;

comment on view accounting.v_invoice_statement is
  'Every invoice with the journal document it posted. The party statement joins this to accounting.v_party_balances on (party_type, party_id).';

commit;
