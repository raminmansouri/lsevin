import "server-only";

import sql from "@/config/database/db";

/**
 * category.categories.is_active is the category's on/off switch. Every customer-facing query
 * (landing shelf, category browser, explore, map, search, offers, assistant, doctor finder)
 * filters on it, so an inactive category disappears from the whole site. It is separate from
 * display_in_home_page, which only decides whether an active category sits on the landing shelf.
 *
 * The .NET category update hard-codes IsActive = true, so the flag is read and written here with
 * direct SQL, and the update action restores it after every save (see update-category).
 */

/** The current flag for one category, or null when the row does not exist. */
export async function readCategoryActive(categoryId: string | undefined): Promise<boolean | null> {
  if (!categoryId) return null;
  const rows = await sql<{ is_active: boolean }[]>`
    select coalesce(is_active, true) as is_active
    from category.categories
    where id = ${categoryId}::uuid
    limit 1
  `;
  return rows[0] ? Boolean(rows[0].is_active) : null;
}

/** The flag for many categories at once (admin list). */
export async function getCategoryActiveFlags(ids: string[]): Promise<Record<string, boolean>> {
  if (!ids.length) return {};
  const rows = await sql<{ id: string; is_active: boolean }[]>`
    select id::text as id, coalesce(is_active, true) as is_active
    from category.categories
    where id::text = any(${ids})
  `;
  return Object.fromEntries(rows.map((row) => [row.id, Boolean(row.is_active)]));
}

/** Puts one category's flag back to a value read before a save. */
export async function restoreCategoryActive(categoryId: string | undefined, isActive: boolean | null) {
  if (!categoryId || isActive === null) return;
  await sql`
    update category.categories
       set is_active = ${isActive}
     where id = ${categoryId}::uuid
       and is_active is distinct from ${isActive}
  `;
}

export type SetCategoryActiveOutcome =
  | { status: "ok"; changed: number }
  | { status: "not-found" }
  | { status: "parent-inactive" };

/**
 * Switches a category and its whole subtree on or off. The subtree goes with it because most
 * customer-facing queries check each row's own flag, so an active child of an inactive parent
 * would keep showing up (the same reason migration 0037 retired a whole subtree).
 *
 * A category cannot be switched on while its parent is off: it would show up on its own,
 * detached from the branch the admin turned off.
 */
export async function setCategorySubtreeActive(
  categoryId: string,
  isActive: boolean,
): Promise<SetCategoryActiveOutcome> {
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string; parent_active: boolean | null }[]>`
      select c.id::text as id,
             case when p.id is null then null else coalesce(p.is_active, true) end as parent_active
      from category.categories c
      left join category.categories p on p.id = c.parent_id
      where c.id = ${categoryId}::uuid
      limit 1
    `;
    const row = rows[0];
    if (!row) return { status: "not-found" } as const;
    if (isActive && row.parent_active === false) return { status: "parent-inactive" } as const;

    const updated = await tx`
      with recursive subtree as (
        select c.id from category.categories c where c.id = ${categoryId}::uuid
        union all
        select child.id
        from category.categories child
        join subtree parent on child.parent_id = parent.id
      )
      update category.categories c
         set is_active = ${isActive},
             last_modified_date = now()
       where c.id in (select id from subtree)
         and c.is_active is distinct from ${isActive}
    `;
    return { status: "ok", changed: updated.count } as const;
  }) as Promise<SetCategoryActiveOutcome>;
}
