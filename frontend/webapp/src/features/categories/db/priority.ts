import "server-only";

import sql from "@/config/database/db";

/**
 * The landing/category-page priority lives in category.categories.display_order, a column the
 * .NET Category entity also owns: its update endpoint writes DisplayOrder from the request, and the
 * admin edit form does not send it, so a plain save reset the priority to 0. The update action reads
 * the priority before calling the API and restores it afterwards with these two helpers.
 */
export async function readCategoryPriority(categoryId: string | undefined): Promise<number | null> {
  if (!categoryId) return null;
  const rows = await sql<{ display_order: number }[]>`
    select coalesce(display_order, 0)::int as display_order
    from category.categories
    where id::text = ${categoryId}
  `;
  return rows.length ? Number(rows[0].display_order) || 0 : null;
}

export async function restoreCategoryPriority(categoryId: string | undefined, priority: number | null): Promise<void> {
  if (!categoryId || priority === null) return;
  await sql`
    update category.categories
       set display_order = ${priority}
     where id::text = ${categoryId}
       and coalesce(display_order, 0) <> ${priority}
  `;
}
