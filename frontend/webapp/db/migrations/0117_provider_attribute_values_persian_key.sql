-- Provider attribute values in the visitor's language (2026-11-19).
--
-- The admin Attributes tab used to save a text attribute from one plain input
-- as { "en-US": <text> }, whatever language was typed. Almost all of it was
-- typed in Persian, so English visitors were shown Persian under the English
-- key and the Persian value could not be told apart from a real translation.
--
-- The tab now saves one value per site language. This moves the old
-- single-language values written in Persian/Arabic script to the fa-IR key,
-- so they stay the Persian (default) value and the English tab starts empty.
-- Visitors in any language still see them as a fallback until translated
-- (common.get_translation_t falls back to the first non-empty value).
--
-- The same repair is applied to attribute names/descriptions and to the
-- Select options' names and values, which had the same problem.
--
-- Only values whose ONLY key is en-US and whose text contains Persian/Arabic
-- letters are touched. Re-running it is a no-op.


update category.provider_attributes
set value_translations = jsonb_build_object('fa-IR', value_translations ->> 'en-US')
where jsonb_typeof(value_translations) = 'object'
  and value_translations ? 'en-US'
  and (select count(*) from jsonb_object_keys(value_translations)) = 1
  and (value_translations ->> 'en-US') ~ '[؀-ۿ]';

-- Shared rule: { "en-US": <Persian text> } and nothing else -> { "fa-IR": <text> }.
create or replace function pg_temp.persian_from_en_only(v jsonb)
returns jsonb language sql immutable as $$
  select case
    when jsonb_typeof(v) = 'object'
     and v ? 'en-US'
     and (select count(*) from jsonb_object_keys(v)) = 1
     and (v ->> 'en-US') ~ '[\u0600-\u06FF]'
    then jsonb_build_object('fa-IR', v ->> 'en-US')
    else v
  end
$$;

update category.provider_attribute_definitions
set name_translations = pg_temp.persian_from_en_only(name_translations),
    description_translations = pg_temp.persian_from_en_only(description_translations)
where name_translations is distinct from pg_temp.persian_from_en_only(name_translations)
   or description_translations is distinct from pg_temp.persian_from_en_only(description_translations);

update category.provider_attribute_definition_domain_options
set display_name_translations = pg_temp.persian_from_en_only(display_name_translations),
    value_translations = pg_temp.persian_from_en_only(value_translations)
where display_name_translations is distinct from pg_temp.persian_from_en_only(display_name_translations)
   or value_translations is distinct from pg_temp.persian_from_en_only(value_translations);

