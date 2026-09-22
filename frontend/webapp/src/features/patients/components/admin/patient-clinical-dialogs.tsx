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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import {
  ALLERGY_CATEGORIES,
  CONDITION_CLINICAL_STATUSES,
  MEDICATION_STATUSES,
  PROCEDURE_STATUSES,
  PRODUCT_USAGE_CATEGORIES,
} from "../../clinical-schemas";
import {
  addPatientAllergyAction,
  addPatientConditionAction,
  addPatientMedicationAction,
  addPatientProcedureAction,
  addPatientProductUsageAction,
  addPatientSymptomAction,
} from "../../server/clinical-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

type DialogProps = { patientId: string; open: boolean; onOpenChange: (open: boolean) => void };

function useRefreshOnSuccess() {
  const router = useRouter();
  return () => router.refresh();
}

export function AddConditionDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [clinicalStatus, setClinicalStatus] = useState<(typeof CONDITION_CLINICAL_STATUSES)[number]>("active");
  const [onsetDate, setOnsetDate] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientConditionAction({
        patientId,
        displayName: displayName.trim(),
        clinicalStatus,
        onsetDate,
        notes: notes.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setDisplayName("");
        setNotes("");
        setOnsetDate(undefined);
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
          <DialogTitle>{t("admin.clinical.addCondition")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.displayName")}</Label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.clinicalStatus")}</Label>
            <Select value={clinicalStatus} onValueChange={(v) => setClinicalStatus(v as typeof clinicalStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_CLINICAL_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.clinical.conditionStatuses.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.onsetDate")}</Label>
            <DatePicker value={onsetDate} onChange={setOnsetDate} disableFuture />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.notes")}</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !displayName.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddProcedureDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [procedureName, setProcedureName] = useState("");
  const [procedureStatus, setProcedureStatus] = useState<(typeof PROCEDURE_STATUSES)[number]>("completed");
  const [performedFrom, setPerformedFrom] = useState<string | undefined>();
  const [countryCode, setCountryCode] = useState("");
  const [notes, setNotes] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    if (!performedFrom) return;
    startTransition(async () => {
      const result = await addPatientProcedureAction({
        patientId,
        procedureName: procedureName.trim(),
        procedureStatus,
        performedFrom,
        countryCode: countryCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setProcedureName("");
        setNotes("");
        setCountryCode("");
        setPerformedFrom(undefined);
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
          <DialogTitle>{t("admin.clinical.addProcedure")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.procedureName")}</Label>
            <Input value={procedureName} onChange={(event) => setProcedureName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.procedureStatus")}</Label>
            <Select value={procedureStatus} onValueChange={(v) => setProcedureStatus(v as typeof procedureStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCEDURE_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.clinical.procedureStatuses.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.performedFrom")}</Label>
            <DatePicker value={performedFrom} onChange={setPerformedFrom} disableFuture />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.fields.countryCode")}</Label>
            <Input dir="ltr" maxLength={2} value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.notes")}</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !procedureName.trim() || !performedFrom}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddAllergyDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [substance, setSubstance] = useState("");
  const [category, setCategory] = useState<(typeof ALLERGY_CATEGORIES)[number]>("medication");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState("");
  const refresh = useRefreshOnSuccess();

  const isNoKnown = category === "no_known_allergies";
  const canSave = isNoKnown || substance.trim().length > 0;

  const save = () => {
    startTransition(async () => {
      const result = await addPatientAllergyAction({
        patientId,
        substance: isNoKnown ? undefined : substance.trim(),
        category,
        reaction: reaction.trim() || undefined,
        severity: severity.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setSubstance("");
        setReaction("");
        setSeverity("");
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
          <DialogTitle>{t("admin.clinical.addAllergy")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.allergyCategory")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.clinical.allergyCategories.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isNoKnown && (
            <>
              <div className="space-y-2">
                <Label>{t("admin.clinical.fields.substance")}</Label>
                <Input value={substance} onChange={(event) => setSubstance(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.clinical.fields.reaction")}</Label>
                <Input value={reaction} onChange={(event) => setReaction(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.clinical.fields.severity")}</Label>
                <Input value={severity} onChange={(event) => setSeverity(event.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !canSave}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddMedicationDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [medicationStatus, setMedicationStatus] = useState<(typeof MEDICATION_STATUSES)[number]>("active");
  const [startDate, setStartDate] = useState<string | undefined>();
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientMedicationAction({
        patientId,
        name: name.trim(),
        dose: dose.trim() || undefined,
        frequency: frequency.trim() || undefined,
        medicationStatus,
        startDate,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setName("");
        setDose("");
        setFrequency("");
        setStartDate(undefined);
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
          <DialogTitle>{t("admin.clinical.addMedication")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.medicationName")}</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("admin.clinical.fields.dose")}</Label>
              <Input dir="ltr" value={dose} onChange={(event) => setDose(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.clinical.fields.frequency")}</Label>
              <Input value={frequency} onChange={(event) => setFrequency(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.medicationStatus")}</Label>
            <Select value={medicationStatus} onValueChange={(v) => setMedicationStatus(v as typeof medicationStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDICATION_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.clinical.medicationStatuses.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.startDate")}</Label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !name.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddProductUsageDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<(typeof PRODUCT_USAGE_CATEGORIES)[number]>("supplement");
  const [startedAt, setStartedAt] = useState<string | undefined>();
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientProductUsageAction({
        patientId,
        productName: productName.trim(),
        category,
        startedAt,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setProductName("");
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
          <DialogTitle>{t("admin.clinical.addProductUsage")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.productName")}</Label>
            <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.productCategory")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_USAGE_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.clinical.productCategories.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.startedAt")}</Label>
            <DatePicker value={startedAt} onChange={setStartedAt} disableFuture />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !productName.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddSymptomDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [onsetDate, setOnsetDate] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addPatientSymptomAction({
        patientId,
        name: name.trim(),
        onsetDate,
        patientDescription: description.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setName("");
        setOnsetDate(undefined);
        setDescription("");
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
          <DialogTitle>{t("admin.clinical.addSymptom")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.symptomName")}</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.onsetDate")}</Label>
            <DatePicker value={onsetDate} onChange={setOnsetDate} disableFuture />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.clinical.fields.patientDescription")}</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !name.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
