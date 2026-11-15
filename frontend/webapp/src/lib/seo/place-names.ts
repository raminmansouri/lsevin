import "server-only";

import { cache } from "react";

import sql from "@/config/database/db";

/**
 * A provider's city in the page's language, for titles and structured data.
 *
 * service_providers.city holds a location code ("BANDARABBA" — codes are capped
 * at ten characters), which showed up as-is in Persian page titles and in
 * PostalAddress.addressLocality. The code is looked up among the cities of the
 * provider's country (directly or under a province) and its translation is used:
 * the page language, else English, else the stored value.
 */
export const cityLabel = cache(
  async (country: string | null | undefined, city: string | null | undefined, locale: string): Promise<string | null> => {
    const code = city?.trim();
    if (!code) return null;
    const language = locale.split("-")[0].toLowerCase();
    try {
      const [row] = await sql<{ label: string | null }[]>`
        select coalesce(
                 (select nullif(btrim(v), '') from jsonb_each_text(l.value_translations) as t(k, v)
                   where k = ${language} or split_part(k, '-', 1) = ${language} order by length(k) limit 1),
                 nullif(btrim(l.value_translations ->> 'en-US'), ''),
                 nullif(btrim(l.value_translations ->> 'en'), '')
               ) as label
          from category.locations l
          left join category.locations p on p.id = l.parent_id
          left join category.locations c on c.id = coalesce(case when p.location_type_id = 1 then p.id end, p.parent_id)
         where l.location_type_id = 2
           and upper(l.code) = upper(${code})
           and (${country ?? ""} = '' or upper(c.code) = upper(${country ?? ""}))
         limit 1
      `;
      return row?.label || code;
    } catch {
      return code;
    }
  },
);
