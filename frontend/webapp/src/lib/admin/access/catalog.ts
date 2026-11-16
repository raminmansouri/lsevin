/**
 * The permission catalogue: every admin area a role can be granted, grouped like the sidebar.
 *
 * Nothing is registered by hand. The sidebar tree gives the named areas; the generated route
 * manifest adds any page that exists on disk but is not (yet) in the sidebar — those show up
 * under the nearest group flagged "unlisted", so a new page is visible in the matrix the day it
 * is merged and, until someone grants it, reachable only by unlimited admins.
 */
import { ADMIN_NAV, ADMIN_NAV_LEAVES, isNavGroup } from "@/features/shared/config/admin-nav";

import { ADMIN_PAGE_ROUTES } from "./manifest.generated";
import { isGrantable, isPendingMigration, UNLIMITED_ONLY_RESOURCES } from "./policy";
import { resolveAdminPageResource, resourceKeyFromHref } from "./resolver";

export type CatalogResource = {
  key: string;
  href: string;
  /** Message key under `Admin.nav` for sidebar areas; humanised path for unlisted pages. */
  titleKey: string;
  /** `nav` = a row of the sidebar; `unlisted` = a page the sidebar does not link to. */
  origin: "nav" | "unlisted";
  /** Cannot be granted to a custom role, ever. */
  unlimitedOnly: boolean;
  /** Cannot be granted *yet*: its server-side guards are not migrated (see policy.ts). */
  pending: boolean;
  /** Moves or values money, or exposes personal data: the UI asks for a second look. */
  sensitive: boolean;
};

export type CatalogGroup = {
  /** `Admin.nav` key of the sidebar group, or `other` for unlisted pages with no home. */
  groupKey: string;
  resources: CatalogResource[];
};

const SENSITIVE_PREFIXES = [
  "finance",
  "commercial",
  "payments",
  "payment-gateways",
  "payment-methods",
  "wallet-",
  "refunds",
  "patients",
  "tours-platform.disputes",
];

export function isSensitive(key: string): boolean {
  // Prefix match on purpose: `payments` also covers `payments-xyz`, and a new page whose
  // name begins like a money area is flagged until someone decides otherwise.
  return SENSITIVE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function humanize(href: string): string {
  const last = href.split("/").filter(Boolean).slice(-1)[0] ?? href;
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildCatalog(): CatalogGroup[] {
  const groups: CatalogGroup[] = [];
  const known = new Map<string, CatalogResource>();
  const leafGroup = new Map<string, string>(); // href -> group key

  for (const entry of ADMIN_NAV) {
    const groupKey = isNavGroup(entry) ? entry.titleKey : "general";
    const leaves = isNavGroup(entry) ? entry.items : [entry];
    const resources: CatalogResource[] = [];
    for (const leaf of leaves) {
      const key = resourceKeyFromHref(leaf.href);
      const resource: CatalogResource = {
        key,
        href: leaf.href,
        titleKey: leaf.titleKey,
        origin: "nav",
        unlimitedOnly: UNLIMITED_ONLY_RESOURCES.has(key),
        pending: isPendingMigration(key),
        sensitive: isSensitive(key),
      };
      resources.push(resource);
      known.set(key, resource);
      leafGroup.set(leaf.href, groupKey);
    }
    const existing = groups.find((g) => g.groupKey === groupKey);
    if (existing) existing.resources.push(...resources);
    else groups.push({ groupKey, resources });
  }

  // Pages on disk that the sidebar does not link to.
  const unlisted = new Map<string, CatalogResource>();
  for (const route of ADMIN_PAGE_ROUTES) {
    const resolved = resolveAdminPageResource(route);
    if (resolved.kind !== "resource" || known.has(resolved.key) || unlisted.has(resolved.key)) continue;
    const href = `/admin/${resolved.key.split(".").join("/")}`;
    unlisted.set(resolved.key, {
      key: resolved.key,
      href,
      titleKey: humanize(href),
      origin: "unlisted",
      unlimitedOnly: UNLIMITED_ONLY_RESOURCES.has(resolved.key),
      pending: isPendingMigration(resolved.key),
      sensitive: isSensitive(resolved.key),
    });
  }

  for (const resource of [...unlisted.values()].sort((a, b) => a.key.localeCompare(b.key))) {
    // Home = the group of the longest sidebar leaf that is a path prefix of this page.
    const home = ADMIN_NAV_LEAVES.filter(
      (leaf) => resource.href === leaf.href || resource.href.startsWith(`${leaf.href}/`)
    ).sort((a, b) => b.href.length - a.href.length)[0];
    const groupKey = (home && leafGroup.get(home.href)) || "other";
    const existing = groups.find((g) => g.groupKey === groupKey);
    if (existing) existing.resources.push(resource);
    else groups.push({ groupKey, resources: [resource] });
  }

  return groups;
}

/** Flat list, for validation and tests. */
export function allCatalogResources(): CatalogResource[] {
  return buildCatalog().flatMap((g) => g.resources);
}

/** Keys a role may legitimately hold — the allow-list the save action validates against. */
export function grantableResourceKeys(): Set<string> {
  return new Set(allCatalogResources().filter((r) => isGrantable(r.key)).map((r) => r.key));
}
