"use server";

import { z } from "zod/v4";

import sql from "@/config/database/db";
import { getAdminContext } from "@/lib/auth/admin-guard";

import { MAX_CATEGORY_PRIORITY } from "../../constants";
import { revalidateCategoryLanding } from "../../server/revalidate-landing";

const InputSchema = z.object({
  // GUID, not RFC UUID: most catalog ids in production lack RFC version/variant bits.
  categoryId: z.guid(),
  // null or 0 clears the priority (the category falls back to the default order).
  priority: z.number().int().min(0).max(MAX_CATEGORY_PRIORITY).nullable(),
});

export type SetCategoryPriorityResult =
  | { ok: true; priority: number }
  | { ok: false; code: "INVALID" | "FORBIDDEN" | "NOT_FOUND" | "FAILED"; message: string };

/**
 * Sets a category's priority (category.categories.display_order): 1 shows first on the landing page
 * and the categories page; 0 / empty removes the priority. Admin only.
 */
export async function setCategoryPriorityAction(input: {
  categoryId: string;
  priority: number | null;
}): Promise<SetCategoryPriorityResult> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID", message: `Priority must be a whole number from 0 to ${MAX_CATEGORY_PRIORITY}.` };
  }

  const { isAdmin } = await getAdminContext();
  if (!isAdmin) return { ok: false, code: "FORBIDDEN", message: "Forbidden." };

  const priority = parsed.data.priority ?? 0;
  try {
    const rows = await sql<{ id: string }[]>`
      update category.categories
      set display_order = ${priority},
          last_modified_date = now()
      where id::text = ${parsed.data.categoryId}
      returning id::text as id
    `;
    if (!rows.length) return { ok: false, code: "NOT_FOUND", message: "Category not found." };
  } catch (error) {
    console.error("setCategoryPriorityAction failed", { categoryId: parsed.data.categoryId, error });
    return { ok: false, code: "FAILED", message: "Could not save the priority. Please try again." };
  }

  revalidateCategoryLanding();
  return { ok: true, priority };
}
