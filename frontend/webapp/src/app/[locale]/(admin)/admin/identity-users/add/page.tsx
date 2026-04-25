import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { IdentityUserForm } from "@/features/identity-users-admin/components/identity-user-form";

export default function AddIdentityUserPage() {
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Create identity user" /></CardTitle></CardHeader>
      <IdentityUserForm />
    </Card>
  );
}
