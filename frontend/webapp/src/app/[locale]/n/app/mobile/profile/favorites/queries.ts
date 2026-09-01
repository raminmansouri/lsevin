import sharedSql from "@/config/database/db";

import type { FavoriteCard, FavoritesPageData, FavoritesTabId } from "./types";
import { buildFavoriteTabs, clampRating, normalizeImageUrl } from "./utils";

// Every caller used to build its own `postgres()` client here — a fresh
// connection pool per server action, none of which was ever `.end()`ed. Under
// load that leaks pools until PgBouncer's max_client_conn is reached. The shared
// client in @/config/database/db is the single pool for the whole process and
// already reads DATABASE_URL (which points at PgBouncer in production), so it is
// also the only place where pooling and prepare settings have to stay correct.
export function createFavoritesSqlClient() {
  return sharedSql;
}

export async function resolveCustomerIdOrThrow(
  sql: ReturnType<typeof createFavoritesSqlClient>,
  userId: string
): Promise<string> {
  const exact = await sql<{ id: string }[]>`
    SELECT id
    FROM customer.customers
    WHERE id = ${userId}::uuid
    LIMIT 1
  `;

  if (exact.length > 0) {
    return exact[0].id;
  }

  const matched = await sql<{ id: string }[]>`
    SELECT c.id
    FROM identity.asp_net_users u
    JOIN customer.customers c
      ON (
        lower(c.email) = lower(u.email)
        OR (
          c.phone_number = u.phone_number
          AND c.phone_number_country_code = u.phone_number_country_code
        )
      )
    WHERE u.id = ${userId}::uuid
    ORDER BY CASE WHEN lower(c.email) = lower(u.email) THEN 0 ELSE 1 END
    LIMIT 1
  `;

  if (matched.length > 0) {
    return matched[0].id;
  }

  throw new Error(
    "No matching customer record was found for the signed-in user."
  );
}

function sqlForProviderTab(providerTypeSql: string) {
  return `
    CASE
      WHEN lower(coalesce(${providerTypeSql}, '')) ~ '(salon|spa|beauty)' THEN 'salon'
      WHEN lower(coalesce(${providerTypeSql}, '')) ~ '(gym|fitness|wellness|club|sport)' THEN 'gym'
      ELSE 'clinic'
    END
  `;
}

export async function getFavoritesPageData(
  sql: ReturnType<typeof createFavoritesSqlClient>,
  userId: string,
  preferredLanguage = "en"
): Promise<FavoritesPageData> {
  const customerId = await resolveCustomerIdOrThrow(sql, userId);

  const rows = await sql<{
    favorite_id: string;
    entity_id: string;
    favorite_type: FavoriteCard["favoriteType"];
    tab_id: FavoritesTabId;
    name: string;
    location: string | null;
    rating: string | number | null;
    reviews: number | null;
    image_url: string | null;
    specialty: string | null;
    provider_type_label: string | null;
    created_at: string;
  }[]>`
    WITH favorite_items AS (
      SELECT
        f.id::text AS favorite_id,
        sp.id::text AS entity_id,
        'provider'::text AS favorite_type,
        ${sql.unsafe(sqlForProviderTab("common.get_translation_t(pt.name_translations, $1, 'en')"))} AS tab_id,
        common.get_translation_t(sp.name_translations, ${preferredLanguage}, 'en') AS name,
        CONCAT_WS(', ', NULLIF(sp.city, ''), NULLIF(sp.country, '')) AS location,
        sp.rating AS rating,
        sp.review_count AS reviews,
        NULLIF(sp.image_url, '') AS image_url,
        NULL::text AS specialty,
        common.get_translation_t(pt.name_translations, ${preferredLanguage}, 'en') AS provider_type_label,
        f.created_at AS created_at
      FROM customer.favorites f
      JOIN category.service_providers sp
        ON f.favorite_type = 'provider'
       AND f.entity_id = sp.id
      LEFT JOIN category.provider_types pt
        ON pt.id = sp.provider_type_id
      LEFT JOIN LATERAL (
        SELECT url
        FROM category.provider_gallery_items pgi
        WHERE pgi.service_provider_id = sp.id
        ORDER BY pgi.display_order ASC
        LIMIT 1
      ) provider_gallery ON TRUE
      WHERE f.customer_id = ${customerId}::uuid

      UNION ALL

      SELECT
        f.id::text AS favorite_id,
        ps.id::text AS entity_id,
        'service'::text AS favorite_type,
        ${sql.unsafe(sqlForProviderTab("common.get_translation_t(pt.name_translations, $1, 'en')"))} AS tab_id,
        common.get_translation_t(ps.display_name_translations, ${preferredLanguage}, 'en') AS name,
        CONCAT_WS(', ', NULLIF(sp.city, ''), NULLIF(sp.country, '')) AS location,
        ps.rating AS rating,
        ps.review_count AS reviews,
        COALESCE(NULLIF(ps.image_url, ''), service_gallery.url, NULLIF(sp.image_url, ''), provider_gallery.url) AS image_url,
        common.get_translation_t(sp.name_translations, ${preferredLanguage}, 'en') AS specialty,
        common.get_translation_t(pt.name_translations, ${preferredLanguage}, 'en') AS provider_type_label,
        f.created_at AS created_at
      FROM customer.favorites f
      JOIN category.provider_services ps
        ON f.favorite_type = 'service'
       AND f.entity_id = ps.id
      JOIN category.service_providers sp
        ON sp.id = ps.service_provider_id
      LEFT JOIN category.provider_types pt
        ON pt.id = sp.provider_type_id
      LEFT JOIN LATERAL (
        SELECT url
        FROM category.provider_service_gallery_items psgi
        WHERE psgi.provider_service_id = ps.id
        ORDER BY psgi.is_primary DESC, psgi.display_order ASC
        LIMIT 1
      ) service_gallery ON TRUE
      LEFT JOIN LATERAL (
        SELECT url
        FROM category.provider_gallery_items pgi
        WHERE pgi.service_provider_id = sp.id
        ORDER BY pgi.display_order ASC
        LIMIT 1
      ) provider_gallery ON TRUE
      WHERE f.customer_id = ${customerId}::uuid

      UNION ALL

      SELECT
        f.id::text AS favorite_id,
        st.id::text AS entity_id,
        'specialist'::text AS favorite_type,
        'doctor'::text AS tab_id,
        common.get_translation_t(st.name_translations, ${preferredLanguage}, 'en') AS name,
        CONCAT_WS(', ', NULLIF(sp.city, ''), NULLIF(sp.country, '')) AS location,
        st.rating AS rating,
        st.review_count AS reviews,
        COALESCE(NULLIF(st.profile_image_url, ''), staff_gallery.url) AS image_url,
        COALESCE(
          NULLIF(common.get_translation_t(st.title_translations, ${preferredLanguage}, 'en'), ''),
          NULLIF(common.get_translation_t(st.specialty_translations, ${preferredLanguage}, 'en'), ''),
          NULLIF(st.specialty, '')
        ) AS specialty,
        common.get_translation_t(pt.name_translations, ${preferredLanguage}, 'en') AS provider_type_label,
        f.created_at AS created_at
      FROM customer.favorites f
      JOIN category.staff st
        ON f.favorite_type = 'specialist'
       AND f.entity_id = st.id
      LEFT JOIN LATERAL (
        SELECT pss.service_provider_id
        FROM category.provider_staffs pss
        WHERE pss.staff_id = st.id
        ORDER BY pss.is_active DESC, pss.create_date DESC NULLS LAST
        LIMIT 1
      ) first_provider ON TRUE
      LEFT JOIN category.service_providers sp
        ON sp.id = first_provider.service_provider_id
      LEFT JOIN category.provider_types pt
        ON pt.id = sp.provider_type_id
      LEFT JOIN LATERAL (
        SELECT url
        FROM category.staff_gallery_items sgi
        WHERE sgi.staff_id = st.id
        ORDER BY sgi.is_primary DESC, sgi.display_order ASC
        LIMIT 1
      ) staff_gallery ON TRUE
      WHERE f.customer_id = ${customerId}::uuid
    )
    SELECT *
    FROM favorite_items
    ORDER BY created_at DESC
  `;

  const favorites: FavoriteCard[] = rows.map((row) => ({
    favoriteId: row.favorite_id,
    entityId: row.entity_id,
    favoriteType: row.favorite_type,
    tabId: row.tab_id === "all" ? "clinic" : row.tab_id,
    name: row.name,
    location: row.location?.trim() || "Location unavailable",
    rating: clampRating(Number(row.rating ?? 0)),
    reviews: Number(row.reviews ?? 0),
    image: normalizeImageUrl(row.image_url),
    specialty: row.specialty,
    providerTypeLabel: row.provider_type_label,
    createdAt: row.created_at,
  }));

  return {
    favorites,
    tabs: buildFavoriteTabs(favorites),
  };
}

export async function removeFavorite(
  sql: ReturnType<typeof createFavoritesSqlClient>,
  userId: string,
  favoriteId: string
): Promise<boolean> {
  const customerId = await resolveCustomerIdOrThrow(sql, userId);

  const result = await sql<{ id: string }[]>`
    DELETE FROM customer.favorites
    WHERE id = ${favoriteId}::bigint
      AND customer_id = ${customerId}::uuid
    RETURNING id::text AS id
  `;

  return result.length > 0;
}
