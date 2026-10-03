<<<<<<< HEAD
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
=======
import { CheckCircle2, Circle, Clock3, History } from "lucide-react";
>>>>>>> 592473c7b3918fca6d7445ad3b93a7e8a1e69664
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
<<<<<<< HEAD
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
=======
import { AdminCaseStepControls } from "@/features/case-management/components/admin-case-step-controls";
import type { CaseStepStatus } from "@/features/case-management/lib/case-step-transitions";
import { getAdminCase } from "@/features/case-management/server/admin-repository";
import { Link } from "@/i18n/navigation";

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; caseId: string }>;
}) {
  const { locale, caseId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      caseId
    )
  )
    notFound();
  const [item, t] = await Promise.all([
    getAdminCase(caseId, locale),
    getTranslations({ locale, namespace: "CaseManagement" }),
  ]);
  if (!item) notFound();
  const statusKey = item.status === "on_hold" ? "onHold" : item.status;
  const format = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("caseManagement")} · ${item.serviceName}`}
        description={`${item.customerName || item.customerEmail || "-"} · ${item.providerName}`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Badge>{t(statusKey)}</Badge>
        <span className="text-muted-foreground text-sm">
          {t("staff")}: {item.staffName || t("unassigned")}
        </span>
        <Link
          className="text-primary ms-auto text-sm font-semibold hover:underline"
          href={`/admin/bookings/${item.bookingId}`}
        >
          {t("openBooking")}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("steps")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="before:bg-border relative space-y-0 before:absolute before:start-[15px] before:top-4 before:bottom-4 before:w-px">
            {item.steps.map((step) => {
              const done =
                step.status === "completed" || step.status === "skipped";
              const active =
                step.status === "in_progress" ||
                item.currentStep === step.title;
              const Icon = done ? CheckCircle2 : active ? Clock3 : Circle;
              return (
                <li
                  key={step.id}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  <span className="bg-background z-10 flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Icon
                      className={
                        done
                          ? "size-6 text-emerald-600"
                          : active
                            ? "size-6 text-amber-600"
                            : "text-muted-foreground size-5"
                      }
                    />
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{step.title}</p>
                      <Badge variant="outline">
                        {t(`stepStatuses.${step.status}`)}
                      </Badge>
                    </div>
                    {step.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {step.description}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-2 text-xs">
                      {t("responsibleRole")}:{" "}
                      {t(`actorRoles.${step.responsibleRole}`)}
                    </p>
                    {(step.completedAt || step.plannedStartAt) && (
                      <p className="text-muted-foreground mt-3 text-xs">
                        {format(step.completedAt || step.plannedStartAt)}
                      </p>
                    )}
                    {step.completionNote && (
                      <p className="bg-muted mt-2 rounded-lg p-2 text-sm">
                        {step.completionNote}
                      </p>
                    )}
                    <AdminCaseStepControls
                      caseId={item.id}
                      stepId={step.id}
                      status={step.status as CaseStepStatus}
                      lockVersion={step.lockVersion}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5" />
            {t("activity")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {item.events.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
          ) : (
            item.events.map((event) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {t("stepStatusChanged")}
                  </p>
                  <time className="text-muted-foreground text-xs">
                    {format(event.createdAt)}
                  </time>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {event.actorRole
                    ? t(`actorRoles.${event.actorRole}`)
                    : t("actorRoles.system")}
                  {event.fromStatus && event.toStatus
                    ? ` · ${t(`stepStatuses.${event.fromStatus}`)} → ${t(`stepStatuses.${event.toStatus}`)}`
                    : ""}
                </p>
                {event.note && (
                  <p className="bg-muted mt-2 rounded-lg p-2 text-sm">
                    {event.note}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
>>>>>>> 592473c7b3918fca6d7445ad3b93a7e8a1e69664
}
