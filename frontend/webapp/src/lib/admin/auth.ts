import "server-only";

import { headers } from "next/headers";
import { adminLocales } from "./config";
import { getAdminContext } from "../auth/admin-guard";
import { AdminAuthError } from "./errors";

export type AdminSession = {
  userId: string;
  locale: string;
};

/**
 * The admin area's server-side identity check.
 *
 * This used to return `{ userId: session?.user?.id }` — typed `string`, but `undefined`
 * at runtime for anyone not signed in, and with no role check at all. That undefined
 * flows into `where ur.user_id = ${userId}` in getUserAllowedTables, and postgres.js
 * rejects undefined parameters outright (UNDEFINED_VALUE), so a guest got an opaque
 * driver crash instead of a refusal — and any signed-in customer got through.
 *
 * The role check mirrors middleware.ts exactly, so it locks out no admin who can already
 * reach these pages. It matters because middleware does not run on `/api/**`, which is
 * where most of the admin data surface lives.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const h = await headers();

  // auth() throws rather than returning null on a malformed or key-rotated session
  // cookie, which is precisely the case this guard exists for. Same idiom as
  // assertAdminUserId() in admin/wallet-payment-intents/actions.ts.
  // Unlimited admins only. The generic table browser is `table-browser`, which can never be
  // granted to a limited admin (it reaches every table, auth.* included), so this guard keeps
  // its original meaning; a managed admin is refused here exactly like a customer.
  const ctx = await getAdminContext();
  const userId = ctx.userId;

  if (!userId || !ctx.isAdmin) {
    throw new AdminAuthError();
  }

  const locale = h.get("x-admin-locale") || adminLocales.defaultLocale;

  return {
    userId,
    locale: adminLocales.supported.includes(locale) ? locale : adminLocales.defaultLocale,
  };
}
