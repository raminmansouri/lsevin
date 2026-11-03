import "server-only";

import sql from "@/config/database/db";
import { resolveDisplayPrice } from "@/features/finance/lib/server/toman-price";

import type { SearchHotelsToolOutput } from "../types";
import { toCitySlug } from "./assistant-search.repository";

const uuidPattern = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type HotelRow = {
  id: string;
  hotel: string | null;
  room: string | null;
  location: string;
  rating: number | null;
  reviews: number | null;
  price: number | null;
  currency: string | null;
  value_toman: number | null;
  image: string | null;
  total: number;
};

const toNumber = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * Hotels listed on LSevin: providers of the "Accommodations" type, plus any provider with a
 * nightly-priced service (booking_ui_mode 'date_range'). Many hotels list their rooms as ordinary
 * services, so the type is what finds most of them. One card per hotel, for its cheapest room
 * (nightly rooms first, then priced ones).
 * With check-in and nights, hotels with any of those nights taken (provider_portal.hotel_date_availability)
 * are left out.
 */
export async function searchAssistantHotels(input: {
  city: string;
  checkIn?: string | null;
  nights?: number | null;
  locale: string;
  isIranianVisitor: boolean;
  limit: number;
}): Promise<SearchHotelsToolOutput> {
  const city = toCitySlug(input.city);
  if (!city) return { hotelCount: 0, checkIn: null, nights: null, results: [] };

  const checkIn = input.checkIn && ISO_DATE.test(input.checkIn) ? input.checkIn : null;
  const nights = checkIn ? Math.max(1, Math.min(input.nights ?? 1, 60)) : null;

  const rows = await sql<HotelRow[]>`
    WITH hotel_rooms AS (
      SELECT DISTINCT ON (sp.id)
        ps.id, sp.id AS provider_id,
        COALESCE(sp.rating, 0)::float8 AS rating,
        COALESCE(sp.review_count, 0)::int AS reviews
      FROM category.provider_services ps
      JOIN category.service_definitions sd ON sd.id = ps.service_definition_id AND sd.is_active = true
      JOIN category.service_providers sp ON sp.id = ps.service_provider_id AND sp.is_active = true
      JOIN category.provider_types pt ON pt.id = sp.provider_type_id
      WHERE ps.is_active = true
        AND (
          sd.booking_ui_mode = 'date_range'
          OR EXISTS (
            SELECT 1 FROM jsonb_each_text(CASE WHEN jsonb_typeof(pt.name_translations) = 'object'
              THEN pt.name_translations ELSE '{}'::jsonb END) ptn
            WHERE ptn.value ILIKE '%accommodation%' OR ptn.value ILIKE '%hotel%' OR ptn.value LIKE '%اقامتگاه%'
          )
        )
        AND (
          regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g') = ${city}
          OR (
            length(regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g')) >= 7
            AND ${city}::text LIKE regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g') || '%'
          )
        )
        AND (
          ${checkIn}::date IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM provider_portal.hotel_date_availability hda
            WHERE hda.service_provider_id = sp.id
              AND hda.stay_date >= ${checkIn}::date
              AND hda.stay_date < ${checkIn}::date + ${nights}::int
          )
        )
      ORDER BY sp.id, (sd.booking_ui_mode = 'date_range') DESC, (ps.value > 0) DESC, ps.value ASC
    ),
    ranked AS (
      SELECT h.*, COUNT(*) OVER ()::int AS total
      FROM hotel_rooms h
      ORDER BY h.rating * ln(2 + h.reviews) DESC, h.reviews DESC
      LIMIT ${input.limit}
    )
    SELECT
      ps.id::text AS id,
      common.get_translation_t(sp.name_translations, ${input.locale}::text, 'en-US') AS hotel,
      COALESCE(
        NULLIF(common.get_translation_t(ps.display_name_translations, ${input.locale}::text, 'en-US'), ''),
        common.get_translation_t(sd.name_translations, ${input.locale}::text, 'en-US')
      ) AS room,
      CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
      r.rating,
      r.reviews,
      ps.value::float8 AS price,
      ps.currency,
      ps.value_toman::float8 AS value_toman,
      (
        SELECT CASE
          WHEN BTRIM(split_part(src.url, ',', 1)) ~* ${uuidPattern} THEN (
            SELECT NULLIF(BTRIM(ml.file_url), '') FROM media.media_library ml
            WHERE ml.id = BTRIM(split_part(src.url, ',', 1))::uuid
          )
          ELSE NULLIF(BTRIM(split_part(src.url, ',', 1)), '')
        END
        FROM (
          SELECT ps.image_url AS url, 1 AS ord
          UNION ALL
          SELECT sp.image_url, 2
          UNION ALL
          (SELECT g.url, 3 FROM category.provider_service_gallery_items g
           WHERE g.provider_service_id = ps.id
           ORDER BY g.is_primary DESC, g.display_order ASC LIMIT 1)
        ) src
        WHERE NULLIF(BTRIM(src.url), '') IS NOT NULL
        ORDER BY src.ord
        LIMIT 1
      ) AS image,
      r.total
    FROM ranked r
    JOIN category.provider_services ps ON ps.id = r.id
    JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
    JOIN category.service_providers sp ON sp.id = ps.service_provider_id
    ORDER BY r.rating * ln(2 + r.reviews) DESC, r.reviews DESC
  `;

  return {
    hotelCount: rows[0]?.total ?? 0,
    checkIn,
    nights,
    results: rows.map((row) => {
      const price = resolveDisplayPrice(
        { value: toNumber(row.price), currency: row.currency || "USD" },
        row.value_toman,
        input.isIranianVisitor
      );
      return {
        id: row.id,
        type: "hotel" as const,
        name: row.hotel || "",
        provider: row.room || "",
        location: row.location || "",
        rating: toNumber(row.rating),
        reviews: toNumber(row.reviews),
        price: price.value,
        currency: price.currency,
        image: row.image || "",
        href: `/n/app/mobile/service/${row.id}`,
      };
    }),
  };
}
