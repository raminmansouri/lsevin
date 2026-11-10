// Query-scoped headers preserve static/ISR landing pages. Do not match tracking
// parameters or apply noindex to the unfiltered shop category/specialty landing itself.
export function facetHeaders(locales: readonly string[]) {
  const prefix = `/:locale(${locales.join("|")})`;
  const families = [
    { source: `${prefix}/shop/:slug`, keys: ["sort", "page", "brand", "inStockOnly", "onSale", "minRating", "minPrice", "maxPrice"] },
    // Specialty landings take the explore filters (explore.data parseExploreFilters).
    { source: `${prefix}/specialties/:slug`, keys: ["q", "category", "categoryId", "country", "countryCode", "city", "cityCode", "minPrice", "maxPrice", "currency", "minRating", "verifiedOnly", "languages", "responseTime", "sort"] },
    // A category's provider page takes the map filters (nearby.data parseNearbyFilters)
    // and the view; only the plain list is the indexable page.
    { source: `${prefix}/categories/:slug/providers`, keys: ["view", "q", "countryCode", "cityCode", "minPrice", "maxPrice", "currency", "distanceKm", "minRating", "verifiedOnly", "languages", "specialties", "lat", "lng"] },
  ];
  return families.flatMap(({ source, keys }) => keys.map(key => ({
    source,
    has: [{ type: "query" as const, key }],
    headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
  })));
}
