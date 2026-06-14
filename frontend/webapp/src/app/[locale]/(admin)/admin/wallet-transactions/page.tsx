import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import db from "@/config/database/db";
import { getTranslations } from "next-intl/server";

export default async function WalletTransactionsPage() {
  const t = await getTranslations("Admin.walletTransactions");
  const items = await db<any[]>`
    select wt.*, trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name
    from customer.wallet_transactions wt
    left join identity.asp_net_users u on u.id = wt.user_id
    order by wt.occurred_at desc
    limit 300
  `;

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={t("title")} description={t("description")} /></CardTitle></CardHeader>
      <CardContent className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-md border p-4 text-sm"><div className="font-medium">{item.title}</div><div className="text-muted-foreground">{item.customer_name || item.user_id} · {item.transaction_type} · {item.direction} · {item.status}</div><div>{item.amount} {item.currency_code}</div></div>)}</CardContent>
    </Card>
  );
}
