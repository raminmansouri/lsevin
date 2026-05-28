import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getCustomers } from "@/features/customers-admin/server/repository";

export default async function CustomersPage() {
  const items = await getCustomers();
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Customers" description="Booking customers, linked identity users, documents and wallet operations" /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <a key={item.id} href={`/admin/customers/${item.id}/update`} className="block rounded-md border p-4 hover:bg-muted/40">
            <div className="font-medium">{item.first_name} {item.last_name}</div>
            <div className="text-sm text-muted-foreground">{item.email} · {item.phone_number_country_code} {item.phone_number}</div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
