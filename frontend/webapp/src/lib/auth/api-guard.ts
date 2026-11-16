import "server-only";

import { NextResponse } from "next/server";

import { type AccessLevel, type AdminAccess, can } from "@/lib/admin/access/policy";
import { AdminAccessInfrastructureError, loadAdminAccess } from "@/lib/admin/access/store";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";

/**
 * Authorization boundary for `/api/**` route handlers.
 *
 * The middleware matcher in src/middleware.ts is `/((?!api|trpc|_next|_vercel|.*\..*).*)`,
 * so nothing under `/api` ever reaches the middleware. A route handler there is a raw
 * public endpoint until it checks the session itself — which is how anonymous callers
 * ended up able to list bookings, delete media and query arbitrary lookup tables.
 *
 * This is the route-handler twin of assertAdmin() in @/lib/auth/admin-guard: same
 * session source, same role rule, but it returns a response instead of throwing so a
 * handler can bail out in two lines and keep its own error shape.
 *
 * Narrow with `instanceof NextResponse`. A `{ response: NextResponse | null }` union
 * would not narrow under `strict` — this form is sound either way.
 *
 * `/api/admin/**` handlers must name the admin area they serve —
 * `requireApiAdmin("bookings", "view")` — so a limited admin who holds that area can use it.
 * With no argument only unlimited admins pass (see src/lib/admin/access/README.md).
 */
export type ApiAuth = {
  userId: string;
  /** Effective roles: `admin`/`superadmin` are removed for a limited admin (see AdminContext). */
  roles: string[];
  access: AdminAccess;
};

export async function getApiAuth(): Promise<ApiAuth | null> {
  // auth() throws rather than returning null on a malformed or key-rotated cookie.
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) return null;
  const tokenRoles = (session?.user?.roles ?? []).map((r) => String(r).trim().toLowerCase());
  const access = await loadAdminAccess(userId, tokenRoles);
  const roles =
    access.kind === "unlimited"
      ? tokenRoles
      : tokenRoles.filter((r) => r !== UserRole.Admin && r !== UserRole.SuperAdmin);
  return { userId, roles, access };
}

/** Unlimited admin. A limited admin is *not* an admin here — name a resource to let them in. */
export function isApiAdmin(auth: ApiAuth | null): boolean {
  return !!auth && auth.access.kind === "unlimited";
}

function unavailable(): NextResponse {
  return NextResponse.json({ error: "Access service unavailable." }, { status: 503 });
}

/**
 * Any signed-in user.
 * `const auth = await requireApiUser(); if (auth instanceof NextResponse) return auth;`
 */
export async function requireApiUser(): Promise<ApiAuth | NextResponse> {
  try {
    const auth = await getApiAuth();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return auth;
  } catch (error) {
    if (error instanceof AdminAccessInfrastructureError) return unavailable();
    throw error;
  }
}

/**
 * Admin, optionally scoped to one admin area.
 * @param resource permission resource of the area this handler serves, e.g. `bookings`
 * @param level    `view` for reads; `manage` (the default) for anything that writes
 */
export async function requireApiAdmin(
  resource?: string,
  level: AccessLevel = "manage"
): Promise<ApiAuth | NextResponse> {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  if (isApiAdmin(auth) || (resource && can(auth.access, resource, level))) return auth;
  return NextResponse.json({ error: "Forbidden: admin role required." }, { status: 403 });
}
