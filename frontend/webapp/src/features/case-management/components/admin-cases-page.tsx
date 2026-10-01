import { Activity, CalendarClock, CheckCircle2, HeartPulse, PauseCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import type { AdminCaseRow, AdminCaseSummary } from "../server/admin-repository";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  scheduled: "secondary",
  on_hold: "outline",
  completed: "default",
  cancelled: "destructive",
};

export async function AdminCasesPage({ locale, cases, summary }: {
  locale: string;
  cases: AdminCaseRow[];
  summary: AdminCaseSummary;
}) {
  const t = await getTranslations({ locale, namespace: "CaseManagement" });
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const stats = [
    ["total", summary.total, HeartPulse],
    ["active", summary.active, Activity],
    ["scheduled", summary.scheduled, CalendarClock],
    ["onHold", summary.onHold, PauseCircle],
    ["completed", summary.completed, CheckCircle2],
  ] as const;

  return <div className="space-y-6">
    <PageHeader title={t("caseManagement")} description={t("description")} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map(([key, value, Icon]) => <Card key={key}>
        <CardContent className="flex items-center justify-between p-5">
          <div><p className="text-sm text-muted-foreground">{t(key)}</p><p className="mt-1 text-3xl font-bold tabular-nums">{value}</p></div>
          <Icon className="size-6 text-primary" />
        </CardContent>
      </Card>)}
    </div>
    <Card>
      <CardHeader><CardTitle>{t("allCases")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">{t("noCases")}</div> : cases.map((item) => {
          const percentage = item.totalSteps ? Math.round(item.completedSteps * 100 / item.totalSteps) : 0;
          const statusKey = item.status === "on_hold" ? "onHold" : item.status;
          return <div key={item.id} className="grid gap-4 rounded-2xl border p-4 lg:grid-cols-[1.2fr_1.2fr_1fr_180px_auto] lg:items-center">
            <div><p className="font-semibold">{item.customerName || item.customerEmail || "-"}</p><p className="text-sm text-muted-foreground">{item.serviceName}</p></div>
            <div><p className="text-sm font-medium">{item.providerName}</p><p className="text-xs text-muted-foreground">{item.staffName || t("unassigned")}</p></div>
            <div><p className="text-sm font-medium">{item.currentStep || "-"}</p><p className="text-xs text-muted-foreground">{dateFormatter.format(new Date(item.createdAt))}</p></div>
            <div className="space-y-1"><div className="flex justify-between text-xs"><span>{t("progress")}</span><span>{percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>
            <div className="flex items-center gap-2"><Badge variant={statusVariants[item.status]}>{t(statusKey)}</Badge><Link className="text-sm font-semibold text-primary hover:underline" href={`/admin/cases/${item.id}`}>{t("steps")}</Link></div>
          </div>;
        })}
      </CardContent>
    </Card>
  </div>;
}
