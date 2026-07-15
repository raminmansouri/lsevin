"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/features/booking-admin-shared/server/db";
import { UserRole } from "@/types/common";
import { assertSuperAdmin } from "../server/guard";

const schema = z.object({
  userId: z.guid(),
  roleIds: z.array(z.guid()),
});

/**
 * Replaces the full set of roles assigned to a user. Super-admin only.
 * Writes directly to identity.asp_net_user_roles (same tables the .NET backend
 * reads when minting JWTs, so changes take effect on the user's next login).
 */
export async function setUserRolesAction(input: unknown) {
  const ctx = await assertSuperAdmin();
  const { userId, roleIds } = schema.parse(input);

  // Only allow role ids that actually exist.
  const allRoles = await db<{ id: string; name: string }[]>`
    select id, name from identity.asp_net_roles
  `;
  const byId = new Map(allRoles.map((r) => [r.id, r.name]));
  const validIds = [...new Set(roleIds.filter((id) => byId.has(id)))];
  const nextRoleNames = validIds.map((id) => byId.get(id));

  // Safety: a super admin cannot strip their own super-admin role (avoids self-lockout).
  if (userId === ctx.userId && !nextRoleNames.includes(UserRole.SuperAdmin)) {
    throw new Error("You cannot remove your own super admin role.");
  }

  await db.begin(async (sql) => {
    await sql`delete from identity.asp_net_user_roles where user_id = ${userId}`;
    for (const roleId of validIds) {
      await sql`
        insert into identity.asp_net_user_roles (user_id, role_id)
        values (${userId}, ${roleId})
      `;
    }
  });

  revalidatePath(`/admin/identity-users/${userId}/update`);
  revalidatePath("/admin/identity-users");
  return { success: true };
}
