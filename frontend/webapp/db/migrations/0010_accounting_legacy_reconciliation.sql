-- Reconciliation between the legacy wallet and the accounting ledger.
--
-- Read-only. Safe to apply before anything is migrated, and it is the thing to look at
-- both before and after the cut-over:
--
--   * BEFORE  — shows what each customer holds today and that the new side is zero.
--   * AFTER   — must show every customer matching. Any row where `matches` is false is
--               a customer whose balance changed meaning during the move.
--   * DURING  — while both systems are live, this is the divergence alarm. The legacy
--               wallet code still writes to customer.wallet_transactions, so any write
--               that has not been switched over shows up here as a mismatch.
--
-- The legacy balance is defined exactly as the legacy app defines it: the sum of
-- completed transactions per currency. Deliberately NOT read from
-- customer.wallet_balances, because that view CROSS JOINs a hardcoded
-- (USD, EUR, GBP, AED) list and so cannot see IRR or IRT at all — the same defect that
-- made Rial wallet payments impossible in booking-pro.

create or replace view accounting.v_legacy_wallet_balances as
select
  wa.user_id,
  wt.currency_code,
  sum(wt.amount) filter (where wt.status = 'completed') as available_amount,
  sum(wt.amount) filter (where wt.status in ('pending', 'processing')) as pending_amount,
  count(*) as transaction_count
from customer.wallet_accounts wa
join customer.wallet_transactions wt on wt.wallet_account_id = wa.id
group by wa.user_id, wt.currency_code
having sum(wt.amount) filter (where wt.status = 'completed') is not null;

comment on view accounting.v_legacy_wallet_balances is
  'Per-user, per-currency balance as the legacy wallet computes it: sum of completed customer.wallet_transactions.';

create or replace view accounting.v_cutover_reconciliation as
select
  coalesce(legacy.user_id, w.user_id)                as user_id,
  coalesce(legacy.currency_code, w.currency_code)    as currency_code,
  coalesce(legacy.available_amount, 0)               as legacy_balance,
  coalesce(w.available_balance, 0)                   as ledger_balance,
  coalesce(w.available_balance, 0) - coalesce(legacy.available_amount, 0) as difference,
  coalesce(w.available_balance, 0) = coalesce(legacy.available_amount, 0) as matches,
  legacy.transaction_count                           as legacy_transaction_count,
  w.id                                               as wallet_id
from accounting.v_legacy_wallet_balances legacy
full outer join accounting.wallets w
  on w.user_id = legacy.user_id
 and w.currency_code = legacy.currency_code;

comment on view accounting.v_cutover_reconciliation is
  'Legacy wallet balance vs accounting ledger balance, per user per currency. After cut-over every row must have matches = true.';
