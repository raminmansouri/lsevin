import { getTranslations } from "next-intl/server";

import { formatAmount, formatDateTime } from "@/accounting/lib/format";
import { getLedgerLines } from "@/accounting/server/admin-queries";
import { listAccounts } from "@/accounting/server/accounts-admin";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pickName(name: Record<string, string> | null, locale: string): string {
  if (!name) return "—";
  return name[locale.startsWith("fa") ? "fa-IR" : "en-US"] ?? Object.values(name)[0] ?? "—";
}

/**
 * General, subsidiary and detail ledger in one screen.
 *
 * They are the same report at three depths — filtering by an account code prefix is what
 * separates them: '2' is the group (دفتر کل), '2001' the subsidiary (معین), '2001001' the
 * detail account (تفصیلی). Three separate pages would be three copies of this table.
 */
export default async function LedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ account?: string }>;
}) {
  const { locale } = await params;
  const { account } = await searchParams;
  const t = await getTranslations("Admin.accounting");

  const [lines, accounts] = await Promise.all([
    getLedgerLines({ accountCodePrefix: account }),
    listAccounts(),
  ]);

  const totals = lines.reduce(
    (acc, l) => ({
      debit: acc.debit + Number(l.debitAmount),
      credit: acc.credit + Number(l.creditAmount),
    }),
    { debit: 0, credit: 0 }
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("ledgerTitle")} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-muted-foreground mb-3 text-sm">{t("ledgerDescription")}</p>

        <form method="get" className="mb-4 flex flex-wrap items-end gap-2 print:hidden">
          <label className="text-xs">
            <span className="text-muted-foreground">{t("filterByAccount")}</span>
            <select name="account" defaultValue={account ?? ""} className="mt-1 h-9 w-80 rounded border px-2">
              <option value="">{t("allAccounts")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.code}>
                  {"—".repeat(Math.max(0, a.level - 1))} {a.code} · {pickName(a.nameTranslations, locale)}
                </option>
              ))}
            </select>
          </label>
          <button className="bg-primary text-primary-foreground h-9 rounded px-4 text-xs font-semibold">
            {t("applyFilter")}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-xs">
              <tr>
                <th className="p-2 text-start">{t("entryNumber")}</th>
                <th className="p-2 text-start">{t("entryDate")}</th>
                <th className="p-2 text-start">{t("accountCode")}</th>
                <th className="p-2 text-start">{t("accountName")}</th>
                <th className="p-2 text-start">{t("entryDescription")}</th>
                <th className="p-2 text-end">{t("totalDebit")}</th>
                <th className="p-2 text-end">{t("totalCredit")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.entryNumber}-${line.accountCode}-${index}`} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs" dir="ltr">{line.entryNumber}</td>
                  <td className="p-2 text-xs">{formatDateTime(line.entryDate, locale)}</td>
                  <td className="p-2 font-mono text-xs" dir="ltr">{line.accountCode}</td>
                  <td className="p-2">{pickName(line.accountName, locale)}</td>
                  <td className="p-2 text-xs">{line.memo ?? line.description ?? "—"}</td>
                  <td className="p-2 text-end" dir="ltr">
                    {Number(line.debitAmount) > 0 ? formatAmount(line.debitAmount, line.currencyCode) : "—"}
                  </td>
                  <td className="p-2 text-end" dir="ltr">
                    {Number(line.creditAmount) > 0 ? formatAmount(line.creditAmount, line.currencyCode) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr>
                <td className="p-2" colSpan={5}>{t("subtotal")}</td>
                <td className="p-2 text-end" dir="ltr">{formatAmount(String(totals.debit), "IRR")}</td>
                <td className="p-2 text-end" dir="ltr">{formatAmount(String(totals.credit), "IRR")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
