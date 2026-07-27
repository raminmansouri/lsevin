-- Accounting: schema, settings, chart of accounts, fiscal calendar.
--
-- Design notes that the rest of the migrations depend on:
--
-- * Money is numeric(38,18) everywhere. Not minor-unit integers: 18-decimal crypto
--   units overflow bigint, and the existing 146 money columns in this database are all
--   `numeric` already. Balance is enforced by constraint and trigger (0004), not by
--   integer arithmetic. Presentation rounding uses finance.currencies.decimal_digits.
--
-- * finance.currencies and finance.exchange_rates are REUSED, not duplicated. They are
--   already the authoritative FX engine (finance.convert_money, finance.get_latest_rate,
--   and a trigger that maintains is_latest). A second currency table is exactly the kind
--   of split this codebase already suffers from.
--
-- * The existing customer.wallet_* tables are left untouched. This schema runs alongside
--   them; 0005 defines the ledger-backed wallet and 0008 seeds an opening balance, so
--   nothing about the live wallet changes until the application is switched over.

create schema if not exists accounting;

-- ---------------------------------------------------------------------------
-- Configuration. Nothing about fees, limits or currencies is hardcoded in code.
-- ---------------------------------------------------------------------------
create table if not exists accounting.settings (
  key         text        primary key,
  value       jsonb       not null,
  description text,
  updated_by  uuid,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Crypto support on the existing currency table. `decimal_digits` already carries
-- the precision (BTC 8, USDT 6); this only records what kind of asset it is, so the
-- deposit/withdrawal flows can branch on it.
-- ---------------------------------------------------------------------------
alter table finance.currencies
  add column if not exists asset_class text not null default 'fiat';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ck_finance_currencies_asset_class'
  ) then
    alter table finance.currencies
      add constraint ck_finance_currencies_asset_class
      check (asset_class in ('fiat', 'crypto'));
  end if;
end $$;

-- decimal_digits was capped at 6, which is fine for every fiat currency but excludes
-- crypto: BTC has 8 and chains with 18 (wei) exist. Raised to 18, matching the scale of
-- the numeric(38,18) money columns — a currency cannot carry more precision than the
-- ledger can store.
alter table finance.currencies drop constraint if exists ck_finance_currencies_decimal_digits;
alter table finance.currencies
  add constraint ck_finance_currencies_decimal_digits
  check (decimal_digits >= 0 and decimal_digits <= 18);

-- ---------------------------------------------------------------------------
-- Chart of accounts (کدینگ حساب‌ها), four levels: گروه → کل → معین → تفصیلی.
--
-- Only leaf accounts accept postings (is_postable). Per-party detail is NOT modelled
-- as one account per user — that would mean a row per customer per currency. Parties
-- live as dimensions on the journal line (0004), which is the standard subsidiary
-- ledger approach and keeps this table small enough for a human to read.
-- ---------------------------------------------------------------------------
create table if not exists accounting.accounts (
  id                uuid        primary key default gen_random_uuid(),
  code              text        not null unique,
  parent_id         uuid        references accounting.accounts(id) on delete restrict,
  level             smallint    not null check (level between 1 and 4),
  name_translations jsonb       not null default '{}'::jsonb,
  account_type      text        not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  normal_balance    text        not null check (normal_balance in ('debit', 'credit')),
  -- null means the account holds any currency; set it to pin an account to one.
  currency_code     varchar     references finance.currencies(code),
  is_postable       boolean     not null default false,
  is_active         boolean     not null default true,
  -- System accounts are referenced by code from the posting rules and must not be
  -- renamed away or deleted. system_key is the stable handle the application uses.
  is_system         boolean     not null default false,
  system_key        text        unique,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid
);

create index if not exists ix_accounting_accounts_parent on accounting.accounts (parent_id);
create index if not exists ix_accounting_accounts_type on accounting.accounts (account_type, is_active);
create index if not exists ix_accounting_accounts_postable on accounting.accounts (is_postable) where is_postable;

-- A parent cannot also be postable: postings belong on leaves, or the parent's balance
-- double counts its children.
create or replace function accounting.fn_accounts_before_write() returns trigger
language plpgsql as $$
begin
  if new.parent_id is not null then
    if exists (select 1 from accounting.accounts p where p.id = new.parent_id and p.is_postable) then
      raise exception 'Account % cannot be nested under postable account', new.code
        using errcode = 'check_violation';
    end if;
  end if;

  if new.is_postable and exists (select 1 from accounting.accounts c where c.parent_id = new.id) then
    raise exception 'Account % has children and cannot be postable', new.code
      using errcode = 'check_violation';
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_accounting_accounts_before_write on accounting.accounts;
create trigger trg_accounting_accounts_before_write
  before insert or update on accounting.accounts
  for each row execute function accounting.fn_accounts_before_write();

-- ---------------------------------------------------------------------------
-- Fiscal calendar. Posting into a closed period is rejected (0004), which is what
-- makes a period close mean something.
-- ---------------------------------------------------------------------------
create table if not exists accounting.fiscal_years (
  id         uuid        primary key default gen_random_uuid(),
  code       text        not null unique,
  starts_on  date        not null,
  ends_on    date        not null,
  status     text        not null default 'open' check (status in ('open', 'closed')),
  closed_at  timestamptz,
  closed_by  uuid,
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);

create table if not exists accounting.fiscal_periods (
  id             uuid        primary key default gen_random_uuid(),
  fiscal_year_id uuid        not null references accounting.fiscal_years(id) on delete cascade,
  code           text        not null unique,
  starts_on      date        not null,
  ends_on        date        not null,
  status         text        not null default 'open' check (status in ('open', 'closing', 'closed')),
  closed_at      timestamptz,
  closed_by      uuid,
  created_at     timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists ix_accounting_periods_year on accounting.fiscal_periods (fiscal_year_id);
-- Periods must not overlap: an entry date has to resolve to exactly one period.
create index if not exists ix_accounting_periods_range on accounting.fiscal_periods (starts_on, ends_on);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ex_accounting_periods_no_overlap') then
    execute 'create extension if not exists btree_gist';
    alter table accounting.fiscal_periods
      add constraint ex_accounting_periods_no_overlap
      exclude using gist (daterange(starts_on, ends_on, '[]') with &&);
  end if;
end $$;
