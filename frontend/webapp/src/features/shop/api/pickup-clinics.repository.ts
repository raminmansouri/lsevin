import "server-only";

import sql from "@/config/database/db";

/**
 * A partner seller's (clinic's) contact details for Lsevin staff collecting its items: name,
 * address, phone and weekly opening hours, read live from the provider (category.service_providers
 * and provider_portal.provider_operating_hours) so a changed address shows everywhere.
 * Never shown to customers: Lsevin sends every order.
 * The address is built the same way as on "my bookings" (street, detail, city, country, zip).
 */

export type ClinicOpeningHours = {
  /** ISO weekday: 1 = Monday ... 7 = Sunday. */
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type PickupClinic = {
  sellerId: string;
  sellerSlug: string | null;
  serviceProviderId: string | null;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: ClinicOpeningHours[];
};

type ClinicRow = {
  sellerId: string;
  sellerSlug: string | null;
  serviceProviderId: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: ClinicOpeningHours[] | null;
};

export async function getPickupClinics(sellerIds: string[], locale: string): Promise<Map<string, PickupClinic>> {
  const ids = [...new Set(sellerIds.filter(Boolean))];
  const out = new Map<string, PickupClinic>();
  if (!ids.length) return out;
  const lang = locale.split("-")[0] || "fa";
  const rows = await sql<ClinicRow[]>`
    select s.id::text as "sellerId", s.slug as "sellerSlug", sp.id::text as "serviceProviderId",
      coalesce(nullif(common.get_translation_t(sp.name_translations, ${lang}, 'en'), ''),
               nullif(common.get_translation_t(s.name_translations, ${lang}, 'en'), '')) as name,
      nullif(concat_ws(', ',
        nullif(common.get_translation_t(sp.street_translations, ${lang}, 'en'), ''),
        nullif(common.get_translation_t(sp.detail_translations, ${lang}, 'en'), ''),
        nullif(sp.city, ''),
        nullif(sp.country, ''),
        nullif(sp.zip_code, '')), '') as address,
      nullif(sp.city, '') as city,
      coalesce(nullif(concat_ws('', sp.phone_number_country_code, sp.phone_number), ''), nullif(s.phone, '')) as phone,
      sp.latitude::float as latitude, sp.longitude::float as longitude,
      (select coalesce(json_agg(json_build_object(
                'dayOfWeek', oh.day_of_week, 'opensAt', to_char(oh.opens_at, 'HH24:MI'),
                'closesAt', to_char(oh.closes_at, 'HH24:MI'), 'isClosed', oh.is_closed)
              order by oh.day_of_week), '[]'::json)
         from provider_portal.provider_operating_hours oh
        where oh.service_provider_id = sp.id) as "openingHours"
    from shop.sellers s
    left join category.service_providers sp on sp.id = s.service_provider_id
    where s.id::text = any(${ids})
  `;
  for (const row of rows) {
    out.set(row.sellerId, {
      sellerId: row.sellerId,
      sellerSlug: row.sellerSlug,
      serviceProviderId: row.serviceProviderId,
      name: row.name ?? "",
      address: row.address,
      city: row.city,
      phone: row.phone,
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude),
      openingHours: (row.openingHours ?? []).map((h) => ({
        dayOfWeek: Number(h.dayOfWeek),
        opensAt: h.opensAt ?? null,
        closesAt: h.closesAt ?? null,
        isClosed: Boolean(h.isClosed),
      })),
    });
  }
  return out;
}
