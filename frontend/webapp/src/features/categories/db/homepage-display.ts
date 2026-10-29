import "server-only";

import sql from "@/config/database/db";

export interface CategoryHomepageSettings {
  /** Shown on the landing page; a NULL flag counts as shown, like the landing query. */
  displayInHomePage: boolean;
  /** Landing/category-page priority: 1 shows first; 0 means "no priority" (after the prioritised ones). */
  displayOrder: number;
}

/**
 * Landing-page settings for the given category ids. Read with direct SQL because the categories
 * API the admin list uses does not expose them.
 */
export async function getCategoryHomepageSettings(
  ids: string[],
): Promise<Record<string, CategoryHomepageSettings>> {
  if (!ids.length) return {};

  const rows = await sql<{ id: string; on: boolean; display_order: number }[]>`
    select id::text as id,
           coalesce(display_in_home_page, true) as on,
           coalesce(display_order, 0)::int as display_order
    from category.categories
    where id::text = any(${ids})
  `;

  return Object.fromEntries(
    rows.map((row) => [row.id, { displayInHomePage: row.on, displayOrder: Number(row.display_order) || 0 }]),
  );
}

/**
 * Returns the effective "show on homepage" flag for the given category ids.
 * Mirrors how the homepage selects categories: a NULL flag counts as shown
 * (coalesce(display_in_home_page, true)).
 */
export async function getCategoryHomepageFlags(
  ids: string[],
): Promise<Record<string, boolean>> {
  const settings = await getCategoryHomepageSettings(ids);
  return Object.fromEntries(Object.entries(settings).map(([id, value]) => [id, value.displayInHomePage]));
}
