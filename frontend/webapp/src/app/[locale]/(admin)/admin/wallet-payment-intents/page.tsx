import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import db from "@/config/database/db";

export default async function WalletPaymentIntentsPage() {
  const items = await db<any[]>`
    select wpi.*, trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name
    from customer.wallet_payment_intents wpi
    left join identity.asp_net_users u on u.id = wpi.user_id
    order by wpi.create_date desc
    limit 300
  `;

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Wallet payment intents" description="Booking payment intents bound to wallet checkout" /></CardTitle></CardHeader>
      <CardContent className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-md border p-4 text-sm"><div className="font-medium">{item.customer_name || item.user_id}</div><div className="text-muted-foreground">{item.intent_type} · {item.payment_method} · {item.status}</div><div>{item.amount} {item.currency_code}</div></div>)}</CardContent>
    </Card>
  );
}
