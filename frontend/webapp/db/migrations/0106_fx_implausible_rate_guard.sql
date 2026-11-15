-- A typo in a USD rate must not reach prices or checkout.
--
-- After 0105 every conversion goes through each currency's single USD rate.
-- On 2026-11-15 production held USD -> AED = 0.0000026 (entered 2026-11-08;
-- the real rate is about 3.67), so Arabic pages priced services at 0.00 AED and
-- a customer billed in AED would have been charged almost nothing.
--
-- No real currency trades above 100 USD per unit or below 1/100,000,000 USD, so
-- an ISO currency whose rate per USD falls outside [0.01, 100,000,000] is
-- treated as having no rate: visitors are shown USD and checkout bills in USD
-- (both already fall back that way), and Admin -> Finance -> Exchange rates
-- lists the currency as missing until the rate is corrected. Non-ISO codes
-- (BTC, USDT, IRT) keep their own bounds-free rates.

create or replace function finance.units_per_usd(p_currency_code character varying)
returns table(units numeric, exchange_rate_ids uuid[], as_of timestamp with time zone, expires_at timestamp with time zone)
language plpgsql
stable
as $$
declare
  v_code varchar(10) := upper(btrim(p_currency_code));
  v_iso boolean;
  v_row record;
  v_base record;
  v_units numeric;
  v_ids uuid[];
  v_as_of timestamptz;
  v_expires timestamptz;
begin
  if v_code = 'USD' then
    return query select 1::numeric, array[]::uuid[], now(), null::timestamptz;
    return;
  end if;

  select coalesce(c.is_iso, true) into v_iso from finance.currencies c where c.code = v_code;
  v_iso := coalesce(v_iso, true);

  select * into v_row
    from finance.exchange_rates er
   where er.base_currency_code = 'USD' and er.quote_currency_code = v_code
     and er.is_latest and (er.expires_at is null or er.expires_at > now())
   order by er.as_of desc limit 1;
  if found then
    v_units := v_row.rate; v_ids := array[v_row.id]::uuid[]; v_as_of := v_row.as_of; v_expires := v_row.expires_at;
  else
    select * into v_row
      from finance.exchange_rates er
     where er.base_currency_code = v_code and er.quote_currency_code = 'USD'
       and er.is_latest and (er.expires_at is null or er.expires_at > now())
     order by er.as_of desc limit 1;
    if found then
      v_units := 1 / v_row.rate; v_ids := array[v_row.id]::uuid[]; v_as_of := v_row.as_of; v_expires := v_row.expires_at;
    else
      -- A currency defined against another one (IRT = IRR / 10).
      select * into v_row
        from finance.exchange_rates er
       where er.is_latest and er.source like 'definitional%'
         and (er.base_currency_code = v_code or er.quote_currency_code = v_code)
       order by er.as_of desc limit 1;
      if found then
        if v_row.quote_currency_code = v_code then
          select * into v_base from finance.units_per_usd(v_row.base_currency_code) limit 1;
          if v_base.units is not null then
            v_units := v_base.units * v_row.rate;
          end if;
        else
          select * into v_base from finance.units_per_usd(v_row.quote_currency_code) limit 1;
          if v_base.units is not null then
            v_units := v_base.units / v_row.rate;
          end if;
        end if;
        if v_units is not null then
          v_ids := v_base.exchange_rate_ids || v_row.id; v_as_of := v_base.as_of; v_expires := v_base.expires_at;
        end if;
      end if;
    end if;
  end if;

  if v_units is null or (v_iso and (v_units < 0.01 or v_units > 100000000)) then
    return query select null::numeric, array[]::uuid[], null::timestamptz, null::timestamptz;
    return;
  end if;

  return query select v_units, v_ids, v_as_of, v_expires;
end;
$$;

comment on function finance.units_per_usd(character varying) is
  'Units of a currency per 1 USD: its USD->X rate, else 1 / X->USD, else via a definitional pair; null when none or (ISO currencies) outside 0.01..100,000,000.';
