-- Text-type product attributes (e.g. "Store", "Suitable for") stored one free-text
-- value for every language, so the Arabic/Persian storefront showed whatever was typed.
-- Keep a per-locale copy alongside text_value (which stays as the EN/first value).
alter table shop.product_attributes
  add column if not exists text_value_translations jsonb not null default '{}'::jsonb;
