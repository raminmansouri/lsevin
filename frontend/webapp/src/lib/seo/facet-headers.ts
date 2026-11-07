// Query-scoped headers preserve static/ISR landing pages. Do not match tracking
// parameters or apply noindex to the unfiltered shop category/specialty landing itself.
export function facetHeaders(locales: readonly string[]) {
  const prefix = `/:locale(${locales.join("|")})`;
  const families = [
    { source: `${prefix}/shop/:slug`, keys: ["sort", "page", "brand", "inStockOnly", "onSale", "minRating", "minPrice", "maxPrice"] },
    // Specialty landings take the explore filters (explore.data parseExploreFilters).
    { source: `${prefix}/specialties/:slug`, keys: ["q", "categoryId", "country", "countryCode", "city", "cityCode", "minPrice", "maxPrice", "currency", "minRating", "verifiedOnly", "languages", "responseTime", "sort"] },
  ];
  return families.flatMap(({ source, keys }) => keys.map(key => ({
    source,
    has: [{ type: "query" as const, key }],
    headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
  })));
}
