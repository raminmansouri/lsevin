/**
 * The financial panel's roles and what each may do. Pure data, so the same table drives
 * the server checks (access.ts), the menu and buttons, and the tests.
 *
 *   manager             — everything, including settings and approvals above the limit
 *   accounting_manager  — approves documents, deposits, withdrawals and payouts (up to
 *                         the approval limit), manages the chart of accounts
 *   accountant          — prepares: drafts, invoices, templates; sees the queues but
 *                         cannot approve, pay or finalise anything
 *
 * Nobody may delete a posted record; that is enforced by triggers in the database, not
 * by a permission anyone could be granted.
 */
export type PanelRole = "manager" | "accounting_manager" | "accountant";

export const PANEL_ROLES: PanelRole[] = ["manager", "accounting_manager", "accountant"];

/** How the panel (Persian-only) names each role. */
export const PANEL_ROLE_LABEL: Record<PanelRole, string> = {
  manager: "مدیر",
  accounting_manager: "مدیر حسابداری",
  accountant: "حسابدار",
};

export type AccountingPermission =
  /** Dashboard, journal, ledger, reports, statements, lists, attachments, exports. */
  | "books.view"
  | "audit.view"
  /** Create, edit, copy and delete draft documents; send them for approval. */
  | "entry.edit"
  /** Approve or reject a document waiting for approval. */
  | "entry.approve"
  /** Post an approved document to the ledger. */
  | "entry.post"
  /** Create and delete draft invoices. */
  | "invoice.edit"
  /** Issue (posts a journal document) or cancel an invoice. */
  | "invoice.issue"
  | "accounts.manage"
  | "dimensions.manage"
  | "templates.manage"
  /** Build a draft from a template, or run due recurring documents. */
  | "templates.run"
  /** Approve or reject deposits and reservation payments, record a received balance. */
  | "deposit.approve"
  /** Approve or reject withdrawals and provider payouts (subject to the approval limit). */
  | "withdrawal.approve"
  /** Record that a payout actually left (or failed). */
  | "withdrawal.pay"
  /** Add, edit or remove a provider's bank account. */
  | "payout_account.manage"
  | "settings.manage"
  /** Open the Users page; which roles a person may add or remove is canManageRole. */
  | "users.manage";

const ACCOUNTANT: AccountingPermission[] = [
  "books.view",
  "entry.edit",
  "invoice.edit",
  "templates.run",
];

const ACCOUNTING_MANAGER: AccountingPermission[] = [
  ...ACCOUNTANT,
  "audit.view",
  "entry.approve",
  "entry.post",
  "invoice.issue",
  "accounts.manage",
  "dimensions.manage",
  "templates.manage",
  "deposit.approve",
  "withdrawal.approve",
  "withdrawal.pay",
  "payout_account.manage",
  "users.manage",
];

const MANAGER: AccountingPermission[] = [...ACCOUNTING_MANAGER, "settings.manage"];

export const ROLE_PERMISSIONS: Record<PanelRole, readonly AccountingPermission[]> = {
  manager: MANAGER,
  accounting_manager: ACCOUNTING_MANAGER,
  accountant: ACCOUNTANT,
};

/**
 * Which panel accounts each role may add, deactivate or reactivate: the manager looks
 * after accounting managers and accountants, an accounting manager after accountants.
 * Nobody manages a manager from the panel (that stays with the financial-user script),
 * so no one can lock the top role out or grant it to themselves.
 */
export const MANAGEABLE_ROLES: Record<PanelRole, readonly PanelRole[]> = {
  manager: ["accounting_manager", "accountant"],
  accounting_manager: ["accountant"],
  accountant: [],
};

export function canManageRole(actor: PanelRole | null | undefined, target: PanelRole): boolean {
  return Boolean(actor && MANAGEABLE_ROLES[actor]?.includes(target));
}

export function hasPermission(role: PanelRole | null | undefined, permission: AccountingPermission): boolean {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission));
}

/** "12.50" -> { units: 1250n, scale: 2 }. Plain decimals only, as stored. */
function parseDecimal(value: string): { units: bigint; scale: number } | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const [, sign, int, frac = ""] = match;
  const units = BigInt(`${int}${frac}`) * (sign ? -1n : 1n);
  return { units, scale: frac.length };
}

/**
 * Whether an amount is above an approval limit, compared exactly — a JavaScript number
 * would round an 18-decimal amount. No limit (null or empty) is never exceeded.
 */
export function exceedsLimit(amount: string, limit: string | number | null | undefined): boolean {
  if (limit === null || limit === undefined || String(limit).trim() === "") return false;
  const a = parseDecimal(amount);
  const l = parseDecimal(String(limit));
  if (!a || !l) return false;
  const scale = Math.max(a.scale, l.scale);
  return a.units * 10n ** BigInt(scale - a.scale) > l.units * 10n ** BigInt(scale - l.scale);
}
