import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getIdentityUsers } from "@/features/identity-users-admin/server/repository";

export default async function IdentityUsersPage() {
  const items = await getIdentityUsers();
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Identity users" description="Users that own bookings, drafts, wallets and preferences" /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <a key={item.id} href={`/admin/identity-users/${item.id}/update`} className="block rounded-md border p-4 hover:bg-muted/40">
            <div className="font-medium">{item.first_name} {item.last_name}</div>
            <div className="text-sm text-muted-foreground">{item.email} · {item.user_name} · {item.user_state}</div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
