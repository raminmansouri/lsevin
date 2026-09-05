import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getHomeManagedSections, type HomeManagedSections } from "./get-home-sections";

/**
 * Cached view of {@link getHomeManagedSections}. The managed home sections are
 * editorial content keyed only by locale — they change when an admin edits
 * `marketing.home_sections`, not per request — so the home page can serve them
 * from the data cache instead of hitting Postgres on every render.
 *
 * Tag: `home-managed-sections` — call `revalidateTag("home-managed-sections")`
 * from the section admin mutation to push an edit immediately.
 */
export async function getHomeManagedSectionsCached(
  locale?: string | null,
): Promise<HomeManagedSections> {
  "use cache";
  cacheTag("home-managed-sections");
  cacheLife("default");

  return getHomeManagedSections(locale ?? "en");
}
