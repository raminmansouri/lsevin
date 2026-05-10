import sql from "@/config/database/db";
import { unstable_noStore as noStore } from "next/cache";


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

export type ExplorePageData = {
  customerId: string | null;
  categories: ExploreCategory[];
  providerTypes: ExploreProviderType[];
  featuredProviders: ExploreFeaturedProvider[];
  trendingServices: ExploreTrendingService[];
  sponsoredProviders: ExploreSponsoredProvider[];
  availableLanguages: string[];
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
  const categoryId = toSingleString(params.categoryId).trim();
  const providerTypeId = toSingleString(params.providerTypeId).trim();
  const countryCode = toSingleString(params.countryCode || params.country).trim();
  const cityCode = toSingleString(params.cityCode || params.city).trim();

  return {
    q: toSingleString(params.q).trim(),
    categoryId: categoryId && categoryId !== "all" ? categoryId : null,
    providerTypeId: providerTypeId && providerTypeId !== "all" ? providerTypeId : null,
    countryCode: countryCode && countryCode !== "all" ? countryCode : null,
    cityCode: cityCode && cityCode !== "all" ? cityCode : null,
    minPrice: Math.max(0, toFiniteNumber(params.minPrice, 0)),
    maxPrice: Math.max(0, toFiniteNumber(params.maxPrice, 5000)),
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
  return locale?.trim() || "en";
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  return null;
}



function isRawUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function coalesceImage(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && !isRawUuid(value)) return value;
  }
  return "/placeholder.svg";
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
    const languageFilter = filters.languages
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    conditions.push(sql`
      (
        exists (
          select 1
          from category.provider_languages pl
          where pl.service_provider_id = sp.id
            and lower(pl.language) = any(${sql.array(languageFilter, "text")})
        )
        or exists (
          select 1
          from unnest(coalesce(sp.languages, array[]::text[])) as provider_language(language)
          where lower(provider_language.language) = any(${sql.array(languageFilter, "text")})
        )
      )
    `);
  }

  if (filters.q.trim()) {
    const term = filters.q.trim();

    conditions.push(sql`
      (
        sp.search_vector @@ websearch_to_tsquery('simple', ${term})
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or exists (
          select 1
          from unnest(coalesce(sp.specialties, array[]::text[])) as specialty
          where specialty ilike ${`%${term}%`}
        )
      )
    `);
  }

  if (filters.categoryId) {
    conditions.push(sql`
      exists (
        select 1
        from category.provider_services ps
        join category.service_definitions sd on sd.id = ps.service_definition_id
        where ps.service_provider_id = sp.id
          and ps.is_active = true
          and sd.category_id = ${filters.categoryId}::uuid
      )
    `);
  }

  if (filters.providerTypeId) {
    conditions.push(sql`sp.provider_type_id = ${filters.providerTypeId}::uuid`);
  }

  if (filters.countryCode) {
    conditions.push(sql`sp.country = ${filters.countryCode}`);
  }

  if (filters.cityCode) {
    conditions.push(sql`sp.city = ${filters.cityCode}`);
  }

  return conditions.length
    ? sql`where ${joinSql(conditions, sql` and `)}`
    : sql``;
}

function buildTrendingServicesWhere(filters: ExploreFiltersInput, lang: string) {
  const conditions = [sql`sp.is_active = true`, sql`ps.is_active = true`];

  if (filters.categoryId) {
    conditions.push(sql`sd.category_id = ${filters.categoryId}::uuid`);
  }

  if (filters.providerTypeId) {
    conditions.push(sql`sp.provider_type_id = ${filters.providerTypeId}::uuid`);
  }

  if (filters.countryCode) {
    conditions.push(sql`sp.country = ${filters.countryCode}`);
  }

  if (filters.cityCode) {
    conditions.push(sql`sp.city = ${filters.cityCode}`);
  }

  if (filters.minPrice > 0) {
    conditions.push(sql`ps.value >= ${filters.minPrice}`);
  }

  if (filters.maxPrice > 0) {
    conditions.push(sql`ps.value <= ${filters.maxPrice}`);
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
    const languageFilter = filters.languages
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    conditions.push(sql`
      (
        exists (
          select 1
          from category.provider_languages pl
          where pl.service_provider_id = sp.id
            and lower(pl.language) = any(${sql.array(languageFilter, "text")})
        )
        or exists (
          select 1
          from unnest(coalesce(sp.languages, array[]::text[])) as provider_language(language)
          where lower(provider_language.language) = any(${sql.array(languageFilter, "text")})
        )
      )
    `);
  }

  if (filters.q.trim()) {
    const term = filters.q.trim();

    conditions.push(sql`
      (
        ps.search_vector @@ websearch_to_tsquery('simple', ${term})
        or sp.search_vector @@ websearch_to_tsquery('simple', ${term})
        or common.get_translation_t(ps.display_name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or exists (
          select 1
          from unnest(coalesce(sp.specialties, array[]::text[])) as specialty
          where specialty ilike ${`%${term}%`}
        )
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


  const categoryRows = await sql<ExploreCategory[]>`
    select
      c.id::text as id,
      common.get_translation_t(c.name_translations, ${lang}, 'en') as label,
      count(distinct ps.id)::int as count
    from category.categories c
    left join category.service_definitions sd
      on sd.category_id = c.id
     and sd.is_active = true
    left join category.provider_services ps
      on ps.service_definition_id = sd.id
     and ps.is_active = true
    left join category.service_providers sp
      on sp.id = ps.service_provider_id
     and sp.is_active = true
    group by c.id, common.get_translation_t(c.name_translations, ${lang}, 'en')
    order by count(distinct ps.id) desc, label asc
  `;

  const categories: ExploreCategory[] = [
    {
      id: "all",
      label: "All Services",
      count: categoryRows.reduce((sum, item) => sum + item.count, 0),
    },
    ...categoryRows,
  ];

  const providerTypeRows = await sql<ExploreProviderType[]>`
    select
      pt.id::text as id,
      common.get_translation_t(pt.name_translations, ${lang}, 'en') as label,
      common.get_translation_t(pt.description_translations, ${lang}, 'en') as description,
      coalesce(
        nullif(btrim(ml.file_url), ''),
        nullif(btrim(ml.storage_path), ''),
        nullif(btrim(ml.storage_key), ''),
        (case when nullif(btrim(pt.image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(pt.image_url), '') end),
        nullif(btrim(pt.icon_url), '')
      ) as image,
      coalesce(nullif(btrim(pt.icon_url), ''), '') as icon,
      count(distinct sp.id)::int as count
    from category.provider_types pt
    left join media.media_library ml
      on ml.id::text = nullif(btrim(pt.image_url), '')
    left join category.service_providers sp
      on sp.provider_type_id = pt.id
     and sp.is_active = true
    where pt.is_active = true
    group by
      pt.id,
      common.get_translation_t(pt.name_translations, ${lang}, 'en'),
      common.get_translation_t(pt.description_translations, ${lang}, 'en'),
      ml.file_url,
      ml.storage_path,
      ml.storage_key,
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
      (case when nullif(btrim(pgi.url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(pgi.url), '') end),
      nullif(btrim(sp_media.file_url), ''),
      nullif(btrim(sp_media.storage_path), ''),
      nullif(btrim(sp_media.storage_key), ''),
      (case when nullif(btrim(sp.image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(sp.image_url), '') end)
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
    on pgi_media.id::text = nullif(btrim(pgi.url), '')
  left join media.media_library sp_media
    on sp_media.id::text = nullif(btrim(sp.image_url), '')
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
    common.get_translation_t(ps.display_name_translations, ${lang}, 'en') as name,
    common.get_translation_t(sp.name_translations, ${lang}, 'en') as provider,
    coalesce(
      nullif(btrim(ps_media.file_url), ''),
      nullif(btrim(ps_media.storage_path), ''),
      nullif(btrim(ps_media.storage_key), ''),
      (case when nullif(btrim(ps.image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(ps.image_url), '') end),
      nullif(btrim(psgi_media.file_url), ''),
      nullif(btrim(psgi_media.storage_path), ''),
      nullif(btrim(psgi_media.storage_key), ''),
      (case when nullif(btrim(psgi.url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(psgi.url), '') end),
      nullif(btrim(pgi_media.file_url), ''),
      nullif(btrim(pgi_media.storage_path), ''),
      nullif(btrim(pgi_media.storage_key), ''),
      (case when nullif(btrim(pgi.url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(pgi.url), '') end)
    ) as image,
    ps.value::float as price,
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
    on ps_media.id::text = nullif(btrim(ps.image_url), '')
  left join media.media_library psgi_media
    on psgi_media.id::text = nullif(btrim(psgi.url), '')
  left join media.media_library pgi_media
    on pgi_media.id::text = nullif(btrim(pgi.url), '')
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
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    growth: row.growth,
    location: row.location || "",
    isFavorited: serviceFavoriteSet.has(row.id),
  }));

  const sponsoredRows = await sql<any[]>`
    select
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${lang}, 'en') as name,
      common.get_translation_t(sp.description_translations, ${lang}, 'en') as subtitle,
      coalesce(
        nullif(btrim(ps_pick_media.file_url), ''),
        nullif(btrim(ps_pick_media.storage_path), ''),
        nullif(btrim(ps_pick_media.storage_key), ''),
        (case when nullif(btrim(ps_pick.image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(ps_pick.image_url), '') end),
        nullif(btrim(pgi_media.file_url), ''),
        nullif(btrim(pgi_media.storage_path), ''),
        nullif(btrim(pgi_media.storage_key), ''),
        (case when nullif(btrim(pgi.url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(pgi.url), '') end),
        nullif(btrim(sp_media.file_url), ''),
        nullif(btrim(sp_media.storage_path), ''),
        nullif(btrim(sp_media.storage_key), ''),
        (case when nullif(btrim(sp.image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(sp.image_url), '') end)
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
      on ps_pick_media.id::text = nullif(btrim(ps_pick.image_url), '')
    left join media.media_library pgi_media
      on pgi_media.id::text = nullif(btrim(pgi.url), '')
    left join media.media_library sp_media
      on sp_media.id::text = nullif(btrim(sp.image_url), '')
    where sp.is_active = true
      and sp.is_sponsored = true
      and (${filters.providerTypeId === null} or sp.provider_type_id = ${filters.providerTypeId ?? null}::uuid)
      and (${filters.countryCode === null} or sp.country = ${filters.countryCode ?? null})
      and (${filters.cityCode === null} or sp.city = ${filters.cityCode ?? null})
      and (${filters.verifiedOnly} = false or coalesce(sp.accredited, false) = true)
      and (${filters.minRating} = 0 or coalesce(sp.rating, 0) >= ${filters.minRating})
      and (
        ${filters.q} = ''
        or sp.search_vector @@ websearch_to_tsquery('simple', ${filters.q})
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${filters.q}%`}
      )
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

  const availableLanguages = languageRows
    .map((row) => row.language)
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));

  return {
    customerId,
    categories,
    providerTypes,
    featuredProviders,
    trendingServices,
    sponsoredProviders,
    availableLanguages,
  };
}
