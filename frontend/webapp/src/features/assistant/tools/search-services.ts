import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";

import { getSearchResults } from "@/features/service-providers/server/search.repository";

/**
 * Assistant tool: search bookable services with the same query the site's
 * search page uses, so results (and prices) match what the customer sees there.
 */
export function createSearchServicesTool(storedLocale: string) {
  return tool(
    async ({ query, city, country, limit }) => {
      const max = limit ?? 6;
      const data = await getSearchResults({
        term: query,
        locale: storedLocale,
        city: city ?? null,
        country: country ?? null,
        limit: Math.max(max * 2, 12),
      });

      const results = data.results
        .filter((item) => item.type === "service")
        .slice(0, max)
        .map((item) => ({
          id: item.id,
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

      return JSON.stringify({ count: results.length, results });
    },
    {
      name: "search_services",
      description:
        "Search LSevin's bookable medical, beauty and wellness services. " +
        "Use it whenever the user describes a treatment or service they want. " +
        "Returns real services with provider, location, rating, price and a link. " +
        "Prices are in the provider's own currency; never invent or convert them.",
      schema: z.object({
        query: z
          .string()
          .describe("What the user is looking for, e.g. 'hair transplant' or 'کاشت مو'. Any language."),
        city: z.string().optional().describe("City to filter by, if the user mentioned one."),
        country: z.string().optional().describe("Country to filter by, if the user mentioned one."),
        limit: z.number().int().min(1).max(10).optional().describe("How many results to return (default 6)."),
      }),
    }
  );
}
