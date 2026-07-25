import "server-only";

/**
 * The identity-users admin panel writes to Postgres directly (it does not go through
 * the .NET API), so every privileged server action MUST authorize the caller.
 *
 * The implementation moved to @/lib/auth/admin-guard once the same check was needed by
 * the finance, refund and commercial admin actions — there is one copy now, and this
 * re-export keeps the existing imports in this feature working unchanged.
 */
export { assertAdmin, assertSuperAdmin, getAdminContext } from "@/lib/auth/admin-guard";
export type { AdminContext } from "@/lib/auth/admin-guard";
