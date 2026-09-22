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
import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import type { MediaItem } from "@/features/media-picker-addon/types";
import { useRouter } from "@/i18n/navigation";

import {
  DIAGNOSTIC_REPORT_STATUSES,
  DOCUMENT_TYPES,
  IMAGING_MODALITIES,
  OBSERVATION_INTERPRETATIONS,
} from "../../documents-schemas";
import {
  addClinicalDocumentAction,
  addClinicalObservationAction,
  addDiagnosticReportAction,
  addImagingStudyAction,
  addLabOrderAction,
} from "../../server/documents-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

type DialogProps = { patientId: string; open: boolean; onOpenChange: (open: boolean) => void };

function useRefreshOnSuccess() {
  const router = useRouter();
  return () => router.refresh();
}

export function AddDocumentDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<MediaItem | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<(typeof DOCUMENT_TYPES)[number]>("other");
  const [documentDate, setDocumentDate] = useState<string | undefined>();
  const [isConfidential, setIsConfidential] = useState(false);
  const refresh = useRefreshOnSuccess();

  const save = () => {
    if (!file) return;
    startTransition(async () => {
      const result = await addClinicalDocumentAction({
        patientId,
        documentType,
        title: title.trim() || file.originalName,
        mediaLibraryId: file.id,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        originalName: file.originalName,
        documentDate,
        isConfidential,
      });
      if (result.ok) {
        if (result.data?.duplicateOf) {
          toast.warning(t("admin.documents.possibleDuplicate"));
        } else {
          toast.success(t("admin.overview.saved"));
        }
        onOpenChange(false);
        setFile(null);
        setTitle("");
        setDocumentDate(undefined);
        setIsConfidential(false);
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
          <DialogTitle>{t("admin.documents.addDocument")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.file")}</Label>
            <SingleMediaPickerInput
              name="clinical-document-file"
              mediaType="all"
              valueField="id"
              onItemsChange={(items) => setFile(items[0] ?? null)}
              placeholder={t("admin.documents.fields.filePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.title")}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={file?.originalName} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.documentType")}</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as typeof documentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.documents.documentTypes.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.documentDate")}</Label>
            <DatePicker value={documentDate} onChange={setDocumentDate} disableFuture />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isConfidential} onChange={(event) => setIsConfidential(event.target.checked)} />
            {t("admin.documents.fields.isConfidential")}
          </label>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !file}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddLabOrderDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [testsText, setTestsText] = useState("");
  const [externalLab, setExternalLab] = useState("");
  const refresh = useRefreshOnSuccess();

  const requestedTests = testsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const save = () => {
    if (requestedTests.length === 0) return;
    startTransition(async () => {
      const result = await addLabOrderAction({ patientId, requestedTests, externalLab: externalLab.trim() || undefined });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setTestsText("");
        setExternalLab("");
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
          <DialogTitle>{t("admin.documents.addLabOrder")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.requestedTests")}</Label>
            <Textarea value={testsText} onChange={(event) => setTestsText(event.target.value)} rows={2} placeholder={t("admin.documents.fields.requestedTestsPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.externalLab")}</Label>
            <Input value={externalLab} onChange={(event) => setExternalLab(event.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || requestedTests.length === 0}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddDiagnosticReportDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportStatus, setReportStatus] = useState<(typeof DIAGNOSTIC_REPORT_STATUSES)[number]>("preliminary");
  const [summary, setSummary] = useState("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addDiagnosticReportAction({
        patientId,
        title: title.trim(),
        reportType: reportType.trim(),
        reportStatus,
        summary: summary.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setTitle("");
        setReportType("");
        setSummary("");
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
          <DialogTitle>{t("admin.documents.addDiagnosticReport")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.title")}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.reportType")}</Label>
            <Input value={reportType} onChange={(event) => setReportType(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.reportStatus")}</Label>
            <Select value={reportStatus} onValueChange={(v) => setReportStatus(v as typeof reportStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAGNOSTIC_REPORT_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.documents.reportStatuses.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.summary")}</Label>
            <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !title.trim() || !reportType.trim()}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddObservationDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [valueNumber, setValueNumber] = useState("");
  const [unit, setUnit] = useState("");
  const [referenceLow, setReferenceLow] = useState("");
  const [referenceHigh, setReferenceHigh] = useState("");
  const [interpretation, setInterpretation] = useState<(typeof OBSERVATION_INTERPRETATIONS)[number] | "">("");
  const refresh = useRefreshOnSuccess();

  const save = () => {
    startTransition(async () => {
      const result = await addClinicalObservationAction({
        patientId,
        displayName: displayName.trim(),
        valueNumber: valueNumber ? Number(valueNumber) : undefined,
        unit: unit.trim() || undefined,
        referenceLow: referenceLow ? Number(referenceLow) : undefined,
        referenceHigh: referenceHigh ? Number(referenceHigh) : undefined,
        interpretation: interpretation || undefined,
        effectiveAt: new Date().toISOString(),
      });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setDisplayName("");
        setValueNumber("");
        setUnit("");
        setReferenceLow("");
        setReferenceHigh("");
        setInterpretation("");
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
          <DialogTitle>{t("admin.documents.addObservation")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.observationName")}</Label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("admin.documents.fields.value")}</Label>
              <Input dir="ltr" inputMode="decimal" value={valueNumber} onChange={(event) => setValueNumber(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.documents.fields.unit")}</Label>
              <Input dir="ltr" value={unit} onChange={(event) => setUnit(event.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("admin.documents.fields.referenceLow")}</Label>
              <Input dir="ltr" inputMode="decimal" value={referenceLow} onChange={(event) => setReferenceLow(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.documents.fields.referenceHigh")}</Label>
              <Input dir="ltr" inputMode="decimal" value={referenceHigh} onChange={(event) => setReferenceHigh(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.interpretation")}</Label>
            <Select value={interpretation || "none"} onValueChange={(v) => setInterpretation(v === "none" ? "" : (v as typeof interpretation))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.documents.fields.interpretationNone")}</SelectItem>
                {OBSERVATION_INTERPRETATIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.documents.interpretations.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export function AddImagingStudyDialog({ patientId, open, onOpenChange }: DialogProps) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [modality, setModality] = useState<(typeof IMAGING_MODALITIES)[number]>("mri");
  const [bodyPart, setBodyPart] = useState("");
  const [studyDate, setStudyDate] = useState<string | undefined>();
  const refresh = useRefreshOnSuccess();

  const save = () => {
    if (!studyDate) return;
    startTransition(async () => {
      const result = await addImagingStudyAction({ patientId, modality, bodyPart: bodyPart.trim() || undefined, studyDate });
      if (result.ok) {
        toast.success(t("admin.overview.saved"));
        onOpenChange(false);
        setBodyPart("");
        setStudyDate(undefined);
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
          <DialogTitle>{t("admin.documents.addImagingStudy")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.modality")}</Label>
            <Select value={modality} onValueChange={(v) => setModality(v as typeof modality)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGING_MODALITIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.documents.modalities.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.bodyPart")}</Label>
            <Input value={bodyPart} onChange={(event) => setBodyPart(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.documents.fields.studyDate")}</Label>
            <DatePicker value={studyDate} onChange={setStudyDate} disableFuture />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !studyDate}>
            {t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
