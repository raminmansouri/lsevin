import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { getCpCategoryGroupsTag } from "@/features/service-providers/db/cache";

/**
 * Everything that shows categories to customers after an admin changes which ones are on the
 * landing page or their priority:
 *  - `home-rails`: the landing page's category shelf (getHomeCategoriesCached, "use cache").
 *    revalidatePath alone does not drop that entry, so the shelf kept the old set for up to
 *    its cache life.
 *  - the category browser ("see all") rows (unstable_cache, cp-category-groups tag).
 *  - the search page's category filter chips ("use cache", search-discovery tag), which follow
 *    the display order too.
 *  - the rendered pages themselves.
 */
export function revalidateCategoryLanding() {
  revalidateTag("home-rails");
  revalidateTag(getCpCategoryGroupsTag());
  revalidateTag("search-discovery");
  revalidatePath("/[locale]/n/app/mobile/home", "page");
  revalidatePath("/[locale]/n/app/mobile/categories", "page");
  revalidatePath("/", "layout");
}
