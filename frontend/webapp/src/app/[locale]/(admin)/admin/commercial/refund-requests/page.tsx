import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminRefundRequests } from '@/features/commercial/api/server/get-admin-commercial';

export default async function RefundRequestsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>>; }) {
  const params = await searchParams;
  const status = typeof params?.status === 'string' ? params.status : '';
  const bookingId = typeof params?.bookingId === 'string' ? params.bookingId : '';
  const rows = await getAdminRefundRequests({ status: status || undefined, bookingId: bookingId || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refund requests</h1>
        <p className="text-sm text-muted-foreground">Manage requested, approved, processing, and refunded booking refunds.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <input type="text" name="bookingId" defaultValue={bookingId} placeholder="Booking id" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="status" defaultValue={status} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="requested">requested</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="processing">processing</option>
              <option value="refunded">refunded</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button type="submit" className="rounded-md border px-3 py-2 text-sm">Apply</button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Booking</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Scope</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="p-3 text-xs text-muted-foreground">{row.booking_id}</td>
                <td className="p-3">
                  <div className="font-medium">{row.reason}</div>
                  <div className="text-xs text-muted-foreground">{row.customer_note ?? '—'}</div>
                </td>
                <td className="p-3">{row.refund_scope}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.payment_amount ?? '—'} {row.payment_currency ?? ''}</td>
                <td className="p-3">{row.created_at}</td>
                <td className="p-3 text-right"><Link href={`/admin/commercial/refund-requests/${row.id}`} className="underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
