import { describe, expect, it } from "vitest";

import { exceedsLimit, hasPermission, PANEL_ROLES, ROLE_PERMISSIONS, type AccountingPermission } from "./permissions";

/**
 * The role table is the whole access policy of the financial panel, so it is pinned here
 * permission by permission: a change to who may move money should fail a test, not slip
 * through in a refactor. Pure data, no database.
 */
const EXPECTED: Record<AccountingPermission, { manager: boolean; accounting_manager: boolean; accountant: boolean }> = {
  "books.view": { manager: true, accounting_manager: true, accountant: true },
  "entry.edit": { manager: true, accounting_manager: true, accountant: true },
  "invoice.edit": { manager: true, accounting_manager: true, accountant: true },
  "templates.run": { manager: true, accounting_manager: true, accountant: true },
  "audit.view": { manager: true, accounting_manager: true, accountant: false },
  "entry.approve": { manager: true, accounting_manager: true, accountant: false },
  "entry.post": { manager: true, accounting_manager: true, accountant: false },
  "invoice.issue": { manager: true, accounting_manager: true, accountant: false },
  "accounts.manage": { manager: true, accounting_manager: true, accountant: false },
  "dimensions.manage": { manager: true, accounting_manager: true, accountant: false },
  "templates.manage": { manager: true, accounting_manager: true, accountant: false },
  "deposit.approve": { manager: true, accounting_manager: true, accountant: false },
  "withdrawal.approve": { manager: true, accounting_manager: true, accountant: false },
  "withdrawal.pay": { manager: true, accounting_manager: true, accountant: false },
  "payout_account.manage": { manager: true, accounting_manager: true, accountant: false },
  "settings.manage": { manager: true, accounting_manager: false, accountant: false },
};

describe("financial panel roles", () => {
  for (const [permission, byRole] of Object.entries(EXPECTED) as [AccountingPermission, (typeof EXPECTED)[AccountingPermission]][]) {
    for (const role of PANEL_ROLES) {
      it(`${role} ${byRole[role] ? "may" : "may not"} ${permission}`, () => {
        expect(hasPermission(role, permission)).toBe(byRole[role]);
      });
    }
  }

  it("grants nothing that the table above does not list", () => {
    for (const role of PANEL_ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(EXPECTED[permission]?.[role]).toBe(true);
      }
    }
  });

  it("is ordered: each role holds everything the role below it holds", () => {
    const has = (role: (typeof PANEL_ROLES)[number]) => new Set(ROLE_PERMISSIONS[role]);
    for (const p of has("accountant")) expect(has("accounting_manager").has(p)).toBe(true);
    for (const p of has("accounting_manager")) expect(has("manager").has(p)).toBe(true);
  });

  it("grants nothing to a missing or unknown role", () => {
    expect(hasPermission(null, "books.view")).toBe(false);
    expect(hasPermission("finance_admin" as never, "books.view")).toBe(false);
  });
});

describe("approval limit comparison", () => {
  it("compares exactly, without rounding", () => {
    expect(exceedsLimit("500000000", "500000000")).toBe(false);
    expect(exceedsLimit("500000000.01", "500000000")).toBe(true);
    expect(exceedsLimit("499999999.999999999999999999", "500000000")).toBe(false);
    expect(exceedsLimit("10", "9.5")).toBe(true);
    expect(exceedsLimit("100", 50)).toBe(true);
  });

  it("treats no limit as no ceiling, and a negative amount as never over", () => {
    expect(exceedsLimit("100", null)).toBe(false);
    expect(exceedsLimit("100", undefined)).toBe(false);
    expect(exceedsLimit("100", "")).toBe(false);
    expect(exceedsLimit("-100", "0")).toBe(false);
  });
});
