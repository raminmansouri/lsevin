import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { AccountTreePicker } from "@/accounting/components/account-tree-picker";
import { formatAmount, formatDateTime } from "@/accounting/lib/format";
import { getLedgerLines } from "@/accounting/server/admin-queries";
import { listAccounts } from "@/accounting/server/accounts-admin";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pickName(name: Record<string, string> | null, locale: string): string {
  if (!name) return "—";
  return name[locale.startsWith("fa") ? "fa-IR" : "en-US"] ?? Object.values(name)[0] ?? "—";
}

function AmountCell({
  base,
  baseCurrency,
  amount,
  currency,
}: {
  base: string;
  baseCurrency: string;
  amount: string;
  currency: string;
}) {
  if (!(Number(base) > 0)) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex flex-col items-end leading-tight">
      <span dir="ltr">{formatAmount(base, baseCurrency)}</span>
      {currency !== baseCurrency ? (
        <span dir="ltr" className="text-muted-foreground text-[11px]">
          {formatAmount(amount, currency)} {currency}
        </span>
      ) : null}
    </span>
  );
}

function BalanceCell({ value, currency, debit, credit }: { value: string; currency: string; debit: string; credit: string }) {
  const amount = Number(value);
  if (!amount) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span dir="ltr" className="font-semibold">{formatAmount(String(Math.abs(amount)), currency)}</span>
      <span className={`rounded px-1 text-[10px] ${amount > 0 ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}>
        {amount > 0 ? debit : credit}
      </span>
    </span>
  );
}

export default async function LedgerPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ account?: string }>;
}) {
  const locale = PANEL_LOCALE;
  const { account } = await searchParams;
  const t = await getTranslations("Admin.accounting");

  const [lines, accounts] = await Promise.all([
    getLedgerLines({ accountCodePrefix: account }),
    listAccounts(),
  ]);

  const baseCurrency = lines[0]?.baseCurrencyCode ?? "IRR";
  const totals = lines.reduce(
    (acc, l) => ({
      debit: acc.debit + Number(l.baseDebitAmount),
      credit: acc.credit + Number(l.baseCreditAmount),
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
          <div className="text-xs">
            <span className="text-muted-foreground">{t("filterByAccount")}</span>
            <AccountTreePicker
              name="account"
              defaultValue={account ?? ""}
              allLabel={t("allAccounts")}
              autoSubmit
              className="mt-1 w-96 max-w-full"
              accounts={accounts.map((a) => ({
                id: a.id,
                parentId: a.parentId,
                code: a.code,
                name: pickName(a.nameTranslations, locale),
                isActive: a.isActive,
                isPostable: a.isPostable,
              }))}
            />
          </div>
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
                <th className="p-2 text-end">{t("runningBalance")}</th>
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
                  <td className="p-2 text-end">
                    <AmountCell
                      base={line.baseDebitAmount}
                      baseCurrency={line.baseCurrencyCode}
                      amount={line.debitAmount}
                      currency={line.currencyCode}
                    />
                  </td>
                  <td className="p-2 text-end">
                    <AmountCell
                      base={line.baseCreditAmount}
                      baseCurrency={line.baseCurrencyCode}
                      amount={line.creditAmount}
                      currency={line.currencyCode}
                    />
                  </td>
                  <td className="p-2 text-end whitespace-nowrap">
                    <BalanceCell
                      value={line.runningBalance}
                      currency={line.baseCurrencyCode}
                      debit={t("sides.debit")}
                      credit={t("sides.credit")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr>
                <td className="p-2" colSpan={5}>{t("subtotal")}</td>
                <td className="p-2 text-end" dir="ltr">{formatAmount(String(totals.debit), baseCurrency)}</td>
                <td className="p-2 text-end" dir="ltr">{formatAmount(String(totals.credit), baseCurrency)}</td>
                <td className="p-2 text-end whitespace-nowrap">
                  {account && lines[0] ? (
                    <BalanceCell
                      value={lines[0].runningBalance}
                      currency={baseCurrency}
                      debit={t("sides.debit")}
                      credit={t("sides.credit")}
                    />
                  ) : null}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}