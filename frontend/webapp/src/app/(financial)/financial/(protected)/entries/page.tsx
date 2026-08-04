import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { formatAmount } from "@/accounting/lib/format";
import {
  getPeriodCoverage,
  listDimensions,
  listEntries,
  listPostableAccounts,
} from "@/accounting/server/manual-entry.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EntryForm } from "./entry-form";
import { EntryWorkflowButtons } from "./workflow-buttons";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  draft: { text: "پیش‌نویس", className: "bg-zinc-100 text-zinc-700" },
  temporary: { text: "موقت", className: "bg-amber-100 text-amber-800" },
  approved: { text: "تأییدشده", className: "bg-blue-100 text-blue-800" },
  posted: { text: "قطعی", className: "bg-emerald-100 text-emerald-800" },
  reversed: { text: "برگشت‌خورده", className: "bg-purple-100 text-purple-800" },
  rejected: { text: "ردشده", className: "bg-red-100 text-red-800" },
};

const TYPE_LABEL: Record<string, string> = {
  general: "عمومی",
  receipt: "دریافت",
  payment: "پرداخت",
  provider_settlement: "تسویه ارائه‌دهنده",
  patient_refund: "بازپرداخت بیمار",
  fx_revaluation: "تسعیر ارز",
  opening: "افتتاحیه",
  closing: "اختتامیه",
  adjustment: "اصلاحی",
};

export default async function EntriesPage() {
  const locale = PANEL_LOCALE;
  const [accounts, dimensions, entries, coverage] = await Promise.all([
    listPostableAccounts(locale),
    listDimensions(locale),
    listEntries({ limit: 100 }),
    getPeriodCoverage(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>ثبت سند دستی</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4 text-sm">
            سند به‌صورت پیش‌نویس ذخیره می‌شود و می‌تواند نامتوازن بماند. قطعی‌شدن فقط با تراز کامل و
            تأیید فردی غیر از ثبت‌کننده ممکن است.
          </p>
          <EntryForm
            accounts={accounts}
            dimensions={dimensions}
            today={today}
            canPostToday={coverage.openPeriodsToday > 0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>دفتر روزنامه</span>
            <span className="text-muted-foreground text-xs font-normal">
              دوره‌های باز تا {coverage.coveredUntil ?? "—"} ({coverage.daysOfRunway} روز)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">شماره</th>
                  <th className="p-2 text-start">عطف</th>
                  <th className="p-2 text-start">تاریخ</th>
                  <th className="p-2 text-start">شرح</th>
                  <th className="p-2 text-start">نوع</th>
                  <th className="p-2 text-start">بدهکار</th>
                  <th className="p-2 text-start">بستانکار</th>
                  <th className="p-2 text-start">وضعیت</th>
                  <th className="p-2 text-start">ثبت‌کننده</th>
                  <th className="p-2 text-start">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-muted-foreground p-6 text-center">
                      هنوز سندی ثبت نشده است.
                    </td>
                  </tr>
                )}
                {entries.map((entry) => {
                  const status = STATUS_LABEL[entry.status] ?? {
                    text: entry.status,
                    className: "bg-zinc-100 text-zinc-700",
                  };
                  const unbalanced = entry.totalDebit !== entry.totalCredit;

                  return (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="p-2 font-mono" dir="ltr">
                        {entry.entryNumber}
                      </td>
                      <td className="p-2 font-mono text-xs" dir="ltr">
                        {entry.referenceNumber ?? "—"}
                      </td>
                      <td className="p-2" dir="ltr">
                        {entry.entryDate}
                      </td>
                      <td className="p-2">{entry.description ?? "—"}</td>
                      <td className="p-2 text-xs">{TYPE_LABEL[entry.entryType] ?? entry.entryType}</td>
                      <td className="p-2" dir="ltr">
                        {formatAmount(entry.totalDebit, entry.baseCurrencyCode)}
                      </td>
                      <td className={`p-2 ${unbalanced ? "text-amber-700" : ""}`} dir="ltr">
                        {formatAmount(entry.totalCredit, entry.baseCurrencyCode)}
                      </td>
                      <td className="p-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>
                          {status.text}
                        </span>
                        {unbalanced && (
                          <span className="mr-1 text-xs text-amber-700">نامتوازن</span>
                        )}
                      </td>
                      <td className="p-2 text-xs">{entry.createdBy ?? "سیستم"}</td>
                      <td className="p-2">
                        {entry.isManual ? (
                          <EntryWorkflowButtons entryId={entry.id} status={entry.status} />
                        ) : (
                          <span className="text-muted-foreground text-xs">خودکار</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
