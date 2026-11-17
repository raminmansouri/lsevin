/**
 * The middleware's admin gate, shared by BOTH middleware files.
 *
 * The repository carries two middleware files (`middleware.ts` at the root and `src/middleware.ts`)
 * and Next picks one depending on version and mode — the SEO notes say the root one is live in
 * production, while `next dev` here compiled the `src/` one. Until one of them is deleted, both
 * must enforce the same rule, so the rule lives here and each file only calls it.
 */
import { NextResponse, type NextRequest } from "next/server";

import { publicAppUrl } from "@/lib/http/public-origin";

import { decideAdminAction } from "./actions";
import { decideAdminRequest, fetchActionPages, fetchAdminAccess } from "./edge";

export type AdminGateInput = {
  request: NextRequest;
  /** Session user id (the caller has already checked that someone is signed in). */
  userId: string | undefined;
  /** Identity roles from the session token. */
  roles: readonly string[] | undefined;
  /** Locale-free path, e.g. `/admin/shop/orders`. */
  pathnameWithoutLocale: string;
  /** `/en`, `/fa`, … — where redirects go. */
  localePrefix: string;
};

const unavailable = () =>
  new NextResponse("Admin access service unavailable. Please retry shortly.", {
    status: 503,
    headers: { "Retry-After": "5", "Cache-Control": "no-store" },
  });

const forbiddenWrite = () => new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });

/**
 * Returns a response that stops the request (redirect, 403 or 503), or `null` to let it through.
 *
 * Super admins are never narrowed. A plain `admin` is unlimited unless someone put them under
 * access management, which only the database knows — so ask the Node server (cached for a few
 * seconds) and refuse on failure rather than guess: a database blip must not open the panel to a
 * restricted admin.
 */
export async function enforceAdminAccess(input: AdminGateInput): Promise<NextResponse | null> {
  const { request, userId, roles, pathnameWithoutLocale, localePrefix } = input;
  if (roles?.includes("superadmin")) return null;
  if (!pathnameWithoutLocale.startsWith("/admin")) return null;

  const result = await fetchAdminAccess(userId ?? "", request.headers.get("cookie") ?? "");
  if (!result.ok) return unavailable();

  const decision = decideAdminRequest(result.access, pathnameWithoutLocale, request.method);
  if (decision === "allow") {
    // A server action is called by id, not by URL. A limited admin who may manage this page could still
    // post ANOTHER area's action id to it, so for them the id is checked too (see actions.ts).
    if (result.access.kind === "limited" && request.method !== "GET" && request.method !== "HEAD") {
      const actionId = request.headers.get("next-action");
      // Every real call from the admin UI carries the header. A write without one (a hand-made form
      // post, or a multipart request that names the action in its body) cannot be attributed to an
      // area, so it is refused.
      if (!actionId) return forbiddenWrite();
      const pages = await fetchActionPages(actionId);
      if (!pages.ok) return unavailable();
      if (decideAdminAction(result.access, pages.pages) === "forbidden") return forbiddenWrite();
    }
    return null;
  }
  if (decision === "not-admin") return NextResponse.redirect(publicAppUrl(request, `${localePrefix}/`));

  // forbidden. A write (server action) that is not allowed must fail as a write, not as a
  // redirect the browser would silently follow and render as a page.
  if (request.method !== "GET" && request.method !== "HEAD") return forbiddenWrite();
  const denied = publicAppUrl(request, `${localePrefix}/admin/access-denied`);
  denied.searchParams.set("from", pathnameWithoutLocale);
  return NextResponse.redirect(denied);
}
