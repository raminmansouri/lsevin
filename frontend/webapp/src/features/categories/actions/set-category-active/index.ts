"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import { getAdminContext } from "@/lib/auth/admin-guard";

import { setCategorySubtreeActive } from "../../db/active-status";
import { revalidateCategoryLanding } from "../../server/revalidate-landing";

const InputSchema = z.object({
  // GUID, not RFC UUID: most catalog ids in production lack RFC version/variant bits.
  categoryId: z.guid(),
  isActive: z.boolean(),
});

export type SetCategoryActiveResult =
  | { ok: true; isActive: boolean; changed: number }
  | { ok: false; code: "INVALID" | "FORBIDDEN" | "NOT_FOUND" | "PARENT_INACTIVE" | "FAILED"; message: string };

/**
 * Turns a category (and everything under it) on or off for the whole site by setting
 * category.categories.is_active. Separate from the "show on landing page" switch, which only
 * hides an active category from the landing shelf. Admin only.
 */
export async function setCategoryActiveAction(input: {
  categoryId: string;
  isActive: boolean;
}): Promise<SetCategoryActiveResult> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID", message: "Invalid input." };

  const { isAdmin } = await getAdminContext();
  if (!isAdmin) return { ok: false, code: "FORBIDDEN", message: "Forbidden." };

  try {
    const outcome = await setCategorySubtreeActive(parsed.data.categoryId, parsed.data.isActive);
    if (outcome.status === "not-found") {
      return { ok: false, code: "NOT_FOUND", message: "Category not found." };
    }
    if (outcome.status === "parent-inactive") {
      return { ok: false, code: "PARENT_INACTIVE", message: "The parent category is inactive." };
    }

    // Landing shelf, category browser and their pages; the rest of the public pages
    // (explore, map, offers, search, service pages) are rendered per request.
    revalidateCategoryLanding();
    revalidatePath("/[locale]/n/app/mobile/explore", "page");
    revalidatePath("/[locale]/n/app/mobile/offers", "page");
    revalidatePath("/[locale]/(admin)/admin/categories", "page");
    return { ok: true, isActive: parsed.data.isActive, changed: outcome.changed };
  } catch (error) {
    console.error("Failed to set category active flag", { input, error });
    return { ok: false, code: "FAILED", message: error instanceof Error ? error.message : "Failed." };
  }
}
