import { type AdminAccess, can } from "@/lib/admin/access/policy";
import { resourceKeyFromHref } from "@/lib/admin/access/resolver";

import { ADMIN_NAV_LEAVES, type AdminNavEntry, isNavGroup } from "./admin-nav";

/**
 * Which sidebar / ⌘K rows an admin may see.
 *
 * Returns the hrefs they may open, or `null` meaning "all of them" (unlimited admins). The
 * result is plain strings on purpose: the nav tree holds icon components, which cannot cross
 * from a server layout into the client sidebar, so the server sends *which* rows and the client
 * narrows its own copy of the tree with {@link restrictNav}.
 *
 * This is a convenience — the middleware and the guards are what actually refuse — but it must
 * agree with them, so it asks the same `can()` about the same resource key.
 */
export function allowedNavHrefs(access: AdminAccess): string[] | null {
  if (access.kind === "unlimited") return null;
  if (access.kind === "none") return [];
  return ADMIN_NAV_LEAVES.map((leaf) => leaf.href).filter((href) =>
    can(access, resourceKeyFromHref(href), "view")
  );
}

/** Narrow a nav tree to the given hrefs; a group left with no rows disappears. */
export function restrictNav(nav: AdminNavEntry[], hrefs: readonly string[] | null | undefined): AdminNavEntry[] {
  if (!hrefs) return nav;
  const allowed = new Set(hrefs);
  return nav.flatMap<AdminNavEntry>((entry) => {
    if (!isNavGroup(entry)) return allowed.has(entry.href) ? [entry] : [];
    const items = entry.items.filter((item) => allowed.has(item.href));
    return items.length ? [{ ...entry, items }] : [];
  });
}
