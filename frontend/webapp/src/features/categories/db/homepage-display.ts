import "server-only";

import sql from "@/config/database/db";

/**
 * Returns the effective "show on homepage" flag for the given category ids.
 * Mirrors how the homepage selects categories: a NULL flag counts as shown
 * (coalesce(display_in_home_page, true)).
 */
export async function getCategoryHomepageFlags(
  ids: string[],
): Promise<Record<string, boolean>> {
  if (!ids.length) return {};

  const rows = await sql<{ id: string; on: boolean }[]>`
    select id::text as id, coalesce(display_in_home_page, true) as on
    from category.categories
    where id::text = any(${ids})
  `;

  return Object.fromEntries(rows.map((row) => [row.id, row.on]));
}
