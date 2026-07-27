import "server-only";

import { NextResponse } from "next/server";

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
 */
export type ApiAuth = { userId: string; roles: string[] };

export async function getApiAuth(): Promise<ApiAuth | null> {
  // auth() throws rather than returning null on a malformed or key-rotated cookie.
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) return null;
  return { userId, roles: session?.user?.roles ?? [] };
}

export function isApiAdmin(auth: ApiAuth | null): boolean {
  return (
    !!auth && (auth.roles.includes(UserRole.Admin) || auth.roles.includes(UserRole.SuperAdmin))
  );
}

/**
 * Any signed-in user.
 * `const auth = await requireApiUser(); if (auth instanceof NextResponse) return auth;`
 */
export async function requireApiUser(): Promise<ApiAuth | NextResponse> {
  const auth = await getApiAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return auth;
}

/** Admin or SuperAdmin. */
export async function requireApiAdmin(): Promise<ApiAuth | NextResponse> {
  const auth = await getApiAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isApiAdmin(auth)) {
    return NextResponse.json({ error: "Forbidden: admin role required." }, { status: 403 });
  }
  return auth;
}
