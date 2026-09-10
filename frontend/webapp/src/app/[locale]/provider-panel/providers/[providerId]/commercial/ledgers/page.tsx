import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProviderLedgerTable } from '@/features/commercial/components/admin/provider-ledger-table';
import { getProviderLedgers } from '@/features/provider-commercial/server/repository';

export default async function ProviderLedgersPage({ params, searchParams }: { params: Promise<{ providerId: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getTranslations("AdminPages");
  const { providerId } = await params;
  const sp = await searchParams;
  const bookingId = typeof sp?.bookingId === 'string' ? sp.bookingId : '';
  const status = typeof sp?.status === 'string' ? sp.status : '';
  const rows = await getProviderLedgers(providerId, { bookingId: bookingId || undefined, status: status || undefined });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">{t("providerLedger")}</h1><p className="text-sm text-muted-foreground">{t("reviewEarningsReversalsAndSettlementStateForThis")}</p></div>
      <Card>
        <CardHeader><CardTitle>{t("filter")}</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3">
            <input type="text" name="bookingId" defaultValue={bookingId} placeholder={t("bookingId")} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="status" defaultValue={status} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">{t("anyStatus")}</option><option value="pending">{t("pending")}</option><option value="approved">{t("approved")}</option><option value="paid">{t("paid")}</option><option value="cancelled">{t("cancelled")}</option>
            </select>
            <button type="submit" className="rounded-md border px-3 py-2 text-sm">{t("apply")}</button>
          </form>
        </CardContent>
      </Card>
      <ProviderLedgerTable rows={rows} />
    </div>
  );
}
