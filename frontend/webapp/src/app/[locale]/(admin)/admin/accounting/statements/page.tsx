import { getTranslations } from "next-intl/server";

import { formatAmount } from "@/accounting/lib/format";
import {
  getBalanceSheet,
  getIncomeStatement,
  type StatementLineRow,
} from "@/accounting/server/admin-queries";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalePageProps } from "@/types/next";

function pickName(name: Record<string, string> | null, locale: string): string {
  if (!name) return "—";
  return name[locale.startsWith("fa") ? "fa-IR" : "en-US"] ?? Object.values(name)[0] ?? "—";
}

export default async function StatementsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations("Admin.accounting");
  const [balanceSheet, incomeStatement] = await Promise.all([
    getBalanceSheet(),
    getIncomeStatement(),
  ]);

  const assets = balanceSheet.filter((r) => r.accountType === "asset");
  const liabilities = balanceSheet.filter((r) => r.accountType === "liability");
  const equity = balanceSheet.filter((r) => r.accountType === "equity");
  const income = incomeStatement.filter((r) => r.accountType === "income");
  const expenses = incomeStatement.filter((r) => r.accountType === "expense");

  const sum = (rows: StatementLineRow[]) => rows.reduce((n, r) => n + Number(r.amount), 0);
  const totalAssets = sum(assets);
  const totalClaims = sum(liabilities) + sum(equity);
  const profit = sum(income) - sum(expenses);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title={t("statementsTitle")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-sm">{t("statementsDescription")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("balanceSheet")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Section title={t("accountTypes.asset")} rows={assets} locale={locale} t={t} />
          <Section title={t("accountTypes.liability")} rows={liabilities} locale={locale} t={t} />
          <Section title={t("accountTypes.equity")} rows={equity} locale={locale} t={t} />

          {/* Assets must equal liabilities plus equity. The ledger enforces it entry by
              entry, so this can only ever confirm it — but an accountant looks here first. */}
          <div className="flex items-center justify-between rounded-md border-2 p-3 text-sm font-semibold">
            <span>{t("accountingEquation")}</span>
            <span dir="ltr">
              {formatAmount(String(totalAssets), "IRR")} ={" "}
              {formatAmount(String(totalClaims), "IRR")}
              {Math.abs(totalAssets - totalClaims) < 1e-9 ? " ✓" : " ✗"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("incomeStatement")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Section title={t("accountTypes.income")} rows={income} locale={locale} t={t} />
          <Section title={t("accountTypes.expense")} rows={expenses} locale={locale} t={t} />
          <div className="flex items-center justify-between rounded-md border-2 p-3 text-sm font-semibold">
            <span>{profit >= 0 ? t("netProfit") : t("netLoss")}</span>
            <span dir="ltr">{formatAmount(String(Math.abs(profit)), "IRR")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  title,
  rows,
  locale,
  t,
}: {
  title: string;
  rows: StatementLineRow[];
  locale: string;
  t: (key: string) => string;
}) {
  if (!rows.length) return null;
  const total = rows.reduce((n, r) => n + Number(r.amount), 0);

  return (
    <div>
      <div className="mb-1 text-sm font-semibold">{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.accountCode}-${row.currencyCode}`} className="border-b last:border-0">
              <td className="p-2 font-mono text-xs" dir="ltr">
                {row.accountCode}
              </td>
              <td className="p-2">{pickName(row.accountName, locale)}</td>
              <td className="p-2 text-xs">{row.currencyCode}</td>
              <td className="p-2 text-end" dir="ltr">
                {formatAmount(row.amount, row.currencyCode ?? "IRR")}
              </td>
            </tr>
          ))}
          <tr className="border-t font-medium">
            <td className="p-2" colSpan={3}>
              {t("subtotal")}
            </td>
            <td className="p-2 text-end" dir="ltr">
              {formatAmount(String(total), "IRR")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
