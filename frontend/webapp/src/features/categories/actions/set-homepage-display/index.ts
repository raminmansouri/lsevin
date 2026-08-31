"use server";

import { revalidatePath } from "next/cache";

import sql from "@/config/database/db";
import { getAdminContext } from "@/lib/auth/admin-guard";

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

  // getAdminContext treats SuperAdmin as a superset of Admin, the way the
  // middleware and every other admin action do. Testing for the bare "admin"
  // role rejected super admins, who could open the page but not use the toggle.
  const { isAdmin } = await getAdminContext();
  if (!isAdmin) {
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
