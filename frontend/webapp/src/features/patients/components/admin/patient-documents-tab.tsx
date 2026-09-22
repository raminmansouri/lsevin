"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import type {
  ClinicalDocumentRow,
  ClinicalObservationRow,
  DiagnosticReportRow,
  ImagingStudyRow,
  LabOrderRow,
} from "../../documents-types";
import {
  archiveClinicalDocumentAction,
  archiveClinicalObservationAction,
  archiveDiagnosticReportAction,
  archiveImagingStudyAction,
  archiveLabOrderAction,
} from "../../server/documents-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import {
  AddDiagnosticReportDialog,
  AddDocumentDialog,
  AddImagingStudyDialog,
  AddLabOrderDialog,
  AddObservationDialog,
} from "./patient-documents-dialogs";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const INTERPRETATION_VARIANT: Record<string, "default" | "destructive" | "secondary"> = {
  normal: "default",
  high: "secondary",
  low: "secondary",
  critical_high: "destructive",
  critical_low: "destructive",
  abnormal: "secondary",
};

export function DocumentsTab({
  patientId,
  documents,
  labOrders,
  diagnosticReports,
  observations,
  imagingStudies,
}: {
  patientId: string;
  documents: ClinicalDocumentRow[];
  labOrders: LabOrderRow[];
  diagnosticReports: DiagnosticReportRow[];
  observations: ClinicalObservationRow[];
  imagingStudies: ImagingStudyRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  const [addLabOrderOpen, setAddLabOrderOpen] = useState(false);
  const [addReportOpen, setAddReportOpen] = useState(false);
  const [addObservationOpen, setAddObservationOpen] = useState(false);
  const [addImagingOpen, setAddImagingOpen] = useState(false);

  const archive = (action: (input: { id: string }) => Promise<{ ok: boolean; error?: string }>, id: string) => {
    startTransition(async () => {
      const result = await action({ id });
      if (result.ok) {
        toast.success(t("admin.clinical.archived"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.documents.documents")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddDocumentOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {documents.map((document) => (
            <div key={document.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {document.title}
                  {document.version > 1 && (
                    <span className="text-muted-foreground ms-1 text-xs">
                      ({t("admin.documents.version")} {document.version})
                    </span>
                  )}
                </p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                  <span>{t(`admin.documents.documentTypes.${document.documentType}`)}</span>
                  {document.documentDate && <span dir="ltr">· {formatDate(document.documentDate)}</span>}
                  {document.fileSize && <span dir="ltr">· {formatFileSize(document.fileSize)}</span>}
                  {document.isConfidential && <Badge variant="destructive">{t("admin.documents.confidential")}</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button asChild type="button" size="sm" variant="ghost">
                  <a href={`/api/v1/patients/${patientId}/documents/${document.id}/download`} target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                  </a>
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archiveClinicalDocumentAction, document.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.documents.labOrders")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddLabOrderOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {labOrders.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {labOrders.map((order) => (
            <div key={order.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{order.requestedTests.join("، ")}</p>
                <p className="text-muted-foreground text-xs">{t(`admin.documents.labOrderStatuses.${order.orderStatus}`)}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archiveLabOrderAction, order.id)}>
                {t("admin.clinical.archive")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.documents.diagnosticReports")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddReportOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {diagnosticReports.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {diagnosticReports.map((report) => (
            <div key={report.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{report.title}</p>
                <p className="text-muted-foreground text-xs">{t(`admin.documents.reportStatuses.${report.reportStatus}`)}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archiveDiagnosticReportAction, report.id)}>
                {t("admin.clinical.archive")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.documents.observations")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddObservationOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {observations.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {observations.map((observation) => (
            <div key={observation.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {observation.displayName}
                  {observation.valueNumber !== null && (
                    <span dir="ltr" className="ms-1">
                      {observation.valueNumber} {observation.unit}
                    </span>
                  )}
                </p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                  <span dir="ltr">{formatDate(observation.effectiveAt)}</span>
                  {(observation.referenceLow !== null || observation.referenceHigh !== null) && (
                    <span dir="ltr">
                      ({observation.referenceLow ?? "?"}-{observation.referenceHigh ?? "?"})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {observation.interpretation && (
                  <Badge variant={INTERPRETATION_VARIANT[observation.interpretation] ?? "secondary"}>
                    {t(`admin.documents.interpretations.${observation.interpretation}`)}
                  </Badge>
                )}
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archiveClinicalObservationAction, observation.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.documents.imaging")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddImagingOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {imagingStudies.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {imagingStudies.map((study) => (
            <div key={study.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {t(`admin.documents.modalities.${study.modality}`)}
                  {study.bodyPart ? ` · ${study.bodyPart}` : ""}
                </p>
                <p dir="ltr" className="text-muted-foreground text-xs">
                  {formatDate(study.studyDate)}
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archiveImagingStudyAction, study.id)}>
                {t("admin.clinical.archive")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddDocumentDialog patientId={patientId} open={addDocumentOpen} onOpenChange={setAddDocumentOpen} />
      <AddLabOrderDialog patientId={patientId} open={addLabOrderOpen} onOpenChange={setAddLabOrderOpen} />
      <AddDiagnosticReportDialog patientId={patientId} open={addReportOpen} onOpenChange={setAddReportOpen} />
      <AddObservationDialog patientId={patientId} open={addObservationOpen} onOpenChange={setAddObservationOpen} />
      <AddImagingStudyDialog patientId={patientId} open={addImagingOpen} onOpenChange={setAddImagingOpen} />
    </div>
  );
}
