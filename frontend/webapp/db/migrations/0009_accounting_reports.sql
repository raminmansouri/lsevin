-- Accounting: reporting views.
--
-- These are the read side. Every one of them derives from journal_lines, so a report can
-- never disagree with the ledger — there is no second place where a total is stored.

-- ---------------------------------------------------------------------------
-- Every posted line, flattened with its account and entry. The base for the rest.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_ledger_entries as
select
  l.id                as line_id,
  e.id                as entry_id,
  e.entry_number,
  e.entry_date,
  e.status            as entry_status,
  e.source_type,
  e.source_id,
  e.description       as entry_description,
  e.fiscal_period_id,
  fp.code             as fiscal_period_code,
  a.id                as account_id,
  a.code              as account_code,
  a.name_translations as account_name,
  a.account_type,
  a.normal_balance,
  l.line_no,
  l.party_type,
  l.party_id,
  l.wallet_id,
  l.currency_code,
  l.debit_amount,
  l.credit_amount,
  l.base_currency_code,
  l.base_debit_amount,
  l.base_credit_amount,
  l.exchange_rate,
  l.memo
from accounting.journal_lines l
join accounting.journal_entries e on e.id = l.entry_id
join accounting.accounts a on a.id = l.account_id
left join accounting.fiscal_periods fp on fp.id = e.fiscal_period_id
where e.status <> 'draft';

-- ---------------------------------------------------------------------------
-- Trial balance (تراز آزمایشی). The signed balance follows the account's normal side,
-- so an asset with more debits shows positive and a liability with more credits does too
-- — which is how an accountant expects to read it.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_trial_balance as
select
  a.id   as account_id,
  a.code as account_code,
  a.name_translations as account_name,
  a.account_type,
  a.normal_balance,
  l.base_currency_code as currency_code,
  coalesce(sum(l.base_debit_amount), 0)  as total_debit,
  coalesce(sum(l.base_credit_amount), 0) as total_credit,
  case a.normal_balance
    when 'debit'  then coalesce(sum(l.base_debit_amount), 0) - coalesce(sum(l.base_credit_amount), 0)
    else               coalesce(sum(l.base_credit_amount), 0) - coalesce(sum(l.base_debit_amount), 0)
  end as balance
from accounting.accounts a
left join accounting.journal_lines l on l.account_id = a.id
left join accounting.journal_entries e on e.id = l.entry_id and e.status <> 'draft'
group by a.id, a.code, a.name_translations, a.account_type, a.normal_balance, l.base_currency_code;

-- ---------------------------------------------------------------------------
-- Balance per account per transaction currency, for accounts that hold more than one.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_account_balances_by_currency as
select
  a.id   as account_id,
  a.code as account_code,
  l.currency_code,
  coalesce(sum(l.debit_amount), 0)  as total_debit,
  coalesce(sum(l.credit_amount), 0) as total_credit,
  case a.normal_balance
    when 'debit'  then coalesce(sum(l.debit_amount), 0) - coalesce(sum(l.credit_amount), 0)
    else               coalesce(sum(l.credit_amount), 0) - coalesce(sum(l.debit_amount), 0)
  end as balance
from accounting.accounts a
join accounting.journal_lines l on l.account_id = a.id
join accounting.journal_entries e on e.id = l.entry_id and e.status <> 'draft'
group by a.id, a.code, a.normal_balance, l.currency_code;

-- ---------------------------------------------------------------------------
-- Per-user statement (صورت‌حساب کاربر), straight off the wallet ledger.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_user_statement as
select
  w.user_id,
  w.id            as wallet_id,
  w.currency_code,
  -- Order a statement by seq, not occurred_at: now() is transaction-scoped, so
  -- movements posted together share a timestamp.
  wl.seq,
  wl.occurred_at,
  wl.movement_type,
  wl.direction,
  wl.amount,
  wl.balance_after,
  wl.description,
  wl.reference_type,
  wl.reference_id,
  e.entry_number,
  e.id            as entry_id
from accounting.wallet_ledger wl
join accounting.wallets w on w.id = wl.wallet_id
join accounting.journal_entries e on e.id = wl.entry_id;

-- ---------------------------------------------------------------------------
-- Reconciliation: cached wallet balance vs. the ledger it is supposed to summarise.
--
-- This should always be empty. A row here means a code path updated the cached balance
-- outside the ledger transaction, which is the exact bug class this whole schema exists
-- to prevent — so it belongs on the admin dashboard as an alert, not buried in a report.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_wallet_balance_drift as
select *
from (
  select
    w.id   as wallet_id,
    w.user_id,
    w.currency_code,
    b.bucket,
    b.cached_balance,
    accounting.fn_recompute_wallet_balance(w.id, b.bucket) as ledger_balance,
    b.cached_balance - accounting.fn_recompute_wallet_balance(w.id, b.bucket) as drift
  from accounting.wallets w
  cross join lateral (values
    ('available', w.available_balance),
    ('reserved',  w.reserved_balance),
    ('pending',   w.pending_balance)
  ) as b(bucket, cached_balance)
) d
where d.drift <> 0;

-- ---------------------------------------------------------------------------
-- Balance sheet and income statement, rolled up to the top-level group.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_balance_sheet as
select
  a.account_type,
  root.code           as group_code,
  root.name_translations as group_name,
  tb.currency_code,
  sum(tb.balance)     as balance
from accounting.v_trial_balance tb
join accounting.accounts a on a.id = tb.account_id
join accounting.accounts root
  on root.level = 1 and left(a.code, 1) = root.code
where a.account_type in ('asset', 'liability', 'equity')
group by a.account_type, root.code, root.name_translations, tb.currency_code;

create or replace view accounting.v_income_statement as
select
  a.account_type,
  a.code              as account_code,
  a.name_translations as account_name,
  tb.currency_code,
  sum(tb.balance)     as amount
from accounting.v_trial_balance tb
join accounting.accounts a on a.id = tb.account_id
where a.account_type in ('income', 'expense')
group by a.account_type, a.code, a.name_translations, tb.currency_code;
