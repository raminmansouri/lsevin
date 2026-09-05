import "server-only";

import { getAdminContext } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/common";

/**
 * Explicit, named Shop admin permissions (SHP-ADM-017). The platform's access
 * model is role-based (`identity.asp_net_roles`) plus a generic table-grant
 * layer (`auth.role_table_permissions`); there is no named-capability system to
 * reuse, so each Shop permission is defined here and mapped to the roles that
 * may exercise it. This is the seam a finer-grained capability store can slot
 * into later without touching call sites.
 *
 * Money-touching permissions (`payments.view`, `refunds.manage`, `pricing.manage`)
 * require a finance role in addition to plain admin, mirroring how the platform
 * separates "can run the panel" from "can move money".
 */
export const SHOP_PERMISSIONS = {
  catalogManage: "shop.catalog.manage",
  ordersManage: "shop.orders.manage",
  inventoryManage: "shop.inventory.manage",
  merchandisingManage: "shop.merchandising.manage",
  paymentsView: "shop.payments.view",
  refundsManage: "shop.refunds.manage",
  pricingManage: "shop.pricing.manage",
} as const;

export type ShopPermission = (typeof SHOP_PERMISSIONS)[keyof typeof SHOP_PERMISSIONS];

const ADMIN = [UserRole.Admin, UserRole.SuperAdmin] as string[];
const FINANCE = [UserRole.FinanceAdmin, UserRole.SuperAdmin] as string[];
const FINANCE_OR_ACCOUNTANT = [UserRole.FinanceAdmin, UserRole.Accountant, UserRole.SuperAdmin] as string[];

const PERMISSION_ROLES: Record<ShopPermission, string[]> = {
  "shop.catalog.manage": ADMIN,
  "shop.orders.manage": ADMIN,
  "shop.inventory.manage": ADMIN,
  "shop.merchandising.manage": ADMIN,
  "shop.payments.view": FINANCE_OR_ACCOUNTANT,
  "shop.refunds.manage": FINANCE,
  "shop.pricing.manage": [...ADMIN, UserRole.FinanceAdmin],
};

export type ShopAdminActor = { userId?: string; roles: string[] };

export async function getShopActor(): Promise<ShopAdminActor & { isAdmin: boolean }> {
  const ctx = await getAdminContext().catch(() => ({ userId: undefined, roles: [], isAdmin: false }));
  return { userId: ctx.userId, roles: ctx.roles ?? [], isAdmin: Boolean(ctx.isAdmin) };
}

export async function hasShopPermission(permission: ShopPermission): Promise<boolean> {
  const actor = await getShopActor();
  const allowed = PERMISSION_ROLES[permission] ?? [];
  return actor.roles.some((r) => allowed.includes(r));
}

/**
 * Authorization boundary for a specific Shop admin capability. Throws with the
 * permission name so the failure is legible in logs (SHP-NFR-005).
 */
export async function assertShopPermission(permission: ShopPermission): Promise<ShopAdminActor> {
  const actor = await getShopActor();
  const allowed = PERMISSION_ROLES[permission] ?? [];
  if (!actor.roles.some((r) => allowed.includes(r))) {
    throw new Error(`Forbidden: "${permission}" is required for this action.`);
  }
  return actor;
}
