import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import db from "@/config/database/db";

export default async function PaymentsPage() {
  const items = await db<any[]>`
    select p.*, trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name
    from booking.payments p
    left join identity.asp_net_users u on u.id = p.user_id
    order by p.created_at desc
    limit 300
  `;

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Booking payments" description="Normalized payment attempts and reconciliations" /></CardTitle></CardHeader>
      <CardContent className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-md border p-4 text-sm"><div className="font-medium">{item.customer_name || item.user_id}</div><div className="text-muted-foreground">{item.payment_method} · {item.status} · {item.gateway || 'manual'}</div><div>{item.amount} {item.currency}</div></div>)}</CardContent>
    </Card>
  );
}
