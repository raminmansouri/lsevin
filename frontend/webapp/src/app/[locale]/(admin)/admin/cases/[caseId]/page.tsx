import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminCase } from "@/features/case-management/server/admin-repository";
import { Link } from "@/i18n/navigation";

export default async function AdminCaseDetailPage({ params }: {
  params: Promise<{ locale: string; caseId: string }>;
}) {
  const { locale, caseId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseId)) notFound();
  const [item, t] = await Promise.all([getAdminCase(caseId, locale), getTranslations({ locale, namespace: "CaseManagement" })]);
  if (!item) notFound();
  const statusKey = item.status === "on_hold" ? "onHold" : item.status;
  const format = (value: string | null) => value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : null;

  return <div className="space-y-6">
    <PageHeader title={`${t("caseManagement")} · ${item.serviceName}`} description={`${item.customerName || item.customerEmail || "-"} · ${item.providerName}`} />
    <div className="flex flex-wrap items-center gap-3"><Badge>{t(statusKey)}</Badge><span className="text-sm text-muted-foreground">{t("staff")}: {item.staffName || t("unassigned")}</span><Link className="ms-auto text-sm font-semibold text-primary hover:underline" href={`/admin/bookings/${item.bookingId}`}>{t("openBooking")}</Link></div>
    <Card><CardHeader><CardTitle>{t("steps")}</CardTitle></CardHeader><CardContent>
      <ol className="relative space-y-0 before:absolute before:bottom-4 before:start-[15px] before:top-4 before:w-px before:bg-border">
        {item.steps.map((step) => {
          const done = step.status === "completed" || step.status === "skipped";
          const active = step.status === "in_progress" || item.currentStep === step.title;
          const Icon = done ? CheckCircle2 : active ? Clock3 : Circle;
          return <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0"><span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-background"><Icon className={done ? "size-6 text-emerald-600" : active ? "size-6 text-amber-600" : "size-5 text-muted-foreground"} /></span><div className="min-w-0 flex-1 rounded-xl border p-4"><p className="font-semibold">{step.title}</p>{step.description && <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>}{(step.completedAt || step.plannedStartAt) && <p className="mt-3 text-xs text-muted-foreground">{format(step.completedAt || step.plannedStartAt)}</p>}{step.completionNote && <p className="mt-2 rounded-lg bg-muted p-2 text-sm">{step.completionNote}</p>}</div></li>;
        })}
      </ol>
    </CardContent></Card>
  </div>;
}
