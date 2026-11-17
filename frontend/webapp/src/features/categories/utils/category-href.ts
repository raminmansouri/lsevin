/**
 * Where a category card goes.
 *
 * One rule, shared by the home page shelf and the category browser, so the two
 * cannot drift apart: a category that has subcategories opens them, a category
 * that has none opens the businesses in it. Nothing in between, and no dead end —
 * every tap either descends a level or arrives at providers.
 *
 * Both are readable public URLs (src/lib/routes/filter-paths.ts); the provider
 * list is the directory filtered to the category, with a map button of its own.
 */

import { categoryPath, categoryProvidersPath } from "@/lib/routes/filter-paths";

type CategoryRef = { id: string; slug?: string | null };

/** The URL segment of a category: its slug (migration 0095), else its id, which the page redirects. */
function segment(category: CategoryRef) {
  return category.slug || category.id;
}

/** The category browser opened on a node's subcategories: /categories/<slug>. */
export function categoryBrowserHref(category: CategoryRef) {
  return categoryPath(segment(category));
}

/** The providers filed under a category, or under anything beneath it: /categories/<slug>/providers. */
export function categoryProvidersHref(category: CategoryRef) {
  return categoryProvidersPath(segment(category));
}

export function categoryCardHref(
  category: CategoryRef & { childCount: number },
  /**
   * Pass the Tourism root (from tour settings) so Tourism and its subtree open Tours directly,
   * and the Accommodation root (from stay settings) so hotels and stays open the Stays app.
   */
  apps?: { tourismCategoryId?: string | null; staysCategoryId?: string | null; parentOf?: (id: string) => string | null | undefined },
) {
  const app = subAppPathFor(category.id, apps);
  if (app) return app;
  return category.childCount > 0
    ? categoryBrowserHref(category)
    : categoryProvidersHref(category);
}

/** The Tours sub-application (src/app/[locale]/tours). */
export const TOURS_HOME_PATH = "/tours";

/** The Stays (hotels and accommodation) sub-application (src/app/[locale]/stays). */
export const STAYS_HOME_PATH = "/stays";

/** The sub-application a category (or anything beneath it) opens, or null for the provider directory. */
export function subAppPathFor(
  categoryId: string,
  apps?: { tourismCategoryId?: string | null; staysCategoryId?: string | null; parentOf?: (id: string) => string | null | undefined },
): string | null {
  const parentOf = apps?.parentOf ?? (() => null);
  if (apps?.tourismCategoryId && isTourismCategory(categoryId, parentOf, apps.tourismCategoryId)) return TOURS_HOME_PATH;
  if (apps?.staysCategoryId && isTourismCategory(categoryId, parentOf, apps.staysCategoryId)) return STAYS_HOME_PATH;
  return null;
}

/**
 * Tourism and everything beneath it opens the Tours sub-application instead of
 * the provider map (C-001). The Tourism root id comes from tour.settings
 * (`tourism_category_id`), read on the server and passed down — never hardcoded.
 */
export function isTourismCategory(
  categoryId: string,
  parentOf: (id: string) => string | null | undefined,
  tourismCategoryId: string | null | undefined,
): boolean {
  if (!tourismCategoryId) return false;
  let current: string | null | undefined = categoryId;
  for (let depth = 0; current && depth < 20; depth += 1) {
    if (current === tourismCategoryId) return true;
    current = parentOf(current);
  }
  return false;
}
