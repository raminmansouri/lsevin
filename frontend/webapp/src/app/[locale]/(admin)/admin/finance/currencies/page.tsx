import { getTranslations } from "next-intl/server";
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyActiveToggle } from '@/features/finance/components/admin/currency-active-toggle';
import { CurrencyDeleteButton } from '@/features/finance/components/admin/currency-delete-button';
import { getAdminCurrencies } from '@/features/finance/api/server/get-admin-finance';

export default async function AdminCurrenciesPage() {
  const t = await getTranslations("AdminPages");
  const currencies = await getAdminCurrencies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("currencies")}</h1>
          <p className="text-sm text-muted-foreground">{t("manageDisplayPaymentAndSettlementCurrencies")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/finance/currencies/new"><Plus className="mr-2 h-4 w-4" />{t("newCurrency")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("currencyRegistry")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3">{t("code")}</th>
                <th>{t("name")}</th>
                <th>{t("symbol")}</th>
                <th>{t("decimals")}</th>
                <th>{t("display")}</th>
                <th>{t("payment")}</th>
                <th>{t("settlement")}</th>
                <th>{t("active")}</th>
                <th className="text-right">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.code} className="border-b last:border-0">
                  <td className="py-3 font-semibold">{currency.code}</td>
                  <td>{currency.name}</td>
                  <td>{currency.symbol}</td>
                  <td>{currency.decimalDigits}</td>
                  <td>{currency.isDisplayEnabled ? <Badge>{t("yes")}</Badge> : <Badge variant="outline">{t("no")}</Badge>}</td>
                  <td>{currency.isPaymentEnabled ? <Badge>{t("yes")}</Badge> : <Badge variant="outline">{t("no")}</Badge>}</td>
                  <td>{currency.isSettlementEnabled ? <Badge>{t("yes")}</Badge> : <Badge variant="outline">{t("no")}</Badge>}</td>
                  <td><CurrencyActiveToggle code={currency.code} isActive={currency.isActive} /></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline"><Link href={`/admin/finance/currencies/${currency.code}/edit`}>{t("edit")}</Link></Button>
                      <CurrencyDeleteButton code={currency.code} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
