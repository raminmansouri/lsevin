import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { formatAmount } from "@/accounting/lib/format";
import { getTrialBalance } from "@/accounting/server/admin-queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pickName(name: Record<string, string> | null, locale: string): string {
  if (!name) return "—";
  return name[locale.startsWith("fa") ? "fa-IR" : "en-US"] ?? Object.values(name)[0] ?? "—";
}

export default async function TrialBalancePage() {
  const locale = PANEL_LOCALE;
  const t = await getTranslations("Admin.accounting");
  const rows = await getTrialBalance();

  // Summed here only to show the check an accountant looks for first. The ledger already
  // refuses to store an unbalanced entry, so this can only ever confirm it.
  const totals = rows.reduce(
    (acc, r) => ({
      debit: acc.debit + Number(r.totalDebit),
      credit: acc.credit + Number(r.totalCredit),
    }),
    { debit: 0, credit: 0 }
  );
  const balanced = Math.abs(totals.debit - totals.credit) < 1e-9;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("reportsTitle")}>
              <ExportButtons report="trial-balance" locale={locale} />
            </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-muted-foreground mb-3 text-sm">{t("reportsDescription")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-xs">
              <tr>
                <th className="p-2 text-start">{t("accountCode")}</th>
                <th className="p-2 text-start">{t("accountName")}</th>
                <th className="p-2 text-start">{t("currency")}</th>
                <th className="p-2 text-start">{t("totalDebit")}</th>
                <th className="p-2 text-start">{t("totalCredit")}</th>
                <th className="p-2 text-start">{t("balance")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.accountCode}-${row.currencyCode}`} className="border-b last:border-0">
                  <td className="p-2 font-mono" dir="ltr">
                    {row.accountCode}
                  </td>
                  <td className="p-2">{pickName(row.accountName, locale)}</td>
                  <td className="p-2">{row.currencyCode ?? "—"}</td>
                  <td className="p-2" dir="ltr">
                    {formatAmount(row.totalDebit, row.currencyCode ?? "IRR")}
                  </td>
                  <td className="p-2" dir="ltr">
                    {formatAmount(row.totalCredit, row.currencyCode ?? "IRR")}
                  </td>
                  <td className="p-2 font-medium" dir="ltr">
                    {formatAmount(row.balance, row.currencyCode ?? "IRR")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr>
                <td className="p-2" colSpan={3}>
                  {balanced ? t("balanced") : t("unbalanced")}
                </td>
                <td className="p-2" dir="ltr">
                  {formatAmount(String(totals.debit), "IRR")}
                </td>
                <td className="p-2" dir="ltr">
                  {formatAmount(String(totals.credit), "IRR")}
                </td>
                <td className="p-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
