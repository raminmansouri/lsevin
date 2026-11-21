import "server-only";

import sql from "@/config/database/db";

/**
 * SQL for showing a provider attribute (category.provider_attributes `pa` joined
 * to category.provider_attribute_definitions `pad`) in the visitor's language.
 *
 * - Text attributes keep their own per-language value.
 * - Select / MultiSelect / Enum attributes store a copy of the chosen option's
 *   value at save time, so translations added to the option later never reached
 *   the page. They are now resolved through the option itself: the option whose
 *   value matches what was saved, shown in the visitor's language.
 * - Yes/no answers (true/false, دارد/ندارد, ...) are shown as ✅ / ❌.
 */

/**
 * Yes/no answers are shown as ✅ / ❌ in every language. Covers real Yes/No
 * attributes ("true"/"false") and Select attributes whose options are yes/no
 * words such as دارد / ندارد, whatever language the value was saved in.
 */
const YES_WORDS = ["true", "yes", "دارد", "بله", "هست", "نعم", "يوجد", "evet", "var", "sí", "si", "ja", "oui", "да", "есть", "是", "有", "✅", "✔", "✔️"];
const NO_WORDS = ["false", "no", "ندارد", "خیر", "نیست", "لا", "لا يوجد", "hayır", "yok", "nein", "non", "нет", "否", "无", "❌", "✖", "✖️"];
const YES_MARK = "✅";
const NO_MARK = "❌";

const FALLBACK_LOCALE = "en-US";

function baseOf(locale: string) {
  return (locale || "").toLowerCase().replace("_", "-").split("-")[0] || "en";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeObject(column: any) {
  return sql`(case when jsonb_typeof(${column}) = 'object' then ${column} else '{}'::jsonb end)`;
}

/** The value for exactly the visitor's language (no fallback), or null. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exactTranslation(column: any, base: string) {
  return sql`(
    select nullif(btrim(e.value), '')
    from jsonb_each_text(${safeObject(column)}) e
    where split_part(lower(replace(e.key, '_', '-')), '-', 1) = ${base}
      and nullif(btrim(e.value), '') is not null
    order by e.key
    limit 1
  )`;
}

export function localizedProviderAttributeValue(locale: string) {
  const base = baseOf(locale);
  const savedValue = safeObject(sql`pa.value_translations`);
  const savedIsAny = (words: string[]) => sql`exists (
    select 1 from jsonb_each_text(${savedValue}) sv
    where lower(btrim(sv.value)) = any(${words}::text[])
  )`;

  return sql`case
    when ${savedIsAny(YES_WORDS)} then ${YES_MARK}::text
    when ${savedIsAny(NO_WORDS)} then ${NO_MARK}::text
    else coalesce(
    (
      select coalesce(
        ${exactTranslation(sql`o.value_translations`, base)},
        ${exactTranslation(sql`o.display_name_translations`, base)},
        nullif(common.get_translation_t(o.value_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        nullif(common.get_translation_t(o.display_name_translations, ${locale}, ${FALLBACK_LOCALE}), '')
      )
      from category.provider_attribute_definition_domain_options o
      where pad.attribute_type_id in (5, 6, 7)
        and o.provider_attribute_definition_id = pa.attribute_definition_id
        and exists (
          select 1
          from jsonb_each_text(${safeObject(sql`o.value_translations`)}) ov,
               jsonb_each_text(${savedValue}) pv
          where nullif(btrim(ov.value), '') is not null
            and btrim(ov.value) = btrim(pv.value)
        )
      order by o.id
      limit 1
    ),
    common.get_translation_t(pa.value_translations, ${locale}, ${FALLBACK_LOCALE})
  ) end`;
}


export function localizedServiceAttributeValue(locale: string) {
  const savedValue = safeObject(sql`sav.value_translations`);
  const savedIsAny = (words: string[]) => sql`exists (
    select 1 from jsonb_each_text(${savedValue}) sv
    where lower(btrim(sv.value)) = any(${words}::text[])
  )`;

  return sql`case
    when ${savedIsAny(YES_WORDS)} then ${YES_MARK}::text
    when ${savedIsAny(NO_WORDS)} then ${NO_MARK}::text
    else common.get_translation_t(sav.value_translations, ${locale}, ${FALLBACK_LOCALE})
  end`;
}