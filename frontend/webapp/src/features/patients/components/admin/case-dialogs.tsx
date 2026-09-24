"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import { ENCOUNTER_TYPES, REQUIREMENT_TYPES } from "../../cases-schemas";
import {
  addCaseRequirementAction,
  addClinicalEncounterAction,
  addFollowUpAction,
  addProviderSubmissionAction,
  addSecondOpinionAction,
  addTreatmentProposalAction,
} from "../../server/cases-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

type DialogProps = { patientId: string; medicalCaseId: string; open: boolean; onOpenChange: (open: boolean) => void };

function useRefreshOnSuccess() {
  const router = useRouter();
  return () => router.refresh();
}

export function AddEncounterDialog({ patientId, medicalCaseId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [encounterType, setEncounterType] = useState<(typeof ENCOUNTER_TYPES)[number]>("clinic_visit");
  const [startedAt, setStartedAt] = useState<string | undefined>();
  const [reason, setReason] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    if (!startedAt) return;
    startTransition(async () => {
      const result = await addClinicalEncounterAction({
        patientId,
        medicalCaseId,
        encounterType,
        startedAt: `${startedAt}T00:00:00.000Z`,
        reason: reason.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setReason("");
        setStartedAt(undefined);
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.addEncounter")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.encounterType")}</Label>
            <Select value={encounterType} onValueChange={(v) => setEncounterType(v as typeof encounterType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCOUNTER_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.cases.encounterTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.startedAt")}</Label>
            <DatePicker value={startedAt} onChange={setStartedAt} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.reason")}</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !startedAt}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddRequirementDialog({ medicalCaseId, open, onOpenChange }: Omit<DialogProps, "patientId">) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [requirementType, setRequirementType] = useState<(typeof REQUIREMENT_TYPES)[number]>("document");
  const [title, setTitle] = useState("");
  const [maxAgeHours, setMaxAgeHours] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addCaseRequirementAction({
        medicalCaseId,
        requirementType,
        title: title.trim(),
        maxAgeHours: maxAgeHours.trim() ? Number(maxAgeHours) : undefined,
        isMandatory,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setTitle("");
        setMaxAgeHours("");
        setIsMandatory(true);
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.addRequirement")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.requirementType")}</Label>
            <Select value={requirementType} onValueChange={(v) => setRequirementType(v as typeof requirementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.cases.requirementTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.title")}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.maxAgeHours")}</Label>
            <Input
              dir="ltr"
              inputMode="numeric"
              placeholder={t("admin.cases.fields.maxAgeHoursPlaceholder")}
              value={maxAgeHours}
              onChange={(event) => setMaxAgeHours(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label>{t("admin.cases.fields.isMandatory")}</Label>
            <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !title.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddSubmissionDialog({ medicalCaseId, open, onOpenChange }: Omit<DialogProps, "patientId">) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [providerId, setProviderId] = useState("");
  const [notes, setNotes] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addProviderSubmissionAction({ medicalCaseId, providerId: providerId.trim(), providerNotes: notes.trim() || undefined });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setProviderId("");
        setNotes("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.addSubmission")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.fields.accountId")} ({t("admin.cases.providerId")})</Label>
            <Input dir="ltr" value={providerId} onChange={(event) => setProviderId(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.notes")}</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !providerId.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddProposalDialog({ medicalCaseId, open, onOpenChange }: Omit<DialogProps, "patientId">) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [estimatedStayDays, setEstimatedStayDays] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addTreatmentProposalAction({
        medicalCaseId,
        diagnosis: diagnosis.trim() || undefined,
        treatmentPlan: treatmentPlan.trim() || undefined,
        estimatedStayDays: estimatedStayDays ? Number(estimatedStayDays) : undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setDiagnosis("");
        setTreatmentPlan("");
        setEstimatedStayDays("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.addProposal")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.diagnosis")}</Label>
            <Input value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.treatmentPlan")}</Label>
            <Textarea value={treatmentPlan} onChange={(event) => setTreatmentPlan(event.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.estimatedStayDays")}</Label>
            <Input dir="ltr" inputMode="numeric" value={estimatedStayDays} onChange={(event) => setEstimatedStayDays(event.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddSecondOpinionDialog({ medicalCaseId, open, onOpenChange }: Omit<DialogProps, "patientId">) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [providerId, setProviderId] = useState("");
  const [opinionDate, setOpinionDate] = useState<string | undefined>();
  const [conclusion, setConclusion] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    if (!opinionDate) return;
    startTransition(async () => {
      const result = await addSecondOpinionAction({ medicalCaseId, providerId: providerId.trim(), opinionDate, conclusion: conclusion.trim() });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setProviderId("");
        setOpinionDate(undefined);
        setConclusion("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.addSecondOpinion")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.cases.providerId")}</Label>
            <Input dir="ltr" value={providerId} onChange={(event) => setProviderId(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.opinionDate")}</Label>
            <DatePicker value={opinionDate} onChange={setOpinionDate} disableFuture />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.conclusion")}</Label>
            <Textarea value={conclusion} onChange={(event) => setConclusion(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !providerId.trim() || !opinionDate || !conclusion.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddFollowUpDialog({ medicalCaseId, open, onOpenChange }: Omit<DialogProps, "patientId">) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [scheduledDate, setScheduledDate] = useState<string | undefined>();
  const [requiredItems, setRequiredItems] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    if (!scheduledDate) return;
    startTransition(async () => {
      const result = await addFollowUpAction({ medicalCaseId, scheduledDate, requiredItems: requiredItems.trim() || undefined });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setScheduledDate(undefined);
        setRequiredItems("");
        refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.cases.addFollowUp")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.scheduledDate")}</Label>
            <DatePicker value={scheduledDate} onChange={setScheduledDate} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.cases.fields.requiredItems")}</Label>
            <Textarea value={requiredItems} onChange={(event) => setRequiredItems(event.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !scheduledDate}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
