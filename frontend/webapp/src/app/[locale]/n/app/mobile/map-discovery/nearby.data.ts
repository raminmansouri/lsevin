import sql from "@/config/database/db";
import { unstable_noStore as noStore } from "next/cache";

export type NearbyFiltersInput = {
  q: string;
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  distanceKm: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  specialties: string[];
  lat: number | null;
  lng: number | null;
};

export type NearbyCategory = {
  image?: string;
  id: string;
  label: string;
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
  mapCenter: { lat: number; lng: number; zoom: number };
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

export function parseNearbyFilters(
  params: Record<string, string | string[] | undefined>,
): NearbyFiltersInput {
  const languagesRaw = toSingleString(params.languages).trim();
  const specialtiesRaw = toSingleString(params.specialties).trim();

  return {
    q: toSingleString(params.q).trim(),
    categoryId: toSingleString(params.categoryId).trim() || null,
    minPrice: Math.max(0, toFiniteNumber(params.minPrice, 0)),
    maxPrice: Math.max(0, toFiniteNumber(params.maxPrice, 5000)),
    distanceKm: Math.max(1, toFiniteNumber(params.distanceKm ?? params.distance, 10)),
    minRating: Math.max(0, toFiniteNumber(params.minRating, 0)),
    verifiedOnly: ["1", "true", "yes", "on"].includes(
      toSingleString(params.verifiedOnly || params.verified).trim().toLowerCase(),
    ),
    languages: languagesRaw
      ? languagesRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    specialties: specialtiesRaw
      ? specialtiesRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
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
  return parts.slice(1).reduce((acc, part) => sql`${acc}${separator}${part}`, parts[0]);
}

function coalesceImage(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return "/placeholder.svg";
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

  if (filters.minPrice > 0 || filters.maxPrice > 0) {
    conditions.push(sql`exists (
      select 1
      from category.provider_services psp
      where psp.service_provider_id = sp.id
        and psp.is_active = true
        and (${filters.minPrice} = 0 or psp.value >= ${filters.minPrice})
        and (${filters.maxPrice} = 0 or psp.value <= ${filters.maxPrice})
    )`);
  }

  if (filters.minRating > 0) {
    conditions.push(sql`coalesce(sp.rating, 0) >= ${filters.minRating}`);
  }

  if (filters.verifiedOnly) {
    conditions.push(sql`coalesce(sp.accredited, false) = true`);
  }

  const languageFilter = filters.languages.map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (languageFilter.length > 0) {
    conditions.push(sql`(
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
    )`);
  }

  const specialtyFilter = filters.specialties.map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (specialtyFilter.length > 0) {
    conditions.push(sql`exists (
      select 1
      from unnest(coalesce(sp.specialties, array[]::text[])) as specialty
      where lower(specialty) = any(${sql.array(specialtyFilter, "text")})
    )`);
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
  const customerId = await resolveCurrentCustomerId();
  const whereSql = buildNearbyWhere(filters, lang);

  const favoriteProviderIds = customerId
    ? await sql<{ entity_id: string }[]>`
        select entity_id::text as entity_id
        from customer.favorites
        where customer_id = ${customerId}
          and favorite_type = 'provider'
      `
    : [];
  const providerFavoriteSet = new Set(favoriteProviderIds.map((x) => x.entity_id));

  const categoryRows = await sql<NearbyCategory[]>`
    select distinct
      c.id::text as id,
      common.get_translation_t(c.name_translations, ${lang}, 'en') as label
    from category.categories c
    join category.service_definitions sd on sd.category_id = c.id and sd.is_active = true
    join category.provider_services ps on ps.service_definition_id = sd.id and ps.is_active = true
    join category.service_providers sp on sp.id = ps.service_provider_id and sp.is_active = true
    order by label asc
  `;

  const categories: NearbyCategory[] = [{ id: 'all', label: 'All' }, ...categoryRows];

  const rows = await sql<any[]>`
    select
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${lang}, 'en') as name,
      coalesce(pgi.url, sp.image_url) as image,
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
    left join lateral (
      select min(ps.value)::float as price_from
      from category.provider_services ps
      where ps.service_provider_id = sp.id
        and ps.is_active = true
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
    const location = distanceKm != null
      ? `${distanceKm.toFixed(1)} km away`
      : row.city_country || "Location unavailable";

    return {
      id: row.id,
      name: row.name,
      image: coalesceImage(row.image),
      rating: Number(row.rating ?? 0),
      reviews: Number(row.reviews ?? 0),
      verified: Boolean(row.verified),
      location,
      specialties: Array.isArray(row.specialties) ? row.specialties.filter(Boolean) : [],
      languages: Array.isArray(row.languages) ? row.languages.filter(Boolean) : [],
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

  const availableLanguages = languageRows.map((row) => row.language).filter(Boolean).map((value) => value.charAt(0).toUpperCase() + value.slice(1));
  const availableSpecialties = specialtyRows.map((row) => row.specialty).filter(Boolean).map((value) => value.charAt(0).toUpperCase() + value.slice(1));

  const firstWithCoordinates = providers.find((provider) => provider.coordinates);
  const mapCenter = filters.lat != null && filters.lng != null
    ? { lat: filters.lat, lng: filters.lng, zoom: 10 }
    : firstWithCoordinates?.coordinates
      ? { lat: firstWithCoordinates.coordinates.lat, lng: firstWithCoordinates.coordinates.lng, zoom: 10 }
      : { lat: 25.2048, lng: 55.2708, zoom: 9 };

  return {
    customerId,
    categories,
    providers,
    availableLanguages,
    availableSpecialties,
    mapCenter,
  };
}
