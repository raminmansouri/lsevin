import "server-only";

import sql from "@/config/database/db";

import { normalizeLocale } from "../lib/context";

export type ProductSpec = { attributeId: string; name: string; values: string[] };

/** The attribute values an admin set on a product (not the variant options). */
export async function getProductSpecs(productId: string, locale: string): Promise<ProductSpec[]> {
  const lang = normalizeLocale(locale);
  const rows = await sql<{ attributeId: string; name: string; textValue: string | null; values: string[] | null }[]>`
    select a.id::text as "attributeId",
      common.get_translation_t(a.name_translations, ${lang}, 'en') as name,
      coalesce(
        nullif(common.get_translation_t(pa.text_value_translations, ${lang}, 'en'), ''),
        nullif(btrim(pa.text_value), '')
      ) as "textValue",
      (
        select array_agg(
          coalesce(nullif(common.get_translation_t(av.display_name_translations, ${lang}, 'en'), ''), av.value)
          order by av.value
        )
        from shop.attribute_values av
        where av.id = any(pa.value_ids)
      ) as values
    from shop.product_attributes pa
    join shop.attributes a on a.id = pa.attribute_id
    where pa.product_id = ${productId}::uuid
    order by pa.display_order asc, a.slug asc
  `;
  return rows
    .map((r) => ({ attributeId: r.attributeId, name: r.name, values: r.textValue ? [r.textValue] : r.values ?? [] }))
    .filter((spec) => spec.values.length > 0);
}