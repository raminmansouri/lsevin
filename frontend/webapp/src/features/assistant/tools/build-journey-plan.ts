import "server-only";

import { z } from "zod";

import sql from "@/config/database/db";
import { convertMoney } from "@/features/finance/lib/server/currency-queries";
import { searchProducts } from "@/features/shop/api/catalog.repository";

import type { JourneyItem, JourneyPlan, JourneyStop } from "../types";
import { DISPLAY_CURRENCY } from "./search-products";

export const BUILD_JOURNEY_PLAN_DESCRIPTION =
  "Build the user's complete trip plan as a day-by-day timeline card: arrival transfer, hotel stay, treatment day, " +
  "recovery with aftercare products, and departure, with an estimated total in the user's currency and a book button per item. " +
  "Pass the ids the user chose from search_services (type service), search_hotels, get_transfer_options and search_products. " +
  "All prices are loaded and converted on the server; never invent prices. Only serviceId is required.";

const uuid = z.string().uuid();

export const buildJourneyPlanInputSchema = z.object({
  serviceId: uuid.describe("The treatment: id of a search_services result whose type is 'service'."),
  hotelServiceId: uuid.optional().describe("The hotel room: id of a search_hotels result."),
  nights: z.number().int().min(1).max(60).optional().describe("Hotel nights; base it on the treatment's recovery time."),
  checkIn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("Arrival date as YYYY-MM-DD, if the user said."),
  arrivalTransferId: uuid.optional().describe("Transfer on arrival: id of a get_transfer_options result."),
  departureTransferId: uuid.optional().describe("Transfer on departure: id of a get_transfer_options result."),
  productSlugs: z.array(z.string().min(1)).max(4).optional().describe("Aftercare products: ids of search_products results."),
});

export type BuildJourneyPlanInput = z.infer<typeof buildJourneyPlanInputSchema>;

type ServiceRow = {
  id: string;
  name: string | null;
  provider: string | null;
  city: string | null;
  price: string | number | null;
  currency: string | null;
};

async function loadServices(ids: string[], storedLocale: string): Promise<Map<string, ServiceRow>> {
  if (!ids.length) return new Map();
  const rows = await sql<ServiceRow[]>`
    select
      ps.id::text as id,
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${storedLocale}, 'en-US'), ''),
        common.get_translation_t(sd.name_translations, ${storedLocale}, 'en-US')
      ) as name,
      common.get_translation_t(sp.name_translations, ${storedLocale}, 'en-US') as provider,
      sp.city,
      ps.value as price,
      ps.currency
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    where ps.id = any(${ids})
  `;
  return new Map(rows.map((row) => [row.id, row]));
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function buildJourneyPlan(
  input: BuildJourneyPlanInput,
  options: { storedLocale: string; locale: string }
): Promise<{ found: false } | { found: true; plan: JourneyPlan }> {
  const lang = options.locale.slice(0, 2);
  const currency = DISPLAY_CURRENCY[lang] ?? "USD";

  const ids = [input.serviceId, input.hotelServiceId, input.arrivalTransferId, input.departureTransferId].filter(
    (id): id is string => Boolean(id)
  );
  const services = await loadServices(ids, options.storedLocale);
  const treatment = services.get(input.serviceId);
  if (!treatment) return { found: false };

  let totalIsPartial = false;
  const toPlanCurrency = async (amount: number, source: string | null): Promise<number> => {
    if (!amount || !source) {
      totalIsPartial = true; // price after consultation
      return 0;
    }
    try {
      const converted = await convertMoney({ amount, sourceCurrencyCode: source, targetCurrencyCode: currency });
      return Math.round(Number(converted.targetAmount));
    } catch {
      totalIsPartial = true;
      return 0;
    }
  };

  const serviceItem = async (
    row: ServiceRow,
    kind: JourneyItem["kind"],
    multiplier = 1
  ): Promise<JourneyItem> => ({
    kind,
    title: row.name ?? "",
    subtitle: [row.provider, row.city].filter(Boolean).join(" · "),
    price: (await toPlanCurrency(Number(row.price ?? 0), row.currency)) * multiplier,
    showPrice: true,
    href: `/n/app/mobile/service/${row.id}`,
  });

  const hotel = input.hotelServiceId ? services.get(input.hotelServiceId) : undefined;
  const arrivalTransfer = input.arrivalTransferId ? services.get(input.arrivalTransferId) : undefined;
  const departureTransfer = input.departureTransferId ? services.get(input.departureTransferId) : undefined;
  const nights = hotel ? input.nights ?? 3 : 0;

  // Aftercare products, priced by the shop directly in the plan currency.
  const productItems: JourneyItem[] = [];
  if (input.productSlugs?.length) {
    const { items } = await searchProducts(
      { slugs: input.productSlugs, pageSize: input.productSlugs.length },
      { locale: lang, displayCurrency: currency, cookieFree: true }
    );
    for (const product of items) {
      if (product.priceUnavailable) totalIsPartial = true;
      productItems.push({
        kind: "product",
        title: product.name,
        subtitle: product.brandName ?? "",
        price: product.priceUnavailable ? 0 : Math.round(product.price),
        showPrice: true,
        href: `/n/app/mobile/shop/product/${product.slug}`,
      });
    }
  }

  const dateFor = (day: number) => (input.checkIn ? addDays(input.checkIn, day - 1) : null);
  const stops: JourneyStop[] = [];

  const hasArrival = Boolean(hotel || arrivalTransfer);
  const treatmentDay = hasArrival ? 2 : 1;
  const departureDay = hotel ? 1 + nights : treatmentDay;

  if (hasArrival) {
    const items: JourneyItem[] = [];
    if (arrivalTransfer) items.push(await serviceItem(arrivalTransfer, "transfer"));
    if (hotel) items.push({ ...(await serviceItem(hotel, "hotel", nights)), nights });
    stops.push({ kind: "arrival", dayFrom: 1, dayTo: 1, date: dateFor(1), items });
  }

  stops.push({
    kind: "treatment",
    dayFrom: treatmentDay,
    dayTo: treatmentDay,
    date: dateFor(treatmentDay),
    items: [await serviceItem(treatment, "treatment")],
  });

  const recoveryFrom = treatmentDay + 1;
  const recoveryTo = departureDay - 1;
  if (recoveryTo >= recoveryFrom) {
    stops.push({ kind: "recovery", dayFrom: recoveryFrom, dayTo: recoveryTo, date: dateFor(recoveryFrom), items: productItems });
  } else if (productItems.length) {
    stops[stops.length - 1].items.push(...productItems);
  }

  if (hotel || departureTransfer) {
    const items: JourneyItem[] = [];
    if (hotel) {
      items.push({ kind: "hotel", title: hotel.name ?? "", subtitle: "", price: 0, showPrice: false, checkout: true, href: null });
    }
    if (departureTransfer) items.push(await serviceItem(departureTransfer, "transfer"));
    stops.push({ kind: "departure", dayFrom: departureDay, dayTo: departureDay, date: dateFor(departureDay), items });
  }

  const total = stops.flatMap((stop) => stop.items).reduce((sum, item) => sum + (item.showPrice ? item.price : 0), 0);

  return {
    found: true,
    plan: {
      title: [treatment.name, treatment.provider, treatment.city].filter(Boolean).join(" · "),
      currency,
      total,
      totalIsPartial,
      stops,
    },
  };
}