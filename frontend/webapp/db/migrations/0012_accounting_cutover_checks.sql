-- Post-cut-over checks. Read-only views the admin panel and an operator can query.

-- ---------------------------------------------------------------------------
-- Legacy wallets the cut-over could NOT import, and why.
--
-- A negative legacy balance is the most important case here: it means the legacy
-- overdraft race (two concurrent wallet payments both passing the same balance check)
-- already took more from a customer than they had. Importing it would fail the ledger's
-- non-negative CHECK, and it should — it needs a decision, not a silent copy.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_cutover_exceptions as
select
  legacy.user_id,
  legacy.currency_code,
  legacy.available_amount as legacy_balance,
  legacy.transaction_count,
  case
    when legacy.available_amount < 0 then 'negative_legacy_balance'
    when c.code is null              then 'currency_not_registered'
    when legacy.available_amount = 0 then 'zero_balance'
    when w.id is null                then 'not_imported'
    else 'ok'
  end as reason
from accounting.v_legacy_wallet_balances legacy
left join finance.currencies c on c.code = legacy.currency_code
left join accounting.wallets w
  on w.user_id = legacy.user_id and w.currency_code = legacy.currency_code
where legacy.available_amount <= 0
   or c.code is null
   or w.id is null;

comment on view accounting.v_cutover_exceptions is
  'Legacy wallet balances that were not imported into the ledger, with the reason. Review every row before treating the cut-over as complete.';

-- ---------------------------------------------------------------------------
-- The suspense account. Everything imported lands here as a debit; recording the real
-- asset balances (gateway, bank, crypto) credits it back down.
--
-- The remaining balance is the money the platform owes customers but has not yet shown
-- it is holding. It is not automatically a problem — until the asset side is entered it
-- is expected to equal the total imported — but it must be driven to zero deliberately,
-- and whatever will not go is a real shortfall.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_opening_balance_suspense as
select
  b.currency_code,
  b.total_debit                    as imported_to_ledger,
  b.total_credit                   as offset_by_real_assets,
  -- Debit minus credit, not the account's signed balance. Equity is credit-normal, so
  -- the signed balance of a suspense account that has only been debited comes out
  -- negative — correct double-entry, but it reads backwards to a human asking "how much
  -- is still unaccounted for". This orientation answers that question directly: it
  -- starts at the imported total and falls to zero as real assets are recorded.
  b.total_debit - b.total_credit   as unexplained_remainder
from accounting.v_account_balances_by_currency b
join accounting.accounts a on a.id = b.account_id
where a.system_key = 'opening_balance_equity';

comment on view accounting.v_opening_balance_suspense is
  'Opening-balance suspense per currency. Drive unexplained_remainder to zero by recording the platform''s real asset balances.';
