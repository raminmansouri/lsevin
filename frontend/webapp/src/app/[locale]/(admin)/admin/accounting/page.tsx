import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { formatForDisplay } from "@/accounting/lib/format";
import {
  getSystemBalances,
  isAccountingInstalled,
  listBalanceDrift,
  listPendingDeposits,
  listPendingWithdrawals,
} from "@/accounting/server/admin-queries";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalePageProps } from "@/types/next";

export default async function AccountingDashboardPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations("Admin.accounting");

  if (!(await isAccountingInstalled())) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title={t("title")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">{t("notInstalled")}</p>
          <pre dir="ltr" className="bg-muted mt-3 rounded-md p-3 text-xs">
            cd frontend/webapp && pnpm migrate
          </pre>
        </CardContent>
      </Card>
    );
  }

  const [balances, drift, deposits, withdrawals] = await Promise.all([
    getSystemBalances(),
    listBalanceDrift(),
    listPendingDeposits(),
    listPendingWithdrawals(),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title={t("title")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </CardContent>
      </Card>

      {/* The reconciliation alarm. It is supposed to be silent forever; if it is not,
          a wallet balance has drifted from the ledger and that is an incident. */}
      {drift.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="border-b border-red-200">
            <CardTitle className="text-red-900 dark:text-red-200">{t("driftAlertTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <p className="text-red-900 dark:text-red-200">{t("driftAlertBody")}</p>
            {drift.map((row) => (
              <div key={`${row.walletId}-${row.bucket}`} className="font-mono text-xs" dir="ltr">
                {row.walletId} · {row.bucket} · cached {row.cachedBalance} vs ledger {row.ledgerBalance}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <QueueCard
          href={`/${locale}/admin/accounting/deposits`}
          title={t("pendingDeposits")}
          count={deposits.length}
          emptyLabel={t("queueEmpty")}
        />
        <QueueCard
          href={`/${locale}/admin/accounting/withdrawals`}
          title={t("pendingWithdrawals")}
          count={withdrawals.length}
          emptyLabel={t("queueEmpty")}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("systemBalances")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {balances.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noWallets")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-xs">
                  <tr>
                    <th className="p-2 text-start">{t("currency")}</th>
                    <th className="p-2 text-start">{t("userLiability")}</th>
                    <th className="p-2 text-start">{t("reserved")}</th>
                    <th className="p-2 text-start">{t("platformCash")}</th>
                    <th className="p-2 text-start">{t("walletCount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((row) => {
                    const liability = formatForDisplay(row.userLiability, row.currencyCode, locale);
                    const reserved = formatForDisplay(row.reserved, row.currencyCode, locale);
                    const cash = formatForDisplay(row.platformCash, row.currencyCode, locale);
                    return (
                      <tr key={row.currencyCode} className="border-b last:border-0">
                        <td className="p-2 font-medium">{row.currencyCode}</td>
                        <td className="p-2">
                          {liability.value} <span className="text-muted-foreground">{liability.unit}</span>
                        </td>
                        <td className="p-2">
                          {reserved.value} <span className="text-muted-foreground">{reserved.unit}</span>
                        </td>
                        <td className="p-2">
                          {cash.value} <span className="text-muted-foreground">{cash.unit}</span>
                        </td>
                        <td className="p-2">{row.walletCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-muted-foreground mt-3 text-xs">{t("balancesNote")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QueueCard({
  href,
  title,
  count,
  emptyLabel,
}: {
  href: string;
  title: string;
  count: number;
  emptyLabel: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary transition-colors">
        <CardContent className="flex items-center justify-between p-6">
          <span className="font-medium">{title}</span>
          <span className={count > 0 ? "text-2xl font-bold" : "text-muted-foreground text-sm"}>
            {count > 0 ? count : emptyLabel}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
