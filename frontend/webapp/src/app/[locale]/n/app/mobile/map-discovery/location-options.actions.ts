"use server";

import sql from "@/config/database/db";

export type MapDiscoveryLocationKind = "country" | "city";

export type MapDiscoveryLocationOption = {
  value: string;
  label: string;
  description?: string | null;
  raw?: Record<string, string | null>;
};

export type MapDiscoveryLocationOptionsResult = {
  items: MapDiscoveryLocationOption[];
  hasMore: boolean;
};

type LoadLocationOptionsArgs = {
  kind: MapDiscoveryLocationKind;
  locale: string;
  search?: string;
  page?: number;
  pageSize?: number;
  countryCode?: string | null;
};

type LoadLocationByValueArgs = {
  kind: MapDiscoveryLocationKind;
  locale: string;
  value: string;
  countryCode?: string | null;
};

type LocationRow = {
  value: string;
  label: string;
  provider_count: number;
  country_code: string | null;
};

function normalizeLocale(locale: string) {
  return locale?.trim() || "en";
}

function normalizeSearch(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizePage(value: number | undefined) {
  return Math.max(1, Number.isFinite(value) ? Number(value) : 1);
}

function normalizePageSize(value: number | undefined) {
  return Math.min(50, Math.max(5, Number.isFinite(value) ? Number(value) : 20));
}

function toOption(row: LocationRow): MapDiscoveryLocationOption {
  const providerCount = Number(row.provider_count ?? 0);
  return {
    value: row.value,
    label: row.label || row.value,
    description: providerCount === 1 ? "1 provider" : `${providerCount.toLocaleString()} providers`,
    raw: {
      countryCode: row.country_code,
    },
  };
}

export async function loadMapDiscoveryLocationOptions({
  kind,
  locale,
  search,
  page,
  pageSize,
  countryCode,
}: LoadLocationOptionsArgs): Promise<MapDiscoveryLocationOptionsResult> {
  const lang = normalizeLocale(locale);
  const term = normalizeSearch(search);
  const pageNumber = normalizePage(page);
  const size = normalizePageSize(pageSize);
  const offset = (pageNumber - 1) * size;
  const country = countryCode?.trim() ?? "";

  if (kind === "city" && !country) {
    return { items: [], hasMore: false };
  }

  const rows = kind === "country"
    ? await sql<LocationRow[]>`
        with source as (
          select
            btrim(sp.country)::text as code,
            count(*)::int as provider_count
          from category.service_providers sp
          where sp.is_active = true
            and sp.latitude is not null
            and sp.longitude is not null
            and nullif(btrim(sp.country), '') is not null
          group by btrim(sp.country)
        )
        select
          source.code as value,
          coalesce(nullif(common.get_translation_t(loc.value_translations, ${lang}::text, 'en'), ''), source.code) as label,
          source.provider_count,
          source.code as country_code
        from source
        left join category.locations loc
          on loc.location_type_id = 1
         and loc.code = source.code
        where ${term}::text = ''
          or source.code ilike ${`%${term}%`}::text
          or coalesce(nullif(common.get_translation_t(loc.value_translations, ${lang}::text, 'en'), ''), source.code) ilike ${`%${term}%`}::text
        order by label asc, source.code asc
        limit ${size + 1} offset ${offset}
      `
    : await sql<LocationRow[]>`
        with source as (
          select
            btrim(sp.city)::text as code,
            btrim(sp.country)::text as country_code,
            count(*)::int as provider_count
          from category.service_providers sp
          where sp.is_active = true
            and sp.latitude is not null
            and sp.longitude is not null
            and nullif(btrim(sp.city), '') is not null
            and sp.country = ${country}::text
          group by btrim(sp.city), btrim(sp.country)
        )
        select
          source.code as value,
          coalesce(nullif(common.get_translation_t(loc.value_translations, ${lang}::text, 'en'), ''), source.code) as label,
          source.provider_count,
          source.country_code
        from source
        left join category.locations loc
          on loc.location_type_id = 2
         and loc.code = source.code
        where ${term}::text = ''
          or source.code ilike ${`%${term}%`}::text
          or coalesce(nullif(common.get_translation_t(loc.value_translations, ${lang}::text, 'en'), ''), source.code) ilike ${`%${term}%`}::text
        order by label asc, source.code asc
        limit ${size + 1} offset ${offset}
      `;

  return {
    items: rows.slice(0, size).map(toOption),
    hasMore: rows.length > size,
  };
}

export async function loadMapDiscoveryLocationByValue({
  kind,
  locale,
  value,
  countryCode,
}: LoadLocationByValueArgs): Promise<MapDiscoveryLocationOption | null> {
  const code = value.trim();
  if (!code) return null;

  const result = await loadMapDiscoveryLocationOptions({
    kind,
    locale,
    search: code,
    page: 1,
    pageSize: 10,
    countryCode,
  });

  return result.items.find((item) => item.value === code) ?? null;
}
