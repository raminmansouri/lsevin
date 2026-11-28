"use server";

import { getShopFacets, searchProducts, type ShopFacets } from "../api/catalog.repository";
import type { ProductCard } from "../types/domain";

export type ShopProductSearchInput = {
  locale: string;
  category?: string;
  q?: string;
  brand?: string;
  seller?: string;
  sellers?: string;
  attrs?: string;
  sort?: "popularity" | "newest" | "price_asc" | "price_desc" | "rating" | "low_stock";
  page?: number;
  pageSize?: number;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  featuredOnly?: boolean;
  bestSellerOnly?: boolean;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
};

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

export async function getShopFacetsAction(input: ShopProductSearchInput & { fixedCategory?: boolean }): Promise<ShopFacets> {
  const { locale, fixedCategory, page: _page, pageSize: _pageSize, sort: _sort, ...filters } = input;
  return getShopFacets(filters, { locale, fixedCategory });
}