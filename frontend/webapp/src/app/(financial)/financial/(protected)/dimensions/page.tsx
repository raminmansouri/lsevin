import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { formatAmount } from "@/accounting/lib/format";
import { listAllDimensions } from "@/accounting/server/dimensions.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DimensionForm, DimensionToggle } from "./dimension-form";

const KIND_LABEL: Record<string, string> = {
  cost_center: "مرکز هزینه",
  project: "پروژه",
  branch: "شعبه",
  department: "دپارتمان",
};

export default async function DimensionsPage() {
  const dimensions = await listAllDimensions(PANEL_LOCALE);

  const grouped = ["cost_center", "project", "branch", "department"].map((kind) => ({
    kind,
    rows: dimensions.filter((d) => d.kind === kind),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>افزودن بُعد جدید</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4 text-sm">
            مرکز هزینه، پروژه، شعبه و دپارتمان محورهایی هستند که گزارش‌ها بر اساسشان تفکیک
            می‌شوند. بعد از اینکه سندی به یک بُعد ارجاع داد، آن بُعد حذف نمی‌شود — فقط غیرفعال
            می‌شود، چون حذفش یعنی تغییر معنای سندی که قبلاً قطعی شده.
          </p>
          <DimensionForm />
        </CardContent>
      </Card>

      {grouped.map(({ kind, rows }) => (
        <Card key={kind}>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>{KIND_LABEL[kind]}</span>
              <span className="text-muted-foreground text-xs font-normal">{rows.length} مورد</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {rows.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                هنوز موردی تعریف نشده است.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b text-xs">
                    <tr>
                      <th className="p-2 text-start">کد</th>
                      <th className="p-2 text-start">عنوان</th>
                      {kind === "cost_center" || kind === "project" ? (
                        <th className="p-2 text-start">بودجه</th>
                      ) : null}
                      {kind === "project" ? <th className="p-2 text-start">بازه</th> : null}
                      <th className="p-2 text-start">کاربرد در اسناد</th>
                      <th className="p-2 text-start">وضعیت</th>
                      <th className="p-2 text-start">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 font-mono text-xs" dir="ltr">
                          {row.code}
                        </td>
                        <td className="p-2">{row.name}</td>
                        {kind === "cost_center" || kind === "project" ? (
                          <td className="p-2" dir="ltr">
                            {row.budgetAmount
                              ? `${formatAmount(row.budgetAmount, row.budgetCurrency ?? "IRR")} ${row.budgetCurrency ?? ""}`
                              : "—"}
                          </td>
                        ) : null}
                        {kind === "project" ? (
                          <td className="p-2 text-xs" dir="ltr">
                            {row.startsOn ?? "—"} → {row.endsOn ?? "—"}
                          </td>
                        ) : null}
                        <td className="p-2">
                          {row.usageCount === 0 ? (
                            <span className="text-muted-foreground text-xs">استفاده نشده</span>
                          ) : (
                            <span className="text-xs">{row.usageCount} ردیف</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              row.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {row.isActive ? "فعال" : "غیرفعال"}
                          </span>
                        </td>
                        <td className="p-2">
                          <DimensionToggle id={row.id} isActive={row.isActive} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
