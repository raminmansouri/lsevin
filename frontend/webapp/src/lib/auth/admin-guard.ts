import "server-only";

import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";

export type AdminContext = {
  userId?: string;
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

/**
 * The authorization boundary for privileged server actions.
 *
 * Every export of a `"use server"` module is a public POST endpoint. The middleware
 * gates the admin area by URL, but a server action is invoked by action id, not by
 * URL — so an action that does not check the session here is reachable by anyone,
 * from any page, signed in or not. That is how the finance, refund and commercial
 * admin actions ended up writing exchange rates, wallet credits and platform fee
 * percentages for unauthenticated callers.
 *
 * Anything that moves money, changes what money is worth, or changes who is allowed
 * to do either must start with assertAdmin() or assertSuperAdmin().
 */
export async function getAdminContext(): Promise<AdminContext> {
  // auth() throws rather than returning null on a malformed or key-rotated session
  // cookie, so a bare call would surface a NextAuth internal error to the caller.
  const session = await getSession().catch(() => null);
  const roles = session?.user?.roles ?? [];
  const isSuperAdmin = roles.includes(UserRole.SuperAdmin);
  const isAdmin = isSuperAdmin || roles.includes(UserRole.Admin);
  return { userId: session?.user?.id, roles, isAdmin, isSuperAdmin };
}

export async function assertAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) {
    throw new Error("Forbidden: admin access is required.");
  }
  return ctx;
}

export async function assertSuperAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx.isSuperAdmin) {
    throw new Error("Forbidden: super admin access is required.");
  }
  return ctx;
}
