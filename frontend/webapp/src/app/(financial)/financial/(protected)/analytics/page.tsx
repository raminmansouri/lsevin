import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { formatAmount } from "@/accounting/lib/format";
import {
  getCostCenterReport,
  getCurrencyExposure,
  getPartyBalances,
  getPendingDocuments,
  getProjectReport,
} from "@/accounting/server/analytics.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  draft: "پیش‌نویس",
  temporary: "موقت",
  approved: "تأییدشده",
  rejected: "ردشده",
};

const PARTY_LABEL: Record<string, string> = {
  user: "کاربر",
  provider: "ارائه‌دهنده",
  staff: "کارمند",
  customer: "مشتری",
};

/** A budget bar that turns amber over 80% and red over 100%. */
function BudgetBar({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <span className="text-muted-foreground text-xs">بدون بودجه</span>;
  }
  const clamped = Math.max(0, Math.min(percent, 100));
  const tone =
    percent > 100 ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
        <div className={`h-full ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-xs ${percent > 100 ? "font-medium text-red-600" : ""}`} dir="ltr">
        {percent.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
      </span>
    </div>
  );
}

export default async function AnalyticsPage() {
  const locale = PANEL_LOCALE;
  const [costCenters, projects, parties, pending, currencies] = await Promise.all([
    getCostCenterReport(locale),
    getProjectReport(locale),
    getPartyBalances(locale),
    getPendingDocuments(),
    getCurrencyExposure(),
  ]);

  const unbalancedCount = pending.filter((p) => p.isUnbalanced).length;
  const oldest = pending[0]?.ageDays ?? 0;

  return (
    <div className="space-y-6">
      {/* The queue first: it is the only one of these that is a to-do list. */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>اسناد در جریان</span>
            <span className="text-muted-foreground text-xs font-normal">
              {pending.length} سند
              {unbalancedCount > 0 && (
                <span className="mr-2 text-amber-700">{unbalancedCount} نامتوازن</span>
              )}
              {oldest > 30 && <span className="mr-2 text-red-600">قدیمی‌ترین {oldest} روز</span>}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-3 text-sm">
            اسنادی که هنوز وارد دفاتر نشده‌اند. هیچ‌کدام در تراز آزمایشی، ترازنامه یا صورت سود و
            زیان شمرده نمی‌شوند.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">شماره</th>
                  <th className="p-2 text-start">تاریخ</th>
                  <th className="p-2 text-start">شرح</th>
                  <th className="p-2 text-start">وضعیت</th>
                  <th className="p-2 text-start">بدهکار</th>
                  <th className="p-2 text-start">بستانکار</th>
                  <th className="p-2 text-start">اختلاف</th>
                  <th className="p-2 text-start">سن</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-muted-foreground p-6 text-center">
                      هیچ سند معلقی وجود ندارد.
                    </td>
                  </tr>
                )}
                {pending.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-2 font-mono" dir="ltr">
                      {row.entryNumber}
                    </td>
                    <td className="p-2" dir="ltr">
                      {row.entryDate}
                    </td>
                    <td className="p-2">{row.description ?? "—"}</td>
                    <td className="p-2 text-xs">{STATUS_LABEL[row.status] ?? row.status}</td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.totalDebit, "IRR")}
                    </td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.totalCredit, "IRR")}
                    </td>
                    <td
                      className={`p-2 ${row.isUnbalanced ? "font-medium text-amber-700" : ""}`}
                      dir="ltr"
                    >
                      {row.isUnbalanced ? formatAmount(row.difference, "IRR") : "—"}
                    </td>
                    <td className={`p-2 ${row.ageDays > 30 ? "text-red-600" : ""}`}>
                      {row.ageDays} روز
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>مراکز هزینه</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">کد</th>
                  <th className="p-2 text-start">عنوان</th>
                  <th className="p-2 text-start">خالص</th>
                  <th className="p-2 text-start">بودجه</th>
                  <th className="p-2 text-start">مصرف</th>
                  <th className="p-2 text-start">اسناد</th>
                </tr>
              </thead>
              <tbody>
                {costCenters.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-2 font-mono text-xs" dir="ltr">
                      {row.code}
                    </td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.netAmount, row.budgetCurrency ?? "IRR")}
                    </td>
                    <td className="p-2" dir="ltr">
                      {row.budgetAmount
                        ? formatAmount(row.budgetAmount, row.budgetCurrency ?? "IRR")
                        : "—"}
                    </td>
                    <td className="p-2">
                      <BudgetBar percent={row.budgetUsedPercent} />
                    </td>
                    <td className="p-2">{row.entryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {projects.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>پروژه‌ها</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-xs">
                  <tr>
                    <th className="p-2 text-start">کد</th>
                    <th className="p-2 text-start">عنوان</th>
                    <th className="p-2 text-start">بازه</th>
                    <th className="p-2 text-start">خالص</th>
                    <th className="p-2 text-start">اسناد</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-2 font-mono text-xs" dir="ltr">
                        {row.code}
                      </td>
                      <td className="p-2">{row.name}</td>
                      <td className="p-2 text-xs" dir="ltr">
                        {row.startsOn ?? "—"} → {row.endsOn ?? "—"}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatAmount(row.netAmount, "IRR")}
                      </td>
                      <td className="p-2">{row.entryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>گردش اشخاص</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-3 text-sm">
            مانده هر طرف حساب. مثبت یعنی طرف به ما بدهکار است در حساب‌های دریافتنی، و ما به او
            بدهکاریم در حساب‌های پرداختنی. مانده‌های صفر نمایش داده نمی‌شوند.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">نوع</th>
                  <th className="p-2 text-start">شناسه</th>
                  <th className="p-2 text-start">حساب</th>
                  <th className="p-2 text-start">مانده</th>
                  <th className="p-2 text-start">ارز</th>
                  <th className="p-2 text-start">آخرین گردش</th>
                </tr>
              </thead>
              <tbody>
                {parties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted-foreground p-6 text-center">
                      هیچ مانده‌ای وجود ندارد.
                    </td>
                  </tr>
                )}
                {parties.map((row) => (
                  <tr key={`${row.partyType}-${row.partyId}-${row.accountCode}`} className="border-b last:border-0">
                    <td className="p-2 text-xs">{PARTY_LABEL[row.partyType] ?? row.partyType}</td>
                    <td className="p-2 font-mono text-xs" dir="ltr">
                      {row.partyId.slice(0, 8)}…
                    </td>
                    <td className="p-2">
                      <span className="font-mono text-xs" dir="ltr">
                        {row.accountCode}
                      </span>{" "}
                      {row.accountName}
                    </td>
                    <td className="p-2 font-medium" dir="ltr">
                      {formatAmount(row.balance, row.currencyCode)}
                    </td>
                    <td className="p-2 text-xs" dir="ltr">
                      {row.currencyCode}
                    </td>
                    <td className="p-2 text-xs" dir="ltr">
                      {row.lastMovementAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>وضعیت ارزی</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-3 text-sm">
            خالص هر ارز و ارزش آن به ارز پایه، با همان نرخی که اسناد ثبت شده‌اند. اختلاف این عدد با
            نرخ امروز، همان سود یا زیان تسعیر تحقق‌نیافته است.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">ارز</th>
                  <th className="p-2 text-start">بدهکار</th>
                  <th className="p-2 text-start">بستانکار</th>
                  <th className="p-2 text-start">خالص</th>
                  <th className="p-2 text-start">معادل ارز پایه</th>
                  <th className="p-2 text-start">اسناد</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((row) => (
                  <tr key={row.currencyCode} className="border-b last:border-0">
                    <td className="p-2 font-medium" dir="ltr">
                      {row.currencyCode}
                    </td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.totalDebit, row.currencyCode)}
                    </td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.totalCredit, row.currencyCode)}
                    </td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.netAmount, row.currencyCode)}
                    </td>
                    <td className="p-2" dir="ltr">
                      {formatAmount(row.netBaseAmount, row.baseCurrencyCode)}{" "}
                      <span className="text-muted-foreground text-xs">{row.baseCurrencyCode}</span>
                    </td>
                    <td className="p-2">{row.entryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
