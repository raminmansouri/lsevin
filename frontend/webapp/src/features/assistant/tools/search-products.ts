import "server-only";

import { z } from "zod";

import { searchProducts } from "@/features/shop/api/catalog.repository";

import type { AssistantServiceResult } from "../types";

export const SEARCH_PRODUCTS_DESCRIPTION =
  "Search the LSevin shop: pharmacy items, skincare, supplements, personal care and medical devices. " +
  "Use it when the user needs products: aftercare after a treatment (e.g. shampoo after hair transplant, scar cream, sunscreen), " +
  "supplements, devices (e.g. blood pressure monitor), or asks what to buy. " +
  "Returns real products with price already in the user's currency and a link; never convert prices. " +
  "Search with a short keyword; if results are few, retry in English or Persian.";

export const searchProductsInputSchema = z.object({
  query: z.string().describe("What to look for, e.g. 'sunscreen', 'شامپو', 'vitamin D'. Any language."),
  limit: z.number().int().min(1).max(8).optional().describe("How many products to return (default 4)."),
});

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;

// Display currency per site language (same convention as the rest of the app).
export const DISPLAY_CURRENCY: Record<string, string> = { fa: "IRT", en: "USD", ar: "AED", tr: "TRY", ru: "USD" };

export async function searchProductsForAssistant(
  input: SearchProductsInput,
  locale: string
): Promise<{ count: number; results: AssistantServiceResult[] }> {
  const max = input.limit ?? 4;
  const lang = locale.slice(0, 2);

  const { items } = await searchProducts(
    { q: input.query, pageSize: max },
    { locale: lang, displayCurrency: DISPLAY_CURRENCY[lang] ?? "USD", cookieFree: true }
  );

  const results = items.slice(0, max).map((product) => ({
    // The journey planner looks products up by slug, so expose the slug as the id.
    id: product.slug,
    type: "product" as const,
    name: product.name,
    provider: product.brandName ?? "",
    location: product.categoryName ?? "",
    rating: product.rating,
    reviews: product.reviewCount,
    price: product.priceUnavailable ? 0 : product.price,
    currency: product.currency,
    image: product.imageUrl ?? "",
    href: `/n/app/mobile/shop/product/${product.slug}`,
  }));

  return { count: results.length, results };
}