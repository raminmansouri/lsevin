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
 * Reads the caller's session and derives their admin capabilities.
 *
 * The identity-users admin panel writes to Postgres directly (it does not go
 * through the .NET API), so every privileged server action MUST authorize the
 * caller here — this is the only enforcement point.
 */
export async function getAdminContext(): Promise<AdminContext> {
  const session = await getSession({ redirectToLogin: false });
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
