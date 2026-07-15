"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/features/booking-admin-shared/server/db";
import { assertSuperAdmin } from "../server/guard";

const schema = z.object({ userId: z.guid() });

// Child rows to remove before deleting the user, in FK-safe order. Each is
// deleted only if the table exists, so this stays correct across schema drift.
const CHILD_TABLES: ReadonlyArray<readonly [table: string, column: string]> = [
  ["identity.asp_net_user_roles", "user_id"],
  ["identity.asp_net_user_claims", "user_id"],
  ["identity.asp_net_user_logins", "user_id"],
  ["identity.asp_net_user_tokens", "user_id"],
  ["identity.access_tokens", "user_id"],
  ["identity.refresh_tokens", "user_id"],
  ["identity.phone_login_codes", "user_id"],
  ["identity.user_preferences", "user_id"],
  ["identity.user_security_settings", "user_id"],
  ["identity.user_sessions", "user_id"],
  ["identity.account_deletion_requests", "user_id"],
];

/**
 * Permanently deletes a user and their dependent rows. Super-admin only.
 * Guards against deleting your own account or the last remaining super admin.
 */
export async function deleteIdentityUserAction(input: unknown) {
  const ctx = await assertSuperAdmin();
  const { userId } = schema.parse(input);

  if (userId === ctx.userId) {
    throw new Error("You cannot delete your own account.");
  }

  // Refuse to delete the last super admin (would lock everyone out of role management).
  const superAdmins = await db<{ user_id: string }[]>`
    select ur.user_id
    from identity.asp_net_user_roles ur
    join identity.asp_net_roles r on r.id = ur.role_id
    where r.name = 'superadmin'
  `;
  const targetIsSuperAdmin = superAdmins.some((s) => s.user_id === userId);
  if (targetIsSuperAdmin && superAdmins.length <= 1) {
    throw new Error("You cannot delete the last super admin.");
  }

  await db.begin(async (sql) => {
    for (const [table, column] of CHILD_TABLES) {
      const [{ reg }] = await sql<{ reg: string | null }[]>`
        select to_regclass(${table}) as reg
      `;
      if (reg) {
        // table/column are hardcoded constants, not user input — safe to inline.
        await sql.unsafe(`delete from ${table} where ${column} = $1`, [userId]);
      }
    }
    await sql`delete from identity.asp_net_users where id = ${userId}`;
  });

  revalidatePath("/admin/identity-users");
  return { success: true };
}
