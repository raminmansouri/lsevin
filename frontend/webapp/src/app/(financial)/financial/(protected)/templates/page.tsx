import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { formatAmount } from "@/accounting/lib/format";
import { listPostableAccounts } from "@/accounting/server/manual-entry.queries";
import { listSchedules, listTemplates } from "@/accounting/server/templates.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  ApplyTemplateButton,
  RunSchedulesButton,
  ScheduleForm,
  TemplateForm,
  ToggleButton,
} from "./template-forms";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "روزانه",
  weekly: "هفتگی",
  monthly: "ماهانه",
  quarterly: "فصلی",
  yearly: "سالانه",
};

export default async function TemplatesPage() {
  const locale = PANEL_LOCALE;
  const [templates, schedules, accounts] = await Promise.all([
    listTemplates(locale),
    listSchedules(locale),
    listPostableAccounts(locale),
  ]);

  const dueCount = schedules.filter((s) => s.isDue).length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>الگوی سند</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4 text-sm">
            الگو، اسکلت سندی است که مدام تکرار می‌شود — اجاره، کارمزد ماهانه، تسویهٔ ثابت. مبلغ هر
            ردیف را می‌توانید خالی بگذارید تا موقع استفاده پر شود؛ ولی اگر همهٔ ردیف‌ها مبلغ داشته
            باشند، الگو باید تراز باشد، وگرنه هر سندی که تولید می‌کند نامتوازن متولد می‌شود.
          </p>
          <TemplateForm accounts={accounts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <span>الگوهای موجود</span>
            <span className="text-muted-foreground text-xs font-normal">{templates.length} الگو</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {templates.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              هنوز الگویی تعریف نشده است.
            </p>
          ) : (
            <div className="space-y-4">
              {templates.map((t) => (
                <div key={t.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs" dir="ltr">
                        {t.code}
                      </span>{" "}
                      <span className="font-medium">{t.name}</span>
                      {!t.isActive && (
                        <span className="mr-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                          غیرفعال
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {t.isActive && <ApplyTemplateButton id={t.id} today={today} />}
                      <ToggleButton
                        kind="template"
                        id={t.id}
                        isActive={t.isActive}
                      />
                    </div>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground border-b">
                      <tr>
                        <th className="p-1 text-start">حساب</th>
                        <th className="p-1 text-start">طرف</th>
                        <th className="p-1 text-start">مبلغ</th>
                        <th className="p-1 text-start">شرح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.lines.map((l) => (
                        <tr key={l.id} className="border-b last:border-0">
                          <td className="p-1">
                            <span className="font-mono" dir="ltr">
                              {l.accountCode}
                            </span>{" "}
                            {l.accountName}
                          </td>
                          <td className="p-1">{l.side === "debit" ? "بدهکار" : "بستانکار"}</td>
                          <td className="p-1" dir="ltr">
                            {l.amount ? formatAmount(l.amount, "IRR") : "— هنگام استفاده"}
                          </td>
                          <td className="p-1">{l.memo ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>اسناد دوره‌ای</span>
            {dueCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {dueCount} سررسید شده
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4 text-sm">
            اسناد تولیدشده همیشه با وضعیت <strong>موقت</strong> ساخته می‌شوند، هرگز قطعی. زمان‌بندی
            تایپ را حذف می‌کند نه قضاوت را. اگر زمان‌بندی عقب افتاده باشد، برای <em>هر</em> دوره‌ای
            که جا مانده یک سند می‌سازد — ماه جامانده یعنی سند غایب در دفاتر.
          </p>

          <div className="mb-4">
            <RunSchedulesButton dueCount={dueCount} />
          </div>

          {templates.filter((t) => t.isActive).length > 0 && (
            <div className="mb-4 rounded-md border p-3">
              <ScheduleForm templates={templates.filter((t) => t.isActive)} today={today} />
            </div>
          )}

          {schedules.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              هنوز زمان‌بندی‌ای تعریف نشده است.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-xs">
                  <tr>
                    <th className="p-2 text-start">کد</th>
                    <th className="p-2 text-start">الگو</th>
                    <th className="p-2 text-start">تناوب</th>
                    <th className="p-2 text-start">اجرای بعدی</th>
                    <th className="p-2 text-start">آخرین اجرا</th>
                    <th className="p-2 text-start">وضعیت</th>
                    <th className="p-2 text-start">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-2 font-mono text-xs" dir="ltr">
                        {s.code}
                      </td>
                      <td className="p-2">{s.templateName}</td>
                      <td className="p-2 text-xs">
                        {s.intervalCount > 1 && `هر ${s.intervalCount} × `}
                        {FREQUENCY_LABEL[s.frequency] ?? s.frequency}
                      </td>
                      <td className={`p-2 ${s.isDue ? "font-medium text-amber-700" : ""}`} dir="ltr">
                        {s.nextRunOn}
                      </td>
                      <td className="p-2 text-xs" dir="ltr">
                        {s.lastRunAt?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="p-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            s.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {s.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="p-2">
                        <ToggleButton kind="schedule" id={s.id} isActive={s.isActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
