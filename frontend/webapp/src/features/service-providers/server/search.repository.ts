import "server-only";

import { createHash, randomUUID } from "crypto";

import { cookies } from "next/headers";

import sql from "@/config/database/db";

import {
  getPopularSearchCategoriesCached,
  getTrendingSearchesCached,
} from "./search.repository.cached";
import type {
  SearchHistoryPopularCategoryVm,
  SearchHistoryResponse,
  SearchHistoryTrendingSearchVm,
  SearchResultsCategory,
  SearchResultsFilter,
  SearchResultsItem,
  SearchResultsResponse,
} from "../types";

const SEARCH_GUEST_COOKIE = "lsevin_search_guest_id";
const SEARCH_TERM_MAX_LENGTH = 120;
const DEFAULT_LOCALE = "en-US";

// Anchored UUID regex used inside SQL: image/url columns frequently store
// media.media_library ids, which must be resolved to file_url before the
// client can render them.
const uuidPattern =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

type SearchIdentity = {
  userId: string;
  isGuest: boolean;
};

type SearchHistoryRow = {
  term: string;
};

type TrendingSearchRow = {
  query: string;
  image: string | null;
  bookings: number | string | null;
};

type PopularCategoryRow = {
  id: string;
  label: string;
  icon: string | null;
  image: string | null;
  count: number;
};

type SearchResultRow = {
  id: string;
  type: SearchResultsItem["type"];
  name: string;
  provider: string | null;
  image: string | null;
  location: string;
  rating: number | null;
  reviews: number | null;
  price: number | null;
  original_price: number | null;
  currency: string | null;
  verified: boolean | null;
  specialties: string[] | null;
  tags: string[] | null;
  href: string;
  rank_score: number;
};

type SearchCategoryRow = {
  id: string;
  label: string;
  count: number;
};

type SearchFilterRow = {
  id: string;
  label: string;
  count: number;
};

function normalizeLocale(locale?: string | null) {
  const value = locale?.trim();
  return value || DEFAULT_LOCALE;
}

function isPersianLocale(locale?: string | null) {
  return normalizeLocale(locale).toLowerCase().startsWith("fa");
}

function getSearchStaticLabels(locale?: string | null) {
  const isFa = isPersianLocale(locale);

  return {
    category: isFa ? "دسته‌بندی" : "Category",
    searchIcon: isFa ? "جستجو" : "Search",
    sponsored: isFa ? "اسپانسر شده" : "Sponsored",
    verified: isFa ? "تأیید شده" : "Verified",
    untitled: isFa ? "بدون عنوان" : "Untitled",
    defaultProvider: "LSevin",
    providerType: isFa ? "نوع ارائه‌دهنده" : "Provider type",
  };
}

function normalizeUuidOrNull(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return null;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalized
  )
    ? normalized
    : null;
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function normalizeSearchTerm(value?: string | null) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_TERM_MAX_LENGTH);
}

function normalizeTermKey(value: string) {
  return normalizeSearchTerm(value).toLocaleLowerCase();
}

function hashSessionToken(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

async function getSearchIdentity(options?: { createGuestCookie?: boolean }): Promise<SearchIdentity> {
  const cookieStore = await cookies();

  const explicitUserCookie =
    cookieStore.get("lsevin_user_id")?.value ||
    cookieStore.get("lsevin-user-id")?.value ||
    cookieStore.get("user_id")?.value ||
    cookieStore.get("user-id")?.value;

  if (explicitUserCookie?.trim()) {
    return { userId: explicitUserCookie.trim(), isGuest: false };
  }

  const sessionToken =
    cookieStore.get("__Secure-next-auth.session-token")?.value ||
    cookieStore.get("next-auth.session-token")?.value;

  if (sessionToken?.trim()) {
    return { userId: `session:${hashSessionToken(sessionToken)}`, isGuest: false };
  }

  const existingGuestId = cookieStore.get(SEARCH_GUEST_COOKIE)?.value;
  if (existingGuestId?.trim()) {
    return { userId: `guest:${existingGuestId.trim()}`, isGuest: true };
  }

  if (options?.createGuestCookie) {
    const guestId = randomUUID();
    cookieStore.set(SEARCH_GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return { userId: `guest:${guestId}`, isGuest: true };
  }

  return { userId: "guest:anonymous", isGuest: true };
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function cleanArray(value: string[] | null | undefined) {
  return Array.from(
    new Set(
      (value ?? [])
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item))
    )
  );
}

export async function getRecentSearches(limit = 8): Promise<string[]> {
  const identity = await getSearchIdentity();

  if (identity.userId === "guest:anonymous") return [];

  const rows = await sql<SearchHistoryRow[]>`
    WITH ranked AS (
      SELECT
        (array_agg(BTRIM(term) ORDER BY created_at DESC NULLS LAST, id DESC))[1] AS term,
        MAX(created_at) AS last_seen
      FROM search.user_search_history
      WHERE user_id = ${identity.userId}
        AND NULLIF(BTRIM(term), '') IS NOT NULL
      GROUP BY lower(BTRIM(COALESCE(NULLIF(normalized_term, ''), term)))
    )
    SELECT term
    FROM ranked
    WHERE NULLIF(BTRIM(term), '') IS NOT NULL
    ORDER BY last_seen DESC NULLS LAST, term ASC
    LIMIT ${Math.max(1, Math.min(limit, 20))};
  `;

  return rows.map((row) => row.term).filter(Boolean);
}

export async function getTrendingSearches(
  locale?: string,
  limit = 6
): Promise<SearchHistoryTrendingSearchVm[]> {
  const normalizedLocale = normalizeLocale(locale);

  // "Trending Now" is driven by the most-booked services. Bookings for the same
  // service (offered by different providers) are summed under one searchable name,
  // and every item is required to have an image. Image sources are often stored as
  // media UUIDs, so they are resolved through media.media_library. When bookings are
  // sparse we fall back to the most popular active services so the section stays full.
  const rows = await sql<TrendingSearchRow[]>`
    WITH booking_counts AS (
      SELECT b.service_id, COUNT(*)::bigint AS bookings
      FROM booking.bookings b
      WHERE b.service_id IS NOT NULL
        AND lower(COALESCE(b.booking_status, '')) NOT IN ('cancelled', 'canceled', 'rejected', 'failed', 'no_show')
      GROUP BY b.service_id
    ),
    service_rows AS (
      SELECT
        COALESCE(
          NULLIF(common.get_translation_t(ps.display_name_translations, ${normalizedLocale}::text, 'en-US'), ''),
          common.get_translation_t(sd.name_translations, ${normalizedLocale}::text, 'en-US')
        ) AS name,
        COALESCE(
          CASE WHEN ps.image_url ~* ${uuidPattern} THEN ps_media.file_url ELSE NULLIF(BTRIM(ps.image_url), '') END,
          primary_gallery.url,
          CASE WHEN sp.image_url ~* ${uuidPattern} THEN sp_media.file_url ELSE NULLIF(BTRIM(sp.image_url), '') END,
          CASE WHEN c.image_url ~* ${uuidPattern} THEN c_media.file_url ELSE NULLIF(BTRIM(c.image_url), '') END
        ) AS image,
        COALESCE(bc.bookings, 0)::bigint AS bookings,
        COALESCE(ps.trending_score, 0)::float8 AS trending_score,
        COALESCE(ps.rating, sp.rating, 0)::float8 AS rating,
        COALESCE(ps.review_count, sp.review_count, 0)::int AS review_count
      FROM category.provider_services ps
      JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
      JOIN category.categories c ON c.id = sd.category_id
      JOIN category.service_providers sp ON sp.id = ps.service_provider_id
      LEFT JOIN booking_counts bc ON bc.service_id = ps.id
      LEFT JOIN media.media_library ps_media
        ON ps_media.id = CASE WHEN ps.image_url ~* ${uuidPattern} THEN ps.image_url::uuid ELSE NULL END
      LEFT JOIN media.media_library sp_media
        ON sp_media.id = CASE WHEN sp.image_url ~* ${uuidPattern} THEN sp.image_url::uuid ELSE NULL END
      LEFT JOIN media.media_library c_media
        ON c_media.id = CASE WHEN c.image_url ~* ${uuidPattern} THEN c.image_url::uuid ELSE NULL END
      LEFT JOIN LATERAL (
        SELECT COALESCE(gml.file_url, NULLIF(BTRIM(psgi.url), '')) AS url
        FROM category.provider_service_gallery_items psgi
        LEFT JOIN media.media_library gml
          ON gml.id = CASE WHEN psgi.url ~* ${uuidPattern} THEN psgi.url::uuid ELSE NULL END
        WHERE psgi.provider_service_id = ps.id
        ORDER BY psgi.is_primary DESC, psgi.display_order ASC, psgi.create_date DESC
        LIMIT 1
      ) primary_gallery ON true
      WHERE ps.is_active = true
        AND sd.is_active = true
        AND c.is_active = true
        AND sp.is_active = true
    ),
    aggregated AS (
      SELECT
        (array_agg(name ORDER BY bookings DESC, trending_score DESC, rating DESC))[1] AS query,
        (array_agg(image ORDER BY bookings DESC, trending_score DESC, rating DESC) FILTER (WHERE image IS NOT NULL))[1] AS image,
        SUM(bookings)::bigint AS bookings,
        MAX(trending_score) AS trending_score,
        MAX(rating) AS rating,
        MAX(review_count) AS review_count
      FROM service_rows
      WHERE NULLIF(BTRIM(name), '') IS NOT NULL
      GROUP BY lower(BTRIM(name))
    )
    SELECT query, image, bookings
    FROM aggregated
    WHERE image IS NOT NULL
    ORDER BY bookings DESC, trending_score DESC, rating DESC, review_count DESC, query ASC
    LIMIT ${Math.max(1, Math.min(limit, 20))};
  `;

  return rows.map((row) => ({
    query: row.query,
    image: row.image,
    bookings: toNumber(row.bookings),
    trend: "",
  }));
}

export async function getPopularSearchCategories(
  locale?: string,
  limit = 8
): Promise<SearchHistoryPopularCategoryVm[]> {
  const normalizedLocale = normalizeLocale(locale);
  const labels = getSearchStaticLabels(normalizedLocale);

  const rows = await sql<PopularCategoryRow[]>`
    SELECT
      c.id::text AS id,
      common.get_translation_t(c.name_translations, ${normalizedLocale}::text, 'en-US') AS label,
      NULLIF(BTRIM(COALESCE(c.icon, c.icon_url, '')), '') AS icon,
      NULLIF(BTRIM(COALESCE(c.image_url, '')), '') AS image,
      COUNT(DISTINCT ps.id)::int AS count
    FROM category.categories c
    JOIN category.service_definitions sd
      ON sd.category_id = c.id
     AND sd.is_active = true
    JOIN category.provider_services ps
      ON ps.service_definition_id = sd.id
     AND ps.is_active = true
    JOIN category.service_providers sp
      ON sp.id = ps.service_provider_id
     AND sp.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.name_translations, c.icon, c.icon_url, c.image_url, c.display_order
    ORDER BY COUNT(DISTINCT ps.id) DESC, c.display_order ASC, label ASC
    LIMIT ${Math.max(1, Math.min(limit, 20))};
  `;

  return rows.map((row) => ({
    id: row.id,
    label: row.label || labels.category,
    icon: row.icon || labels.searchIcon,
    image: row.image,
    count: toNumber(row.count),
  }));
}

export async function getSearchHistory(locale?: string): Promise<SearchHistoryResponse> {
  // `getRecentSearches` is per identity; the other two are global (locale-only)
  // and served from the `"use cache"` layer — see `search.repository.cached`.
  const [recentSearches, popularCategories, trendingSearches] = await Promise.all([
    getRecentSearches(8),
    getPopularSearchCategoriesCached(locale, 8),
    getTrendingSearchesCached(locale, 6),
  ]);

  return {
    recentSearches,
    popularCategories,
    trendingSearches,
  };
}

export async function recordSearchTerm(term: string) {
  const normalizedTerm = normalizeSearchTerm(term);
  if (!normalizedTerm) return { ok: false, term: "" };

  const identity = await getSearchIdentity({ createGuestCookie: true });

  await sql`
    INSERT INTO search.user_search_history (user_id, term, normalized_term)
    VALUES (${identity.userId}, ${normalizedTerm}, ${normalizeTermKey(normalizedTerm)})
  `;

  return { ok: true, term: normalizedTerm };
}

export async function clearSearchHistory(term?: string | null) {
  const identity = await getSearchIdentity();
  if (identity.userId === "guest:anonymous") return { ok: true };

  const normalizedTerm = normalizeSearchTerm(term);

  if (normalizedTerm) {
    await sql`
      DELETE FROM search.user_search_history
      WHERE user_id = ${identity.userId}
        AND lower(BTRIM(COALESCE(NULLIF(normalized_term, ''), term))) = ${normalizeTermKey(normalizedTerm)}
    `;
  } else {
    await sql`
      DELETE FROM search.user_search_history
      WHERE user_id = ${identity.userId}
    `;
  }

  return { ok: true };
}

export async function getSearchResults(params?: {
  term?: string | null;
  locale?: string | null;
  limit?: number;
  categoryId?: string | null;
  providerTypeId?: string | null;
  country?: string | null;
  city?: string | null;
}): Promise<SearchResultsResponse> {
  const term = normalizeSearchTerm(params?.term);
  const normalizedLocale = normalizeLocale(params?.locale);
  const labels = getSearchStaticLabels(normalizedLocale);
  const limit = Math.max(1, Math.min(params?.limit ?? 30, 60));
  const likeTerm = `%${term}%`;
  const categoryId = normalizeUuidOrNull(params?.categoryId);
  const providerTypeId = normalizeUuidOrNull(params?.providerTypeId);
  const country = normalizeOptionalText(params?.country);
  const city = normalizeOptionalText(params?.city);

  const [resultRows, categoryRows, filterRows] = await Promise.all([
    sql<SearchResultRow[]>`
      WITH params AS (
        SELECT
          NULLIF(BTRIM(${term}::text), '') AS q,
          ${likeTerm}::text AS like_q,
          ${normalizedLocale}::text AS locale,
          ${categoryId}::uuid AS category_id,
          ${providerTypeId}::uuid AS provider_type_id,
          NULLIF(BTRIM(${country}::text), '') AS country,
          NULLIF(BTRIM(${city}::text), '') AS city
      ),
      service_results AS (
        SELECT
          ps.id::text AS id,
          'service'::text AS type,
          COALESCE(
            NULLIF(common.get_translation_t(ps.display_name_translations, params.locale, 'en-US'), ''),
            common.get_translation_t(sd.name_translations, params.locale, 'en-US')
          ) AS name,
          common.get_translation_t(sp.name_translations, params.locale, 'en-US') AS provider,
          COALESCE(
            CASE
              WHEN BTRIM(split_part(ps.image_url, ',', 1)) ~* ${uuidPattern}
              THEN ps_media.file_url
              ELSE NULLIF(BTRIM(split_part(ps.image_url, ',', 1)), '')
            END,
            NULLIF(BTRIM(primary_gallery.url), ''),
            CASE
              WHEN BTRIM(split_part(sp.image_url, ',', 1)) ~* ${uuidPattern}
              THEN sp_media.file_url
              ELSE NULLIF(BTRIM(split_part(sp.image_url, ',', 1)), '')
            END,
            CASE
              WHEN BTRIM(split_part(c.image_url, ',', 1)) ~* ${uuidPattern}
              THEN c_media.file_url
              ELSE NULLIF(BTRIM(split_part(c.image_url, ',', 1)), '')
            END
          ) AS image,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          COALESCE(ps.rating, sp.rating, 0)::float8 AS rating,
          COALESCE(ps.review_count, sp.review_count, 0)::int AS reviews,
          ps.value::float8 AS price,
          NULL::float8 AS original_price,
          ps.currency AS currency,
          COALESCE(sp.accredited, false) AS verified,
          COALESCE(ps.tags, sp.specialties, ARRAY[]::text[]) AS specialties,
          ARRAY_REMOVE(ARRAY[
            NULLIF(common.get_translation_t(c.name_translations, params.locale, 'en-US'), ''),
            NULLIF(common.get_translation_t(pt.name_translations, params.locale, 'en-US'), ''),
            CASE WHEN sp.is_sponsored THEN COALESCE(NULLIF(BTRIM(sp.sponsored_tag), ''), ${labels.sponsored}) END,
            CASE WHEN sp.accredited THEN ${labels.verified} END
          ], NULL) AS tags,
          CONCAT('/n/app/mobile/service/', ps.id::text) AS href,
          (
            CASE WHEN params.q IS NULL THEN 0 ELSE
              ts_rank_cd(
                COALESCE(ps.search_vector, to_tsvector('simple', COALESCE(common.get_translation_t(ps.display_name_translations, params.locale, 'en-US'), ''))),
                plainto_tsquery('simple', params.q)
              )
            END
            + COALESCE(ps.trending_score, 0)::float8 / 100
            + COALESCE(ps.rating, sp.rating, 0)::float8 / 10
          ) AS rank_score
        FROM category.provider_services ps
        JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
        JOIN category.categories c ON c.id = sd.category_id
        JOIN category.service_providers sp ON sp.id = ps.service_provider_id
        JOIN category.provider_types pt ON pt.id = sp.provider_type_id
        CROSS JOIN params
        LEFT JOIN media.media_library ps_media
          ON ps_media.id = CASE
            WHEN BTRIM(split_part(ps.image_url, ',', 1)) ~* ${uuidPattern}
            THEN BTRIM(split_part(ps.image_url, ',', 1))::uuid
            ELSE NULL
          END
        LEFT JOIN media.media_library sp_media
          ON sp_media.id = CASE
            WHEN BTRIM(split_part(sp.image_url, ',', 1)) ~* ${uuidPattern}
            THEN BTRIM(split_part(sp.image_url, ',', 1))::uuid
            ELSE NULL
          END
        LEFT JOIN media.media_library c_media
          ON c_media.id = CASE
            WHEN BTRIM(split_part(c.image_url, ',', 1)) ~* ${uuidPattern}
            THEN BTRIM(split_part(c.image_url, ',', 1))::uuid
            ELSE NULL
          END
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            gml.file_url,
            CASE
              WHEN BTRIM(split_part(psgi.url, ',', 1)) ~* ${uuidPattern} THEN NULL
              ELSE NULLIF(BTRIM(split_part(psgi.url, ',', 1)), '')
            END
          ) AS url
          FROM category.provider_service_gallery_items psgi
          LEFT JOIN media.media_library gml
            ON gml.id = CASE
              WHEN BTRIM(split_part(psgi.url, ',', 1)) ~* ${uuidPattern}
              THEN BTRIM(split_part(psgi.url, ',', 1))::uuid
              ELSE NULL
            END
          WHERE psgi.provider_service_id = ps.id
          ORDER BY psgi.is_primary DESC, psgi.display_order ASC, psgi.create_date DESC
          LIMIT 1
        ) primary_gallery ON true
        WHERE ps.is_active = true
          AND sd.is_active = true
          AND c.is_active = true
          AND sp.is_active = true
          AND (params.category_id IS NULL OR c.id = params.category_id)
          AND (params.provider_type_id IS NULL OR pt.id = params.provider_type_id)
          AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
          AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
          AND (
            params.q IS NULL
            OR common.get_translation_t(ps.display_name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(ps.description_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(sd.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(sd.description_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(c.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(c.description_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(sp.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(sp.description_translations, params.locale, 'en-US') ILIKE params.like_q
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(ps.display_name_translations) = 'object' THEN ps.display_name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(ps.description_translations) = 'object' THEN ps.description_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sd.name_translations) = 'object' THEN sd.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sd.description_translations) = 'object' THEN sd.description_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(c.name_translations) = 'object' THEN c.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(c.description_translations) = 'object' THEN c.description_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sp.name_translations) = 'object' THEN sp.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sp.description_translations) = 'object' THEN sp.description_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR COALESCE(ps.search_vector, to_tsvector('simple', '')) @@ plainto_tsquery('simple', params.q)
            OR COALESCE(sp.search_vector, to_tsvector('simple', '')) @@ plainto_tsquery('simple', params.q)
            OR EXISTS (
              SELECT 1 FROM unnest(COALESCE(ps.tags, sp.specialties, ARRAY[]::text[])) AS tag
              WHERE tag ILIKE params.like_q
            )
          )
      ),
      provider_results AS (
        SELECT
          sp.id::text AS id,
          'provider'::text AS type,
          common.get_translation_t(sp.name_translations, params.locale, 'en-US') AS name,
          common.get_translation_t(pt.name_translations, params.locale, 'en-US') AS provider,
          COALESCE(
            CASE
              WHEN BTRIM(split_part(sp.image_url, ',', 1)) ~* ${uuidPattern}
              THEN sp_media.file_url
              ELSE NULLIF(BTRIM(split_part(sp.image_url, ',', 1)), '')
            END,
            NULLIF(BTRIM(provider_gallery.url), '')
          ) AS image,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          COALESCE(sp.rating, 0)::float8 AS rating,
          COALESCE(sp.review_count, 0)::int AS reviews,
          COALESCE(min_service.minimum_price, 0)::float8 AS price,
          NULL::float8 AS original_price,
          COALESCE(min_service.currency, 'USD') AS currency,
          COALESCE(sp.accredited, false) AS verified,
          COALESCE(sp.specialties, ARRAY[]::text[]) AS specialties,
          ARRAY_REMOVE(ARRAY[
            NULLIF(common.get_translation_t(pt.name_translations, params.locale, 'en-US'), ''),
            CASE WHEN sp.is_sponsored THEN COALESCE(NULLIF(BTRIM(sp.sponsored_tag), ''), ${labels.sponsored}) END,
            CASE WHEN sp.accredited THEN ${labels.verified} END
          ], NULL) AS tags,
          CONCAT('/n/app/mobile/provider/', sp.id::text) AS href,
          (
            CASE WHEN params.q IS NULL THEN 0 ELSE
              ts_rank_cd(
                COALESCE(sp.search_vector, to_tsvector('simple', COALESCE(common.get_translation_t(sp.name_translations, params.locale, 'en-US'), ''))),
                plainto_tsquery('simple', params.q)
              )
            END
            + COALESCE(sp.featured_score, 0)::float8 / 100
            + COALESCE(sp.rating, 0)::float8 / 10
          ) AS rank_score
        FROM category.service_providers sp
        JOIN category.provider_types pt ON pt.id = sp.provider_type_id
        CROSS JOIN params
        LEFT JOIN media.media_library sp_media
          ON sp_media.id = CASE
            WHEN BTRIM(split_part(sp.image_url, ',', 1)) ~* ${uuidPattern}
            THEN BTRIM(split_part(sp.image_url, ',', 1))::uuid
            ELSE NULL
          END
        LEFT JOIN LATERAL (
          SELECT ps.value AS minimum_price, ps.currency
          FROM category.provider_services ps
          JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
          WHERE ps.service_provider_id = sp.id
            AND ps.is_active = true
            AND sd.is_active = true
            AND (params.category_id IS NULL OR sd.category_id = params.category_id)
          ORDER BY ps.value ASC NULLS LAST
          LIMIT 1
        ) min_service ON true
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            pgml.file_url,
            CASE
              WHEN BTRIM(split_part(pgi.url, ',', 1)) ~* ${uuidPattern} THEN NULL
              ELSE NULLIF(BTRIM(split_part(pgi.url, ',', 1)), '')
            END
          ) AS url
          FROM category.provider_gallery_items pgi
          LEFT JOIN media.media_library pgml
            ON pgml.id = CASE
              WHEN BTRIM(split_part(pgi.url, ',', 1)) ~* ${uuidPattern}
              THEN BTRIM(split_part(pgi.url, ',', 1))::uuid
              ELSE NULL
            END
          WHERE pgi.service_provider_id = sp.id
          ORDER BY pgi.display_order ASC, pgi.create_date DESC
          LIMIT 1
        ) provider_gallery ON true
        WHERE sp.is_active = true
          AND (params.provider_type_id IS NULL OR pt.id = params.provider_type_id)
          AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
          AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
          AND min_service.minimum_price IS NOT NULL
          AND (
            params.q IS NULL
            OR common.get_translation_t(sp.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(sp.description_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(pt.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(pt.description_translations, params.locale, 'en-US') ILIKE params.like_q
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sp.name_translations) = 'object' THEN sp.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sp.description_translations) = 'object' THEN sp.description_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(pt.name_translations) = 'object' THEN pt.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(pt.description_translations) = 'object' THEN pt.description_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR COALESCE(sp.search_vector, to_tsvector('simple', '')) @@ plainto_tsquery('simple', params.q)
            OR EXISTS (
              SELECT 1 FROM unnest(COALESCE(sp.specialties, ARRAY[]::text[])) AS specialty
              WHERE specialty ILIKE params.like_q
            )
          )
      ),
      specialist_results AS (
        SELECT
          staff.id::text AS id,
          'specialist'::text AS type,
          common.get_translation_t(staff.name_translations, params.locale, 'en-US') AS name,
          common.get_translation_t(sp.name_translations, params.locale, 'en-US') AS provider,
          COALESCE(
            NULLIF(BTRIM(staff_profile_media.file_url), ''),
            CASE
              WHEN NULLIF(BTRIM(staff.profile_image_url), '') IS NOT NULL
                AND NULLIF(BTRIM(staff.profile_image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN NULLIF(BTRIM(staff.profile_image_url), '')
            END,
            NULLIF(BTRIM(staff_gallery.url), '')
          ) AS image,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          COALESCE(staff.rating, 0)::float8 AS rating,
          COALESCE(staff.review_count, 0)::int AS reviews,
          COALESCE(staff.consultation_fee, 0)::float8 AS price,
          NULL::float8 AS original_price,
          COALESCE(service_price.currency, 'USD') AS currency,
          true AS verified,
          ARRAY_REMOVE(ARRAY[NULLIF(COALESCE(staff.specialty, common.get_translation_t(staff.specialty_translations, params.locale, 'en-US')), '')], NULL) AS specialties,
          ARRAY_REMOVE(ARRAY[
            NULLIF(common.get_translation_t(staff.title_translations, params.locale, 'en-US'), ''),
            NULLIF(common.get_translation_t(sp.name_translations, params.locale, 'en-US'), '')
          ], NULL) AS tags,
          CONCAT('/n/app/mobile/specialist/', staff.id::text) AS href,
          (COALESCE(staff.rating, 0)::float8 / 10) AS rank_score
        FROM category.staff staff
        JOIN category.provider_staffs psf ON psf.staff_id = staff.id AND psf.is_active = true
        JOIN category.service_providers sp ON sp.id = psf.service_provider_id AND sp.is_active = true
        JOIN category.provider_types pt ON pt.id = sp.provider_type_id
        CROSS JOIN params
        LEFT JOIN media.media_library staff_profile_media
          ON staff_profile_media.id::text = NULLIF(BTRIM(staff.profile_image_url), '')
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            NULLIF(BTRIM(staff_gallery_media.file_url), ''),
            CASE
              WHEN NULLIF(BTRIM(sgi.url), '') IS NOT NULL
                AND NULLIF(BTRIM(sgi.url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN NULLIF(BTRIM(sgi.url), '')
            END
          ) AS url
          FROM category.staff_gallery_items sgi
          LEFT JOIN media.media_library staff_gallery_media
            ON staff_gallery_media.id::text = NULLIF(BTRIM(sgi.url), '')
          WHERE sgi.staff_id = staff.id
            AND COALESCE(NULLIF(BTRIM(sgi.media_type), ''), 'image') = 'image'
          ORDER BY sgi.is_primary DESC, sgi.display_order ASC, sgi.create_date DESC
          LIMIT 1
        ) staff_gallery ON true
        LEFT JOIN LATERAL (
          SELECT ps.currency
          FROM category.provider_services ps
          JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
          WHERE ps.service_provider_id = sp.id
            AND ps.is_active = true
            AND sd.is_active = true
            AND (params.category_id IS NULL OR sd.category_id = params.category_id)
          ORDER BY ps.value ASC NULLS LAST
          LIMIT 1
        ) service_price ON true
        WHERE staff.is_active = true
          AND (params.provider_type_id IS NULL OR pt.id = params.provider_type_id)
          AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
          AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
          AND (
            params.q IS NULL
            OR common.get_translation_t(staff.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(staff.title_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(staff.biography_translations, params.locale, 'en-US') ILIKE params.like_q
            OR common.get_translation_t(staff.specialty_translations, params.locale, 'en-US') ILIKE params.like_q
            OR staff.specialty ILIKE params.like_q
            OR common.get_translation_t(sp.name_translations, params.locale, 'en-US') ILIKE params.like_q
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(staff.name_translations) = 'object' THEN staff.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(staff.title_translations) = 'object' THEN staff.title_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(staff.biography_translations) = 'object' THEN staff.biography_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(staff.specialty_translations) = 'object' THEN staff.specialty_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
            OR EXISTS (
              SELECT 1
              FROM jsonb_each_text(CASE WHEN jsonb_typeof(sp.name_translations) = 'object' THEN sp.name_translations ELSE '{}'::jsonb END) AS translated(locale_key, translated_value)
              WHERE translated.translated_value ILIKE params.like_q
            )
          )
      )
      SELECT *
      FROM (
        SELECT * FROM service_results
        UNION ALL
        SELECT * FROM provider_results
        UNION ALL
        SELECT * FROM specialist_results
      ) results
      ORDER BY rank_score DESC, rating DESC NULLS LAST, reviews DESC NULLS LAST, name ASC
      LIMIT ${limit};
    `,
    sql<SearchCategoryRow[]>`
      WITH params AS (
        SELECT
          ${normalizedLocale}::text AS locale,
          ${providerTypeId}::uuid AS provider_type_id,
          NULLIF(BTRIM(${country}::text), '') AS country,
          NULLIF(BTRIM(${city}::text), '') AS city
      )
      SELECT
        c.id::text AS id,
        common.get_translation_t(c.name_translations, params.locale, 'en-US') AS label,
        COUNT(DISTINCT ps.id)::int AS count
      FROM category.categories c
      JOIN category.service_definitions sd ON sd.category_id = c.id AND sd.is_active = true
      JOIN category.provider_services ps ON ps.service_definition_id = sd.id AND ps.is_active = true
      JOIN category.service_providers sp ON sp.id = ps.service_provider_id AND sp.is_active = true
      CROSS JOIN params
      WHERE c.is_active = true
        AND (params.provider_type_id IS NULL OR sp.provider_type_id = params.provider_type_id)
        AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
        AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
      GROUP BY c.id, c.name_translations, c.display_order, params.locale
      ORDER BY count DESC, c.display_order ASC, label ASC
      LIMIT 12;
    `,
    sql<SearchFilterRow[]>`
      WITH params AS (
        SELECT
          ${normalizedLocale}::text AS locale,
          ${categoryId}::uuid AS category_id,
          NULLIF(BTRIM(${country}::text), '') AS country,
          NULLIF(BTRIM(${city}::text), '') AS city
      )
      SELECT
        pt.id::text AS id,
        common.get_translation_t(pt.name_translations, params.locale, 'en-US') AS label,
        COUNT(DISTINCT sp.id)::int AS count
      FROM category.provider_types pt
      JOIN category.service_providers sp ON sp.provider_type_id = pt.id AND sp.is_active = true
      JOIN category.provider_services ps ON ps.service_provider_id = sp.id AND ps.is_active = true
      JOIN category.service_definitions sd ON sd.id = ps.service_definition_id AND sd.is_active = true
      CROSS JOIN params
      WHERE pt.is_active = true
        AND (params.category_id IS NULL OR sd.category_id = params.category_id)
        AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
        AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
      GROUP BY pt.id, pt.name_translations, params.locale
      ORDER BY count DESC, label ASC
      LIMIT 12;
    `,
  ]);

  const results: SearchResultsItem[] = resultRows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name || labels.untitled,
    provider: row.provider || labels.defaultProvider,
    image: row.image || "",
    location: row.location || "",
    rating: toNumber(row.rating),
    reviews: toNumber(row.reviews),
    price: toNumber(row.price),
    originalPrice: row.original_price === null ? null : toNumber(row.original_price),
    currency: row.currency || "USD",
    verified: Boolean(row.verified),
    specialties: cleanArray(row.specialties),
    tags: cleanArray(row.tags),
    href: row.href,
  }));

  const categories: SearchResultsCategory[] = categoryRows.map((row) => ({
    id: row.id,
    label: row.label || labels.category,
    count: toNumber(row.count),
  }));

  const filters: SearchResultsFilter[] = filterRows.map((row) => ({
    id: row.id,
    label: row.label || labels.providerType,
    count: toNumber(row.count),
  }));

  return { results, categories, filters };
}
