import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * SHP-ADM-017 — the named Shop permissions map to the right roles, and a plain
 * admin cannot exercise the money-touching ones.
 */

const getAdminContext = vi.fn();
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: (...a: unknown[]) => getAdminContext(...a),
}));

import { SHOP_PERMISSIONS, assertShopPermission, hasShopPermission } from "./permissions";

function actor(roles: string[]) {
  getAdminContext.mockResolvedValue({ userId: "u1", roles, isAdmin: roles.some((r) => r === "admin" || r === "superadmin") });
}

beforeEach(() => vi.clearAllMocks());

describe("hasShopPermission", () => {
  it("plain admin can manage catalog / orders / inventory / merchandising", async () => {
    actor(["admin"]);
    for (const p of [
      SHOP_PERMISSIONS.catalogManage,
      SHOP_PERMISSIONS.ordersManage,
      SHOP_PERMISSIONS.inventoryManage,
      SHOP_PERMISSIONS.merchandisingManage,
    ]) {
      await expect(hasShopPermission(p)).resolves.toBe(true);
    }
  });

  it("plain admin CANNOT manage refunds or view payments", async () => {
    actor(["admin"]);
    await expect(hasShopPermission(SHOP_PERMISSIONS.refundsManage)).resolves.toBe(false);
    await expect(hasShopPermission(SHOP_PERMISSIONS.paymentsView)).resolves.toBe(false);
  });

  it("financeadmin can manage refunds + pricing + view payments", async () => {
    actor(["financeadmin"]);
    await expect(hasShopPermission(SHOP_PERMISSIONS.refundsManage)).resolves.toBe(true);
    await expect(hasShopPermission(SHOP_PERMISSIONS.pricingManage)).resolves.toBe(true);
    await expect(hasShopPermission(SHOP_PERMISSIONS.paymentsView)).resolves.toBe(true);
  });

  it("financeadmin is NOT a catalog manager", async () => {
    actor(["financeadmin"]);
    await expect(hasShopPermission(SHOP_PERMISSIONS.catalogManage)).resolves.toBe(false);
  });

  it("accountant can view payments but not refund", async () => {
    actor(["accountant"]);
    await expect(hasShopPermission(SHOP_PERMISSIONS.paymentsView)).resolves.toBe(true);
    await expect(hasShopPermission(SHOP_PERMISSIONS.refundsManage)).resolves.toBe(false);
  });

  it("superadmin can do everything", async () => {
    actor(["superadmin"]);
    for (const p of Object.values(SHOP_PERMISSIONS)) {
      await expect(hasShopPermission(p)).resolves.toBe(true);
    }
  });

  it("no roles => nothing", async () => {
    actor([]);
    for (const p of Object.values(SHOP_PERMISSIONS)) {
      await expect(hasShopPermission(p)).resolves.toBe(false);
    }
  });
});

describe("assertShopPermission", () => {
  it("throws with the permission name when denied", async () => {
    actor(["admin"]);
    await expect(assertShopPermission(SHOP_PERMISSIONS.refundsManage)).rejects.toThrow("shop.refunds.manage");
  });
  it("returns the actor when allowed", async () => {
    actor(["superadmin"]);
    await expect(assertShopPermission(SHOP_PERMISSIONS.catalogManage)).resolves.toMatchObject({ userId: "u1" });
  });
});
