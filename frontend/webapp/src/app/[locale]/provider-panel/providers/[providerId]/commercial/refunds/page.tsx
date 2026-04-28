import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProviderRefundRequests } from '@/features/provider-commercial/server/repository';

export default async function ProviderRefundRequestsPage({ params, searchParams }: { params: Promise<{ providerId: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { providerId } = await params;
  const sp = await searchParams;
  const bookingId = typeof sp?.bookingId === 'string' ? sp.bookingId : '';
  const status = typeof sp?.status === 'string' ? sp.status : '';
  const rows = await getProviderRefundRequests(providerId, { bookingId: bookingId || undefined, status: status || undefined });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Provider refunds</h1><p className="text-sm text-muted-foreground">View refund requests that touch this provider’s charge lines.</p></div>
      <Card>
        <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3">
            <input type="text" name="bookingId" defaultValue={bookingId} placeholder="Booking id" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="status" defaultValue={status} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="requested">requested</option><option value="approved">approved</option><option value="rejected">rejected</option><option value="processing">processing</option><option value="refunded">refunded</option><option value="failed">failed</option><option value="cancelled">cancelled</option>
            </select>
            <button type="submit" className="rounded-md border px-3 py-2 text-sm">Apply</button>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-muted/50"><tr><th className="p-3 text-left">Booking</th><th className="p-3 text-left">Reason</th><th className="p-3 text-left">Scope</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Payment</th><th className="p-3 text-right">Action</th></tr></thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="p-3 text-xs text-muted-foreground">{row.booking_id}</td>
                <td className="p-3"><div className="font-medium">{row.reason}</div><div className="text-xs text-muted-foreground">{row.customer_note ?? '—'}</div></td>
                <td className="p-3">{row.refund_scope}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.payment_amount ?? '—'} {row.payment_currency ?? ''}</td>
                <td className="p-3 text-right"><Link className="underline" href={`/provider-panel/providers/${providerId}/commercial/refunds/${row.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
