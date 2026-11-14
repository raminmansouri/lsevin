-- Exchange rates: one rate per currency, against USD (decided 2026-11-12).
--
-- get_latest_rate used the direct pair first, then its inverse, then a USD
-- pivot. The direct pairs entered over time contradicted the USD ones: on
-- 2026-11-12 one 2,500,000,000 IRR package showed as $2,381 but as 905,000 TRY,
-- 68,000 AED and EUR 16,500 (each about $18,000) — roughly 7.6 times too much,
-- on pages and in checkout conversions alike.
--
-- Now every currency has exactly one rate: units per 1 USD, read from its
-- USD->X row, else the inverse of its X->USD row. Any other pair is derived
-- from those two numbers, so no two pairs can disagree. The one exception is a
-- definitional pair (source starting with 'definitional', e.g. 1 IRT = 10 IRR),
-- which is exact and used as is (and gives IRT its USD rate through IRR).
-- A currency with no USD rate has no conversions at all: callers already fall
-- back to USD rather than inventing a number.
--
-- Rows are not changed; old direct pairs stay in finance.exchange_rates for the
-- record but are no longer used. Finance enters new rates as USD->X.

create or replace function finance.units_per_usd(p_currency_code character varying)
returns table(units numeric, exchange_rate_ids uuid[], as_of timestamp with time zone, expires_at timestamp with time zone)
language plpgsql
stable
as $$
declare
  v_code varchar(10) := upper(btrim(p_currency_code));
  v_row record;
  v_irr record;
begin
  if v_code = 'USD' then
    return query select 1::numeric, array[]::uuid[], now(), null::timestamptz;
    return;
  end if;

  select * into v_row
    from finance.exchange_rates er
   where er.base_currency_code = 'USD' and er.quote_currency_code = v_code
     and er.is_latest and (er.expires_at is null or er.expires_at > now())
   order by er.as_of desc limit 1;
  if found then
    return query select v_row.rate, array[v_row.id]::uuid[], v_row.as_of, v_row.expires_at;
    return;
  end if;

  select * into v_row
    from finance.exchange_rates er
   where er.base_currency_code = v_code and er.quote_currency_code = 'USD'
     and er.is_latest and (er.expires_at is null or er.expires_at > now())
   order by er.as_of desc limit 1;
  if found then
    return query select 1 / v_row.rate, array[v_row.id]::uuid[], v_row.as_of, v_row.expires_at;
    return;
  end if;

  -- A currency defined against another one (IRT = IRR / 10): its USD rate
  -- follows from that currency's.
  select * into v_row
    from finance.exchange_rates er
   where er.is_latest and er.source like 'definitional%'
     and (er.base_currency_code = v_code or er.quote_currency_code = v_code)
   order by er.as_of desc limit 1;
  if found then
    if v_row.quote_currency_code = v_code then
      -- 1 base = rate * code  =>  code per USD = base per USD * rate
      select * into v_irr from finance.units_per_usd(v_row.base_currency_code) limit 1;
      if v_irr.units is not null then
        return query select v_irr.units * v_row.rate, v_irr.exchange_rate_ids || v_row.id, v_irr.as_of, v_irr.expires_at;
        return;
      end if;
    else
      select * into v_irr from finance.units_per_usd(v_row.quote_currency_code) limit 1;
      if v_irr.units is not null then
        return query select v_irr.units / v_row.rate, v_irr.exchange_rate_ids || v_row.id, v_irr.as_of, v_irr.expires_at;
        return;
      end if;
    end if;
  end if;

  return query select null::numeric, array[]::uuid[], null::timestamptz, null::timestamptz;
end;
$$;

comment on function finance.units_per_usd(character varying) is
  'Units of a currency per 1 USD: its USD->X rate, else 1 / X->USD, else via a definitional pair; null when none.';

create or replace function finance.get_latest_rate(p_source_currency_code character varying, p_target_currency_code character varying)
returns table(base_rate numeric, exchange_rate_ids uuid[], rate_path text[], as_of timestamp with time zone, expires_at timestamp with time zone, source text)
language plpgsql
stable
as $$
declare
  v_source varchar(10) := upper(btrim(p_source_currency_code));
  v_target varchar(10) := upper(btrim(p_target_currency_code));
  v_definitional record;
  v_s record;
  v_t record;
begin
  if v_source = v_target then
    return query select 1::numeric, array[]::uuid[], array[v_source, v_target]::text[], now(), null::timestamptz, 'same_currency'::text;
    return;
  end if;

  -- An exact definition between the two (1 IRT = 10 IRR), either direction.
  select * into v_definitional
    from finance.exchange_rates er
   where er.is_latest and er.source like 'definitional%'
     and ((er.base_currency_code = v_source and er.quote_currency_code = v_target)
       or (er.base_currency_code = v_target and er.quote_currency_code = v_source))
   order by er.as_of desc limit 1;
  if found then
    return query select
      case when v_definitional.base_currency_code = v_source then v_definitional.rate else 1 / v_definitional.rate end,
      array[v_definitional.id]::uuid[], array[v_source, v_target]::text[],
      v_definitional.as_of, v_definitional.expires_at, v_definitional.source::text;
    return;
  end if;

  select * into v_s from finance.units_per_usd(v_source) limit 1;
  select * into v_t from finance.units_per_usd(v_target) limit 1;
  if v_s.units is null or v_t.units is null then
    raise exception 'No active exchange rate found from % to %', v_source, v_target
      using errcode = 'P0001';
  end if;

  return query select
    v_t.units / v_s.units,
    coalesce(v_s.exchange_rate_ids, array[]::uuid[]) || coalesce(v_t.exchange_rate_ids, array[]::uuid[]),
    case when v_source = 'USD' or v_target = 'USD' then array[v_source, v_target]::text[] else array[v_source, 'USD', v_target]::text[] end,
    least(v_s.as_of, v_t.as_of),
    case when v_s.expires_at is null then v_t.expires_at when v_t.expires_at is null then v_s.expires_at else least(v_s.expires_at, v_t.expires_at) end,
    'usd_base'::text;
end;
$$;

comment on function finance.get_latest_rate(character varying, character varying) is
  'Rate between two currencies from each one''s single USD rate (finance.units_per_usd); definitional pairs exact.';
