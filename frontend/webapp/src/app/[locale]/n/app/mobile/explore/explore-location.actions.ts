"use server";

import sql from "@/config/database/db";

export type ExploreLocationOption = {
  value: string;
  label: string;
  description?: string | null;
};

export type ExploreLocationOptionsResult = {
  items: ExploreLocationOption[];
  hasMore: boolean;
};

type SearchLocationOptionsInput = {
  locale?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type SearchCityOptionsInput = SearchLocationOptionsInput & {
  countryCode?: string | null;
};

function normalizeLocale(locale?: string) {
  return locale?.trim() || "en";
}

function normalizeSearch(search?: string) {
  return search?.trim() || "";
}

function normalizePage(page?: number) {
  return Math.max(1, Number.isFinite(page) ? Number(page) : 1);
}

function normalizePageSize(pageSize?: number) {
  return Math.min(50, Math.max(10, Number.isFinite(pageSize) ? Number(pageSize) : 20));
}

function toResult(rows: Array<{ value: string; label: string; provider_count: number }>, pageSize: number) {
  const visibleRows = rows.slice(0, pageSize);

  return {
    items: visibleRows.map((row) => ({
      value: row.value,
      label: row.label || row.value,
      description: `${Number(row.provider_count ?? 0).toLocaleString("en")} providers`,
    })),
    hasMore: rows.length > pageSize,
  } satisfies ExploreLocationOptionsResult;
}

export async function searchExploreCountryOptionsAction({
  locale,
  search,
  page,
  pageSize,
}: SearchLocationOptionsInput): Promise<ExploreLocationOptionsResult> {
  const lang = normalizeLocale(locale);
  const term = normalizeSearch(search);
  const safePage = normalizePage(page);
  const safePageSize = normalizePageSize(pageSize);
  const offset = (safePage - 1) * safePageSize;

  const rows = await sql<Array<{ value: string; label: string; provider_count: number }>>`
    select *
    from (
      select
        sp.country as value,
        coalesce(
          nullif(common.get_translation_t(country_loc.value_translations, ${lang}, 'en'), ''),
          sp.country
        ) as label,
        count(distinct sp.id)::int as provider_count
      from category.service_providers sp
      left join lateral (
        select l.value_translations
        from category.locations l
        where l.code = sp.country
          and l.location_type_id = 1
        order by coalesce(l.display_order, 0), l.create_date desc
        limit 1
      ) country_loc on true
      where sp.is_active = true
        and nullif(btrim(sp.country), '') is not null
      group by sp.country, country_loc.value_translations
    ) countries
    where ${term} = ''
      or countries.value ilike ${`%${term}%`}
      or countries.label ilike ${`%${term}%`}
    order by countries.provider_count desc, countries.label asc
    offset ${offset}
    limit ${safePageSize + 1}
  `;

  return toResult(rows, safePageSize);
}

export async function searchExploreCityOptionsAction({
  locale,
  countryCode,
  search,
  page,
  pageSize,
}: SearchCityOptionsInput): Promise<ExploreLocationOptionsResult> {
  const lang = normalizeLocale(locale);
  const term = normalizeSearch(search);
  const country = countryCode?.trim() || "";
  const safePage = normalizePage(page);
  const safePageSize = normalizePageSize(pageSize);
  const offset = (safePage - 1) * safePageSize;

  if (!country) {
    return { items: [], hasMore: false };
  }

  const rows = await sql<Array<{ value: string; label: string; provider_count: number }>>`
    select *
    from (
      select
        sp.city as value,
        coalesce(
          nullif(common.get_translation_t(city_loc.value_translations, ${lang}, 'en'), ''),
          sp.city
        ) as label,
        count(distinct sp.id)::int as provider_count
      from category.service_providers sp
      left join lateral (
        select l.value_translations
        from category.locations l
        where l.code = sp.city
          and l.location_type_id = 2
        order by coalesce(l.display_order, 0), l.create_date desc
        limit 1
      ) city_loc on true
      where sp.is_active = true
        and sp.country = ${country}
        and nullif(btrim(sp.city), '') is not null
      group by sp.city, city_loc.value_translations
    ) cities
    where ${term} = ''
      or cities.value ilike ${`%${term}%`}
      or cities.label ilike ${`%${term}%`}
    order by cities.provider_count desc, cities.label asc
    offset ${offset}
    limit ${safePageSize + 1}
  `;

  return toResult(rows, safePageSize);
}

export async function getExploreCountryOptionAction({
  locale,
  value,
}: {
  locale?: string;
  value: string;
}): Promise<ExploreLocationOption | null> {
  const country = value?.trim();
  if (!country) return null;

  const result = await searchExploreCountryOptionsAction({
    locale,
    search: country,
    page: 1,
    pageSize: 50,
  });

  return result.items.find((item) => item.value === country) ?? null;
}

export async function getExploreCityOptionAction({
  locale,
  countryCode,
  value,
}: {
  locale?: string;
  countryCode?: string | null;
  value: string;
}): Promise<ExploreLocationOption | null> {
  const city = value?.trim();
  if (!city) return null;

  const result = await searchExploreCityOptionsAction({
    locale,
    countryCode,
    search: city,
    page: 1,
    pageSize: 50,
  });

  return result.items.find((item) => item.value === city) ?? null;
}
