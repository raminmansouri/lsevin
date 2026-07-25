import "server-only";

import { getPanelUser } from "./panel-auth";

/**
 * Who may do what inside the financial panel.
 *
 * Authorisation is against accounting.panel_users — the panel's own credentials — not
 * the platform's admin session. That is the point of moving it off the admin panel: an
 * admin account grants nothing here, and a panel account grants nothing there.
 *
 *   read      — dashboard, journal, reports, audit log
 *   operate   — approve/reject deposits and withdrawals (moves money)
 *   configure — settings and the chart of accounts (decides how much money moves)
 */
export type AccountingCapability = "read" | "operate" | "configure";

type PanelRole = "accountant" | "finance_admin";

const CAPABILITY_ROLES: Record<AccountingCapability, PanelRole[]> = {
  read: ["accountant", "finance_admin"],
  operate: ["accountant", "finance_admin"],
  // Changing the platform fee is a different job from approving a deposit.
  configure: ["finance_admin"],
};

export class AccountingAccessError extends Error {
  constructor(readonly capability: AccountingCapability) {
    super(`Forbidden: this action requires financial '${capability}' access.`);
    this.name = "AccountingAccessError";
  }
}

export async function assertAccounting(
  capability: AccountingCapability
): Promise<{ userId: string }> {
  const user = await getPanelUser();
  if (!user || !CAPABILITY_ROLES[capability].includes(user.role)) {
    throw new AccountingAccessError(capability);
  }
  return { userId: user.id };
}

export async function canAccounting(capability: AccountingCapability): Promise<boolean> {
  const user = await getPanelUser();
  return Boolean(user && CAPABILITY_ROLES[capability].includes(user.role));
}
