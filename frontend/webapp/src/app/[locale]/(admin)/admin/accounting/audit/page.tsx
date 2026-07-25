import { getTranslations } from "next-intl/server";

import { formatDateTime } from "@/accounting/lib/format";
import { listAuditLog } from "@/accounting/server/admin-queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalePageProps } from "@/types/next";

export default async function AuditLogPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations("Admin.accounting");
  const rows = await listAuditLog();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("auditTitle")}>
              <ExportButtons report="audit" locale={locale} />
            </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-muted-foreground mb-3 text-sm">{t("auditDescription")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-xs">
              <tr>
                <th className="p-2 text-start">{t("occurredAt")}</th>
                <th className="p-2 text-start">{t("actor")}</th>
                <th className="p-2 text-start">{t("action")}</th>
                <th className="p-2 text-start">{t("entity")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-2">{formatDateTime(row.occurredAt, locale)}</td>
                  <td className="p-2">{row.actorName || row.actorUserId || "—"}</td>
                  <td className="p-2 font-mono text-xs" dir="ltr">
                    {row.action}
                  </td>
                  <td className="p-2 font-mono text-xs" dir="ltr">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
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
