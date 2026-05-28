import sql from "@/config/database/db";
import { unstable_noStore as noStore } from "next/cache";

export type NearbyFiltersInput = {
  q: string;
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  currencyCode: string | null;
  distanceKm: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  specialties: string[];
  countryCode: string | null;
  cityCode: string | null;
  lat: number | null;
  lng: number | null;
};

export type NearbyCategory = {
  image?: string;
  id: string;
  label: string;
};

export type NearbyCurrencyOption = {
  code: string;
  label: string;
  symbol: string;
  count: number;
};

export type NearbyProvider = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  verified: boolean;
  location: string;
  specialties: string[];
  languages: string[];
  coordinates: { lat: number; lng: number } | null;
  distanceKm: number | null;
  priceFrom: number | null;
  isFavorited: boolean;
};

export type NearbyPageData = {
  customerId: string | null;
  categories: NearbyCategory[];
  providers: NearbyProvider[];
  availableLanguages: string[];
  availableSpecialties: string[];
  availableCurrencies: NearbyCurrencyOption[];
  mapCenter: { lat: number; lng: number; zoom: number };
};

function getNearbyStaticLabels(locale: string) {
  const isFa = locale.toLowerCase().startsWith("fa");

  return {
    all: isFa ? "همه" : "All",
    locationUnavailable: isFa ? "موقعیت نامشخص" : "Location unavailable",
    kmAway: (distanceKm: number) =>
      isFa
        ? `${distanceKm.toFixed(1)} کیلومتر فاصله`
        : `${distanceKm.toFixed(1)} km away`,
  };
}

function toSingleString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toFiniteNumber(
  value: string | string[] | undefined,
  fallback: number,
): number {
  const raw = toSingleString(value).trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCurrencyCode(value?: string | null): string {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function splitFilterValues(value?: string | null): string[] {
  return String(value || "")
    .split(/[،,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const LANGUAGE_ALIAS_GROUPS: Record<string, string[]> = {
  en: ["en", "en-us", "en-gb", "english", "انگلیسی"],
  fa: ["fa", "fa-ir", "farsi", "persian", "فارسی", "پارسی"],
  ar: ["ar", "ar-sa", "arabic", "عربی"],
  tr: ["tr", "tr-tr", "turkish", "ترکی"],
  ku: ["ku", "ku-ku", "kurdish", "کردی"],
  de: ["de", "de-de", "german", "آلمانی"],
  fr: ["fr", "fr-fr", "french", "فرانسوی"],
  es: ["es", "es-es", "spanish", "اسپانیایی"],
  ru: ["ru", "ru-ru", "russian", "روسی"],
};

const LANGUAGE_ALIAS_TO_CODE = new Map(
  Object.entries(LANGUAGE_ALIAS_GROUPS).flatMap(([code, aliases]) =>
    aliases.map((alias) => [alias.toLowerCase(), code] as const),
  ),
);

function normalizeLanguageValue(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return "";
  const mapped = LANGUAGE_ALIAS_TO_CODE.get(normalized);
  if (mapped) return mapped;
  const base = normalized.split("-")[0];
  return LANGUAGE_ALIAS_TO_CODE.get(base) ?? base;
}

function expandLanguageFilterValues(values: string[]): string[] {
  const expanded = values.flatMap(splitFilterValues).flatMap((value) => {
    const normalized = normalizeLanguageValue(value);
    const raw = value.trim().toLowerCase().replace(/_/g, "-");
    return [raw, normalized, ...(LANGUAGE_ALIAS_GROUPS[normalized] ?? [])];
  });

  return Array.from(
    new Set(
      expanded.map((value) => value.trim().toLowerCase()).filter(Boolean),
    ),
  );
}

function normalizeLanguageOptions(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .flatMap(splitFilterValues)
        .map(normalizeLanguageValue)
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function buildTextOrFilterSql(valueSql: any, values: string[]) {
  const normalized = Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  );
  if (normalized.length === 0) return null;
  return sql`(${joinSql(
    normalized.map((value) => sql`${valueSql} = ${value}`),
    sql` or `,
  )})`;
}

export function parseNearbyFilters(
  params: Record<string, string | string[] | undefined>,
): NearbyFiltersInput {
  const languagesRaw = toSingleString(params.languages).trim();
  const specialtiesRaw = toSingleString(params.specialties).trim();
  const currencyCode = normalizeCurrencyCode(
    toSingleString(params.currencyCode || params.currency),
  );
  const countryCode =
    (
      toSingleString(params.countryCode) || toSingleString(params.country)
    ).trim() || null;
  const cityCode = countryCode
    ? (toSingleString(params.cityCode) || toSingleString(params.city)).trim() ||
      null
    : null;
  const requestedMinPrice = Math.max(0, toFiniteNumber(params.minPrice, 0));
  const requestedMaxPrice = Math.max(0, toFiniteNumber(params.maxPrice, 5000));
  const minPrice = Math.min(
    requestedMinPrice,
    requestedMaxPrice || requestedMinPrice,
  );
  const maxPrice = Math.max(requestedMinPrice, requestedMaxPrice);
  const requestedDistanceKm = toFiniteNumber(
    params.distanceKm ?? params.distance,
    10,
  );

  return {
    q: toSingleString(params.q).trim(),
    categoryId: toSingleString(params.categoryId).trim() || null,
    countryCode,
    cityCode,
    minPrice,
    maxPrice,
    currencyCode: currencyCode && currencyCode !== "ALL" ? currencyCode : null,
    distanceKm: Math.min(200, Math.max(1, requestedDistanceKm)),
    minRating: Math.max(0, toFiniteNumber(params.minRating, 0)),
    verifiedOnly: ["1", "true", "yes", "on"].includes(
      toSingleString(params.verifiedOnly || params.verified)
        .trim()
        .toLowerCase(),
    ),
    languages: splitFilterValues(languagesRaw),
    specialties: splitFilterValues(specialtiesRaw),
    lat: (() => {
      const value = toSingleString(params.lat).trim();
      if (!value) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
    lng: (() => {
      const value = toSingleString(params.lng).trim();
      if (!value) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
  };
}

function normalizeLocale(locale: string) {
  return locale?.trim() || "en";
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  return null;
}

function joinSql(parts: any[], separator: any) {
  return parts
    .slice(1)
    .reduce((acc, part) => sql`${acc}${separator}${part}`, parts[0]);
}

function coalesceImage(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return "/placeholder-provider.svg";
}

function buildNearbyWhere(filters: NearbyFiltersInput, lang: string) {
  const conditions = [
    sql`sp.is_active = true`,
    sql`sp.latitude is not null`,
    sql`sp.longitude is not null`,
  ];

  if (filters.categoryId) {
    conditions.push(sql`exists (
      select 1
      from category.provider_services cps
      join category.service_definitions csd on csd.id = cps.service_definition_id
      where cps.service_provider_id = sp.id
        and cps.is_active = true
        and csd.category_id = ${filters.categoryId}::uuid
    )`);
  }

  if (filters.countryCode) {
    conditions.push(sql`sp.country = ${filters.countryCode}`);
  }

  if (filters.cityCode) {
    conditions.push(sql`sp.city = ${filters.cityCode}`);
  }

  if (filters.minPrice > 0 || filters.maxPrice > 0 || filters.currencyCode) {
    const currencyCode = normalizeCurrencyCode(filters.currencyCode);

    conditions.push(sql`exists (
      select 1
      from category.provider_services psp
      where psp.service_provider_id = sp.id
        and psp.is_active = true
        and (${filters.minPrice} = 0 or psp.value >= ${filters.minPrice})
        and (${filters.maxPrice} = 0 or psp.value <= ${filters.maxPrice})
        and (${currencyCode} = '' or upper(coalesce(psp.currency, '')) = ${currencyCode})
    )`);
  }

  if (filters.minRating > 0) {
    conditions.push(sql`coalesce(sp.rating, 0) >= ${filters.minRating}`);
  }

  if (filters.verifiedOnly) {
    conditions.push(sql`coalesce(sp.accredited, false) = true`);
  }

  const languageFilter = expandLanguageFilterValues(filters.languages);
  if (languageFilter.length > 0) {
    const languageMatch = buildTextOrFilterSql(
      sql`lower(language_token.language)`,
      languageFilter,
    );
    if (languageMatch) {
      conditions.push(sql`(
        exists (
          select 1
          from category.provider_languages pl
          cross join lateral regexp_split_to_table(coalesce(pl.language, ''), '[[:space:]]*[,،|][[:space:]]*') as language_token(language)
          where pl.service_provider_id = sp.id
            and ${languageMatch}
        )
        or exists (
          select 1
          from unnest(coalesce(sp.languages, array[]::text[])) as provider_language(raw_language)
          cross join lateral regexp_split_to_table(coalesce(provider_language.raw_language, ''), '[[:space:]]*[,،|][[:space:]]*') as language_token(language)
          where ${languageMatch}
        )
      )`);
    }
  }

  const specialtyFilter = Array.from(
    new Set(
      filters.specialties
        .flatMap(splitFilterValues)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  if (specialtyFilter.length > 0) {
    const specialtyMatch = buildTextOrFilterSql(
      sql`lower(specialty_token.specialty)`,
      specialtyFilter,
    );
    if (specialtyMatch) {
      conditions.push(sql`exists (
        select 1
        from unnest(coalesce(sp.specialties, array[]::text[])) as provider_specialty(raw_specialty)
        cross join lateral regexp_split_to_table(coalesce(provider_specialty.raw_specialty, ''), '[[:space:]]*[,،|][[:space:]]*') as specialty_token(specialty)
        where ${specialtyMatch}
      )`);
    }
  }

  if (filters.q.trim()) {
    const term = filters.q.trim();
    conditions.push(sql`(
      sp.search_vector @@ websearch_to_tsquery('simple', ${term})
      or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
      or exists (
        select 1
        from unnest(coalesce(sp.specialties, array[]::text[])) as specialty
        where specialty ilike ${`%${term}%`}
      )
      or exists (
        select 1
        from category.provider_services pss
        where pss.service_provider_id = sp.id
          and pss.is_active = true
          and (
            pss.search_vector @@ websearch_to_tsquery('simple', ${term})
            or common.get_translation_t(pss.display_name_translations, ${lang}, 'en') ilike ${`%${term}%`}
          )
      )
    )`);
  }

  if (filters.lat != null && filters.lng != null && filters.distanceKm > 0) {
    conditions.push(sql`(
      6371 * acos(
        least(1, greatest(-1,
          cos(radians(${filters.lat})) * cos(radians(sp.latitude::float))
          * cos(radians(sp.longitude::float) - radians(${filters.lng}))
          + sin(radians(${filters.lat})) * sin(radians(sp.latitude::float))
        ))
      )
    ) <= ${filters.distanceKm}`);
  }

  return sql`where ${joinSql(conditions, sql` and `)}`;
}

export async function getNearbyPageData({
  locale,
  filters,
}: {
  locale: string;
  filters: NearbyFiltersInput;
}): Promise<NearbyPageData> {
  noStore();

  const lang = normalizeLocale(locale);
  const labels = getNearbyStaticLabels(lang);
  const customerId = await resolveCurrentCustomerId();
  const whereSql = buildNearbyWhere(filters, lang);
  const selectedCurrencyCode = normalizeCurrencyCode(filters.currencyCode);

  const favoriteProviderIds = customerId
    ? await sql<{ entity_id: string }[]>`
        select entity_id::text as entity_id
        from customer.favorites
        where customer_id = ${customerId}
          and favorite_type = 'provider'
      `
    : [];
  const providerFavoriteSet = new Set(
    favoriteProviderIds.map((x) => x.entity_id),
  );

  const categoryRows = await sql<NearbyCategory[]>`
    select distinct
      c.id::text as id,
      common.get_translation_t(c.name_translations, ${lang}, 'en') as label,
      coalesce(
        nullif(btrim(category_image_media.file_url), ''),
        nullif(btrim(category_image_media.storage_path), ''),
        nullif(btrim(category_image_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(c.image_url, ''), ',', 1)), ''),
        nullif(btrim(category_icon_media.file_url), ''),
        nullif(btrim(category_icon_media.storage_path), ''),
        nullif(btrim(category_icon_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(c.icon_url, ''), ',', 1)), '')
      ) as image
    from category.categories c
    left join media.media_library category_image_media
      on category_image_media.id::text = nullif(btrim(split_part(coalesce(c.image_url, ''), ',', 1)), '')
    left join media.media_library category_icon_media
      on category_icon_media.id::text = nullif(btrim(split_part(coalesce(c.icon_url, ''), ',', 1)), '')
    join category.service_definitions sd on sd.category_id = c.id and sd.is_active = true
    join category.provider_services ps on ps.service_definition_id = sd.id and ps.is_active = true
    join category.service_providers sp on sp.id = ps.service_provider_id and sp.is_active = true
    order by label asc
  `;

  const categories: NearbyCategory[] = [
    { id: "all", label: labels.all },
    ...categoryRows.map((row) => ({
      ...row,
      image: row.image ? coalesceImage(row.image) : undefined,
    })),
  ];

  const rows = await sql<any[]>`
    select
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${lang}, 'en') as name,
      coalesce(
        nullif(btrim(pgi_media.file_url), ''),
        nullif(btrim(pgi_media.storage_path), ''),
        nullif(btrim(pgi_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(pgi.url, ''), ',', 1)), ''),
        nullif(btrim(sp_media.file_url), ''),
        nullif(btrim(sp_media.storage_path), ''),
        nullif(btrim(sp_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(sp.image_url, ''), ',', 1)), ''),
        nullif(btrim(provider_type_image_media.file_url), ''),
        nullif(btrim(provider_type_image_media.storage_path), ''),
        nullif(btrim(provider_type_image_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(pt.image_url, ''), ',', 1)), ''),
        nullif(btrim(provider_type_icon_media.file_url), ''),
        nullif(btrim(provider_type_icon_media.storage_path), ''),
        nullif(btrim(provider_type_icon_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(pt.icon_url, ''), ',', 1)), '')
      ) as image,
      coalesce(sp.rating, 0)::float as rating,
      coalesce(sp.review_count, 0)::int as reviews,
      coalesce(sp.accredited, false) as verified,
      trim(
        concat_ws(', ',
          nullif(common.get_translation_t(city_loc.value_translations, ${lang}, 'en'), ''),
          nullif(common.get_translation_t(country_loc.value_translations, ${lang}, 'en'), '')
        )
      ) as city_country,
      coalesce(sp.specialties, array[]::text[]) as specialties,
      coalesce(sp.languages, array[]::text[]) as languages,
      sp.latitude::float as latitude,
      sp.longitude::float as longitude,
      svc.price_from,
      case
        when ${filters.lat}::float is not null and ${filters.lng}::float is not null then (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(${filters.lat})) * cos(radians(sp.latitude::float))
              * cos(radians(sp.longitude::float) - radians(${filters.lng}))
              + sin(radians(${filters.lat})) * sin(radians(sp.latitude::float))
            ))
          )
        )
        else null
      end as distance_km
    from category.service_providers sp
    left join category.provider_types pt
      on pt.id = sp.provider_type_id
    left join category.locations country_loc
      on country_loc.code = sp.country
     and country_loc.location_type_id = 1
    left join category.locations city_loc
      on city_loc.code = sp.city
     and city_loc.location_type_id = 2
    left join lateral (
      select g.url
      from category.provider_gallery_items g
      where g.service_provider_id = sp.id
      order by g.display_order asc, g.create_date asc
      limit 1
    ) pgi on true
    left join media.media_library pgi_media
      on pgi_media.id::text = nullif(btrim(split_part(coalesce(pgi.url, ''), ',', 1)), '')
    left join media.media_library sp_media
      on sp_media.id::text = nullif(btrim(split_part(coalesce(sp.image_url, ''), ',', 1)), '')
    left join media.media_library provider_type_image_media
      on provider_type_image_media.id::text = nullif(btrim(split_part(coalesce(pt.image_url, ''), ',', 1)), '')
    left join media.media_library provider_type_icon_media
      on provider_type_icon_media.id::text = nullif(btrim(split_part(coalesce(pt.icon_url, ''), ',', 1)), '')
    left join lateral (
      select min(ps.value)::float as price_from
      from category.provider_services ps
      where ps.service_provider_id = sp.id
        and ps.is_active = true
        and (${selectedCurrencyCode} = '' or upper(coalesce(ps.currency, '')) = ${selectedCurrencyCode})
    ) svc on true
    ${whereSql}
    order by
      case when ${filters.lat}::float is not null and ${filters.lng}::float is not null then (
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(${filters.lat})) * cos(radians(sp.latitude::float))
            * cos(radians(sp.longitude::float) - radians(${filters.lng}))
            + sin(radians(${filters.lat})) * sin(radians(sp.latitude::float))
          ))
        )
      ) else null end asc nulls last,
      coalesce(sp.featured_score, 0) desc,
      coalesce(sp.rating, 0) desc,
      sp.create_date desc
    limit 100
  `;

  const providers: NearbyProvider[] = rows.map((row) => {
    const distanceKm = row.distance_km == null ? null : Number(row.distance_km);
    const location =
      distanceKm != null
        ? labels.kmAway(distanceKm)
        : row.city_country || labels.locationUnavailable;

    return {
      id: row.id,
      name: row.name,
      image: coalesceImage(row.image),
      rating: Number(row.rating ?? 0),
      reviews: Number(row.reviews ?? 0),
      verified: Boolean(row.verified),
      location,
      specialties: Array.isArray(row.specialties)
        ? row.specialties.filter(Boolean)
        : [],
      languages: Array.isArray(row.languages)
        ? row.languages.filter(Boolean)
        : [],
      coordinates:
        row.latitude == null || row.longitude == null
          ? null
          : { lat: Number(row.latitude), lng: Number(row.longitude) },
      distanceKm,
      priceFrom: row.price_from == null ? null : Number(row.price_from),
      isFavorited: providerFavoriteSet.has(row.id),
    };
  });

  const languageRows = await sql<{ language: string }[]>`
    select distinct lower(language) as language
    from (
      select unnest(coalesce(sp.languages, array[]::text[])) as language
      from category.service_providers sp
      where sp.is_active = true
      union
      select pl.language
      from category.provider_languages pl
      join category.service_providers sp on sp.id = pl.service_provider_id
      where sp.is_active = true
    ) lang
    where nullif(btrim(language), '') is not null
    order by language asc
  `;

  const specialtyRows = await sql<{ specialty: string }[]>`
    select distinct lower(specialty) as specialty
    from (
      select unnest(coalesce(sp.specialties, array[]::text[])) as specialty
      from category.service_providers sp
      where sp.is_active = true
    ) data
    where nullif(btrim(specialty), '') is not null
    order by specialty asc
    limit 40
  `;

  const availableLanguages = normalizeLanguageOptions(
    languageRows.map((row) => row.language).filter(Boolean),
  );
  const availableSpecialties = specialtyRows
    .map((row) => row.specialty)
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));

  const currencyRows = await sql<
    { code: string; label: string; symbol: string; count: number }[]
  >`
    with service_currency_counts as (
      select upper(coalesce(nullif(btrim(ps.currency), ''), 'USD')) as code, count(*)::int as count
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true
        and sp.is_active = true
        and sp.latitude is not null
        and sp.longitude is not null
      group by upper(coalesce(nullif(btrim(ps.currency), ''), 'USD'))
    )
    select
      coalesce(fc.code, service_currency_counts.code) as code,
      coalesce(fc.name, service_currency_counts.code) as label,
      coalesce(nullif(btrim(fc.symbol), ''), service_currency_counts.code) as symbol,
      coalesce(service_currency_counts.count, 0)::int as count
    from finance.currencies fc
    full join service_currency_counts on service_currency_counts.code = fc.code
    where coalesce(fc.is_display_enabled, true) = true
       or service_currency_counts.count is not null
    order by coalesce(service_currency_counts.count, 0) desc, coalesce(fc.sort_order, 100000), code asc
  `;

  const availableCurrencies: NearbyCurrencyOption[] = currencyRows.map(
    (row) => ({
      code: row.code,
      label: row.label || row.code,
      symbol: row.symbol || row.code,
      count: Number(row.count ?? 0),
    }),
  );

  const firstWithCoordinates = providers.find(
    (provider) => provider.coordinates,
  );
  const mapCenter =
    filters.lat != null && filters.lng != null
      ? { lat: filters.lat, lng: filters.lng, zoom: 10 }
      : firstWithCoordinates?.coordinates
        ? {
            lat: firstWithCoordinates.coordinates.lat,
            lng: firstWithCoordinates.coordinates.lng,
            zoom: 10,
          }
        : { lat: 25.2048, lng: 55.2708, zoom: 9 };

  return {
    customerId,
    categories,
    providers,
    availableLanguages,
    availableSpecialties,
    availableCurrencies,
    mapCenter,
  };
}
