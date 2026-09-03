"use server";

import { searchProducts } from "../api/catalog.repository";
import type { ProductCard } from "../types/domain";

export type ShopProductSearchInput = {
  locale: string;
  category?: string;
  q?: string;
  brand?: string;
  sort?: "popularity" | "newest" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
};

/**
 * Client-driven product search for statically-rendered list pages (the shop
 * category page). Runs cookie-free and returns prices in each item's own stored
 * currency (`noFx`) so `<ShopPrice>` in the cards converts on the client.
 */
export async function searchShopProductsAction(
  input: ShopProductSearchInput,
): Promise<{ items: ProductCard[]; total: number; page: number; pageSize: number }> {
  const { locale, ...filters } = input;
  return searchProducts(filters, {
    locale,
    displayCurrency: "USD",
    cookieFree: true,
    noFx: true,
  });
}
