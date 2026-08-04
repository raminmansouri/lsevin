-- ---------------------------------------------------------------------------
-- 0016 — close the reporting hole 0014 opened, and add the analytic reports.
--
-- PART 1 is a correctness fix, and it matters more than the new reports.
--
-- Before 0014 an entry could only be draft, posted or reversed, so the financial
-- views filtered `status <> 'draft'` and that meant exactly "in the books".
-- 0014 added `temporary`, `approved` and `rejected` to the ladder, and every one
-- of them passes `<> 'draft'`. Without this migration a document that is still
-- awaiting review — or one that was explicitly REJECTED — counts in the trial
-- balance, the balance sheet and the income statement.
--
-- The predicate is rewritten to name the two statuses that actually mean "this
-- is in the books", so adding a status to the ladder later cannot silently pull
-- it into the financial statements again.
--
-- PART 2 adds the analytic reports: cost centre and project performance, party
-- balances (providers, patients), documents still in the workflow, and currency
-- exposure.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- PART 1 — what "in the books" means
-- ---------------------------------------------------------------------------

create or replace function accounting.fn_status_is_in_books(p_status text)
returns boolean language sql immutable as $$
  -- `reversed` stays: the original entry and its reversal both remain in the
  -- ledger and cancel out. Removing it would unbalance every reversed document.
  select p_status in ('posted', 'reversed');
$$;

comment on function accounting.fn_status_is_in_books(text) is
  'Whether an entry counts towards the financial statements. Not the same as "not a draft".';

/*
 * v_trial_balance is rewritten in full rather than having its predicate swapped,
 * because the predicate was in the wrong place to begin with:
 *
 *     LEFT JOIN journal_lines   l ON l.account_id = a.id
 *     LEFT JOIN journal_entries e ON e.id = l.entry_id AND e.status <> 'draft'
 *
 * The status test sat on the LEFT JOIN to the *entry*. When it failed, `e` became
 * NULL but the LINE stayed in the result, and sum(l.base_debit_amount) counted it
 * anyway. Draft lines have therefore been inside the trial balance — and so the
 * balance sheet and income statement built on it — since 0009. 0014 only widened
 * the leak to temporary, approved and rejected documents.
 *
 * The fix filters the lines themselves, and keeps accounts LEFT JOINed so an
 * account with no postings still appears with a zero balance.
 */
create or replace view accounting.v_trial_balance as
select
  a.id                  as account_id,
  a.code                as account_code,
  a.name_translations   as account_name,
  a.account_type,
  a.normal_balance,
  l.base_currency_code  as currency_code,
  coalesce(sum(l.base_debit_amount), 0::numeric)  as total_debit,
  coalesce(sum(l.base_credit_amount), 0::numeric) as total_credit,
  case a.normal_balance
    when 'debit' then coalesce(sum(l.base_debit_amount), 0::numeric)
                    - coalesce(sum(l.base_credit_amount), 0::numeric)
    else              coalesce(sum(l.base_credit_amount), 0::numeric)
                    - coalesce(sum(l.base_debit_amount), 0::numeric)
  end                   as balance
from accounting.accounts a
left join (
  select l.*
    from accounting.journal_lines l
    join accounting.journal_entries e on e.id = l.entry_id
   where accounting.fn_status_is_in_books(e.status)
) l on l.account_id = a.id
group by a.id, a.code, a.name_translations, a.account_type, a.normal_balance,
         l.base_currency_code;

/*
 * These two put the status test where it actually filters — an INNER JOIN and a
 * WHERE respectively — so only the predicate needs updating. They are rewritten
 * from their own definitions so nothing but the predicate can change.
 */
do $$
declare
  v_name text;
  v_def  text;
  v_new  text;
begin
  foreach v_name in array array[
    'v_ledger_entries',
    'v_account_balances_by_currency'
  ] loop
    v_def := pg_get_viewdef(('accounting.' || v_name)::regclass);

    v_new := replace(
      v_def,
      'status <> ''draft''::text',
      'status = ANY (ARRAY[''posted''::text, ''reversed''::text])'
    );

    if v_new = v_def then
      raise exception
        'View accounting.% did not contain the expected draft predicate; refusing to guess.', v_name;
    end if;

    execute format('create or replace view accounting.%I as %s', v_name, v_new);
    raise notice 'Rewrote accounting.% to count only posted and reversed entries.', v_name;
  end loop;
end $$;

-- Prove no view still treats "not a draft" as "in the books".
do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'v_trial_balance',
    'v_ledger_entries',
    'v_account_balances_by_currency'
  ] loop
    if pg_get_viewdef(('accounting.' || v_name)::regclass) like '%<> ''draft''%' then
      raise exception 'View accounting.% still filters on <> draft', v_name;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- PART 2 — analytic reports
-- ---------------------------------------------------------------------------

-- Cost centre performance, with budget consumption where a budget was set.
create or replace view accounting.v_cost_center_report as
select
  d.id                                            as cost_center_id,
  d.code,
  d.name_translations,
  d.budget_amount,
  d.budget_currency,
  coalesce(sum(l.base_debit_amount), 0)           as total_debit,
  coalesce(sum(l.base_credit_amount), 0)          as total_credit,
  coalesce(sum(l.base_debit_amount - l.base_credit_amount), 0) as net_amount,
  count(distinct l.entry_id)                      as entry_count,
  case
    when d.budget_amount is null or d.budget_amount = 0 then null
    else round(
      coalesce(sum(l.base_debit_amount - l.base_credit_amount), 0) / d.budget_amount * 100,
      2
    )
  end                                             as budget_used_percent
from accounting.dimensions d
-- Same shape as v_trial_balance and for the same reason: filtering the entry on a
-- LEFT JOIN leaves the line behind when the test fails, and sum() still counts it.
left join (
  select l.*
    from accounting.journal_lines l
    join accounting.journal_entries e on e.id = l.entry_id
   where accounting.fn_status_is_in_books(e.status)
) l on l.cost_center_id = d.id
where d.kind = 'cost_center'
group by d.id, d.code, d.name_translations, d.budget_amount, d.budget_currency;

comment on view accounting.v_cost_center_report is
  'Spend per cost centre against its budget. Only posted and reversed entries count.';

create or replace view accounting.v_project_report as
select
  d.id                                            as project_id,
  d.code,
  d.name_translations,
  d.budget_amount,
  d.starts_on,
  d.ends_on,
  coalesce(sum(l.base_debit_amount), 0)           as total_debit,
  coalesce(sum(l.base_credit_amount), 0)          as total_credit,
  coalesce(sum(l.base_debit_amount - l.base_credit_amount), 0) as net_amount,
  count(distinct l.entry_id)                      as entry_count
from accounting.dimensions d
left join (
  select l.*
    from accounting.journal_lines l
    join accounting.journal_entries e on e.id = l.entry_id
   where accounting.fn_status_is_in_books(e.status)
) l on l.project_id = d.id
where d.kind = 'project'
group by d.id, d.code, d.name_translations, d.budget_amount, d.starts_on, d.ends_on;

/*
 * Subsidiary ledger by party — "how much do we owe this provider", "what does
 * this patient still owe us".
 *
 * The sign is normalised against the account's own nature so a balance reads the
 * way an accountant expects: positive means the party owes us on a receivable
 * account, and means we owe them on a payable one.
 */
create or replace view accounting.v_party_balances as
select
  l.party_type,
  l.party_id,
  a.id                                   as account_id,
  a.code                                 as account_code,
  a.name_translations                    as account_name,
  a.account_type,
  a.normal_balance,
  l.base_currency_code                   as currency_code,
  sum(l.base_debit_amount)               as total_debit,
  sum(l.base_credit_amount)              as total_credit,
  case a.normal_balance
    when 'debit'  then sum(l.base_debit_amount - l.base_credit_amount)
    else               sum(l.base_credit_amount - l.base_debit_amount)
  end                                    as balance,
  count(*)                               as line_count,
  max(e.entry_date)                      as last_movement_at
from accounting.journal_lines l
join accounting.journal_entries e on e.id = l.entry_id
join accounting.accounts a        on a.id = l.account_id
where l.party_id is not null
  and accounting.fn_status_is_in_books(e.status)
group by l.party_type, l.party_id, a.id, a.code, a.name_translations,
         a.account_type, a.normal_balance, l.base_currency_code;

comment on view accounting.v_party_balances is
  'Per-party balance per account: provider payables, patient receivables, user wallets.';

/*
 * Documents still in the workflow — the queue an accountant works from, and the
 * one place an unbalanced or long-forgotten document becomes visible.
 */
create or replace view accounting.v_pending_documents as
select
  e.id,
  e.entry_number,
  e.entry_date,
  e.reference_number,
  e.description,
  e.entry_type,
  e.status,
  e.is_manual,
  e.created_by,
  e.created_at,
  e.approved_by,
  coalesce(sum(l.base_debit_amount), 0)  as total_debit,
  coalesce(sum(l.base_credit_amount), 0) as total_credit,
  coalesce(sum(l.base_debit_amount), 0)
    - coalesce(sum(l.base_credit_amount), 0) as difference,
  coalesce(sum(l.base_debit_amount), 0) <> coalesce(sum(l.base_credit_amount), 0)
                                         as is_unbalanced,
  count(l.id)                            as line_count,
  (current_date - e.entry_date::date)    as age_days
from accounting.journal_entries e
left join accounting.journal_lines l on l.entry_id = e.id
where not accounting.fn_status_is_in_books(e.status)
group by e.id;

comment on view accounting.v_pending_documents is
  'Every document not yet in the books, with its imbalance and age. The approval queue.';

/*
 * Currency exposure: what each currency holds, and what it is worth at the rates
 * the entries were posted with. The gap between that and today's rate is the
 * unrealised FX position, which is what a revaluation entry settles.
 */
create or replace view accounting.v_currency_exposure as
select
  l.currency_code,
  sum(l.debit_amount)                          as total_debit,
  sum(l.credit_amount)                         as total_credit,
  sum(l.debit_amount - l.credit_amount)        as net_amount,
  l.base_currency_code,
  sum(l.base_debit_amount - l.base_credit_amount) as net_base_amount,
  count(distinct l.entry_id)                   as entry_count
from accounting.journal_lines l
join accounting.journal_entries e on e.id = l.entry_id
where accounting.fn_status_is_in_books(e.status)
group by l.currency_code, l.base_currency_code;

comment on view accounting.v_currency_exposure is
  'Net position per currency, and its base-currency value at the posted rates.';

commit;
