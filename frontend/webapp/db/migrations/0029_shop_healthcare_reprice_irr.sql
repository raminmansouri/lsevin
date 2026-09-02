-- ---------------------------------------------------------------------------
-- 0029_shop_healthcare_reprice_irr.sql
--
-- The 0022 healthcare catalogue was priced in USD. On an environment whose
-- Finance has no USD -> IRR rate, every displayed price resolves to
-- "price unavailable" and the cart / checkout are blocked.
--
-- Re-price those seed products (only the 0022 ids, only while still 'USD') into
-- IRR — the platform's own market currency — so no FX conversion is needed for
-- the primary market. ~1 USD = 900,000 IRR (the dev-seed reference), rounded to
-- the nearest 100,000 IRR for tidy figures. Idempotent: the `where` clause makes
-- a re-run a no-op.
-- ---------------------------------------------------------------------------
set search_path = public;

do $$
declare rate numeric := 900000;
begin
  if to_regclass('shop.products') is null then return; end if;

  update shop.products
  set base_currency = 'IRR',
      base_price = round(base_price * rate / 100000) * 100000,
      compare_at_price = case
        when compare_at_price is not null and compare_at_price > 0
        then round(compare_at_price * rate / 100000) * 100000
        else compare_at_price end,
      last_modified_date = now()
  where id::text like '44444444-0000-4000-8000-00000000d0%'
    and base_currency = 'USD';

  update shop.product_variants v
  set currency = 'IRR',
      price = round(v.price * rate / 100000) * 100000,
      compare_at_price = case
        when v.compare_at_price is not null and v.compare_at_price > 0
        then round(v.compare_at_price * rate / 100000) * 100000
        else v.compare_at_price end,
      last_modified_date = now()
  from shop.products p
  where p.id = v.product_id
    and p.id::text like '44444444-0000-4000-8000-00000000d0%'
    and v.currency = 'USD';

  -- keep the FTS vector fresh (name/desc unchanged, but harmless)
  raise notice '0029: healthcare catalogue re-priced to IRR';
end $$;
