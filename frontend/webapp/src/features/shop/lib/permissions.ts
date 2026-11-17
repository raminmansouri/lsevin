import "server-only";

import { type AdminAccess, can } from "@/lib/admin/access/policy";
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
  /** Issue and revoke API tokens for client websites (sellers). */
  integrationsManage: "shop.integrations.manage",
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
  "shop.integrations.manage": ADMIN,
};

/**
 * The admin-panel resource (src/lib/admin/access) that lets a *limited* admin exercise a Shop
 * permission. Money-touching permissions have no entry on purpose: they stay with the finance
 * roles and unlimited admins, and cannot be handed out through a custom role.
 */
const PERMISSION_RESOURCE: Partial<Record<ShopPermission, string>> = {
  "shop.catalog.manage": "shop.products",
  "shop.orders.manage": "shop.orders",
  "shop.inventory.manage": "shop.inventory",
  "shop.merchandising.manage": "shop.merchandising",
};

export type ShopAdminActor = { userId?: string; roles: string[] };

type ShopActor = ShopAdminActor & { isAdmin: boolean; access?: AdminAccess };

export async function getShopActor(): Promise<ShopActor> {
  const ctx = await getAdminContext().catch(() => null);
  if (!ctx) return { userId: undefined, roles: [], isAdmin: false };
  // ctx.roles already has admin/superadmin removed for a limited admin.
  const roles = (ctx.roles ?? []).map((role) => String(role).trim().toLowerCase()).filter(Boolean);
  return { userId: ctx.userId, roles, isAdmin: Boolean(ctx.isAdmin), access: ctx.access };
}

function actorMay(actor: ShopActor, permission: ShopPermission): boolean {
  const allowed = PERMISSION_ROLES[permission] ?? [];
  if (actor.roles.some((r) => allowed.includes(r))) return true;
  const resource = PERMISSION_RESOURCE[permission];
  return Boolean(resource && actor.access && can(actor.access, resource, "manage"));
}

export async function hasShopPermission(permission: ShopPermission): Promise<boolean> {
  return actorMay(await getShopActor(), permission);
}

/**
 * Authorization boundary for a specific Shop admin capability. Throws with the
 * permission name so the failure is legible in logs (SHP-NFR-005).
 */
export async function assertShopPermission(permission: ShopPermission): Promise<ShopAdminActor> {
  const actor = await getShopActor();
  if (!actorMay(actor, permission)) {
    throw new Error(`Forbidden: "${permission}" is required for this action.`);
  }
  return actor;
}
