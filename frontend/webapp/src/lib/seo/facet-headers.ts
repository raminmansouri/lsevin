// Query-scoped headers preserve static/ISR landing pages. Do not match tracking
// parameters or apply noindex to the unfiltered category/type landing itself.
export function facetHeaders(locales: readonly string[]) {
  const prefix = `/:locale(${locales.join("|")})`;
  const families = [
    { source: `${prefix}/n/app/mobile/shop/category/:slug`, keys: ["sort", "page", "brand", "inStockOnly", "onSale", "minRating", "minPrice", "maxPrice"] },
    { source: `${prefix}/type/:id`, keys: ["search", "countryCode", "cityCode", "attributeFilters"] },
  ];
  return families.flatMap(({ source, keys }) => keys.map(key => ({
    source,
    has: [{ type: "query" as const, key }],
    headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
  })));
}
