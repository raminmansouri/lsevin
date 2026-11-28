import type { ShopProductSearchInput } from "../actions/catalog.actions";

export const SHOP_SORTS = ["popularity", "newest", "price_asc", "price_desc", "rating", "low_stock"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];

export type ShopFilters = {
  q: string;
  sort: ShopSort;
  page: number;
  category?: string;
  brands: string[];
  sellers: string[];
  attrs: string[];
  inStockOnly: boolean;
  discountedOnly: boolean;
  featuredOnly: boolean;
  bestSellerOnly: boolean;
  minRating: number;
  minPrice: number;
  maxPrice: number;
};

export type ShopFixed = { category?: string; q?: string; seller?: string };

const list = (value?: string | null) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function parseShopFilters(get: (key: string) => string | null | undefined): ShopFilters {
  const sort = get("sort") ?? "";
  return {
    q: get("q") ?? "",
    sort: (SHOP_SORTS as readonly string[]).includes(sort) ? (sort as ShopSort) : "popularity",
    page: Math.max(1, Number(get("page")) || 1),
    category: get("category") || undefined,
    brands: list(get("brand")),
    sellers: list(get("sellers")),
    attrs: list(get("attrs")),
    inStockOnly: get("inStockOnly") === "1",
    discountedOnly: get("onSale") === "1",
    featuredOnly: get("featuredOnly") === "1",
    bestSellerOnly: get("bestSellerOnly") === "1",
    minRating: Number(get("minRating")) || 0,
    minPrice: Number(get("minPrice")) || 0,
    maxPrice: Number(get("maxPrice")) || 0,
  };
}

export function shopFiltersQuery(f: ShopFilters, fixed: ShopFixed): string {
  const sp = new URLSearchParams();
  if (!fixed.q && f.q) sp.set("q", f.q);
  if (f.sort !== "popularity") sp.set("sort", f.sort);
  if (!fixed.category && f.category) sp.set("category", f.category);
  if (f.brands.length) sp.set("brand", f.brands.join(","));
  if (f.sellers.length) sp.set("sellers", f.sellers.join(","));
  if (f.attrs.length) sp.set("attrs", f.attrs.join(","));
  if (f.inStockOnly) sp.set("inStockOnly", "1");
  if (f.discountedOnly) sp.set("onSale", "1");
  if (f.featuredOnly) sp.set("featuredOnly", "1");
  if (f.bestSellerOnly) sp.set("bestSellerOnly", "1");
  if (f.minRating) sp.set("minRating", String(f.minRating));
  if (f.minPrice) sp.set("minPrice", String(f.minPrice));
  if (f.maxPrice) sp.set("maxPrice", String(f.maxPrice));
  if (f.page > 1) sp.set("page", String(f.page));
  return sp.toString();
}

export function shopFiltersInput(f: ShopFilters, fixed: ShopFixed, locale: string, pageSize: number, page = f.page): ShopProductSearchInput {
  return {
    locale,
    q: fixed.q ?? (f.q || undefined),
    category: fixed.category ?? f.category,
    seller: fixed.seller,
    brand: f.brands.join(",") || undefined,
    sellers: f.sellers.join(",") || undefined,
    attrs: f.attrs.join(",") || undefined,
    sort: f.sort,
    page,
    pageSize,
    inStockOnly: f.inStockOnly,
    discountedOnly: f.discountedOnly,
    featuredOnly: f.featuredOnly,
    bestSellerOnly: f.bestSellerOnly,
    minRating: f.minRating,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
  };
}

export function activeFilterCount(f: ShopFilters, fixed: ShopFixed): number {
  return (
    f.brands.length +
    f.sellers.length +
    f.attrs.length +
    (!fixed.category && f.category ? 1 : 0) +
    (f.inStockOnly ? 1 : 0) +
    (f.discountedOnly ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.minPrice || f.maxPrice ? 1 : 0)
  );
}

export const EMPTY_SHOP_FILTERS: Omit<ShopFilters, "q" | "sort" | "page"> = {
  category: undefined,
  brands: [],
  sellers: [],
  attrs: [],
  inStockOnly: false,
  discountedOnly: false,
  featuredOnly: false,
  bestSellerOnly: false,
  minRating: 0,
  minPrice: 0,
  maxPrice: 0,
};