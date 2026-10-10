import "server-only";

import { z } from "zod";

import { getSearchResults } from "@/features/service-providers/server/search.repository";

import type { SearchServicesToolOutput } from "../types";

export const SEARCH_SERVICES_DESCRIPTION =
  "Search LSevin's catalogue: bookable medical, beauty and wellness services, clinics and doctors. " +
  "Use it whenever the user describes a treatment or service they want. " +
  "Returns real results (type: service, provider = clinic, specialist = doctor) with location, rating, price and a link. " +
  "Prices are in the provider's own currency; never invent or convert them. " +
  "A price of 0 means the price is given after consultation, not free. " +
  "If results are few or unrelated, retry with a shorter keyword or in Persian.";

export const searchServicesInputSchema = z.object({
  query: z
    .string()
    .describe("What the user is looking for, e.g. 'hair transplant' or 'کاشت مو'. Any language."),
  city: z.string().optional().describe("City to filter by, in English (e.g. 'tehran'), if the user mentioned one."),
  country: z.string().optional().describe("Country to filter by, if the user mentioned one."),
  limit: z.number().int().min(1).max(10).optional().describe("How many results to return (default 6)."),
});

export type SearchServicesInput = z.infer<typeof searchServicesInputSchema>;

/**
 * Search the catalogue with the same query the site's search page uses,
 * so results (and prices) match what the customer sees there.
 */
export async function searchServices(
  input: SearchServicesInput,
  storedLocale: string
): Promise<SearchServicesToolOutput> {
  const max = input.limit ?? 6;

  const data = await getSearchResults({
    term: input.query,
    locale: storedLocale,
    city: input.city ?? null,
    country: input.country ?? null,
    limit: max,
  });

  // The site search can return the same doctor/clinic more than once (e.g. a doctor at two clinics).
  const seen = new Set<string>();
  const unique = data.results.filter((item) => {
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = unique.slice(0, max).map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    provider: item.provider,
    location: item.location,
    rating: item.rating,
    reviews: item.reviews,
    price: item.price,
    currency: item.currency,
    image: item.image,
    href: item.href,
  }));

  return { count: results.length, results };
}