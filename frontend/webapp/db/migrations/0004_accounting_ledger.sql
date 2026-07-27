-- Accounting: the double-entry ledger.
--
-- Three rules are enforced by the database, not by application code, because the
-- application is not the only thing that can reach this data (there is a generic admin
-- CRUD panel, psql sessions, and future services):
--
--   1. Every entry balances: sum(debit) = sum(credit), in each currency AND in the
--      platform's base currency. Checked at COMMIT, so a multi-statement insert can
--      build up the lines before the check runs.
--   2. Posted entries and their lines are immutable. No UPDATE, no DELETE. A mistake is
--      corrected with a reversing entry, which is what makes the history auditable.
--   3. Nothing posts into a closed fiscal period.

-- ---------------------------------------------------------------------------
-- Journal entries (اسناد حسابداری)
-- ---------------------------------------------------------------------------
create sequence if not exists accounting.journal_entry_number_seq as bigint start 1;

create table if not exists accounting.journal_entries (
  id               uuid        primary key default gen_random_uuid(),
  entry_number     bigint      not null unique default nextval('accounting.journal_entry_number_seq'),
  entry_date       timestamptz not null default now(),
  fiscal_period_id uuid        references accounting.fiscal_periods(id),
  description      text,
  status           text        not null default 'posted' check (status in ('draft', 'posted', 'reversed')),

  -- What caused this entry. source_id points at the deposit request, withdrawal
  -- request, booking payment, refund, etc.
  source_type      text        not null,
  source_id        uuid,

  -- The anti-double-post key. Every caller must supply one — the gateway authority,
  -- the invoice id, the request id. A replayed webhook or a double-clicked approval
  -- collides here instead of creating a second entry, which is the single most
  -- important guarantee in this schema.
  idempotency_key  text        not null unique,

  -- Corrections are reversing entries, never edits.
  reverses_entry_id    uuid    references accounting.journal_entries(id),
  reversed_by_entry_id uuid    references accounting.journal_entries(id),

  base_currency_code varchar   not null references finance.currencies(code),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  metadata         jsonb       not null default '{}'::jsonb
);

create index if not exists ix_accounting_entries_source on accounting.journal_entries (source_type, source_id);
create index if not exists ix_accounting_entries_date on accounting.journal_entries (entry_date desc);
create index if not exists ix_accounting_entries_period on accounting.journal_entries (fiscal_period_id);

-- ---------------------------------------------------------------------------
-- Journal lines (سطرهای سند)
--
-- Separate debit/credit columns rather than one signed amount: it matches how an
-- accountant reads a document, and it makes the balance check a plain sum comparison.
-- Exactly one of the two is non-zero on any line.
--
-- Each line carries its own FX snapshot. A rate that changes tomorrow must not move a
-- document posted today, so base_* is computed once, here, and stored.
-- ---------------------------------------------------------------------------
create table if not exists accounting.journal_lines (
  id            uuid    primary key default gen_random_uuid(),
  entry_id      uuid    not null references accounting.journal_entries(id) on delete restrict,
  line_no       smallint not null,
  account_id    uuid    not null references accounting.accounts(id) on delete restrict,

  -- Subsidiary-ledger dimensions (تفصیلی شناور). This is why there is no account row
  -- per customer.
  party_type    text    check (party_type in ('user', 'provider', 'gateway', 'platform')),
  party_id      uuid,
  wallet_id     uuid,          -- FK added in 0005, once accounting.wallets exists
  -- Which of the wallet's three balances this line moved. Stored, not just passed in,
  -- because a reversing entry has to move the SAME balance back: without it, reversing
  -- a withdrawal hold credits `available` and debits `available` again, leaving the
  -- reserve stuck and the customer's money invisible.
  wallet_bucket text    check (wallet_bucket in ('available', 'reserved', 'pending')),

  currency_code varchar not null references finance.currencies(code),
  debit_amount  numeric(38,18) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(38,18) not null default 0 check (credit_amount >= 0),

  -- FX snapshot: what this line is worth in the platform's base currency, at the rate
  -- that applied when it was posted.
  base_currency_code varchar not null references finance.currencies(code),
  base_debit_amount  numeric(38,18) not null default 0 check (base_debit_amount >= 0),
  base_credit_amount numeric(38,18) not null default 0 check (base_credit_amount >= 0),
  exchange_rate      numeric(38,18) not null default 1 check (exchange_rate > 0),
  exchange_rate_id   uuid references finance.exchange_rates(id),
  rate_as_of         timestamptz,

  memo          text,
  metadata      jsonb   not null default '{}'::jsonb,

  unique (entry_id, line_no),
  -- A line is either a debit or a credit, never both, never neither.
  constraint ck_journal_lines_one_sided
    check ((debit_amount > 0) <> (credit_amount > 0)),
  constraint ck_journal_lines_base_one_sided
    check ((debit_amount > 0 and credit_amount = 0 and base_credit_amount = 0)
        or (credit_amount > 0 and debit_amount = 0 and base_debit_amount = 0)),
  constraint ck_journal_lines_party
    check ((party_type is null) = (party_id is null)),
  constraint ck_journal_lines_wallet_bucket
    check ((wallet_id is null) = (wallet_bucket is null))
);

create index if not exists ix_accounting_lines_entry on accounting.journal_lines (entry_id);
create index if not exists ix_accounting_lines_account on accounting.journal_lines (account_id);
create index if not exists ix_accounting_lines_party on accounting.journal_lines (party_type, party_id);
create index if not exists ix_accounting_lines_wallet on accounting.journal_lines (wallet_id);

-- ---------------------------------------------------------------------------
-- Rule 1 — balance, checked at COMMIT.
--
-- DEFERRABLE INITIALLY DEFERRED is essential: the entry and its lines are inserted as
-- separate statements, so an immediate check would fail on the first line every time.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_assert_entry_balanced() returns trigger
language plpgsql as $$
declare
  v_entry_id uuid := coalesce(new.entry_id, old.entry_id);
  v_bad      record;
  v_base_debit  numeric(38,18);
  v_base_credit numeric(38,18);
begin
  -- Balanced per currency.
  select currency_code, sum(debit_amount) as d, sum(credit_amount) as c
    into v_bad
    from accounting.journal_lines
   where entry_id = v_entry_id
   group by currency_code
  having sum(debit_amount) <> sum(credit_amount)
   limit 1;

  if found then
    raise exception 'Journal entry % is unbalanced in %: debit % <> credit %',
      v_entry_id, v_bad.currency_code, v_bad.d, v_bad.c
      using errcode = 'check_violation';
  end if;

  -- Balanced in the base currency too. A cross-currency entry balances per leg by
  -- construction; this catches a bad FX snapshot on one of the legs.
  select coalesce(sum(base_debit_amount), 0), coalesce(sum(base_credit_amount), 0)
    into v_base_debit, v_base_credit
    from accounting.journal_lines
   where entry_id = v_entry_id;

  if v_base_debit <> v_base_credit then
    raise exception 'Journal entry % is unbalanced in base currency: debit % <> credit %',
      v_entry_id, v_base_debit, v_base_credit
      using errcode = 'check_violation';
  end if;

  if not exists (select 1 from accounting.journal_lines where entry_id = v_entry_id) then
    raise exception 'Journal entry % has no lines', v_entry_id
      using errcode = 'check_violation';
  end if;

  return null;
end $$;

drop trigger if exists trg_accounting_lines_balanced on accounting.journal_lines;
create constraint trigger trg_accounting_lines_balanced
  after insert or update or delete on accounting.journal_lines
  deferrable initially deferred
  for each row execute function accounting.fn_assert_entry_balanced();

-- The trigger above hangs off journal_lines, so an entry inserted with NO lines at all
-- never fires it and would commit as a silent empty document. This one covers that: it
-- fires on the entry itself, and because it is deferred it still allows the normal
-- insert-entry-then-insert-lines sequence.
create or replace function accounting.fn_assert_entry_has_lines() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from accounting.journal_lines where entry_id = new.id) then
    raise exception 'Journal entry % has no lines', new.id using errcode = 'check_violation';
  end if;
  return null;
end $$;

drop trigger if exists trg_accounting_entries_have_lines on accounting.journal_entries;
create constraint trigger trg_accounting_entries_have_lines
  after insert on accounting.journal_entries
  deferrable initially deferred
  for each row execute function accounting.fn_assert_entry_has_lines();

-- ---------------------------------------------------------------------------
-- Rule 2 — immutability. Posted entries and all lines are append-only.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_block_ledger_mutation() returns trigger
language plpgsql as $$
begin
  -- The only permitted UPDATE on an entry is stamping the reversal pointer, which is
  -- how a correction records itself without rewriting history.
  if tg_op = 'UPDATE' and tg_table_name = 'journal_entries' then
    if old.status = 'draft' then
      return new;
    end if;
    if new.reversed_by_entry_id is distinct from old.reversed_by_entry_id
       and to_jsonb(new) - 'reversed_by_entry_id' - 'status'
         = to_jsonb(old) - 'reversed_by_entry_id' - 'status'
       and new.status in ('posted', 'reversed') then
      return new;
    end if;
  end if;

  raise exception
    'accounting.% is append-only (attempted %). Correct a posted entry with a reversing entry.',
    tg_table_name, tg_op
    using errcode = 'restrict_violation';
end $$;

drop trigger if exists trg_accounting_entries_immutable on accounting.journal_entries;
create trigger trg_accounting_entries_immutable
  before update or delete on accounting.journal_entries
  for each row execute function accounting.fn_block_ledger_mutation();

drop trigger if exists trg_accounting_lines_immutable on accounting.journal_lines;
create trigger trg_accounting_lines_immutable
  before update or delete on accounting.journal_lines
  for each row execute function accounting.fn_block_ledger_mutation();

-- ---------------------------------------------------------------------------
-- Rule 3 — no posting into a closed period, and only onto postable accounts.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_lines_before_insert() returns trigger
language plpgsql as $$
declare
  v_account accounting.accounts%rowtype;
  v_status  text;
begin
  select * into v_account from accounting.accounts where id = new.account_id;

  if not v_account.is_postable then
    raise exception 'Account % is not postable (postings belong on leaf accounts)', v_account.code
      using errcode = 'check_violation';
  end if;
  if not v_account.is_active then
    raise exception 'Account % is inactive', v_account.code using errcode = 'check_violation';
  end if;
  if v_account.currency_code is not null and v_account.currency_code <> new.currency_code then
    raise exception 'Account % only accepts %, got %', v_account.code, v_account.currency_code, new.currency_code
      using errcode = 'check_violation';
  end if;

  select p.status into v_status
    from accounting.journal_entries e
    join accounting.fiscal_periods p on p.id = e.fiscal_period_id
   where e.id = new.entry_id;

  if v_status = 'closed' then
    raise exception 'Fiscal period is closed; post to an open period or reopen it'
      using errcode = 'check_violation';
  end if;

  return new;
end $$;

drop trigger if exists trg_accounting_lines_before_insert on accounting.journal_lines;
create trigger trg_accounting_lines_before_insert
  before insert on accounting.journal_lines
  for each row execute function accounting.fn_lines_before_insert();
