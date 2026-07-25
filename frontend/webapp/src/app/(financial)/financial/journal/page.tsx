import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { formatAmount, formatDateTime } from "@/accounting/lib/format";
import { listJournalEntries } from "@/accounting/server/admin-queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JournalPage() {
  const locale = PANEL_LOCALE;
  const t = await getTranslations("Admin.accounting");
  const entries = await listJournalEntries();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("journalTitle")}>
              <ExportButtons report="journal" locale={locale} />
            </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-muted-foreground mb-3 text-sm">{t("journalDescription")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-xs">
              <tr>
                <th className="p-2 text-start">{t("entryNumber")}</th>
                <th className="p-2 text-start">{t("entryDate")}</th>
                <th className="p-2 text-start">{t("entryDescription")}</th>
                <th className="p-2 text-start">{t("sourceType")}</th>
                <th className="p-2 text-start">{t("lineCount")}</th>
                <th className="p-2 text-start">{t("totalDebit")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="p-2 font-mono" dir="ltr">
                    {entry.entryNumber}
                  </td>
                  <td className="p-2">{formatDateTime(entry.entryDate, locale)}</td>
                  <td className="p-2">{entry.description ?? "—"}</td>
                  <td className="p-2">{entry.sourceType}</td>
                  <td className="p-2">{entry.lineCount}</td>
                  <td className="p-2" dir="ltr">
                    {formatAmount(entry.totalDebit, entry.baseCurrencyCode)} {entry.baseCurrencyCode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
