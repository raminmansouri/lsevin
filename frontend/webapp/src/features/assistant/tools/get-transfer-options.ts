import "server-only";

import { z } from "zod";

import sql from "@/config/database/db";

import type { AssistantServiceResult } from "../types";

export const GET_TRANSFER_OPTIONS_DESCRIPTION =
  "Find transfer services on LSevin in one city: airport pickups and rides between the airport, hotels and clinics. " +
  "Each result is a bookable transfer route (from → to, vehicle type) with its price and a link to book it. " +
  "Use it when the user travels from another city or country for a treatment, asks how to get to the clinic or hotel, " +
  "or asks about airport pickup. Prices are in the provider's own currency; never invent or convert them.";

export const getTransferOptionsInputSchema = z.object({
  city: z.string().min(1).describe("City, in English (e.g. 'shiraz'), usually the city of the clinic."),
  keyword: z
    .string()
    .optional()
    .describe("Optional word to match in the route, e.g. 'airport' or 'فرودگاه'."),
  limit: z.number().int().min(1).max(10).optional().describe("How many routes to return (default 5)."),
});

export type GetTransferOptionsInput = z.infer<typeof getTransferOptionsInputSchema>;

type TransferRow = {
  providerServiceId: string;
  fromText: string | null;
  toText: string | null;
  vehicleType: string | null;
  providerName: string | null;
  city: string | null;
  country: string | null;
  price: string | number | null;
  currency: string | null;
  image: string | null;
};

const toCitySlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function getTransferOptions(
  input: GetTransferOptionsInput,
  storedLocale: string
): Promise<{ count: number; results: AssistantServiceResult[] }> {
  const city = toCitySlug(input.city);
  if (!city) return { count: 0, results: [] };

  const keyword = input.keyword?.trim();
  const like = keyword ? `%${keyword}%` : null;

  const rows = await sql<TransferRow[]>`
    select
      r.provider_service_id::text as "providerServiceId",
      common.get_translation_t(r.from_translations, ${storedLocale}, 'en-US') as "fromText",
      common.get_translation_t(r.to_translations, ${storedLocale}, 'en-US') as "toText",
      r.vehicle_type as "vehicleType",
      common.get_translation_t(sp.name_translations, ${storedLocale}, 'en-US') as "providerName",
      sp.city,
      sp.country,
      ps.value as price,
      ps.currency,
      coalesce(nullif(ps.image_url, ''), nullif(sp.image_url, '')) as image
    from transfer.routes r
    join category.provider_services ps on ps.id = r.provider_service_id and ps.is_active = true
    join category.service_providers sp on sp.id = r.service_provider_id
    where regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g') = ${city}
      and (
        ${like}::text is null
        or r.from_translations::text ilike ${like}
        or r.to_translations::text ilike ${like}
      )
    order by ps.value asc nulls last
    limit ${input.limit ?? 5}
  `;

  const results = rows.map((row) => ({
    id: row.providerServiceId,
    type: "transfer" as const,
    name: [row.fromText, row.toText].filter(Boolean).join(" → ") || "Transfer",
    provider: [row.providerName, row.vehicleType].filter(Boolean).join(" · "),
    location: [row.city, row.country].filter(Boolean).join(", "),
    rating: 0,
    reviews: 0,
    price: Number(row.price ?? 0),
    currency: row.currency ?? "IRR",
    image: row.image ?? "",
    href: `/n/app/mobile/service/${row.providerServiceId}`,
  }));

  return { count: results.length, results };
}