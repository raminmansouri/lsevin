import sql from "@/config/database/db";
import { unstable_noStore as noStore } from "next/cache";

export type OffersResponseTime = "any" | "fast" | "instant";

export type OffersFiltersInput = {
  q: string;
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  responseTime: OffersResponseTime;
};

export type OfferTab = {
  id: string;
  label: string;
  count: number;
};

export type OfferCard = {
  id: number;
  providerServiceId: string;
  providerId: string;
  categoryId: string | null;
  categoryLabel: string;
  title: string;
  subtitle: string;
  provider: string;
  image: string;
  discount: string;
  discountPercent: number;
  validUntil: string;
  validUntilIso: string;
  code: string;
  verified: boolean;
  location: string;
  rating: number;
  originalPrice: number;
  discountedPrice: number;
  currency: string;
};

export type OffersPageData = {
  tabs: OfferTab[];
  offers: OfferCard[];
  featuredOffer: OfferCard | null;
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

export function parseOffersFilters(
  params: Record<string, string | string[] | undefined>,
): OffersFiltersInput {
  const responseTime = toSingleString(params.responseTime).trim().toLowerCase();
  const languagesRaw = toSingleString(params.languages).trim();

  return {
    q: toSingleString(params.q).trim(),
    categoryId: toSingleString(params.categoryId).trim() || null,
    minPrice: Math.max(0, toFiniteNumber(params.minPrice, 0)),
    maxPrice: Math.max(0, toFiniteNumber(params.maxPrice, 5000)),
    minRating: Math.max(0, toFiniteNumber(params.minRating, 0)),
    verifiedOnly: ["1", "true", "yes", "on"].includes(
      toSingleString(params.verifiedOnly || params.verified).trim().toLowerCase(),
    ),
    languages: languagesRaw
      ? languagesRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    responseTime:
      responseTime === "fast" || responseTime === "instant"
        ? (responseTime as OffersResponseTime)
        : "any",
  };
}

function normalizeLocale(locale: string) {
  return locale?.trim() || "en";
}

function formatDateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function coalesceImage(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return "/placeholder.svg";
}

function joinSql(parts: any[], separator: any) {
  return parts.slice(1).reduce(
    (acc, part) => sql`${acc}${separator}${part}`,
    parts[0],
  );
}

function buildOffersWhere(filters: OffersFiltersInput, lang: string) {
  const conditions = [
    sql`coalesce(o.is_active, false) = true`,
    sql`o.valid_until >= now()`,
    sql`ps.is_active = true`,
    sql`sp.is_active = true`,
  ];

  if (filters.categoryId) {
    conditions.push(sql`sd.category_id = ${filters.categoryId}::uuid`);
  }

  if (filters.minPrice > 0) {
    conditions.push(sql`
      round(ps.value * (1 - (o.discount_percent / 100.0)))::numeric >= ${filters.minPrice}
    `);
  }

  if (filters.maxPrice > 0 && filters.maxPrice < 5000) {
    conditions.push(sql`
      round(ps.value * (1 - (o.discount_percent / 100.0)))::numeric <= ${filters.maxPrice}
    `);
  }

  if (filters.minRating > 0) {
    conditions.push(sql`coalesce(sp.rating, 0) >= ${filters.minRating}`);
  }

  if (filters.verifiedOnly) {
    conditions.push(sql`coalesce(sp.accredited, false) = true`);
  }

  if (filters.responseTime === "fast") {
    conditions.push(sql`lower(coalesce(sp.response_time, '')) ~ '30|1\\s*hour|60\\s*min'`);
  }

  if (filters.responseTime === "instant") {
    conditions.push(sql`lower(coalesce(sp.response_time, '')) ~ '30\\s*min|instant'`);
  }

  const languageFilter = filters.languages.map((x) => x.trim().toLowerCase()).filter(Boolean);

  if (languageFilter.length > 0) {
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

  if (filters.q) {
    const term = filters.q;
    conditions.push(sql`
      (
        common.get_translation_t(coalesce(to_jsonb(jsonb_build_object('x', o.title))->'x', '{}'::jsonb), ${lang}, 'en') = ''
        or true
      )
    `);
    conditions.push(sql`
      (
        ps.search_vector @@ websearch_to_tsquery('simple', ${term})
        or sp.search_vector @@ websearch_to_tsquery('simple', ${term})
        or o.title ilike ${`%${term}%`}
        or coalesce(o.subtitle, '') ilike ${`%${term}%`}
        or common.get_translation_t(ps.display_name_translations, ${lang}, 'en') ilike ${`%${term}%`}
        or common.get_translation_t(sp.name_translations, ${lang}, 'en') ilike ${`%${term}%`}
      )
    `);
  }

  return sql`where ${joinSql(conditions, sql` and `)}`;
}

export async function getOffersPageData({
  locale,
  filters,
}: {
  locale: string;
  filters: OffersFiltersInput;
}): Promise<OffersPageData> {
  noStore();

  const lang = normalizeLocale(locale);
  const whereSql = buildOffersWhere(filters, lang);

  const rows = await sql<any[]>`
    select
      o.id::int as id,
      ps.id::text as provider_service_id,
      sp.id::text as provider_id,
      sd.category_id::text as category_id,
      common.get_translation_t(c.name_translations, ${lang}, 'en') as category_label,
      o.title,
      coalesce(o.subtitle, '') as subtitle,
      common.get_translation_t(sp.name_translations, ${lang}, 'en') as provider,
      coalesce(psgi.url, pgi.url, ps.image_url, sp.image_url) as image,
      o.discount_percent::float as discount_percent,
      to_char(o.discount_percent, 'FM999990D##') || '%' as discount_label,
      o.valid_until::text as valid_until_iso,
      coalesce(o.code, '') as code,
      coalesce(sp.accredited, false) as verified,
      trim(
        concat_ws(', ',
          nullif(common.get_translation_t(city_loc.value_translations, ${lang}, 'en'), ''),
          nullif(common.get_translation_t(country_loc.value_translations, ${lang}, 'en'), '')
        )
      ) as location,
      coalesce(sp.rating, 0)::float as rating,
      round(ps.value)::int as original_price,
      round(ps.value * (1 - (o.discount_percent / 100.0)))::int as discounted_price,
      ps.currency
    from marketing.offers o
    join category.provider_services ps on ps.id = o.provider_service_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    join category.service_definitions sd on sd.id = ps.service_definition_id
    join category.categories c on c.id = sd.category_id
    left join category.locations country_loc
      on country_loc.code = sp.country
     and country_loc.location_type_id = 1
    left join category.locations city_loc
      on city_loc.code = sp.city
     and city_loc.location_type_id = 2
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
    ${whereSql}
    order by
      coalesce(o.is_featured, false) desc,
      o.discount_percent desc,
      o.valid_until asc,
      o.id desc
  `;

  const offers: OfferCard[] = rows.map((row) => ({
    id: Number(row.id),
    providerServiceId: row.provider_service_id,
    providerId: row.provider_id,
    categoryId: row.category_id,
    categoryLabel: row.category_label || "Offers",
    title: row.title || "",
    subtitle: row.subtitle || "",
    provider: row.provider || "",
    image: coalesceImage(row.image),
    discount: row.discount_label || `${Number(row.discount_percent ?? 0)}%`,
    discountPercent: Number(row.discount_percent ?? 0),
    validUntil: formatDateLabel(row.valid_until_iso),
    validUntilIso: row.valid_until_iso,
    code: row.code || "",
    verified: Boolean(row.verified),
    location: row.location || "",
    rating: Number(row.rating ?? 0),
    originalPrice: Number(row.original_price ?? 0),
    discountedPrice: Number(row.discounted_price ?? 0),
    currency: row.currency || "USD",
  }));

  const tabCounts = new Map<string, { label: string; count: number }>();
  for (const offer of offers) {
    const key = offer.categoryId || "uncategorized";
    const current = tabCounts.get(key);
    tabCounts.set(key, {
      label: offer.categoryLabel || "Offers",
      count: (current?.count ?? 0) + 1,
    });
  }

  const tabs: OfferTab[] = [
    { id: "all", label: "All Offers", count: offers.length },
    ...Array.from(tabCounts.entries()).map(([id, value]) => ({
      id,
      label: value.label,
      count: value.count,
    })),
  ];

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
    tabs,
    offers,
    featuredOffer: offers[0] ?? null,
    availableLanguages,
  };
}
