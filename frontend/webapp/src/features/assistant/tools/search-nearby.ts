import "server-only";

import { z } from "zod";

import sql from "@/config/database/db";

import { geocodePlace } from "../server/geocode";

export const SEARCH_NEARBY_DESCRIPTION =
  "Find LSevin providers (clinics, hospitals, salons, gyms, spas…) near a place, sorted by distance. " +
  "Use it whenever the user names a neighbourhood, street, square, landmark or address (\"in Vanak\", \"on Valiasr street\", " +
  "\"near Tajrish square\", \"within 3 km of Milad hospital\"), or gives coordinates. Pass the place exactly as the user wrote it " +
  "and the city if known. Optionally pass what they look for (e.g. \"dentist\", \"laser\", \"gym\") as query. " +
  "If the user says \"near me\" without a place, ask which neighbourhood or street they are in. Never invent providers or distances.";

export const searchNearbyInputSchema = z.object({
  place: z.string().max(200).optional().describe("Neighbourhood, street, square, landmark or address, as the user wrote it."),
  city: z.string().max(100).optional().describe("City of the place, if known (e.g. Tehran, Shiraz)."),
  latitude: z.number().min(-90).max(90).optional().describe("Use instead of place when coordinates are known."),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(0.2).max(50).optional().describe("Search radius in km. Default 5."),
  query: z.string().max(100).optional().describe("What they look for: a specialty, treatment or kind of place."),
  limit: z.number().int().min(1).max(10).optional(),
});

export type SearchNearbyInput = z.infer<typeof searchNearbyInputSchema>;

export async function searchNearby(input: SearchNearbyInput, storedLocale: string) {
  let center: { lat: number; lng: number; label: string } | null = null;
  if (input.latitude != null && input.longitude != null) {
    center = { lat: input.latitude, lng: input.longitude, label: input.place ?? "" };
  } else if (input.place) {
    center = await geocodePlace(input.place, input.city);
  }
  if (!center) return { found: false as const, reason: "place_not_found", place: input.place ?? null };

  const radiusKm = input.radiusKm ?? 5;
  const limit = input.limit ?? 8;
  const like = input.query?.trim() ? `%${input.query.trim()}%` : null;

  const distance = sql`(
    6371 * acos(least(1, greatest(-1,
      cos(radians(${center.lat})) * cos(radians(sp.latitude::float))
      * cos(radians(sp.longitude::float) - radians(${center.lng}))
      + sin(radians(${center.lat})) * sin(radians(sp.latitude::float))
    )))
  )`;

  const rows = await sql<
    { id: string; name: string; city: string | null; distanceKm: number; rating: number | null }[]
  >`
    select sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${storedLocale}, 'en-US') as name,
      sp.city,
      round(${distance}::numeric, 1)::float8 as "distanceKm",
      nullif(to_jsonb(sp)->>'rating', '')::float8 as rating
    from category.service_providers sp
    where sp.is_active
      and sp.latitude is not null and sp.longitude is not null
      and ${distance} <= ${radiusKm}
      and (${like}::text is null
        or exists (select 1 from jsonb_each_text(sp.name_translations) t where t.value ilike ${like})
        or exists (
          select 1 from category.provider_services ps
          join category.service_definitions sd on sd.id = ps.service_definition_id
          join lateral jsonb_each_text(sd.name_translations) n on true
          where ps.service_provider_id = sp.id and ps.is_active and n.value ilike ${like}
        ))
    order by ${distance} asc
    limit ${limit}
  `;

  return {
    found: rows.length > 0,
    center: { label: center.label, latitude: center.lat, longitude: center.lng },
    radiusKm,
    providers: rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      distanceKm: row.distanceKm,
      rating: row.rating,
      url: `/n/app/mobile/provider/${row.id}`,
    })),
  };
}