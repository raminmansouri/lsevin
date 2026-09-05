import "server-only";

import sql from "@/config/database/db";

import { getShopContext, normalizeLocale, resolveShopCustomerId } from "./context";

/**
 * Thin compatibility surface kept so the original scaffold's imports still
 * resolve. New code should import from `./context` and `./pricing` directly.
 */
export { sql, normalizeLocale };

/** @deprecated use `getShopContext().customerId` */
export async function resolveCurrentCustomerId(): Promise<string | null> {
  const ctx = await getShopContext();
  return ctx.customerId;
}

export { resolveShopCustomerId };

/** @deprecated use `assertShopAdmin` from `./context` */
export async function assertAdmin(): Promise<void> {
  const { assertShopAdmin } = await import("./context");
  await assertShopAdmin();
}
