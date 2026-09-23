-- ---------------------------------------------------------------------------
-- LSevin local DEV seed  (docker-compose.dev.yml -> postgres init, first boot only)
--
-- schema_backup.sql restores STRUCTURE ONLY. This file adds the minimum rows a
-- developer needs to exercise the Shop sub-system end to end against a fresh
-- database:
--   * finance currencies / FX rates / country->currency defaults / margin profile
--   * the Shop pricing-mode platform setting
--   * a warehouse, delivery methods, shop-local payment methods
--   * identity roles so an account can be promoted to admin (see promote-admin.sql)
--
-- The Shop catalogue itself (brands/categories/products/media/inventory/home/
-- coupons) is applied by `pnpm migrate` from 0022_shop_seed_healthcare.sql — see
-- the note at the bottom of this file.
--
-- Everything is idempotent (ON CONFLICT / NOT EXISTS) so re-running by hand after
-- `down` (without `-v`) is harmless.
-- ---------------------------------------------------------------------------
set search_path = public;

-- ======================================================================
-- FINANCE
-- ======================================================================
insert into finance.fx_margin_profiles (code, name, default_margin_percent, is_active) values
  ('standard', 'Standard', 0, true)
on conflict (code) do nothing;

insert into finance.currencies
  (code, name, native_name, symbol, decimal_digits, is_iso, is_active, is_display_enabled, is_payment_enabled, is_settlement_enabled, sort_order, asset_class)
values
  ('USD', 'US Dollar',        'US Dollar',   '$',      2, true, true, true,  true,  true,  10, 'fiat'),
  ('EUR', 'Euro',             'Euro',        '€',      2, true, true, true,  true,  false, 20, 'fiat'),
  ('TRY', 'Turkish Lira',     'Türk Lirası', '₺',      2, true, true, true,  true,  false, 30, 'fiat'),
  ('AED', 'UAE Dirham',       'درهم',        'AED',    2, true, true, true,  false, false, 40, 'fiat'),
  ('GBP', 'Pound Sterling',   'Pound',       '£',      2, true, true, true,  false, false, 50, 'fiat'),
  ('IRR', 'Iranian Rial',     'ریال',        'ریال',   0, true, true, true,  true,  true,  60, 'fiat'),
  ('IRT', 'Iranian Toman',    'تومان',       'تومان',  0, false,true, true,  true,  true,  61, 'fiat')
on conflict (code) do update set
  is_active = excluded.is_active,
  is_display_enabled = excluded.is_display_enabled,
  is_payment_enabled = excluded.is_payment_enabled,
  symbol = excluded.symbol,
  decimal_digits = excluded.decimal_digits;

insert into finance.country_currency_defaults (country_code, currency_code, is_active) values
  ('US', 'USD', true),
  ('TR', 'TRY', true),
  ('IR', 'IRT', true),
  ('AE', 'AED', true),
  ('GB', 'GBP', true),
  ('DE', 'EUR', true),
  ('FR', 'EUR', true)
on conflict (country_code) do update set currency_code = excluded.currency_code, is_active = true;

-- FX rates are quoted against USD; finance.get_latest_rate() pivots the rest via USD.
-- Representative mid-market values for local testing (NOT production data).
insert into finance.exchange_rates (base_currency_code, quote_currency_code, rate, source, is_latest, as_of)
select v.base, v.quote, v.rate, 'dev_seed', true, now()
from (values
  ('USD','EUR', 0.92),
  ('USD','TRY', 41.00),
  ('USD','AED', 3.6725),
  ('USD','GBP', 0.79),
  ('USD','IRR', 900000.0),
  ('USD','IRT', 90000.0)
) as v(base, quote, rate)
where not exists (
  select 1 from finance.exchange_rates e
  where e.base_currency_code = v.base and e.quote_currency_code = v.quote and e.is_latest = true
);

-- Shop display-pricing mode (§4.4 / SHP-ADM-019). Read through finance.settings so
-- Shop consumes the platform pricing contract instead of hardcoding it.
insert into finance.settings (key, value) values
  ('shop_pricing_mode', jsonb_build_object('value', 'market_default_with_selector')),
  ('shop_default_currency', jsonb_build_object('value', 'USD'))
on conflict (key) do nothing;

-- ======================================================================
-- IDENTITY roles (promotion target for local admin access)
-- ======================================================================
insert into identity.asp_net_roles (id, name, normalized_name, concurrency_stamp) values
  ('11111111-1111-4111-8111-111111111101', 'superadmin', 'SUPERADMIN', gen_random_uuid()::text),
  ('11111111-1111-4111-8111-111111111102', 'admin',      'ADMIN',      gen_random_uuid()::text),
  ('11111111-1111-4111-8111-111111111103', 'user',       'USER',       gen_random_uuid()::text)
on conflict (id) do nothing;

-- ======================================================================
-- SHOP — operational config
-- ======================================================================
insert into shop.warehouses (id, name, code, country, city, address_line_1, is_active) values
  ('22222222-2222-4222-8222-222222222201', 'Main Warehouse', 'WH-MAIN', 'TR', 'Istanbul', 'Depo Sok. 1', true)
on conflict (id) do nothing;

insert into shop.delivery_methods (id, code, name_translations, description_translations, is_active, base_fee, estimated_days_min, estimated_days_max)
values
  ('22222222-2222-4222-8222-222222222301', 'standard',
    '{"en":"Standard delivery","fa":"ارسال عادی","ar":"توصيل قياسي"}'::jsonb,
    '{"en":"Delivered in 3-6 business days","fa":"تحویل در ۳ تا ۶ روز کاری","ar":"التوصيل خلال 3-6 أيام عمل"}'::jsonb,
    true, 4.99, 3, 6),
  ('22222222-2222-4222-8222-222222222302', 'express',
    '{"en":"Express delivery","fa":"ارسال سریع","ar":"توصيل سريع"}'::jsonb,
    '{"en":"Delivered in 1-2 business days","fa":"تحویل در ۱ تا ۲ روز کاری","ar":"التوصيل خلال 1-2 يوم عمل"}'::jsonb,
    true, 12.99, 1, 2)
on conflict (code) do nothing;

insert into shop.payment_methods (id, code, name_translations, description_translations, provider, is_active, supports_authorize, supports_capture, supports_refund, sort_order)
values
  ('22222222-2222-4222-8222-222222222401', 'zarinpal',
    '{"en":"Online payment","fa":"پرداخت آنلاین","ar":"الدفع الإلكتروني"}'::jsonb,
    '{"en":"Pay securely with your card","fa":"پرداخت امن با کارت","ar":"ادفع بأمان ببطاقتك"}'::jsonb,
    'zarinpal', true, true, true, true, 10),
  ('22222222-2222-4222-8222-222222222402', 'bank_transfer',
    '{"en":"Bank transfer","fa":"کارت به کارت / حواله","ar":"تحويل بنكي"}'::jsonb,
    '{"en":"Transfer to our account and upload the receipt","fa":"واریز به حساب و بارگذاری رسید","ar":"حوّل إلى حسابنا وارفع الإيصال"}'::jsonb,
    'manual', true, false, false, true, 20)
on conflict (code) do nothing;

-- ======================================================================
-- SHOP — catalogue
-- ======================================================================
-- The demo catalogue (brands, categories, products, media, inventory, home
-- sections, coupons) now lives in a numbered migration so it ships to every
-- environment identically and stays production-safe:
--
--   frontend/webapp/db/migrations/0022_shop_seed_healthcare.sql
--   theme: تجهیزات پزشکی، سلامت و زیبایی
--          (medical equipment, health monitoring, first aid, personal care,
--           beauty & skincare, supplements) — 5 brands, 6 categories,
--           18 products, home rails, coupons HEALTH10 / CARE5 / FREESHIP50
--
-- After `docker compose ... up -d`, from frontend/webapp run:  pnpm migrate
-- That applies 0022 (and every other pending migration) against this database.
-- Re-running it is harmless — every row is ON CONFLICT DO NOTHING.
