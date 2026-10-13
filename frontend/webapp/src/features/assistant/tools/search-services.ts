import "server-only";

import { z } from "zod";

import { searchAssistantCatalogue } from "../server/assistant-search.repository";
import type { SearchServicesToolOutput } from "../types";

export const SEARCH_SERVICES_DESCRIPTION =
  "Find the clinics and doctors on LSevin that offer one treatment or service. " +
  "Matching is strict: a clinic is only returned when one of its services is named after the treatment, " +
  "and a doctor only when they perform it or it is their specialty, so pass the treatment's name, not a sentence. " +
  "Returns clinics (type: service, one card per clinic for its matching service) and doctors (type: specialist), " +
  "in every city and country unless you filter, with the total number of matching clinics and doctors. " +
  "If nothing matches in the requested place, it returns the matches elsewhere and sets noMatchesIn to that place. " +
  "Prices are in the provider's own currency; never invent or convert them. " +
  "A price of 0 means the price is given after consultation, not free.";

export const searchServicesInputSchema = z.object({
  queries: z
    .array(z.string().min(1))
    .min(1)
    .max(5)
    .describe(
      "Names of the one treatment the user wants, spelled correctly: always its English and its Persian name, " +
        "plus common alternative names, e.g. ['hair transplant', 'کاشت مو', 'FUE'] or ['rhinoplasty', 'nose job', 'جراحی بینی']. " +
        "Each must name that treatment on its own; never a generic word like 'hair' or 'surgery', a city or 'clinic'."
    ),
  city: z.string().optional().describe("City to filter by, in English (e.g. 'tehran'), only if the user asked for one."),
  country: z.string().optional().describe("Country to filter by (e.g. 'iran', 'turkey', 'uae'), only if the user asked for one. Leave it out when a city is given."),
  kind: z
    .enum(["all", "clinics", "doctors"])
    .optional()
    .describe("'clinics' or 'doctors' when the user only wants one of them; default 'all'."),
  limit: z.number().int().min(1).max(10).optional().describe("How many clinics and how many doctors to return (default 6 and 4)."),
});

export type SearchServicesInput = z.infer<typeof searchServicesInputSchema>;

export async function searchServices(
  input: SearchServicesInput,
  options: { storedLocale: string; isIranianVisitor: boolean }
): Promise<SearchServicesToolOutput> {
  return searchAssistantCatalogue({
    queries: input.queries,
    locale: options.storedLocale,
    isIranianVisitor: options.isIranianVisitor,
    city: input.city,
    country: input.country,
    kind: input.kind,
    clinicLimit: input.limit ?? 6,
    doctorLimit: input.limit ?? 4,
  });
}
