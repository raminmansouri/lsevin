import "server-only";

import db from "@/config/database/db";

import { type AdminAccess, deriveAccess } from "./policy";

/**
 * Thrown when the access tables cannot be read. Callers must treat it as "deny and report a
 * server problem" — never as a permission failure, and never as "fall back to unlimited".
 */
export class AdminAccessInfrastructureError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("Admin access could not be determined (database unavailable).");
    this.name = "AdminAccessInfrastructureError";
    this.cause = cause;
  }
}

/**
 * How long one process remembers a person's access. A role change made on another pod (or on
 * the other site) is therefore visible within this many seconds; a change made on this pod
 * calls {@link invalidateAdminAccess} and is visible immediately.
 */
export const ACCESS_CACHE_TTL_MS = 10_000;

type Entry = { access: AdminAccess; expires: number };
const globalForCache = globalThis as unknown as { __adminAccessCache?: Map<string, Entry> };
const cache = (globalForCache.__adminAccessCache ??= new Map<string, Entry>());

export function invalidateAdminAccess(userId?: string): void {
  if (userId) cache.delete(userId);
  else cache.clear();
}

type StaffRow = { status: "active" | "disabled" };
type GrantRow = { resourceKey: string; level: string };

/**
 * Resolve what one person may do in the admin panel.
 *
 * The identity roles come from the session (the caller passes them in); the staff assignment and
 * the permissions are read fresh from the database, so revoking someone takes effect within
 * {@link ACCESS_CACHE_TTL_MS} even though their JWT is valid for much longer.
 */
export async function loadAdminAccess(
  userId: string | undefined,
  jwtRoles: readonly string[]
): Promise<AdminAccess> {
  const roles = jwtRoles.map((r) => String(r).trim().toLowerCase());

  // Decided by the token alone — no query for the common cases.
  if (roles.includes("superadmin")) return deriveAccess({ jwtRoles: roles, staffStatus: null, grants: [] });
  if (!userId || !roles.includes("admin")) {
    return deriveAccess({ jwtRoles: roles, staffStatus: null, grants: [] });
  }

  const hit = cache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.access;

  try {
    const [staff, grants] = await Promise.all([
      db<StaffRow[]>`
        select status from auth.staff_members where user_id = ${userId}::uuid
      `,
      db<GrantRow[]>`
        select p.resource_key as "resourceKey", p.level
        from auth.user_roles ur
        join auth.roles r on r.id = ur.role_id and r.is_system = false
        join auth.role_admin_permissions p on p.role_id = r.id
        where ur.user_id = ${userId}::uuid
      `,
    ]);

    const access = deriveAccess({
      jwtRoles: roles,
      staffStatus: staff[0]?.status ?? null,
      grants,
    });
    cache.set(userId, { access, expires: Date.now() + ACCESS_CACHE_TTL_MS });
    return access;
  } catch (error) {
    // Migration 0110 not applied yet (undefined_table / undefined_column): nobody can be under
    // access management, so every admin keeps exactly the access they had before this feature.
    // This is what lets the app be deployed before the migration is run without locking anyone
    // out. It is NOT a fallback for other failures — those throw below.
    const code = (error as { code?: string } | null)?.code;
    if (code === "42P01" || code === "42703") {
      const access = deriveAccess({ jwtRoles: roles, staffStatus: null, grants: [] });
      cache.set(userId, { access, expires: Date.now() + ACCESS_CACHE_TTL_MS });
      return access;
    }
    // Do not cache a failure, and do not guess.
    console.error("[admin-access] failed to load access", {
      userId,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new AdminAccessInfrastructureError(error);
  }
}
