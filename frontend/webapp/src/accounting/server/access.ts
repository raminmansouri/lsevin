import "server-only";

import { redirect } from "next/navigation";

import db from "@/config/database/db";

import { getPanelUser, type PanelRole } from "./panel-auth";
import { getCurrencyLimit } from "./settings.repository";
import { ROLE_PERMISSIONS, type AccountingPermission } from "./permissions";

export { ROLE_PERMISSIONS, hasPermission, type AccountingPermission } from "./permissions";

/**
 * Who may do what inside the financial panel.
 *
 * Authorisation is against accounting.panel_users — the panel's own credentials — not
 * the platform's admin session. That is the point of moving it off the admin panel: an
 * admin account grants nothing here, and a panel account grants nothing there.
 *
 * Every service and server action names the one permission it needs (see
 * permissions.ts). Hiding a button is a courtesy; this check is the boundary.
 */
export class AccountingAccessError extends Error {
  constructor(readonly permission: AccountingPermission) {
    super(`Forbidden: this action requires the financial '${permission}' permission.`);
    this.name = "AccountingAccessError";
  }
}

export async function assertAccounting(
  permission: AccountingPermission
): Promise<{ userId: string; role: PanelRole }> {
  const user = await getPanelUser();
  if (!user || !ROLE_PERMISSIONS[user.role]?.includes(permission)) {
    throw new AccountingAccessError(permission);
  }
  return { userId: user.id, role: user.role };
}

export async function canAccounting(permission: AccountingPermission): Promise<boolean> {
  const user = await getPanelUser();
  return Boolean(user && ROLE_PERMISSIONS[user.role]?.includes(permission));
}

/**
 * For a page a role should not open at all (the audit log, settings): sends anyone
 * without the permission back to the dashboard instead of rendering it.
 */
export async function requirePagePermission(permission: AccountingPermission): Promise<void> {
  if (!(await canAccounting(permission))) redirect("/financial");
}

/** Every permission the signed-in panel user holds, for pages deciding what to show. */
export async function getPanelPermissions(): Promise<Set<AccountingPermission>> {
  const user = await getPanelUser();
  return new Set(user ? (ROLE_PERMISSIONS[user.role] ?? []) : []);
}

/** The setting holding how much the accounting manager may approve alone, per currency. */
export const APPROVAL_LIMIT_SETTING = "approval.accounting_manager_limit";

/**
 * The most a role may approve in one request, or null for no ceiling.
 *
 * Only the accounting manager is capped. Above the cap the request waits for the
 * manager. A currency with no figure configured has no cap, so turning this on is a
 * settings change and never locks a queue by accident.
 */
export async function approvalLimitFor(
  role: PanelRole,
  currencyCode: string,
  /** The caller's transaction, so the limit is read in the same snapshot as the request. */
  sql: unknown = db
): Promise<string | null> {
  if (role !== "accounting_manager") return null;
  return getCurrencyLimit(APPROVAL_LIMIT_SETTING, currencyCode, sql as never);
}
