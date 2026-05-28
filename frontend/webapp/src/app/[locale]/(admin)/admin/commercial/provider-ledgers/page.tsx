import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminProviderLedgers } from '@/features/commercial/api/server/get-admin-commercial';
import { ProviderLedgerTable } from '@/features/commercial/components/admin/provider-ledger-table';

export default async function ProviderLedgersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>>; }) {
  const params = await searchParams;
  const providerId = typeof params?.providerId === 'string' ? params.providerId : '';
  const bookingId = typeof params?.bookingId === 'string' ? params.bookingId : '';
  const status = typeof params?.status === 'string' ? params.status : '';

  const rows = await getAdminProviderLedgers({ providerId: providerId || undefined, bookingId: bookingId || undefined, status: status || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Provider ledgers</h1>
        <p className="text-sm text-muted-foreground">Review provider earnings, reversals, and settlement state line by line.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Search and filter</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <input type="text" name="providerId" defaultValue={providerId} placeholder="Provider id" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <input type="text" name="bookingId" defaultValue={bookingId} placeholder="Booking id" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="status" defaultValue={status} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Any status</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="paid">paid</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button type="submit" className="rounded-md border px-3 py-2 text-sm">Apply</button>
          </form>
        </CardContent>
      </Card>

      <ProviderLedgerTable rows={rows} />
    </div>
  );
}
