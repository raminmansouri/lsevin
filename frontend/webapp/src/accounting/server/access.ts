import "server-only";

import { getAdminContext } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/common";

/**
 * Who may do what in the accounting area.
 *
 * Split from the general admin guard on purpose: reading the books and working the
 * approval queues is a different job from running the platform, and the person doing it
 * should not need — or get — the rest of the admin panel. Equally, an accountant who can
 * approve a deposit should not silently also be able to change the platform fee.
 *
 *   read     — dashboard, journal, reports, audit log
 *   operate  — approve/reject deposits and withdrawals (moves money)
 *   configure— settings and the chart of accounts (decides how much money moves)
 */
export type AccountingCapability = "read" | "operate" | "configure";

const CAPABILITY_ROLES: Record<AccountingCapability, UserRole[]> = {
  read: [UserRole.SuperAdmin, UserRole.Admin, UserRole.FinanceAdmin, UserRole.Accountant],
  operate: [UserRole.SuperAdmin, UserRole.Admin, UserRole.FinanceAdmin, UserRole.Accountant],
  configure: [UserRole.SuperAdmin, UserRole.Admin, UserRole.FinanceAdmin],
};

export class AccountingAccessError extends Error {
  constructor(readonly capability: AccountingCapability) {
    super(`Forbidden: this action requires accounting '${capability}' access.`);
    this.name = "AccountingAccessError";
  }
}

export async function assertAccounting(capability: AccountingCapability): Promise<{ userId: string }> {
  const ctx = await getAdminContext();
  const allowed = CAPABILITY_ROLES[capability];

  if (!ctx.userId || !ctx.roles.some((role) => allowed.includes(role as UserRole))) {
    throw new AccountingAccessError(capability);
  }
  return { userId: ctx.userId };
}

export async function canAccounting(capability: AccountingCapability): Promise<boolean> {
  const ctx = await getAdminContext();
  const allowed = CAPABILITY_ROLES[capability];
  return Boolean(ctx.userId && ctx.roles.some((role) => allowed.includes(role as UserRole)));
}
