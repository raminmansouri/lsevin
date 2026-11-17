import "server-only";

import { type AccessLevel, type AdminAccess, can } from "@/lib/admin/access/policy";
import { loadAdminAccess } from "@/lib/admin/access/store";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";

export type AdminContext = {
  userId?: string;
  /**
   * The caller's roles as far as authorization is concerned. `admin` and `superadmin` are
   * removed unless the caller really has unlimited access — a managed (limited) admin still
   * carries the identity `admin` role in their token because the .NET backend needs it, and
   * code that decides by `roles.includes("admin")` must not be fooled by that.
   */
  roles: string[];
  /** Unlimited access: superadmin, or an admin nobody has put under access management. */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** The full picture; use `can(ctx.access, resource, level)` or {@link assertAdmin}. */
  access: AdminAccess;
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
 *
 * ## Access management
 *
 * `isAdmin` means *unlimited*. A limited admin (see src/lib/admin/access) is `isAdmin: false`,
 * so a guard written before access management existed refuses them — safe by default. A
 * guard opts a feature in by naming the admin area it belongs to:
 *
 *     await assertAdmin("shop.orders", "manage");
 */
export async function getAdminContext(): Promise<AdminContext> {
  // auth() throws rather than returning null on a malformed or key-rotated session
  // cookie, so a bare call would surface a NextAuth internal error to the caller.
  const session = await getSession().catch(() => null);
  const tokenRoles = (session?.user?.roles ?? [])
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  const userId = session?.user?.id;
  const access = await loadAdminAccess(userId, tokenRoles);

  const isSuperAdmin = access.kind === "unlimited" && access.reason === "superadmin";
  const isAdmin = access.kind === "unlimited";
  const roles = isAdmin
    ? tokenRoles
    : tokenRoles.filter((role) => role !== UserRole.Admin && role !== UserRole.SuperAdmin);

  return { userId, roles, isAdmin, isSuperAdmin, access };
}

/**
 * Require an admin.
 *
 * - No argument: unlimited admins only (the legacy meaning).
 * - With `resource`: also lets a limited admin through if their roles grant that resource at
 *   `level`. `level` defaults to `manage` — the safe choice for an action that writes. Pass
 *   `"view"` from a page render or a read-only handler.
 */
export async function assertAdmin(
  resource?: string,
  level: AccessLevel = "manage"
): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (ctx.isAdmin) return ctx;
  if (resource && can(ctx.access, resource, level)) return ctx;
  throw new Error(
    resource
      ? `Forbidden: "${resource}" (${level}) access is required.`
      : "Forbidden: admin access is required."
  );
}

/** Explicit spelling of `assertAdmin(resource, level)` for call sites that always name one. */
export async function assertAdminAccess(
  resource: string,
  level: AccessLevel = "manage"
): Promise<AdminContext> {
  return assertAdmin(resource, level);
}

/**
 * Non-throwing counterpart of {@link assertAdmin}, for actions that report a refusal as a
 * result object instead of an exception: unlimited admins, or a limited admin whose roles
 * grant `resource` at `level`.
 */
export function adminMay(ctx: AdminContext, resource: string, level: AccessLevel = "manage"): boolean {
  return ctx.isAdmin || can(ctx.access, resource, level);
}

export async function assertSuperAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx.isSuperAdmin) {
    throw new Error("Forbidden: super admin access is required.");
  }
  return ctx;
}
