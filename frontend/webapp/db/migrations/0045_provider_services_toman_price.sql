-- ---------------------------------------------------------------------------
-- 0045 — Native Toman price on provider_services, additive to the existing
-- pricing/currency system.
--
-- Context: category.provider_services already has exactly one price (value +
-- currency). service-page.repository.ts already has a whole international
-- pricing pipeline on top of that one price -- convertProviderPrice() /
-- getConvertedProviderPriceOptions() in finance/lib/server/currency-queries.ts,
-- which live-converts it via finance.exchange_rates and, for any currency NOT
-- in DOMESTIC_CURRENCY_CODES (= {'IRR', 'IRT'} -- Toman is already a
-- recognized domestic code there, just never had anywhere to be typed in),
-- marks it up by category.service_providers.international_price_multiplier
-- (or the finance.settings global default).
--
-- What's missing is a way for a provider/admin to type an *exact* Toman
-- amount rather than trust a live FX-converted number -- Rial/Toman FX rates
-- move enough that providers reasonably want to set a round, deliberate
-- Toman price instead of whatever a conversion happens to produce today.
--
-- This column is that: a second, optional, native price alongside the
-- existing one. Nothing about convertProviderPrice, the multiplier, or any
-- existing query changes -- when this is null, every existing price path is
-- byte-for-byte what it was before. When it's set, callers that choose to
-- (see resolveDisplayPrice in finance/lib/server/toman-price.ts) show this
-- number directly to a visitor identified as Iranian, instead of computing a
-- conversion. Open for extension (new callers can opt in one at a time),
-- closed for modification (the existing conversion/multiplier code is never
-- touched).
-- ---------------------------------------------------------------------------
begin;

alter table category.provider_services
  add column if not exists value_toman numeric(18,2);

comment on column category.provider_services.value_toman is
  'Optional, admin-set exact price in Toman. When set, resolveDisplayPrice() shows this directly to visitors identified as Iranian instead of a live-converted amount. Null means: nothing changes, same as before this column existed.';

-- Toman as a first-class, selectable currency (finance.currencies already
-- drives currency pickers/admin UI elsewhere in the app). Non-ISO (IRT is
-- colloquial, not an ISO 4217 code -- IRR is), zero decimal digits (Toman has
-- no sub-units in practice), display-only (not a payment/settlement rail).
insert into finance.currencies (
  code, name, native_name, symbol, decimal_digits, is_iso,
  is_active, is_display_enabled, is_payment_enabled, is_settlement_enabled, sort_order
)
values (
  'IRT', 'Toman', 'تومان', 'تومان', 0, false,
  true, true, false, false, 5
)
on conflict (code) do nothing;

commit;
