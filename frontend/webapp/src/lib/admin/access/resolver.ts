/**
 * Maps an admin URL to the permission resource that governs it.
 *
 * Pure and Edge-safe: the middleware calls this on every admin request. It reads only the
 * generated manifest, never the filesystem.
 *
 * The unit a person is granted is a *navigation leaf* — the rows of the admin sidebar
 * (`/admin/shop/orders`, `/admin/bookings`, …). Everything beneath a leaf (`/admin/bookings/add`,
 * `/admin/bookings/<id>/update`) belongs to it. Two cases deserve care:
 *
 *  1. A "parent leaf" such as `/admin/shop` (the shop overview) has sibling leaves beneath it.
 *     It owns only its own page and the add/edit style verbs below it. A page that appears
 *     under it later — `/admin/shop/payouts` — is NOT owned by the overview: it becomes its own
 *     resource (`shop.payouts`), which nobody holds until an unlimited admin grants it. That is
 *     what makes newly added pages safe by default.
 *
 *  2. A route the manifest cannot explain at all resolves to `unclassified`, which can never be
 *     granted. (A real request for such a path 404s anyway.)
 */
import { ADMIN_NAV_HREFS, ADMIN_PAGE_ROUTES } from "./manifest.generated";
import { ALWAYS_ALLOWED_PAGES, UNCLASSIFIED } from "./policy";

/** Static path segments that mean "create/edit a record of the page above", not a new page. */
const RECORD_VERBS: ReadonlySet<string> = new Set(["add", "new", "edit", "update", "create"]);

export type ResolvedResource = {
  /** Permission key, e.g. `shop.orders`. */
  key: string;
  /** `exempt` pages need no grant; `unclassified` ones can never be granted. */
  kind: "resource" | "exempt" | "unclassified";
};

const isDynamic = (segment: string) => segment.startsWith("[");
const isCatchAll = (segment: string) => segment.startsWith("[...") || segment.startsWith("[[...");

const split = (path: string): string[] => path.split("/").filter(Boolean);

/** `/admin/shop/orders` -> `shop.orders`; `/admin` -> `table-browser`. */
export function resourceKeyFromHref(href: string): string {
  const segments = split(href);
  if (segments[0] === "admin") segments.shift();
  return segments.length === 0 ? "table-browser" : segments.join(".");
}

type CompiledRoute = { pattern: string; segments: string[]; staticCount: number };

const compiledRoutes: CompiledRoute[] = ADMIN_PAGE_ROUTES.map((pattern) => {
  const segments = split(pattern);
  return { pattern, segments, staticCount: segments.filter((s) => !isDynamic(s)).length };
});

const navLeaves: string[][] = ADMIN_NAV_HREFS.map(split);
const navHrefSet = new Set(ADMIN_NAV_HREFS);

const isPrefix = (prefix: string[], of: string[]) =>
  prefix.length <= of.length && prefix.every((segment, i) => segment === of[i]);

/** Does this leaf have other leaves beneath it (so it is an overview, not a leaf of its own)? */
function isParentLeaf(leaf: string[]): boolean {
  return navLeaves.some((other) => other.length > leaf.length && isPrefix(leaf, other));
}

function matchRoute(path: string[]): CompiledRoute | null {
  let best: CompiledRoute | null = null;
  for (const route of compiledRoutes) {
    const { segments } = route;
    const last = segments[segments.length - 1];
    const catchAll = last !== undefined && isCatchAll(last);
    const fixed = catchAll ? segments.slice(0, -1) : segments;
    if (catchAll ? path.length < fixed.length : path.length !== fixed.length) continue;
    const ok = fixed.every((seg, i) => isDynamic(seg) || seg === path[i]);
    if (!ok) continue;
    if (!best || route.staticCount > best.staticCount) best = route;
  }
  return best;
}

/**
 * The permission resource for a page URL.
 * @param pathname locale-free path, e.g. `/admin/shop/orders/123`
 */
export function resolveAdminPageResource(pathname: string): ResolvedResource {
  const clean = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (ALWAYS_ALLOWED_PAGES.includes(clean)) return { key: clean, kind: "exempt" };

  const path = split(clean);
  if (path[0] !== "admin") return { key: UNCLASSIFIED, kind: "unclassified" };

  const route = matchRoute(path);
  if (!route) return { key: UNCLASSIFIED, kind: "unclassified" };

  // The static prefix of the matched pattern: `/admin/shop/orders/[id]/edit` -> admin/shop/orders.
  const prefix: string[] = [];
  for (const segment of route.segments) {
    if (isDynamic(segment)) break;
    prefix.push(segment);
  }

  // Longest nav leaf that is a prefix of that.
  let leaf: string[] | null = null;
  for (const candidate of navLeaves) {
    if (isPrefix(candidate, prefix) && (!leaf || candidate.length > leaf.length)) leaf = candidate;
  }

  if (leaf) {
    const rest = prefix.slice(leaf.length);
    if (rest.length === 0 || rest.every((s) => RECORD_VERBS.has(s)) || !isParentLeaf(leaf)) {
      return { key: resourceKeyFromHref("/" + leaf.join("/")), kind: "resource" };
    }
  }

  // Not under any leaf, or an unlisted page under an overview leaf: its own resource.
  return { key: resourceKeyFromHref("/" + prefix.join("/")), kind: "resource" };
}

/** Is this href one of the sidebar's own leaves? (Catalogue uses it to tell "unlisted" pages.) */
export function isNavHref(href: string): boolean {
  return navHrefSet.has(href);
}

/** Every distinct resource key the manifest's pages resolve to — the permission catalogue. */
export function allPageResourceKeys(): string[] {
  const keys = new Set<string>();
  for (const route of compiledRoutes) {
    // Resolve with the pattern itself; dynamic segments are matched as themselves.
    const resolved = resolveAdminPageResource(route.pattern);
    if (resolved.kind === "resource") keys.add(resolved.key);
  }
  for (const href of ADMIN_NAV_HREFS) keys.add(resourceKeyFromHref(href));
  return [...keys].sort();
}
