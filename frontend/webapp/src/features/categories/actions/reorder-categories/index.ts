"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod/v4";

import sql from "@/config/database/db";
import { adminMay, getAdminContext } from "@/lib/auth/admin-guard";

import { revalidateCategoryLanding } from "../../server/revalidate-landing";

/** One category as the "arrange order" dialog shows it. */
export type CategoryOrderNode = {
  id: string;
  parentId: string | null;
  name: string;
  isActive: boolean;
};

export type GetCategoryOrderResult =
  | { ok: true; items: CategoryOrderNode[] }
  | { ok: false; code: "FORBIDDEN" | "FAILED"; message: string };

/**
 * Every category (active or not), in display order among its siblings. The dialog builds the
 * tree from `parentId`; the order of `items` within one parent is the order to show.
 */
export async function getCategoryOrderAction(): Promise<GetCategoryOrderResult> {
  const adminCtx = await getAdminContext();
  if (!adminMay(adminCtx, "categories", "view")) return { ok: false, code: "FORBIDDEN", message: "Forbidden." };

  const locale = await getLocale();
  try {
    const rows = await sql<{ id: string; parent_id: string | null; name: string | null; is_active: boolean }[]>`
      select
        c.id::text as id,
        c.parent_id::text as parent_id,
        nullif(common.get_translation_t(c.name_translations, ${locale}, 'en-US'), '') as name,
        coalesce(c.is_active, true) as is_active
      from category.categories c
      order by case when coalesce(c.display_order, 0) > 0 then 0 else 1 end,
               coalesce(c.display_order, 0),
               c.create_date,
               c.id
    `;
    return {
      ok: true,
      items: rows.map((row) => ({
        id: row.id,
        parentId: row.parent_id,
        name: row.name ?? "—",
        isActive: row.is_active,
      })),
    };
  } catch (error) {
    console.error("getCategoryOrderAction failed", { error });
    return { ok: false, code: "FAILED", message: "Could not load the categories." };
  }
}

const ReorderSchema = z.object({
  // null: the main (top-level) categories.
  parentId: z.guid().nullable(),
  // GUID, not RFC UUID: most catalog ids in production lack RFC version/variant bits.
  orderedIds: z.array(z.guid()).min(1).max(2000),
});

export type ReorderCategoriesResult =
  | { ok: true }
  | { ok: false; code: "INVALID" | "FORBIDDEN" | "STALE" | "FAILED"; message: string };

/**
 * Saves the order of one parent's children (or of the main categories): the first id gets
 * display_order 1, the next 2, and so on. `orderedIds` must be exactly that parent's current
 * children, so a list another admin changed meanwhile is refused instead of half-applied.
 */
export async function reorderCategoriesAction(input: {
  parentId: string | null;
  orderedIds: string[];
}): Promise<ReorderCategoriesResult> {
  const parsed = ReorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID", message: "Invalid order." };

  const adminCtx = await getAdminContext();
  if (!adminMay(adminCtx, "categories")) return { ok: false, code: "FORBIDDEN", message: "Forbidden." };

  const { parentId, orderedIds } = parsed.data;
  const ids = orderedIds.map((id) => id.toLowerCase());
  if (new Set(ids).size !== ids.length) return { ok: false, code: "INVALID", message: "Duplicate category." };

  try {
    const outcome = await sql.begin(async (tx) => {
      const siblings = await tx<{ id: string }[]>`
        select id::text as id
        from category.categories
        where ${parentId === null ? tx`parent_id is null` : tx`parent_id::text = ${parentId.toLowerCase()}`}
        for update
      `;
      const current = new Set(siblings.map((row) => row.id.toLowerCase()));
      if (current.size !== ids.length || ids.some((id) => !current.has(id))) return "STALE" as const;

      await tx`
        update category.categories c
           set display_order = o.position,
               last_modified_date = now()
          from unnest(${ids}::text[]) with ordinality as o(id, position)
         where c.id::text = o.id
           and c.display_order is distinct from o.position::int
      `;
      return "OK" as const;
    });
    if (outcome === "STALE") {
      return { ok: false, code: "STALE", message: "The categories changed meanwhile. Reload and try again." };
    }
  } catch (error) {
    console.error("reorderCategoriesAction failed", { parentId, error });
    return { ok: false, code: "FAILED", message: "Could not save the order. Please try again." };
  }

  revalidateCategoryLanding();
  return { ok: true };
}
