-- Accounting: ledger-backed wallets.
--
-- The balance is DERIVED from the ledger, not owned by this table. available_balance is
-- a cache, and it is only ever written inside the same transaction as the journal lines
-- that moved it, with the wallet row locked. That is the rule that makes a double-spend
-- impossible: two concurrent debits cannot both read the same balance, because the
-- second one waits for the first to commit.
--
-- accounting.fn_recompute_wallet_balance() re-derives it from the ledger, so the cache
-- is always checkable against the source of truth (0009 exposes the drift as a report).

create table if not exists accounting.wallets (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null,
  currency_code varchar not null references finance.currencies(code),
  -- The liability account this wallet rolls up to. Every wallet of a given currency
  -- points at the same account; the wallet itself is the subsidiary detail.
  account_id    uuid    not null references accounting.accounts(id),
  status        text    not null default 'active' check (status in ('active', 'frozen', 'closed')),

  -- Spendable now.
  available_balance numeric(38,18) not null default 0,
  -- Held against a withdrawal that is awaiting approval or execution. Money the customer
  -- can no longer spend but which has not left the platform yet.
  reserved_balance  numeric(38,18) not null default 0,
  -- Incoming but not yet confirmed (unconfirmed crypto, unapproved receipt).
  pending_balance   numeric(38,18) not null default 0,

  last_entry_id uuid    references accounting.journal_entries(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (user_id, currency_code),
  -- A wallet can never go negative. This is a last line of defence: the service layer
  -- checks first, but if a code path ever forgets, the database refuses the write.
  constraint ck_wallets_available_non_negative check (available_balance >= 0),
  constraint ck_wallets_reserved_non_negative  check (reserved_balance >= 0),
  constraint ck_wallets_pending_non_negative   check (pending_balance >= 0)
);

create index if not exists ix_accounting_wallets_user on accounting.wallets (user_id);

-- Deferred from 0004, now that accounting.wallets exists.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_journal_lines_wallet') then
    alter table accounting.journal_lines
      add constraint fk_journal_lines_wallet
      foreign key (wallet_id) references accounting.wallets(id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- The wallet's own statement. One row per journal line that touches the wallet, so a
-- customer statement never has to reconstruct anything: balance_after is stored.
-- ---------------------------------------------------------------------------
create table if not exists accounting.wallet_ledger (
  id              uuid    primary key default gen_random_uuid(),
  -- Statement order. occurred_at cannot provide it: now() is transaction-scoped in
  -- Postgres, so every movement posted in one transaction carries an identical
  -- timestamp, and the primary key is a random uuid. Without this column a statement
  -- containing a payment and its fee could list them in either order — and a running
  -- balance shown out of order is worse than no running balance.
  seq             bigint  generated always as identity,
  wallet_id       uuid    not null references accounting.wallets(id),
  entry_id        uuid    not null references accounting.journal_entries(id),
  -- One wallet movement per journal line, enforced. This is what keeps the wallet
  -- statement and the general ledger from ever telling different stories.
  journal_line_id uuid    not null unique references accounting.journal_lines(id),

  direction     text    not null check (direction in ('credit', 'debit')),
  -- Which balance this movement changed. Without it the reconciliation report cannot
  -- tell a held withdrawal from real drift, and it fires for every customer with a
  -- pending withdrawal — an alert that cries wolf is worse than no alert.
  bucket        text    not null default 'available'
                        check (bucket in ('available', 'reserved', 'pending')),
  amount        numeric(38,18) not null check (amount > 0),
  currency_code varchar not null references finance.currencies(code),
  balance_after numeric(38,18) not null,

  movement_type text    not null check (movement_type in (
    'deposit', 'withdrawal', 'withdrawal_hold', 'withdrawal_release',
    'booking_payment', 'refund', 'cashback', 'referral_bonus',
    'platform_fee', 'adjustment', 'reversal', 'opening_balance'
  )),
  reference_type text,
  reference_id   uuid,
  description    text,
  occurred_at    timestamptz not null default now(),
  metadata       jsonb   not null default '{}'::jsonb
);

create index if not exists ix_accounting_wallet_ledger_wallet on accounting.wallet_ledger (wallet_id, seq desc);
create index if not exists ix_accounting_wallet_ledger_entry on accounting.wallet_ledger (entry_id);

-- Append-only, same as the journal.
drop trigger if exists trg_accounting_wallet_ledger_immutable on accounting.wallet_ledger;
create trigger trg_accounting_wallet_ledger_immutable
  before update or delete on accounting.wallet_ledger
  for each row execute function accounting.fn_block_ledger_mutation();

-- ---------------------------------------------------------------------------
-- Re-derive a wallet's balance from the ledger. The cached column should always equal
-- this; 0009 reports any wallet where it does not.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_recompute_wallet_balance(
  p_wallet_id uuid,
  p_bucket    text default 'available'
)
returns numeric(38,18)
language sql stable as $$
  select coalesce(sum(
    case when direction = 'credit' then amount else -amount end
  ), 0)::numeric(38,18)
  from accounting.wallet_ledger
  where wallet_id = p_wallet_id
    and bucket = p_bucket;
$$;
