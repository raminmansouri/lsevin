"use server";

import { revalidatePath } from "next/cache";

import sql from "@/config/database/db";
import { auth } from "@/lib/auth";

/**
 * Toggles whether a category appears on the homepage by setting
 * category.categories.display_in_home_page. The homepage queries already
 * respect this flag (get-categories.ts / get-home-page.ts), so no other
 * wiring is needed. Admin-only.
 */
export async function setCategoryHomepageDisplayAction(
  categoryId: string,
  displayInHomePage: boolean,
): Promise<{ ok: boolean; message?: string }> {
  if (!categoryId) return { ok: false, message: "Missing category id." };

  const session = await auth();
  const roles = (session?.user?.roles ?? []) as string[];
  if (!roles.includes("admin")) {
    return { ok: false, message: "Forbidden." };
  }

  try {
    await sql`
      update category.categories
      set display_in_home_page = ${displayInHomePage},
          last_modified_date = now()
      where id::text = ${categoryId}
    `;
    // Refresh the cached homepage so the change is reflected.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update category.",
    };
  }
}
