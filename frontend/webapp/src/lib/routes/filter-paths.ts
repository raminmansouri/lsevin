/**
 * Public URLs for listings filtered by a category or a provider type.
 *
 * A listing link never carries a database id. A category's or a type's own page
 * is a path; a further filter is a readable query value (the slug, not the UUID):
 *
 *   a category's subcategories  -> /categories/<category>
 *   a category's providers      -> /categories/<category>/providers   (the map screen, list first)
 *   a provider type             -> /specialties/<type>                (the directory)
 *   directory + category        -> /explore?category=<category>
 *   directory + type + category -> /specialties/<type>?category=<category>
 *   map + type                  -> /map?type=<type>&category=<category>
 *   search                      -> /n/app/mobile/search?category=<category>
 *
 * The pages still accept the old ?categoryId= / ?providerTypeId= / ?parent=
 * links and answer them with one permanent redirect to these addresses
 * (src/lib/seo/listing-params.ts).
 *
 * Client-safe: slugs come from the data the page already has.
 */

export type SlugOf = (id: string) => string | null | undefined;

export type ListingSlugs = {
  category?: SlugOf;
  type?: SlugOf;
};

export type ListingTaxonomy = {
  categoryId?: string | null;
  providerTypeId?: string | null;
};

/** A lookup from records that carry their own slug. */
export function slugLookup(items: readonly { id: string; slug?: string | null }[] | null | undefined): SlugOf {
  const map = new Map((items ?? []).map((item) => [item.id, item.slug ?? null]));
  return (id) => map.get(id) ?? null;
}

function isSet(id: string | null | undefined): id is string {
  return Boolean(id) && id !== "all";
}

/**
 * The URL value for a category or type: its slug. A record that somehow has no
 * slug yet falls back to its id, which the page accepts and redirects to the
 * slug once it exists.
 */
export function listingSlug(id: string | null | undefined, slugOf?: SlugOf): string | null {
  if (!isSet(id)) return null;
  return slugOf?.(id) || id;
}

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** The subcategories of a category. */
export function categoryPath(slug: string) {
  return `/categories/${encodeURIComponent(slug)}`;
}

/** The providers filed under a category or anything beneath it. */
export function categoryProvidersPath(slug: string) {
  return `/categories/${encodeURIComponent(slug)}/providers`;
}

/** A provider type's landing page. */
export function specialtyPath(slug: string) {
  return `/specialties/${encodeURIComponent(slug)}`;
}

const TAXONOMY_KEYS = ["category", "type", "categoryId", "providerTypeId"];

function without(params: URLSearchParams, keys: string[]) {
  const rest = new URLSearchParams(params);
  for (const key of keys) rest.delete(key);
  return rest;
}

/**
 * The provider directory for these filters. `params` holds every other filter
 * already serialized; the category and type are added here.
 */
export function directoryHref(taxonomy: ListingTaxonomy, slugs: ListingSlugs, params = new URLSearchParams()) {
  const category = listingSlug(taxonomy.categoryId, slugs.category);
  const type = listingSlug(taxonomy.providerTypeId, slugs.type);
  const rest = without(params, TAXONOMY_KEYS);
  if (category) rest.set("category", category);
  return withQuery(type ? specialtyPath(type) : "/explore", rest);
}

/**
 * The map screen for these filters. A category on its own is that category's
 * provider page, which opens on the list (`view=map` asks for the map); anything
 * else is /map, which opens on the map (`view=list` asks for the list).
 */
export function mapHref(
  taxonomy: ListingTaxonomy,
  slugs: ListingSlugs,
  params = new URLSearchParams(),
  view: "map" | "list" = "map",
) {
  const category = listingSlug(taxonomy.categoryId, slugs.category);
  const type = listingSlug(taxonomy.providerTypeId, slugs.type);
  const rest = without(params, [...TAXONOMY_KEYS, "view"]);
  if (category && !type) {
    if (view === "map") rest.set("view", "map");
    return withQuery(categoryProvidersPath(category), rest);
  }
  const query = new URLSearchParams();
  if (view === "list") query.set("view", "list");
  setListingParams(query, taxonomy, slugs);
  for (const [key, value] of rest) query.append(key, value);
  return withQuery("/map", query);
}

/** The map/list view a request asks for; `fallback` is the page's own default. */
export function requestedView(value: string | string[] | null | undefined, fallback: "map" | "list"): "map" | "list" {
  const view = Array.isArray(value) ? value[0] : value;
  return view === "list" || view === "map" ? view : fallback;
}

/** Whether a path is a category's provider page, where the list is the default view. */
export function isCategoryProvidersPath(pathname: string) {
  return /\/categories\/[^/]+\/providers\/?$/.test(pathname);
}

/** Adds the category and type to a filter query as slugs (map, offers, search). */
export function setListingParams(params: URLSearchParams, taxonomy: ListingTaxonomy, slugs: ListingSlugs) {
  for (const key of ["category", "type", "categoryId", "providerTypeId"]) params.delete(key);
  const category = listingSlug(taxonomy.categoryId, slugs.category);
  const type = listingSlug(taxonomy.providerTypeId, slugs.type);
  if (category) params.set("category", category);
  if (type) params.set("type", type);
  return params;
}
