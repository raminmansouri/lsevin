"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import type {
  CaseFunnelStage,
  CaseSegmentation,
  CaseTimingMetrics,
  DataQualityMetrics,
  FollowUpCompletionMetrics,
  FollowupScheduleRuleRow,
  OverdueFollowUp,
} from "../../analytics-types";
import { addFollowupScheduleRuleAction, deactivateFollowupScheduleRuleAction } from "../../server/analytics-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function OperationsDashboard({
  funnel,
  timing,
  segmentation,
  followUpCompletion,
  overdueFollowUps,
  dataQuality,
  scheduleRules,
}: {
  funnel: CaseFunnelStage[];
  timing: CaseTimingMetrics;
  segmentation: CaseSegmentation;
  followUpCompletion: FollowUpCompletionMetrics;
  overdueFollowUps: OverdueFollowUp[];
  dataQuality: DataQualityMetrics;
  scheduleRules: FollowupScheduleRuleRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.operations.funnel.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {funnel.map((stage) => (
            <div key={stage.caseStatus} className="flex items-center justify-between text-sm">
              <span>{t(`admin.cases.statuses.${stage.caseStatus}`)}</span>
              <span className="text-muted-foreground" dir="ltr">
                {stage.count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.operations.timing.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.timing.avgIntakeToReadyDays")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {timing.avgIntakeToReadyDays === null
                ? t("admin.operations.timing.noData")
                : t("admin.operations.timing.days", { value: Math.round(timing.avgIntakeToReadyDays) })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.timing.medianIntakeToReadyDays")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {timing.medianIntakeToReadyDays === null
                ? t("admin.operations.timing.noData")
                : t("admin.operations.timing.days", { value: Math.round(timing.medianIntakeToReadyDays) })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.timing.avgProviderResponseDays")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {timing.avgProviderResponseDays === null
                ? t("admin.operations.timing.noData")
                : t("admin.operations.timing.days", { value: Math.round(timing.avgProviderResponseDays) })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.timing.casesMeasured")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {timing.casesMeasured}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.operations.segmentation.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">{t("admin.operations.segmentation.byOriginCountry")}</p>
            {segmentation.byOriginCountry.map((row) => (
              <div key={row.segment} className="flex items-center justify-between text-sm">
                <span>{row.segment === "unknown" ? t("admin.operations.segmentation.unknown") : row.segment}</span>
                <span className="text-muted-foreground" dir="ltr">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">{t("admin.operations.segmentation.byCaseType")}</p>
            {segmentation.byCaseType.map((row) => (
              <div key={row.segment} className="flex items-center justify-between text-sm">
                <span>{row.segment}</span>
                <span className="text-muted-foreground" dir="ltr">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.operations.followUpCompletion.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.followUpCompletion.total")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {followUpCompletion.total}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.followUpCompletion.completed")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {followUpCompletion.completed}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.followUpCompletion.missed")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {followUpCompletion.missed}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.followUpCompletion.completionRate")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {followUpCompletion.completionRate}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.operations.overdueFollowUps.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdueFollowUps.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.operations.overdueFollowUps.empty")}</p>}
          {overdueFollowUps.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0 last:pb-0">
              <div>
                <p className="font-medium">{item.patientName}</p>
                <p dir="ltr" className="text-muted-foreground text-xs">
                  {formatDate(item.scheduledDate)}
                </p>
              </div>
              <Badge variant="destructive">{t("admin.operations.overdueFollowUps.daysOverdue", { value: item.daysOverdue })}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.operations.dataQuality.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.dataQuality.totalPatients")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {dataQuality.totalPatients}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.dataQuality.pendingDuplicateCandidates")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {dataQuality.pendingDuplicateCandidates}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.dataQuality.duplicateRate")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {dataQuality.duplicateRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.dataQuality.unverifiedClinicalRecordRate")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {dataQuality.unverifiedClinicalRecordRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.dataQuality.recordsMissingCodeRate")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {dataQuality.recordsMissingCodeRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("admin.operations.dataQuality.staleContactCount")}</span>
            <span className="text-muted-foreground" dir="ltr">
              {dataQuality.staleContactCount}
            </span>
          </div>
        </CardContent>
      </Card>

      <ScheduleRulesCard scheduleRules={scheduleRules} />
    </div>
  );
}

function ScheduleRulesCard({ scheduleRules }: { scheduleRules: FollowupScheduleRuleRow[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const deactivate = (id: string) => {
    startTransition(async () => {
      const result = await deactivateFollowupScheduleRuleAction({ id });
      if (result.ok) {
        toast.success(t("admin.operations.scheduleRules.deactivated"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("admin.operations.scheduleRules.title")}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t("admin.operations.scheduleRules.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {scheduleRules.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.operations.scheduleRules.empty")}</p>}
        {scheduleRules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">
                {rule.caseType} — {rule.title}
              </p>
              <p className="text-muted-foreground text-xs" dir="ltr">
                {t("admin.operations.scheduleRules.daysAfterCompletion")}: {rule.daysAfterCompletion}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={rule.isActive ? "outline" : "secondary"}>
                {rule.isActive ? t("admin.operations.scheduleRules.active") : t("admin.operations.scheduleRules.inactive")}
              </Badge>
              {rule.isActive && (
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => deactivate(rule.id)}>
                  {t("admin.operations.scheduleRules.deactivate")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <AddScheduleRuleDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function AddScheduleRuleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [caseType, setCaseType] = useState("");
  const [daysAfterCompletion, setDaysAfterCompletion] = useState("14");
  const [title, setTitle] = useState("");
  const [requiredItems, setRequiredItems] = useState("");

  const save = () => {
    const days = Number(daysAfterCompletion);
    if (!caseType.trim() || !title.trim() || !Number.isFinite(days) || days < 0) return;
    startTransition(async () => {
      const result = await addFollowupScheduleRuleAction({
        caseType: caseType.trim(),
        daysAfterCompletion: days,
        title: title.trim(),
        requiredItems: requiredItems.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.operations.scheduleRules.added"));
        onOpenChange(false);
        setCaseType("");
        setDaysAfterCompletion("14");
        setTitle("");
        setRequiredItems("");
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.operations.scheduleRules.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.operations.scheduleRules.caseType")}</Label>
            <Input value={caseType} onChange={(event) => setCaseType(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.operations.scheduleRules.daysAfterCompletion")}</Label>
            <Input
              type="number"
              min={0}
              value={daysAfterCompletion}
              onChange={(event) => setDaysAfterCompletion(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.operations.scheduleRules.ruleTitle")}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.operations.scheduleRules.requiredItems")}</Label>
            <Input value={requiredItems} onChange={(event) => setRequiredItems(event.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !caseType.trim() || !title.trim()}>
            {isPending ? t("admin.operations.scheduleRules.saving") : t("admin.operations.scheduleRules.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
