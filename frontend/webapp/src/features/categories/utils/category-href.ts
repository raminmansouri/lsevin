/**
 * Where a category card goes.
 *
 * One rule, shared by the home page shelf and the category browser, so the two
 * cannot drift apart: a category that has subcategories opens them, a category
 * that has none opens the businesses in it. Nothing in between, and no dead end —
 * every tap either descends a level or arrives at providers.
 *
 * The provider list is the map screen opened in list mode; its own toggle switches
 * to the map.
 */

const CATEGORY_BROWSER_PATH = "/n/app/mobile/categories";
const PROVIDER_LIST_PATH = "/n/app/mobile/map-discovery";

/** The category browser, opened on a node's subcategories rather than at the root. */
export function categoryBrowserHref(categoryId: string) {
  return `${CATEGORY_BROWSER_PATH}?parent=${encodeURIComponent(categoryId)}`;
}

/** The providers filed under a category, or under anything beneath it. */
export function categoryProvidersHref(categoryId: string) {
  return `${PROVIDER_LIST_PATH}?categoryId=${encodeURIComponent(categoryId)}&view=list`;
}

export function categoryCardHref(category: { id: string; childCount: number }) {
  return category.childCount > 0
    ? categoryBrowserHref(category.id)
    : categoryProvidersHref(category.id);
}
