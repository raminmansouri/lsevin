import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import db from "@/config/database/db";
import { approveWalletPaymentIntentAction, rejectWalletPaymentIntentAction } from "./actions";

export default async function WalletPaymentIntentsPage() {
  const items = await db<any[]>`
    select
      wpi.*,
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name,
      u.email as customer_email
    from customer.wallet_payment_intents wpi
    left join identity.asp_net_users u on u.id = wpi.user_id
    order by wpi.create_date desc
    limit 300
  `;

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader
            title="Wallet payment intents"
            description="Production wallet deposits. Bank/manual deposits stay pending until admin confirms; online card deposits are completed only after gateway callback verification."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const status = String(item.status || '').toLowerCase();
          const canReview = ['pending', 'processing', 'requires_action'].includes(status);

          return (
            <div key={item.id} className="rounded-md border p-4 text-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{item.customer_name || item.user_id}</div>
                  {item.customer_email ? <div className="text-muted-foreground">{item.customer_email}</div> : null}
                  <div className="text-muted-foreground">
                    {item.intent_type} · {item.payment_method} · {item.gateway_name || 'manual'} · {item.status}
                  </div>
                  <div className="font-semibold">{item.amount} {item.currency_code}</div>
                  {item.gateway_reference ? <div className="text-xs text-muted-foreground">Reference: {item.gateway_reference}</div> : null}
                </div>

                {canReview ? (
                  <div className="grid gap-2 sm:min-w-[420px] sm:grid-cols-2">
                    <form action={approveWalletPaymentIntentAction} className="rounded-md border border-green-200 bg-green-50 p-3">
                      <input type="hidden" name="intentId" value={item.id} />
                      <label className="text-xs font-medium text-green-900">Confirmed amount</label>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={item.amount}
                        className="mt-1 h-9 w-full rounded border px-2"
                      />
                      <button className="mt-2 w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white">
                        Confirm deposit
                      </button>
                    </form>

                    <form action={rejectWalletPaymentIntentAction} className="rounded-md border border-red-200 bg-red-50 p-3">
                      <input type="hidden" name="intentId" value={item.id} />
                      <label className="text-xs font-medium text-red-900">Reject reason</label>
                      <input
                        name="reason"
                        type="text"
                        defaultValue="Payment was not received"
                        className="mt-1 h-9 w-full rounded border px-2"
                      />
                      <button className="mt-2 w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white">
                        Reject
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
