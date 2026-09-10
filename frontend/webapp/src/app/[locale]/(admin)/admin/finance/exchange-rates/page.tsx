import { getTranslations } from "next-intl/server";
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminExchangeRates } from '@/features/finance/api/server/get-admin-finance';

export default async function AdminExchangeRatesPage() {
  const t = await getTranslations("AdminPages");
  const rates = await getAdminExchangeRates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("exchangeRates")}</h1>
          <p className="text-sm text-muted-foreground">Manual rates now; external API sync can upsert into this same table later.</p>
        </div>
        <Button asChild><Link href="/admin/finance/exchange-rates/new"><Plus className="mr-2 h-4 w-4" />{t("newRate")}</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("latestAndHistoricalRates")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3">{t("pair")}</th>
                <th>{t("rate")}</th>
                <th>{t("source")}</th>
                <th>{t("asOf")}</th>
                <th>{t("expires")}</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-b last:border-0">
                  <td className="py-3 font-semibold">{rate.baseCurrencyCode} → {rate.quoteCurrencyCode}</td>
                  <td className="tabular-nums">{rate.rate.toLocaleString(undefined, { maximumFractionDigits: 12 })}</td>
                  <td>{rate.source}</td>
                  <td>{new Date(rate.asOf).toLocaleString()}</td>
                  <td>{rate.expiresAt ? new Date(rate.expiresAt).toLocaleString() : '—'}</td>
                  <td>{rate.isLatest ? <Badge>{t("latest")}</Badge> : <Badge variant="outline">{t("old")}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
