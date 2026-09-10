import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminProviderLedgers } from '@/features/commercial/api/server/get-admin-commercial';
import { ProviderLedgerTable } from '@/features/commercial/components/admin/provider-ledger-table';

export default async function ProviderLedgersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>>; }) {
  const t = await getTranslations("AdminPages");
  const params = await searchParams;
  const providerId = typeof params?.providerId === 'string' ? params.providerId : '';
  const bookingId = typeof params?.bookingId === 'string' ? params.bookingId : '';
  const status = typeof params?.status === 'string' ? params.status : '';

  const rows = await getAdminProviderLedgers({ providerId: providerId || undefined, bookingId: bookingId || undefined, status: status || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("providerLedgers")}</h1>
        <p className="text-sm text-muted-foreground">{t("reviewProviderEarningsReversalsAndSettlementStateLine")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("searchAndFilter")}</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <input type="text" name="providerId" defaultValue={providerId} placeholder={t("providerId")} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <input type="text" name="bookingId" defaultValue={bookingId} placeholder={t("bookingId")} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="status" defaultValue={status} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">{t("anyStatus")}</option>
              <option value="pending">{t("pending")}</option>
              <option value="approved">{t("approved")}</option>
              <option value="paid">{t("paid")}</option>
              <option value="cancelled">{t("cancelled")}</option>
            </select>
            <button type="submit" className="rounded-md border px-3 py-2 text-sm">{t("apply")}</button>
          </form>
        </CardContent>
      </Card>

      <ProviderLedgerTable rows={rows} />
    </div>
  );
}
