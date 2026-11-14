"use server";

import { headers } from "next/headers";
import { z } from "zod";

import sql from "@/config/database/db";
import { countryFromHeaders } from "@/lib/market/market";

/**
 * One search box for a city or a country (migration 0099,
 * category.location_search): every word of the query must match one of the
 * place's names in any language or its country's names, so "Turkey", "türkiye",
 * "ترکیه", "istanbul", "İstanbul", "اسطنبول" and "istanbul turkey" all work.
 * Ordered by: the name starts with the query, the visitor's own country, size.
 */
const schema = z.object({
  query: z.string().trim().max(80),
  locale: z.string().trim().min(2).max(10).optional().default("en"),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

export type PlaceSearchResult = {
  /** category.locations id of the city, or of the country for a country result. */
  id: string;
  kind: "city" | "country";
  label: string;
  /** The country's name in the visitor's language (empty for a country result). */
  countryLabel: string;
  countryId: string;
  countryCode: string;
  cityId: string | null;
};

export async function searchPlacesAction(rawInput: z.input<typeof schema>): Promise<PlaceSearchResult[]> {
  const input = schema.parse(rawInput);
  if (input.query.length < 2) return [];
  const language = input.locale.split("-")[0].toLowerCase();
  const visitorCountry = countryFromHeaders(await headers());

  const rows = await sql<{
    id: string;
    locationTypeId: number;
    label: string;
    countryLabel: string;
    countryId: string;
    countryCode: string;
  }[]>`
    with q as (
      select category.location_search_norm(${input.query}) as text
    ),
    words as (
      select array_remove(string_to_array((select text from q), ' '), '') as list
    )
    select
      s.id::text as id,
      s.location_type_id as "locationTypeId",
      coalesce(
        (select nullif(btrim(v), '') from jsonb_each_text(l.value_translations) as t(k, v)
          where k = ${language} or split_part(k, '-', 1) = ${language} order by length(k) limit 1),
        nullif(btrim(l.value_translations ->> 'en-US'), ''),
        nullif(btrim(l.value_translations ->> 'en'), ''),
        (select nullif(btrim(v), '') from jsonb_each_text(l.value_translations) as t(k, v) where btrim(v) <> '' order by k limit 1),
        l.code
      ) as label,
      coalesce(
        (select nullif(btrim(v), '') from jsonb_each_text(c.value_translations) as t(k, v)
          where k = ${language} or split_part(k, '-', 1) = ${language} order by length(k) limit 1),
        nullif(btrim(c.value_translations ->> 'en-US'), ''),
        c.code
      ) as "countryLabel",
      s.country_id::text as "countryId",
      s.country_code as "countryCode"
    from category.location_search s
    join category.locations l on l.id = s.id
    join category.locations c on c.id = s.country_id
    where (select coalesce(array_length(list, 1), 0) from words) > 0
      and not exists (
        select 1 from unnest((select list from words)) as w(word)
         where s.search_text not like '%' || w.word || '%'
      )
      -- The whole query, for the trigram index (every word is inside it).
      and s.search_text like '%' || (select list[1] from words) || '%'
    order by
      (s.names = (select text from q)) desc,
      (s.names like (select text from q) || '%' or s.names like '% ' || (select text from q) || '%') desc,
      (s.country_code = ${visitorCountry ?? ""}) desc,
      s.rank desc
    limit ${input.limit}
  `;

  return rows.map((row) => {
    const isCountry = row.locationTypeId === 1;
    return {
      id: row.id,
      kind: isCountry ? "country" : "city",
      label: row.label,
      countryLabel: isCountry ? "" : row.countryLabel,
      countryId: row.countryId,
      countryCode: row.countryCode,
      cityId: isCountry ? null : row.id,
    };
  });
}
