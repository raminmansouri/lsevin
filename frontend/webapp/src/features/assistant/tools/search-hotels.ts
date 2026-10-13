import "server-only";

import { z } from "zod";

import { searchAssistantHotels } from "../server/hotel-search.repository";
import type { SearchHotelsToolOutput } from "../types";

export const SEARCH_HOTELS_DESCRIPTION =
  "Find hotels listed on LSevin in one city, for patients who need somewhere to stay. " +
  "Returns real hotels (type: hotel, one card per hotel for its cheapest room) with rating and price per night, " +
  "and the total number of matching hotels. With checkIn and nights, hotels that are fully booked on any of those nights are left out. " +
  "Prices are per night in the hotel's own currency; never invent or convert them.";

export const searchHotelsInputSchema = z.object({
  city: z.string().min(1).describe("City, in English (e.g. 'tehran')."),
  checkIn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("Check-in date as YYYY-MM-DD, if the user said when they arrive (work it out from today's date)."),
  nights: z.number().int().min(1).max(60).optional().describe("Number of nights, if the user said."),
  limit: z.number().int().min(1).max(10).optional().describe("How many hotels to return (default 5)."),
});

export type SearchHotelsInput = z.infer<typeof searchHotelsInputSchema>;

export async function searchHotels(
  input: SearchHotelsInput,
  options: { storedLocale: string; isIranianVisitor: boolean }
): Promise<SearchHotelsToolOutput> {
  return searchAssistantHotels({
    city: input.city,
    checkIn: input.checkIn,
    nights: input.nights,
    locale: options.storedLocale,
    isIranianVisitor: options.isIranianVisitor,
    limit: input.limit ?? 5,
  });
}
