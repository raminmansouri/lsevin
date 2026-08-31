import sql from "@/config/database/db";
import { unstable_noStore as noStore } from "next/cache";

import {
  categoryProviderCountsCte,
  categoryTotalProviderCount,
  providerInCategorySubtree,
} from "@/features/categories/db/category-tree";


export type ExploreResponseTime = "any" | "fast" | "instant";
export type ExploreSort = "recommended" | "rating" | "price_low" | "price_high" | "newest";

export type ExploreFiltersInput = {
  q: string;
  categoryId: string | null;
  providerTypeId: string | null;
  countryCode: string | null;
  cityCode: string | null;
  minPrice: number;
  maxPrice: number;
  currencyCode: string | null;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  responseTime: ExploreResponseTime;
  sort: ExploreSort;
};

export type ExploreCategory = {
  id: string;
  label: string;
  count: number;
};

export type ExploreProviderType = {
  id: string;
  label: string;
  description: string;
  image: string;
  icon: string;
  count: number;
};

export type ExploreFeaturedProvider = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  verified: boolean;
  location: string;
  specialties: string[];
  responseTime: string;
  bookings: string;
  badge: string;
  isFavorited: boolean;
};

export type ExploreTrendingService = {
  id: string;
  providerId: string;
  name: string;
  provider: string;
  image: string;
  price: number;
  currency: string;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  growth: string | null;
  location: string;
  isFavorited: boolean;
};

export type ExploreSponsoredProvider = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  price: number | null;
  currency: string;
  tag: string;
};

export type ExploreLanguageOption = {
  value: string;
  label: string;
  count: number;
};

export type ExploreCurrencyOption = {
  code: string;
  label: string;
  symbol: string;
  count: number;
};

export type ExplorePageData = {
  customerId: string | null;
  categories: ExploreCategory[];
  providerTypes: ExploreProviderType[];
  featuredProviders: ExploreFeaturedProvider[];
  trendingServices: ExploreTrendingService[];
  sponsoredProviders: ExploreSponsoredProvider[];
  availableLanguages: ExploreLanguageOption[];
  availableCurrencies: ExploreCurrencyOption[];
};

function toSingleString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toFiniteNumber(value: string | string[] | undefined, fallback: number): number {
  const raw = toSingleString(value).trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseExploreFilters(
  params: Record<string, string | string[] | undefined>,
): ExploreFiltersInput {
  const responseTime = toSingleString(params.responseTime).trim().toLowerCase();
  const sort = toSingleString(params.sort).trim().toLowerCase();
  const languagesRaw = toSingleString(params.languages).trim();
  const currencyCode = toSingleString(params.currencyCode || params.currency).trim().toUpperCase();
  const categoryId = toSingleString(params.categoryId).trim();
  const providerTypeId = toSingleString(params.providerTypeId).trim();
  const countryCode = toSingleString(params.countryCode || params.country).trim();
  const cityCode = toSingleString(params.cityCode || params.city).trim();
  const rawMinPrice = Math.max(0, toFiniteNumber(params.minPrice, 0));
  const rawMaxPrice = Math.max(0, toFiniteNumber(params.maxPrice, 0));
  const minPrice = rawMaxPrice > 0 && rawMinPrice > rawMaxPrice ? rawMaxPrice : rawMinPrice;
  const maxPrice = rawMaxPrice > 0 && rawMinPrice > rawMaxPrice ? rawMinPrice : rawMaxPrice;

  return {
    q: toSingleString(params.q).trim(),
    categoryId: normalizeNullableFilter(categoryId),
    providerTypeId: normalizeNullableFilter(providerTypeId),
    countryCode: normalizeNullableFilter(countryCode),
    cityCode: normalizeNullableFilter(cityCode),
    minPrice,
    maxPrice,
    currencyCode: currencyCode && currencyCode !== "ALL" ? currencyCode : null,
    minRating: Math.max(0, toFiniteNumber(params.minRating, 0)),
    verifiedOnly: ["1", "true", "yes", "on"].includes(
      toSingleString(params.verifiedOnly || params.verified).trim().toLowerCase(),
    ),
    languages: languagesRaw
      ? languagesRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    responseTime:
      responseTime === "fast" || responseTime === "instant"
        ? (responseTime as ExploreResponseTime)
        : "any",
    sort:
      sort === "rating" || sort === "price_low" || sort === "price_high" || sort === "newest"
        ? (sort as ExploreSort)
        : "recommended",
  };
}

function normalizeLocale(locale: string) {
  return locale?.trim() || "fa";
}

const LANGUAGE_ALIASES: Record<string, string[]> = {
  fa: ["fa", "fa-ir", "farsi", "persian", "فارسی", "پارسی"],
  en: ["en", "en-us", "en-gb", "english", "انگلیسی"],
  ar: ["ar", "ar-sa", "arabic", "عربی", "العربية"],
  tr: ["tr", "tr-tr", "turkish", "ترکی", "türkçe"],
  ku: ["ku", "ku-ku", "kurdish", "کردی"],
  de: ["de", "de-de", "german", "آلمانی", "deutsch"],
  fr: ["fr", "fr-fr", "french", "فرانسوی", "français"],
  es: ["es", "es-es", "spanish", "اسپانیایی", "español"],
};

function normalizeLanguageValue(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");

  if (!normalized) return "";

  for (const [code, aliases] of Object.entries(LANGUAGE_ALIASES)) {
    if (aliases.includes(normalized)) return code;
  }

  return normalized.split("-")[0] || normalized;
}

function expandLanguageFilterValues(languages: string[]): string[] {
  const values = new Set<string>();

  for (const language of languages) {
    const code = normalizeLanguageValue(language);
    if (!code) continue;

    values.add(code);
    values.add(language.trim().toLowerCase().replace(/_/g, "-"));

    for (const alias of LANGUAGE_ALIASES[code] ?? []) {
      values.add(alias.toLowerCase());
    }
  }

  return [...values].filter(Boolean);
}

function buildLanguageValueMatchSql(languageSql: any, languages: string[]) {
  const normalized = [...new Set(languages.map((item) => item.trim().toLowerCase()).filter(Boolean))];

  if (normalized.length === 0) return sql`false`;

  return sql`(${joinSql(
    normalized.map((language) => sql`${languageSql} = ${language}`),
    sql` or `,
  )})`;
}

function buildProviderLanguageFilterSql(languages: string[]) {
  const languageFilter = expandLanguageFilterValues(languages);

  if (languageFilter.length === 0) return null;

  const providerLanguageTableMatch = buildLanguageValueMatchSql(
    sql`lower(replace(pl.language, '_', '-'))`,
    languageFilter,
  );
  const providerLanguageArrayMatch = buildLanguageValueMatchSql(
    sql`lower(replace(provider_language.language, '_', '-'))`,
    languageFilter,
  );

  return sql`
    (
      exists (
        select 1
        from category.provider_languages pl
        where pl.service_provider_id = sp.id
          and ${providerLanguageTableMatch}
      )
      or exists (
        select 1
        from unnest(coalesce(sp.languages, array[]::text[])) as provider_language(language)
        where ${providerLanguageArrayMatch}
      )
    )
  `;
}

function getLanguageLabel(value: string, locale: string): string {
  const code = normalizeLanguageValue(value);

  if (!code) return value;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    return displayNames.of(code) || value;
  } catch {
    return value;
  }
}

function normalizeCurrencyCode(value: string | null | undefined): string {
  return value?.trim().toUpperCase() || "";
}

function normalizeNullableFilter(value: string): string | null {
  const normalized = value.trim();
  return normalized && normalized.toLowerCase() !== "all" ? normalized : null;
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  return null;
}



function coalesceImage(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = candidate
      ?.split(",")
      .map((part) => part.trim().replace(/^['"]|['"]$/g, "").replace(/\\/g, "/"))
      .find(Boolean);

    if (value) return value;
  }

  return "/placeholder-provider.svg";
}
function joinSql(parts: any[], separator: any) {
  return parts.slice(1).reduce(
    (acc, part) => sql`${acc}${separator}${part}`,
    parts[0]
  );
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const uniqueRows: T[] = [];

  for (const row of rows) {
    if (!row.id || seen.has(row.id)) continue;
    seen.add(row.id);
    uniqueRows.push(row);
  }

  return uniqueRows;
}


function buildLocationCodeMatchSql(columnSql: any, value: string) {
  const normalized = value.trim();
  return sql`lower(btrim(${columnSql}::text)) = lower(btrim(${normalized}::text))`;
}

function buildProviderSpecialistSearchSql(term: string, lang: string) {
  return sql`exists (
    select 1
    from category.provider_staffs pst
    join category.staff st on st.id = pst.staff_id
    where pst.service_provider_id = sp.id
      and pst.is_active = true
      and st.is_active = true
      and (
        common.get_translation_t(st.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(st.title_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(st.biography_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(st.specialty_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or coalesce(st.specialty, '') ilike ${`%${term}%`}
      )
  )`;
}

function buildProviderServiceSearchSql(term: string, lang: string) {
  return sql`exists (
    select 1
    from category.provider_services pss
    join category.service_definitions sds on sds.id = pss.service_definition_id
    where pss.service_provider_id = sp.id
      and pss.is_active = true
      and sds.is_active = true
      and (
        pss.search_vector @@ websearch_to_tsquery('simple', ${term})
        or common.get_translation_t(pss.display_name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(pss.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sds.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sds.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
      )
  )`;
}

function buildServiceSpecialistSearchSql(term: string, lang: string) {
  return sql`exists (
    select 1
    from category.staff_services ss
    join category.provider_staffs pst on pst.staff_id = ss.staff_id and pst.service_provider_id = sp.id
    join category.staff st on st.id = ss.staff_id
    where ss.is_active = true
      and pst.is_active = true
      and st.is_active = true
      and (
        common.get_translation_t(st.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(st.title_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(st.specialty_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or coalesce(st.specialty, '') ilike ${`%${term}%`}
      )
  )`;
}

function buildFeaturedProvidersWhere(filters: ExploreFiltersInput, lang: string) {
  const conditions = [sql`sp.is_active = true`];

  if (filters.verifiedOnly) {
    conditions.push(sql`coalesce(sp.accredited, false) = true`);
  }

  if (filters.minRating > 0) {
    conditions.push(sql`coalesce(sp.rating, 0) >= ${filters.minRating}`);
  }

  if (filters.responseTime === "fast") {
    conditions.push(
      sql`lower(coalesce(sp.response_time, '')) ~ '30|1\\s*hour|60\\s*min'`
    );
  }

  if (filters.responseTime === "instant") {
    conditions.push(
      sql`lower(coalesce(sp.response_time, '')) ~ '30\\s*min|instant'`
    );
  }

  if (filters.languages.length > 0) {
    const languageSql = buildProviderLanguageFilterSql(filters.languages);
    if (languageSql) conditions.push(languageSql);
  }

  if (filters.q.trim()) {
    const term = filters.q.trim();

    conditions.push(sql`
      (
        sp.search_vector @@ websearch_to_tsquery('simple', ${term})
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sp.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or exists (
          select 1
          from unnest(coalesce(sp.specialties, array[]::text[])) as specialty
          where specialty ilike ${`%${term}%`}
        )
        or ${buildProviderServiceSearchSql(term, lang)}
        or ${buildProviderSpecialistSearchSql(term, lang)}
        or ${buildServiceSpecialistSearchSql(term, lang)}
      )
    `);
  }

  if (filters.categoryId) {
    // Subtree, so picking a parent category here means the same set of providers
    // it means everywhere else in the app.
    conditions.push(providerInCategorySubtree(filters.categoryId));
  }

  if (filters.providerTypeId) {
    conditions.push(sql`sp.provider_type_id = ${filters.providerTypeId}::uuid`);
  }

  if (filters.countryCode) {
    conditions.push(buildLocationCodeMatchSql(sql`sp.country`, filters.countryCode));
  }

  if (filters.cityCode) {
    conditions.push(buildLocationCodeMatchSql(sql`sp.city`, filters.cityCode));
  }

  if (filters.minPrice > 0 || filters.maxPrice > 0 || filters.currencyCode) {
    const currencyCode = normalizeCurrencyCode(filters.currencyCode);

    conditions.push(sql`
      exists (
        select 1
        from category.provider_services ps_price
        where ps_price.service_provider_id = sp.id
          and ps_price.is_active = true
          and (${filters.minPrice} = 0 or ps_price.value >= ${filters.minPrice})
          and (${filters.maxPrice} = 0 or ps_price.value <= ${filters.maxPrice})
          and (${currencyCode} = '' or upper(coalesce(ps_price.currency, '')) = ${currencyCode})
      )
    `);
  }

  return conditions.length
    ? sql`where ${joinSql(conditions, sql` and `)}`
    : sql``;
}

function buildTrendingServicesWhere(filters: ExploreFiltersInput, lang: string) {
  const conditions = [
    sql`sp.is_active = true`,
    sql`ps.is_active = true`,
    // Same editorial rule as the home "خدمات ویژه" shelf (get-home-page.ts): a
    // service is on this shelf because an admin ticked "Featured", and for no
    // other reason. trending_score in the order by below only decides the order
    // among the services that were actually chosen.
    sql`coalesce(ps.is_featured, false) = true`,
  ];

  if (filters.categoryId) {
    conditions.push(sql`sd.category_id = ${filters.categoryId}::uuid`);
  }

  if (filters.providerTypeId) {
    conditions.push(sql`sp.provider_type_id = ${filters.providerTypeId}::uuid`);
  }

  if (filters.countryCode) {
    conditions.push(buildLocationCodeMatchSql(sql`sp.country`, filters.countryCode));
  }

  if (filters.cityCode) {
    conditions.push(buildLocationCodeMatchSql(sql`sp.city`, filters.cityCode));
  }

  if (filters.minPrice > 0) {
    conditions.push(sql`ps.value >= ${filters.minPrice}`);
  }

  if (filters.maxPrice > 0) {
    conditions.push(sql`ps.value <= ${filters.maxPrice}`);
  }

  if (filters.currencyCode) {
    conditions.push(sql`upper(coalesce(ps.currency, '')) = ${normalizeCurrencyCode(filters.currencyCode)}`);
  }

  if (filters.minRating > 0) {
    conditions.push(sql`coalesce(ps.rating, 0) >= ${filters.minRating}`);
  }

  if (filters.verifiedOnly) {
    conditions.push(sql`coalesce(sp.accredited, false) = true`);
  }

  if (filters.responseTime === "fast") {
    conditions.push(
      sql`lower(coalesce(sp.response_time, '')) ~ '30|1\\s*hour|60\\s*min'`
    );
  }

  if (filters.responseTime === "instant") {
    conditions.push(
      sql`lower(coalesce(sp.response_time, '')) ~ '30\\s*min|instant'`
    );
  }

  if (filters.languages.length > 0) {
    const languageSql = buildProviderLanguageFilterSql(filters.languages);
    if (languageSql) conditions.push(languageSql);
  }

  if (filters.q.trim()) {
    const term = filters.q.trim();

    conditions.push(sql`
      (
        ps.search_vector @@ websearch_to_tsquery('simple', ${term})
        or sp.search_vector @@ websearch_to_tsquery('simple', ${term})
        or common.get_translation_t(ps.display_name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(ps.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sd.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sd.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sp.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or exists (
          select 1
          from unnest(coalesce(sp.specialties, array[]::text[])) as specialty
          where specialty ilike ${`%${term}%`}
        )
        or ${buildProviderSpecialistSearchSql(term, lang)}
        or ${buildServiceSpecialistSearchSql(term, lang)}
      )
    `);
  }

  return conditions.length
    ? sql`where ${joinSql(conditions, sql` and `)}`
    : sql``;
}

function buildSponsoredProvidersWhere(
  filters: ExploreFiltersInput,
  lang: string,
  languageFilter: string[],
  currencyCode: string,
) {
  const conditions = [sql`sp.is_active = true`, sql`sp.is_sponsored = true`];

  if (filters.providerTypeId) {
    conditions.push(sql`sp.provider_type_id = ${filters.providerTypeId}::uuid`);
  }

  if (filters.countryCode) {
    conditions.push(buildLocationCodeMatchSql(sql`sp.country`, filters.countryCode));
  }

  if (filters.cityCode) {
    conditions.push(buildLocationCodeMatchSql(sql`sp.city`, filters.cityCode));
  }

  if (filters.verifiedOnly) {
    conditions.push(sql`coalesce(sp.accredited, false) = true`);
  }

  if (filters.minRating > 0) {
    conditions.push(sql`coalesce(sp.rating, 0) >= ${filters.minRating}`);
  }

  if (languageFilter.length > 0) {
    const languageSql = buildProviderLanguageFilterSql(languageFilter);
    if (languageSql) conditions.push(languageSql);
  }

  if (filters.minPrice > 0 || filters.maxPrice > 0 || currencyCode) {
    conditions.push(sql`ps_pick.value is not null`);
  }

  if (filters.q.trim()) {
    const term = filters.q.trim();

    conditions.push(sql`
      (
        sp.search_vector @@ websearch_to_tsquery('simple', ${term})
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sp.description_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or ${buildProviderServiceSearchSql(term, lang)}
        or ${buildProviderSpecialistSearchSql(term, lang)}
        or ${buildServiceSpecialistSearchSql(term, lang)}
      )
    `);
  }

  return conditions.length
    ? sql`where ${joinSql(conditions, sql` and `)}`
    : sql``;
}

export async function getExplorePageData({
  locale,
  filters,
}: {
  locale: string;
  filters: ExploreFiltersInput;
}): Promise<ExplorePageData> {
  noStore();

  const lang = normalizeLocale(locale);
  const customerId = await resolveCurrentCustomerId();
  const featuredWhereSql = buildFeaturedProvidersWhere(filters, lang);
  const trendingWhereSql = buildTrendingServicesWhere(filters, lang);


  // The number on a chip is providers, rolled up over the category's subtree. It
  // used to be a count of provider_services — so "Hospital (3303)" sat next to a
  // list of six businesses, and picking a category told you nothing about how much
  // you would get back.
  const categoryRows = await sql<(ExploreCategory & { totalProviders: number })[]>`
    with recursive ${categoryProviderCountsCte()}
    select
      c.id::text as id,
      common.get_translation_t(c.name_translations, ${lang}, 'en') as label,
      pc.provider_count as count,
      ${categoryTotalProviderCount()} as "totalProviders"
    from category.categories c
    join category_provider_counts pc
      on pc.category_id = c.id
     and pc.provider_count > 0
    where c.is_active = true
    order by pc.provider_count desc, label asc
  `;

  const categories: ExploreCategory[] = [
    {
      id: "all",
      label: "All Services",
      // Distinct providers, not the sum of the chips — a provider filed under
      // Clinic is counted for Clinic and again for its parent.
      count: Number(categoryRows[0]?.totalProviders || 0),
    },
    ...categoryRows.map(({ id, label, count }) => ({ id, label, count: Number(count) })),
  ];

  const providerTypeRows = await sql<ExploreProviderType[]>`
    select
      pt.id::text as id,
      common.get_translation_t(pt.name_translations, ${lang}, 'en') as label,
      common.get_translation_t(pt.description_translations, ${lang}, 'en') as description,
      coalesce(
        nullif(btrim(image_media.file_url), ''),
        nullif(btrim(image_media.storage_path), ''),
        nullif(btrim(image_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(pt.image_url, ''), ',', 1)), ''),
        nullif(btrim(icon_media.file_url), ''),
        nullif(btrim(icon_media.storage_path), ''),
        nullif(btrim(icon_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(pt.icon_url, ''), ',', 1)), '')
      ) as image,
      coalesce(
        nullif(btrim(icon_media.file_url), ''),
        nullif(btrim(icon_media.storage_path), ''),
        nullif(btrim(icon_media.storage_key), ''),
        nullif(btrim(split_part(coalesce(pt.icon_url, ''), ',', 1)), '')
      ) as icon,
      count(distinct sp.id)::int as count
    from category.provider_types pt
    left join media.media_library image_media
      on image_media.id::text = nullif(btrim(split_part(coalesce(pt.image_url, ''), ',', 1)), '')
    left join media.media_library icon_media
      on icon_media.id::text = nullif(btrim(split_part(coalesce(pt.icon_url, ''), ',', 1)), '')
    left join category.service_providers sp
      on sp.provider_type_id = pt.id
     and sp.is_active = true
    where pt.is_active = true
    group by
      pt.id,
      common.get_translation_t(pt.name_translations, ${lang}, 'en'),
      common.get_translation_t(pt.description_translations, ${lang}, 'en'),
      image_media.file_url,
      image_media.storage_path,
      image_media.storage_key,
      icon_media.file_url,
      icon_media.storage_path,
      icon_media.storage_key,
      pt.image_url,
      pt.icon_url
    order by count(distinct sp.id) desc, label asc
  `;

  const providerTypes: ExploreProviderType[] = providerTypeRows.map((row) => ({
    id: row.id,
    label: row.label,
    description: row.description || "",
    image: coalesceImage(row.image),
    icon: row.icon || "",
    count: Number(row.count ?? 0),
  }));

  const favoriteProviderIds = customerId
    ? await sql<{ entity_id: string }[]>`
        select entity_id::text as entity_id
        from customer.favorites
        where customer_id = ${customerId}
          and favorite_type = 'provider'
      `
    : [];

  const favoriteServiceIds = customerId
    ? await sql<{ entity_id: string }[]>`
        select entity_id::text as entity_id
        from customer.favorites
        where customer_id = ${customerId}
          and favorite_type = 'service'
      `
    : [];

  const providerFavoriteSet = new Set(favoriteProviderIds.map((x) => x.entity_id));
  const serviceFavoriteSet = new Set(favoriteServiceIds.map((x) => x.entity_id));

const featuredRows = await sql`
  select 
    sp.id::text as id,
    common.get_translation_t(sp.name_translations, ${lang}, 'en') as name,
    coalesce(
      nullif(btrim(pgi_media.file_url), ''),
      nullif(btrim(pgi_media.storage_path), ''),
      nullif(btrim(pgi_media.storage_key), ''),
      nullif(btrim(split_part(pgi.url, ',', 1)), ''),
      nullif(btrim(sp_media.file_url), ''),
      nullif(btrim(sp_media.storage_path), ''),
      nullif(btrim(sp_media.storage_key), ''),
      nullif(btrim(split_part(sp.image_url, ',', 1)), '')
    ) as image,
    coalesce(sp.rating, 0)::float as rating,
    coalesce(sp.review_count, 0)::int as reviews,
    coalesce(sp.accredited, false) as verified,
    trim(
      concat_ws(', ',
        nullif(city_loc.name, ''),
        nullif(country_loc.name, '')
      )
    ) as location,
    coalesce(sp.response_time, '') as response_time,
    coalesce(sp.total_patients, '') as bookings,
    coalesce(sp.success_rate, '') as badge,
    coalesce(sp.specialties, array[]::text[]) as specialties
  from category.service_providers sp
  left join lateral (
    select common.get_translation_t(l.value_translations, ${lang}, 'en') as name
    from category.locations l
    where l.code = sp.country
      and l.location_type_id = 1
    order by coalesce(l.display_order, 0), l.create_date desc
    limit 1
  ) country_loc on true
  left join lateral (
    select common.get_translation_t(l.value_translations, ${lang}, 'en') as name
    from category.locations l
    where l.code = sp.city
      and l.location_type_id = 2
    order by coalesce(l.display_order, 0), l.create_date desc
    limit 1
  ) city_loc on true
  left join lateral (
    select g.url
    from category.provider_gallery_items g
    where g.service_provider_id = sp.id
    order by g.display_order asc, g.create_date asc
    limit 1
  ) pgi on true
  left join media.media_library pgi_media
    on pgi_media.id::text = nullif(btrim(split_part(pgi.url, ',', 1)), '')
  left join media.media_library sp_media
    on sp_media.id::text = nullif(btrim(split_part(sp.image_url, ',', 1)), '')
  ${featuredWhereSql}
  order by
    coalesce(sp.featured_score, 0) desc,
    coalesce(sp.rating, 0) desc,
    coalesce(sp.review_count, 0) desc,
    sp.create_date desc
  limit 10
`;

  const featuredProviders: ExploreFeaturedProvider[] = uniqueById(featuredRows).map((row) => ({
    id: row.id,
    name: row.name,
    image: coalesceImage(row.image),
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    verified: Boolean(row.verified),
    location: row.location || "",
    specialties: Array.isArray(row.specialties) ? row.specialties.filter(Boolean) : [],
    responseTime: row.response_time || "Response time unavailable",
    bookings: row.bookings || "New provider",
    badge: row.badge || (row.verified ? "Verified" : "Featured"),
    isFavorited: providerFavoriteSet.has(row.id),
  }));

  // const whereSql = sql.join(conditions, sql` and `);

  const trendingRows = await sql<any[]>`
  select
    ps.id::text as id,
    sp.id::text as provider_id,
    coalesce(
      nullif(common.get_translation_t(ps.display_name_translations, ${lang}, 'en'), ''),
      nullif(common.get_translation_t(sd.name_translations, ${lang}, 'en'), '')
    ) as name,
    common.get_translation_t(sp.name_translations, ${lang}, 'en') as provider,
    coalesce(
      nullif(btrim(sd_media.file_url), ''),
      nullif(btrim(sd_media.storage_path), ''),
      nullif(btrim(sd_media.storage_key), ''),
      nullif(btrim(split_part(sd.image_url, ',', 1)), ''),
      nullif(btrim(ps_media.file_url), ''),
      nullif(btrim(ps_media.storage_path), ''),
      nullif(btrim(ps_media.storage_key), ''),
      nullif(btrim(split_part(ps.image_url, ',', 1)), ''),
      nullif(btrim(psgi_media.file_url), ''),
      nullif(btrim(psgi_media.storage_path), ''),
      nullif(btrim(psgi_media.storage_key), ''),
      nullif(btrim(split_part(psgi.url, ',', 1)), ''),
      nullif(btrim(pgi_media.file_url), ''),
      nullif(btrim(pgi_media.storage_path), ''),
      nullif(btrim(pgi_media.storage_key), ''),
      nullif(btrim(split_part(pgi.url, ',', 1)), ''),
      nullif(btrim(sp_media.file_url), ''),
      nullif(btrim(sp_media.storage_path), ''),
      nullif(btrim(sp_media.storage_key), ''),
      nullif(btrim(split_part(sp.image_url, ',', 1)), '')
    ) as image,
    ps.value::float as price,
    coalesce(ps.currency, 'USD') as currency,
    case
      when offer.discount_percent is not null and offer.discount_percent > 0
        then round(ps.value / (1 - (offer.discount_percent / 100.0)))::int
      else null
    end as original_price,
    coalesce(ps.rating, 0)::float as rating,
    coalesce(ps.review_count, 0)::int as reviews,
    case
      when ps.growth is null or btrim(ps.growth) = '' then null
      else ps.growth
    end as growth,
    trim(
      concat_ws(', ',
        nullif(city_loc.name, ''),
        nullif(country_loc.name, '')
      )
    ) as location
  from category.provider_services ps
  join category.service_providers sp on sp.id = ps.service_provider_id
  join category.service_definitions sd on sd.id = ps.service_definition_id
  left join lateral (
    select common.get_translation_t(l.value_translations, ${lang}, 'en') as name
    from category.locations l
    where l.code = sp.country
      and l.location_type_id = 1
    order by coalesce(l.display_order, 0), l.create_date desc
    limit 1
  ) country_loc on true
  left join lateral (
    select common.get_translation_t(l.value_translations, ${lang}, 'en') as name
    from category.locations l
    where l.code = sp.city
      and l.location_type_id = 2
    order by coalesce(l.display_order, 0), l.create_date desc
    limit 1
  ) city_loc on true
  left join lateral (
    select g.url
    from category.provider_service_gallery_items g
    where g.provider_service_id = ps.id
    order by g.is_primary desc, g.display_order asc, g.create_date asc
    limit 1
  ) psgi on true
  left join lateral (
    select g.url
    from category.provider_gallery_items g
    where g.service_provider_id = sp.id
    order by g.display_order asc, g.create_date asc
    limit 1
  ) pgi on true
  left join media.media_library ps_media
    on ps_media.id::text = nullif(btrim(split_part(ps.image_url, ',', 1)), '')
  left join media.media_library psgi_media
    on psgi_media.id::text = nullif(btrim(split_part(psgi.url, ',', 1)), '')
  left join media.media_library pgi_media
    on pgi_media.id::text = nullif(btrim(split_part(pgi.url, ',', 1)), '')
  left join media.media_library sd_media
    on sd_media.id::text = nullif(btrim(split_part(sd.image_url, ',', 1)), '')
  left join media.media_library sp_media
    on sp_media.id::text = nullif(btrim(split_part(sp.image_url, ',', 1)), '')
  left join lateral (
    select o.discount_percent
    from marketing.offers o
    where o.provider_service_id = ps.id
      and coalesce(o.is_active, false) = true
      and o.valid_until >= now()
    order by coalesce(o.is_featured, false) desc, o.valid_until asc
    limit 1
  ) offer on true
  ${trendingWhereSql}
  order by
    coalesce(ps.trending_score, 0) desc,
    coalesce(ps.review_count, 0) desc,
    ps.create_date desc
  limit 10
`;

  const trendingServices: ExploreTrendingService[] = uniqueById(trendingRows).map((row) => ({
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    provider: row.provider,
    image: coalesceImage(row.image),
    price: Number(row.price ?? 0),
    currency: row.currency || "USD",
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    growth: row.growth,
    location: row.location || "",
    isFavorited: serviceFavoriteSet.has(row.id),
  }));

  const sponsoredCurrencyCode = normalizeCurrencyCode(filters.currencyCode);
  const sponsoredWhereSql = buildSponsoredProvidersWhere(
    filters,
    lang,
    filters.languages,
    sponsoredCurrencyCode,
  );

  const sponsoredRows = await sql<any[]>`
    select
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${lang}, 'en') as name,
      common.get_translation_t(sp.description_translations, ${lang}, 'en') as subtitle,
      coalesce(
        nullif(btrim(ps_pick_media.file_url), ''),
        nullif(btrim(ps_pick_media.storage_path), ''),
        nullif(btrim(ps_pick_media.storage_key), ''),
        nullif(btrim(split_part(ps_pick.image_url, ',', 1)), ''),
        nullif(btrim(pgi_media.file_url), ''),
        nullif(btrim(pgi_media.storage_path), ''),
        nullif(btrim(pgi_media.storage_key), ''),
        nullif(btrim(split_part(pgi.url, ',', 1)), ''),
        nullif(btrim(sp_media.file_url), ''),
        nullif(btrim(sp_media.storage_path), ''),
        nullif(btrim(sp_media.storage_key), ''),
        nullif(btrim(split_part(sp.image_url, ',', 1)), '')
      ) as image,
      ps_pick.value::float as price,
      coalesce(ps_pick.currency, 'USD') as currency,
      coalesce(sp.sponsored_tag, 'Sponsored') as tag
    from category.service_providers sp
    left join lateral (
      select ps.value, ps.image_url, ps.currency
      from category.provider_services ps
      join category.service_definitions sd on sd.id = ps.service_definition_id
      where ps.service_provider_id = sp.id
        and ps.is_active = true
        and (
          ${filters.categoryId === null}
          or sd.category_id = ${filters.categoryId ?? null}::uuid
        )
        and (${filters.minPrice} = 0 or ps.value >= ${filters.minPrice})
        and (${filters.maxPrice} = 0 or ps.value <= ${filters.maxPrice})
        and (${sponsoredCurrencyCode} = '' or upper(coalesce(ps.currency, '')) = ${sponsoredCurrencyCode})
      order by coalesce(ps.is_popular, false) desc,
               coalesce(ps.rating, 0) desc,
               coalesce(ps.review_count, 0) desc,
               ps.create_date desc
      limit 1
    ) ps_pick on true
    left join lateral (
      select g.url
      from category.provider_gallery_items g
      where g.service_provider_id = sp.id
      order by g.display_order asc, g.create_date asc
      limit 1
    ) pgi on true
    left join media.media_library ps_pick_media
      on ps_pick_media.id::text = nullif(btrim(split_part(ps_pick.image_url, ',', 1)), '')
    left join media.media_library pgi_media
      on pgi_media.id::text = nullif(btrim(split_part(pgi.url, ',', 1)), '')
    left join media.media_library sp_media
      on sp_media.id::text = nullif(btrim(split_part(sp.image_url, ',', 1)), '')
    ${sponsoredWhereSql}
    order by coalesce(sp.featured_score, 0) desc,
             coalesce(sp.rating, 0) desc,
             sp.create_date desc
    limit 10
  `;

  const sponsoredProviders: ExploreSponsoredProvider[] = uniqueById(sponsoredRows).map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle || "",
    image: coalesceImage(row.image),
    price: row.price == null ? null : Number(row.price),
    currency: row.currency || "USD",
    tag: row.tag || "Sponsored",
  }));

  const languageRows = await sql<{ language: string; count: number }[]>`
    select lower(replace(language, '_', '-')) as language, count(distinct service_provider_id)::int as count
    from (
      select sp.id as service_provider_id, unnest(coalesce(sp.languages, array[]::text[])) as language
      from category.service_providers sp
      where sp.is_active = true
      union all
      select pl.service_provider_id, pl.language
      from category.provider_languages pl
      join category.service_providers sp on sp.id = pl.service_provider_id
      where sp.is_active = true
    ) lang
    where nullif(btrim(language), '') is not null
    group by lower(replace(language, '_', '-'))
    order by count(distinct service_provider_id) desc, language asc
  `;

  const languageCounts = new Map<string, number>();

  for (const row of languageRows) {
    const value = normalizeLanguageValue(row.language);
    if (!value) continue;

    languageCounts.set(value, (languageCounts.get(value) ?? 0) + Number(row.count ?? 0));
  }

  const availableLanguages = [...languageCounts.entries()]
    .map(([value, count]) => ({
      value,
      label: getLanguageLabel(value, lang),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const currencyRows = await sql<{ code: string; label: string; symbol: string; count: number }[]>`
    with service_currency_counts as (
      select upper(coalesce(nullif(btrim(ps.currency), ''), 'USD')) as code, count(*)::int as count
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true
        and sp.is_active = true
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

  const availableCurrencies = currencyRows.map((row) => ({
    code: row.code,
    label: row.label || row.code,
    symbol: row.symbol || row.code,
    count: Number(row.count ?? 0),
  }));

  return {
    customerId,
    categories,
    providerTypes,
    featuredProviders,
    trendingServices,
    sponsoredProviders,
    availableLanguages,
    availableCurrencies,
  };
}
