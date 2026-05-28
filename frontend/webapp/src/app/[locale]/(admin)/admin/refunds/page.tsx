import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { listAdminRefundRequests } from "@/features/refunds/server/repository";
import { approveRefundToWalletAction, rejectRefundRequestAction } from "./actions";

export default async function AdminRefundsPage() {
  const items = await listAdminRefundRequests();

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader
            title="Refund requests"
            description="Review customer refund requests. Approved refunds are credited to the customer wallet and recorded in commercial refund tables."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const status = String(item.status || '').toLowerCase();
          const paidAmount = Number(item.paid_amount ?? 0);
          const alreadyRefunded = Number(item.already_refunded_amount ?? 0);
          const refundable = Math.max(0, paidAmount - alreadyRefunded);
          const canReview = ['requested', 'approved', 'processing', 'failed'].includes(status) && refundable > 0;

          return (
            <div key={item.id} className="rounded-md border p-4 text-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-1">
                  <div className="font-semibold">{item.customer_name || item.user_id}</div>
                  <div className="text-muted-foreground">{item.customer_email}</div>
                  <div className="text-muted-foreground">{item.provider_name} · {item.service_name}</div>
                  <div>Booking: <span className="font-mono text-xs">{item.booking_id}</span></div>
                  <div>Status: <span className="font-semibold">{item.status}</span> · Scope: {item.refund_scope}</div>
                  <div>Reason: {item.reason}</div>
                  {item.customer_note ? <div>Customer note: {item.customer_note}</div> : null}
                  <div className="font-semibold">
                    Paid {paidAmount} {item.currency_code} · already refunded {alreadyRefunded} · refundable {refundable}
                  </div>
                </div>

                {canReview ? (
                  <div className="grid gap-2 sm:min-w-[520px] sm:grid-cols-2">
                    <form action={approveRefundToWalletAction} className="rounded-md border border-green-200 bg-green-50 p-3">
                      <input type="hidden" name="refundRequestId" value={item.id} />
                      <label className="text-xs font-medium text-green-900">Refund amount</label>
                      <input name="amount" type="number" step="0.01" defaultValue={refundable} className="mt-1 h-9 w-full rounded border px-2" />
                      <label className="mt-2 block text-xs font-medium text-green-900">Admin note</label>
                      <input name="adminNote" type="text" defaultValue="Approved as wallet credit" className="mt-1 h-9 w-full rounded border px-2" />
                      <button className="mt-2 w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white">Approve to wallet</button>
                    </form>

                    <form action={rejectRefundRequestAction} className="rounded-md border border-red-200 bg-red-50 p-3">
                      <input type="hidden" name="refundRequestId" value={item.id} />
                      <label className="text-xs font-medium text-red-900">Reject reason</label>
                      <input name="adminNote" type="text" defaultValue="Refund policy conditions are not met" className="mt-1 h-9 w-full rounded border px-2" />
                      <button className="mt-2 w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white">Reject</button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {items.length === 0 ? <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">No refund requests yet.</div> : null}
      </CardContent>
    </Card>
  );
}
