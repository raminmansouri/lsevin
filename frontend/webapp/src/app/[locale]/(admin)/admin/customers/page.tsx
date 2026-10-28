import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { CustomerSearch } from "@/features/customers-admin/components/customer-search";
import { getCustomers } from "@/features/customers-admin/server/repository";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CustomersPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const items = await getCustomers(q);
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Customers" description="Booking customers, linked identity users, documents and wallet operations" /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <CustomerSearch initialQuery={q} />
        {items.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {q ? "مشتری‌ای با این نام پیدا نشد." : "هیچ مشتری‌ای وجود ندارد."}
          </div>
        )}
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
