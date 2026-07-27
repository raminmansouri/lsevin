-- Cut-over: bring every legacy wallet balance into the ledger as an opening entry.
--
-- One journal entry per customer per currency, so a problem with one customer cannot
-- block the rest and each entry is individually traceable:
--
--     Dr  3003001  تراز افتتاحیه            (opening balance equity)
--     Cr  2001001  موجودی کیف پول کاربران   (that customer's wallet)
--
-- Why equity and not an asset: the money physically sits in gateway balances, the
-- platform bank account and crypto wallets, and this migration cannot know how it is
-- split. Opening-balance equity is the standard suspense account for exactly that. As
-- each real asset balance is entered afterwards (Dr asset / Cr 3003001), this account
-- drains toward zero — and whatever is left in it is precisely the money the platform
-- cannot account for. That residual is the number worth watching.
--
-- IDEMPOTENT. The idempotency key is derived from the wallet, so re-running credits
-- nobody twice: the second run finds every key taken and inserts nothing.
--
-- Balances of zero or less are skipped. A negative legacy balance means the legacy race
-- condition already overdrew someone; importing it would fail the wallet's non-negative
-- CHECK, and it needs a human decision rather than a silent import — 0012 reports them.

do $$
declare
  v_period_id       uuid;
  v_equity_account  uuid;
  v_wallet_account  uuid;
  v_row             record;
  v_wallet_id       uuid;
  v_entry_id        uuid;
  v_line_id         uuid;
  v_key             text;
  v_imported        integer := 0;
  v_skipped         integer := 0;
begin
  select id into v_equity_account from accounting.accounts where system_key = 'opening_balance_equity';
  select id into v_wallet_account from accounting.accounts where system_key = 'user_wallet_liability';
  if v_equity_account is null or v_wallet_account is null then
    raise exception 'The accounting seed has not been applied (missing system accounts).';
  end if;

  -- A period covering today has to exist before anything can post.
  insert into accounting.fiscal_years (code, starts_on, ends_on)
  select to_char(now(), 'YYYY'),
         date_trunc('year', now())::date,
         (date_trunc('year', now()) + interval '1 year - 1 day')::date
  where not exists (select 1 from accounting.fiscal_years where code = to_char(now(), 'YYYY'));

  insert into accounting.fiscal_periods (fiscal_year_id, code, starts_on, ends_on)
  select fy.id, to_char(now(), 'YYYY-MM'),
         date_trunc('month', now())::date,
         (date_trunc('month', now()) + interval '1 month - 1 day')::date
  from accounting.fiscal_years fy
  where fy.code = to_char(now(), 'YYYY')
    and not exists (
      select 1 from accounting.fiscal_periods
      where current_date between starts_on and ends_on
    );

  select id into v_period_id
  from accounting.fiscal_periods
  where current_date between starts_on and ends_on
  limit 1;

  for v_row in
    select legacy.user_id, legacy.currency_code, legacy.available_amount
    from accounting.v_legacy_wallet_balances legacy
    join finance.currencies c on c.code = legacy.currency_code
    order by legacy.user_id, legacy.currency_code
  loop
    if v_row.available_amount is null or v_row.available_amount <= 0 then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into accounting.wallets (user_id, currency_code, account_id)
    values (v_row.user_id, v_row.currency_code, v_wallet_account)
    on conflict (user_id, currency_code) do update set updated_at = now()
    returning id into v_wallet_id;

    v_key := 'opening:' || v_wallet_id::text;

    -- Already imported on an earlier run.
    if exists (select 1 from accounting.journal_entries where idempotency_key = v_key) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into accounting.journal_entries (
      entry_date, fiscal_period_id, description, source_type, source_id,
      idempotency_key, base_currency_code, metadata
    ) values (
      now(), v_period_id, 'تراز افتتاحیه — انتقال موجودی کیف پول', 'opening_balance',
      v_wallet_id, v_key,
      (select value #>> '{}' from accounting.settings where key = 'base_currency'),
      jsonb_build_object('migratedFrom', 'customer.wallet_transactions')
    )
    returning id into v_entry_id;

    insert into accounting.journal_lines (
      entry_id, line_no, account_id, currency_code,
      debit_amount, base_currency_code, base_debit_amount, memo
    ) values (
      v_entry_id, 1, v_equity_account, v_row.currency_code,
      v_row.available_amount,
      (select value #>> '{}' from accounting.settings where key = 'base_currency'),
      v_row.available_amount, 'انتقال از سیستم قبلی'
    );

    insert into accounting.journal_lines (
      entry_id, line_no, account_id, party_type, party_id, wallet_id, wallet_bucket,
      currency_code, credit_amount, base_currency_code, base_credit_amount, memo
    ) values (
      v_entry_id, 2, v_wallet_account, 'user', v_row.user_id, v_wallet_id, 'available',
      v_row.currency_code, v_row.available_amount,
      (select value #>> '{}' from accounting.settings where key = 'base_currency'),
      v_row.available_amount, 'انتقال از سیستم قبلی'
    )
    returning id into v_line_id;

    update accounting.wallets
       set available_balance = available_balance + v_row.available_amount,
           last_entry_id = v_entry_id,
           updated_at = now()
     where id = v_wallet_id;

    insert into accounting.wallet_ledger (
      wallet_id, entry_id, journal_line_id, direction, bucket, amount, currency_code,
      balance_after, movement_type, reference_type, description
    )
    select v_wallet_id, v_entry_id, v_line_id, 'credit', 'available',
           v_row.available_amount, v_row.currency_code,
           w.available_balance, 'opening_balance', 'migration',
           'انتقال موجودی از سیستم قبلی'
    from accounting.wallets w where w.id = v_wallet_id;

    v_imported := v_imported + 1;
  end loop;

  raise notice 'Opening balances: % imported, % skipped.', v_imported, v_skipped;
end $$;
