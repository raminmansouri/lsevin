'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { approveRefundRequestAction, executeRefundRequestAction, rejectRefundRequestAction } from '../../../actions/admin-commercial-actions';

export function RefundRequestDetail({ data }: { data: any }) {
  const [isPending, startTransition] = useTransition();
  const request = data.request;

  const run = (fn: () => Promise<unknown>, success: string) => {
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Action failed.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Refund request</h2>
            <p className="text-sm text-muted-foreground">Booking {request.booking_id}</p>
          </div>
          <div className="flex gap-2">
            {request.status === 'requested' && <Button disabled={isPending} onClick={() => run(() => approveRefundRequestAction(request.id), 'Refund request approved.')}>Approve</Button>}
            {(request.status === 'requested' || request.status === 'approved') && <Button variant="outline" disabled={isPending} onClick={() => run(() => rejectRefundRequestAction(request.id), 'Refund request rejected.')}>Reject</Button>}
            {request.status === 'approved' && <Button variant="secondary" disabled={isPending} onClick={() => run(() => executeRefundRequestAction(request.id), 'Refund executed.')}>Execute</Button>}
          </div>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div><div className="text-muted-foreground">Status</div><div className="font-medium">{request.status}</div></div>
          <div><div className="text-muted-foreground">Scope</div><div className="font-medium">{request.refund_scope}</div></div>
          <div><div className="text-muted-foreground">Payment</div><div className="font-medium">{request.payment_amount ?? '—'} {request.payment_currency ?? ''}</div></div>
          <div><div className="text-muted-foreground">Booking status</div><div className="font-medium">{request.booking_status ?? '—'}</div></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><div className="text-sm text-muted-foreground">Reason</div><div>{request.reason}</div></div>
          <div><div className="text-sm text-muted-foreground">Customer note</div><div>{request.customer_note ?? '—'}</div></div>
          <div><div className="text-sm text-muted-foreground">Admin note</div><div>{request.admin_note ?? '—'}</div></div>
        </div>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="border-b p-4"><h3 className="font-semibold">Refund lines</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Charge line</th>
              <th className="p-3 text-left">Payment refund</th>
              <th className="p-3 text-left">Settlement reversal</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line: any) => (
              <tr key={line.id} className="border-t">
                <td className="p-3">{line.line_type}</td>
                <td className="p-3 text-xs text-muted-foreground">{line.charge_line_id ?? '—'}</td>
                <td className="p-3">{Number(line.payment_refund_amount ?? 0).toFixed(2)} {line.payment_currency_code}</td>
                <td className="p-3">{Number(line.settlement_reversal_amount ?? 0).toFixed(2)} {line.settlement_currency_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="border-b p-4"><h3 className="font-semibold">Refund executions</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Gateway</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Processed</th>
            </tr>
          </thead>
          <tbody>
            {data.refunds.length === 0 && (
              <tr><td className="p-3 text-muted-foreground" colSpan={4}>No refund execution rows yet.</td></tr>
            )}
            {data.refunds.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.gateway ?? 'wallet/gateway stub'}</td>
                <td className="p-3">{Number(row.refund_amount ?? 0).toFixed(2)} {row.currency_code}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.processed_at ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
