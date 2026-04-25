import { notFound } from "next/navigation";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { IdentityUserDetailCard } from "@/features/identity-users-admin/components/identity-user-detail-card";
import { IdentityUserForm } from "@/features/identity-users-admin/components/identity-user-form";
import { getIdentityUserById } from "@/features/identity-users-admin/server/repository";

export default async function UpdateIdentityUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getIdentityUserById(userId);
  if (!user) return notFound();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={`Update user ${user.user_name}`} /></CardTitle></CardHeader>
        <IdentityUserForm user={user} />
      </Card>
      <IdentityUserDetailCard user={user} />
    </div>
  );
}
