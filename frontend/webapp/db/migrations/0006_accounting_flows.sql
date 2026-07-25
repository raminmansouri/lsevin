-- Accounting: deposits, withdrawals, gateway transactions, crypto.
--
-- These tables are the *workflow* around the money. They record intent and approval;
-- the money itself only ever moves when a journal entry is posted, and each request
-- stores the id of the entry that moved it. If journal_entry_id is null, no money moved
-- — that is the invariant that makes "approved but not paid" impossible to fake.

-- ---------------------------------------------------------------------------
-- Payment gateway transactions (Zarinpal, BTCPay).
-- ---------------------------------------------------------------------------
create table if not exists accounting.gateway_transactions (
  id           uuid    primary key default gen_random_uuid(),
  gateway_code text    not null,
  purpose      text    not null check (purpose in ('deposit', 'booking_payment', 'refund')),
  user_id      uuid,

  amount        numeric(38,18) not null check (amount > 0),
  currency_code varchar not null references finance.currencies(code),

  -- Zarinpal's Authority / BTCPay's invoice id. Unique per gateway, which is what makes
  -- a replayed callback or a retried webhook resolve to the same row instead of a new one.
  authority    text    not null,
  reference_id text,
  status       text    not null default 'created' check (status in (
    'created', 'requires_action', 'pending', 'verified', 'failed', 'cancelled', 'expired'
  )),

  idempotency_key text not null unique,
  journal_entry_id uuid references accounting.journal_entries(id),

  request_payload  jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (gateway_code, authority)
);

create index if not exists ix_accounting_gateway_txn_user on accounting.gateway_transactions (user_id, created_at desc);
create index if not exists ix_accounting_gateway_txn_status on accounting.gateway_transactions (status);

-- ---------------------------------------------------------------------------
-- Crypto addresses and on-chain transactions.
-- ---------------------------------------------------------------------------
create table if not exists accounting.crypto_addresses (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid,                    -- null for platform-owned addresses
  currency_code varchar not null references finance.currencies(code),
  network       text    not null,        -- BTC, TRC20, ERC20, ...
  address       text    not null,
  label         text,
  purpose       text    not null check (purpose in ('deposit', 'payout', 'platform_hot', 'platform_cold')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  metadata      jsonb   not null default '{}'::jsonb,
  unique (network, address)
);

create index if not exists ix_accounting_crypto_addresses_user on accounting.crypto_addresses (user_id) where user_id is not null;

create table if not exists accounting.crypto_transactions (
  id            uuid    primary key default gen_random_uuid(),
  direction     text    not null check (direction in ('in', 'out')),
  currency_code varchar not null references finance.currencies(code),
  network       text    not null,
  tx_hash       text    not null,
  vout          integer not null default 0,
  address       text    not null,

  amount     numeric(38,18) not null check (amount > 0),
  fee_amount numeric(38,18) not null default 0 check (fee_amount >= 0),

  confirmations          integer not null default 0 check (confirmations >= 0),
  required_confirmations integer not null default 1 check (required_confirmations >= 0),
  status text not null default 'detected' check (status in (
    'detected', 'confirming', 'confirmed', 'failed', 'orphaned'
  )),

  -- Credited only once the required confirmations are in; until then the amount sits in
  -- the wallet's pending_balance and is not spendable.
  journal_entry_id uuid references accounting.journal_entries(id),

  first_seen_at timestamptz not null default now(),
  confirmed_at  timestamptz,
  raw           jsonb   not null default '{}'::jsonb,

  -- A chain reorg can present the same hash twice; this makes the second one a no-op.
  unique (network, tx_hash, vout)
);

create index if not exists ix_accounting_crypto_txn_status on accounting.crypto_transactions (status, confirmations);
create index if not exists ix_accounting_crypto_txn_address on accounting.crypto_transactions (address);

-- ---------------------------------------------------------------------------
-- Deposit requests (درخواست واریز)
-- ---------------------------------------------------------------------------
create table if not exists accounting.deposit_requests (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null,
  wallet_id     uuid    references accounting.wallets(id),
  currency_code varchar not null references finance.currencies(code),
  amount        numeric(38,18) not null check (amount > 0),
  -- What the admin actually confirmed, when it differs from what the customer claimed
  -- (a bank receipt for a different figure, a partial crypto send).
  confirmed_amount numeric(38,18) check (confirmed_amount > 0),

  method text not null check (method in (
    'gateway_zarinpal', 'gateway_btcpay', 'bank_transfer', 'crypto_manual', 'admin_credit'
  )),
  status text not null default 'awaiting_payment' check (status in (
    'draft', 'awaiting_payment', 'pending_review', 'approved', 'rejected',
    'failed', 'expired', 'completed'
  )),

  gateway_transaction_id uuid references accounting.gateway_transactions(id),
  crypto_transaction_id  uuid references accounting.crypto_transactions(id),
  receipt_media_id       uuid,
  receipt_url            text,
  external_reference     text,

  idempotency_key  text not null unique,
  journal_entry_id uuid references accounting.journal_entries(id),

  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,

  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata   jsonb   not null default '{}'::jsonb
);

create index if not exists ix_accounting_deposits_user on accounting.deposit_requests (user_id, created_at desc);
create index if not exists ix_accounting_deposits_status on accounting.deposit_requests (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Withdrawal requests (درخواست برداشت)
--
-- Lifecycle, and what moves money at each step:
--   pending    request created — funds moved from available to reserved (hold entry)
--   approved   admin approved — no money moves
--   rejected   hold released back to available (reversing entry)
--   processing payout in flight
--   paid       reserved is cleared, money leaves the platform (settlement entry)
--   failed     hold released back to available (reversing entry)
-- ---------------------------------------------------------------------------
create table if not exists accounting.withdrawal_requests (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null,
  wallet_id     uuid    not null references accounting.wallets(id),
  currency_code varchar not null references finance.currencies(code),

  amount     numeric(38,18) not null check (amount > 0),   -- gross requested
  fee_amount numeric(38,18) not null default 0 check (fee_amount >= 0),
  net_amount numeric(38,18) not null check (net_amount > 0), -- what the customer receives
  constraint ck_withdrawal_amounts check (net_amount = amount - fee_amount),

  destination_type text not null check (destination_type in ('bank_iban', 'crypto_address')),
  destination_iban         text,
  destination_holder_name  text,
  destination_bank_name    text,
  destination_address      text,
  destination_network      text,
  constraint ck_withdrawal_destination check (
    (destination_type = 'bank_iban'      and destination_iban is not null)
    or (destination_type = 'crypto_address' and destination_address is not null)
  ),

  status text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'processing', 'paid', 'failed', 'cancelled'
  )),

  -- Three separate entries, because they happen at different times and any of them may
  -- be the last thing that happened. Keeping them apart is what lets a rejected
  -- withdrawal prove the hold was released.
  hold_entry_id       uuid references accounting.journal_entries(id),
  settlement_entry_id uuid references accounting.journal_entries(id),
  release_entry_id    uuid references accounting.journal_entries(id),

  idempotency_key text not null unique,

  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,

  paid_at              timestamptz,
  payout_reference     text,
  crypto_transaction_id uuid references accounting.crypto_transactions(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata   jsonb   not null default '{}'::jsonb
);

create index if not exists ix_accounting_withdrawals_user on accounting.withdrawal_requests (user_id, created_at desc);
create index if not exists ix_accounting_withdrawals_status on accounting.withdrawal_requests (status, created_at desc);
-- Supports the daily-cap check without a full scan.
create index if not exists ix_accounting_withdrawals_daily on accounting.withdrawal_requests (user_id, currency_code, created_at);
