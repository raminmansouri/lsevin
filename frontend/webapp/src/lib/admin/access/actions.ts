/**
 * Which admin area does a server action belong to?
 *
 * A server action is invoked by id (the `Next-Action` header), not by URL, so a limited admin who may
 * manage area A could POST area B's action id to a page of area A: the URL gate would see "a write to
 * a page they hold" and let it through. This closes that, for every action and without registering
 * any of them: `next build` writes `server-reference-manifest.json`, which lists, for each action id,
 * the page entries that import it. An action that only admin pages import belongs to those pages'
 * areas; a limited admin may call it only if they can manage one of them.
 *
 * Pure and Edge-safe (the I/O lives in action-manifest.ts, which only the Node server can run).
 */
import { type AdminAccess, can } from "./policy";
import { resolveAdminPageResource } from "./resolver";

/**
 * `app/[locale]/(admin)/admin/editorial/page` -> `/admin/editorial`.
 * Locale, route groups and parallel slots are not part of the URL.
 */
export function workerToUrl(worker: string): string {
  const segments = worker
    .split("/")
    .filter(Boolean)
    .filter((segment, index) => !(index === 0 && segment === "app"))
    .filter((segment) => segment !== "[locale]" && !(segment.startsWith("(") && segment.endsWith(")")) && !segment.startsWith("@"));
  const last = segments[segments.length - 1];
  if (last === "page" || last === "route") segments.pop();
  return "/" + segments.join("/");
}

/** The page entries that import an action, from a parsed `server-reference-manifest.json`; null if unknown. */
export function pagesForAction(manifest: unknown, actionId: string): string[] | null {
  const node = (manifest as { node?: Record<string, { workers?: unknown }> } | null)?.node;
  const entry = node?.[actionId];
  if (!entry) return null;
  const workers = entry.workers;
  if (Array.isArray(workers)) return workers.filter((w): w is string => typeof w === "string");
  if (workers && typeof workers === "object") return Object.keys(workers);
  return [];
}

export type ActionDecision = "allow" | "forbidden";

/**
 * May this person call this action?
 *
 * @param pages the pages that import it, or `null` when the action id is not in the manifest
 */
export function decideAdminAction(access: AdminAccess, pages: readonly string[] | null): ActionDecision {
  if (access.kind === "unlimited") return "allow";
  if (access.kind === "none") return "forbidden";
  // An id nobody can account for is refused rather than guessed at.
  if (!pages || pages.length === 0) return "forbidden";

  const urls = pages.map(workerToUrl);
  // Also imported by a page outside the admin panel: not an admin-only action (a shared component's
  // action, or a customer-facing one), so the admin permission model does not apply to it.
  if (urls.some((url) => url !== "/admin" && !url.startsWith("/admin/"))) return "allow";

  const resources = urls
    .map((url) => resolveAdminPageResource(url))
    .filter((resolved) => resolved.kind === "resource")
    .map((resolved) => resolved.key);
  // Only exempt pages (e.g. the no-access page) import it: nothing to protect.
  if (resources.length === 0) return urls.every((url) => resolveAdminPageResource(url).kind === "exempt") ? "allow" : "forbidden";

  return resources.some((key) => can(access, key, "manage")) ? "allow" : "forbidden";
}
