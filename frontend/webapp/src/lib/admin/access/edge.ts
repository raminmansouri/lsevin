/**
 * The middleware's half of access control. Edge-safe: no database, no `server-only`.
 */
import { type AdminAccess, can, levelForMethod } from "./policy";
import { resolveAdminPageResource } from "./resolver";

export type AdminRequestDecision =
  /** Let the request through. */
  | "allow"
  /** A signed-in admin who may not open this page: send them to the "no access" page. */
  | "forbidden"
  /** Not an admin (or revoked): treat like any visitor without admin rights. */
  | "not-admin";

/**
 * Decide one admin request from the caller's access.
 *
 * @param pathnameWithoutLocale e.g. `/admin/shop/orders/42`
 * @param method                the HTTP method — a server action is a POST to its page's URL,
 *                              so a write from a page the person may only `view` is refused.
 */
export function decideAdminRequest(
  access: AdminAccess,
  pathnameWithoutLocale: string,
  method: string
): AdminRequestDecision {
  if (access.kind === "none") return "not-admin";
  if (access.kind === "unlimited") return "allow";

  const resolved = resolveAdminPageResource(pathnameWithoutLocale);
  if (resolved.kind === "exempt") return "allow";
  if (resolved.kind === "unclassified") return "forbidden";
  return can(access, resolved.key, levelForMethod(method)) ? "allow" : "forbidden";
}

export type EdgeAccessResult = { ok: true; access: AdminAccess } | { ok: false };

type CacheEntry = { result: EdgeAccessResult; expires: number };
const cache = new Map<string, CacheEntry>();
const EDGE_TTL_MS = 5_000;
const FETCH_TIMEOUT_MS = 4_000;
/** One retry: a cold start or a brief spike must not look like an outage to every admin. */
const FETCH_ATTEMPTS = 2;
const MAX_ENTRIES = 500;

function internalBase(): string {
  const configured = process.env.ADMIN_ACCESS_INTERNAL_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

/**
 * Ask the Node server what this person may do. Cached briefly per user so a page full of
 * prefetching links does not become a page full of lookups. A failure is returned, never
 * guessed at — the caller turns it into a 503.
 */
export async function fetchAdminAccess(userId: string, cookieHeader: string): Promise<EdgeAccessResult> {
  const hit = cache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.result;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(`${internalBase()}/api/internal/admin-access`, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.ok) {
        const body = (await response.json()) as { access?: AdminAccess };
        if (body.access) {
          const result: EdgeAccessResult = { ok: true, access: body.access };
          if (cache.size >= MAX_ENTRIES) cache.clear();
          cache.set(userId, { result, expires: Date.now() + EDGE_TTL_MS });
          return result;
        }
      }
    } catch {
      // timeout or connection failure: try again, then give up (the caller answers 503)
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false };
}

/** Test seam. */
export function clearEdgeAccessCache(): void {
  cache.clear();
}
