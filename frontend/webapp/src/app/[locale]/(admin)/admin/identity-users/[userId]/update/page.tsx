import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { DeleteIdentityUserButton } from "@/features/identity-users-admin/components/delete-identity-user-button";
import { IdentityUserDetailCard } from "@/features/identity-users-admin/components/identity-user-detail-card";
import { IdentityUserForm } from "@/features/identity-users-admin/components/identity-user-form";
import { IdentityUserRolesManager } from "@/features/identity-users-admin/components/identity-user-roles-manager";
import { getAdminContext } from "@/features/identity-users-admin/server/guard";
import { getAllRoles, getIdentityUserById } from "@/features/identity-users-admin/server/repository";

export default async function UpdateIdentityUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [user, allRoles, ctx] = await Promise.all([
    getIdentityUserById(userId),
    getAllRoles(),
    getAdminContext(),
  ]);
  if (!user) return notFound();

  const isSelf = ctx.userId === user.id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={`Update user ${user.user_name}`} /></CardTitle></CardHeader>
        <IdentityUserForm user={user} />
      </Card>

      <IdentityUserRolesManager
        userId={user.id}
        allRoles={allRoles}
        assignedRoles={user.roles ?? []}
        canManage={ctx.isSuperAdmin}
      />

      <IdentityUserDetailCard user={user} />

      {ctx.isSuperAdmin && !isSelf && (
        <Card>
          <CardHeader><CardTitle>حذف کاربر</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">حذف قطعی این کاربر از سیستم.</p>
            <DeleteIdentityUserButton userId={user.id} userName={user.user_name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
