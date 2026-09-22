"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import type {
  PatientAllergyRow,
  PatientClinicalSummary,
  PatientConditionRow,
  PatientMedicationRow,
  PatientProcedureRow,
  PatientProductUsageRow,
  PatientSymptomRow,
} from "../../clinical-types";
import {
  archivePatientAllergyAction,
  archivePatientConditionAction,
  archivePatientMedicationAction,
  archivePatientProcedureAction,
  archivePatientProductUsageAction,
  archivePatientSymptomAction,
} from "../../server/clinical-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import {
  AddAllergyDialog,
  AddConditionDialog,
  AddMedicationDialog,
  AddProcedureDialog,
  AddProductUsageDialog,
  AddSymptomDialog,
} from "./patient-clinical-dialogs";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

/** VERIFICATION_STATUS !== "verified" must always stay visibly labeled --
 * spec V2.8: "Never present AI-extracted [or unverified] values as
 * verified." */
function VerificationBadge({ status }: { status: string }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  if (status === "verified") return <Badge variant="default">{t("admin.clinical.verified")}</Badge>;
  return <Badge variant="secondary">{t(`admin.clinical.verificationStatuses.${status}`)}</Badge>;
}

export function ClinicalTab({
  patientId,
  summary,
  conditions,
  procedures,
  allergies,
  medications,
  productUsage,
  symptoms,
}: {
  patientId: string;
  summary: PatientClinicalSummary;
  conditions: PatientConditionRow[];
  procedures: PatientProcedureRow[];
  allergies: PatientAllergyRow[];
  medications: PatientMedicationRow[];
  productUsage: PatientProductUsageRow[];
  symptoms: PatientSymptomRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [addConditionOpen, setAddConditionOpen] = useState(false);
  const [addProcedureOpen, setAddProcedureOpen] = useState(false);
  const [addAllergyOpen, setAddAllergyOpen] = useState(false);
  const [addMedicationOpen, setAddMedicationOpen] = useState(false);
  const [addProductUsageOpen, setAddProductUsageOpen] = useState(false);
  const [addSymptomOpen, setAddSymptomOpen] = useState(false);

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

  const hasCritical = summary.criticalAllergies.length > 0;

  return (
    <div className="space-y-4">
      {hasCritical && (
        <div className="flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{t("admin.clinical.criticalAllergiesTitle")}</p>
            <p className="text-sm">
              {summary.criticalAllergies.map((a) => a.substance).filter(Boolean).join("، ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.clinical.conditions")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddConditionOpen(true)}>
              {t("admin.overview.add")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {conditions.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {conditions.map((condition) => (
              <div key={condition.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{condition.displayName}</p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                    <span>{t(`admin.clinical.conditionStatuses.${condition.clinicalStatus}`)}</span>
                    {condition.onsetDate && <span dir="ltr">· {formatDate(condition.onsetDate)}</span>}
                    <VerificationBadge status={condition.verificationStatus} />
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archivePatientConditionAction, condition.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.clinical.allergies")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddAllergyOpen(true)}>
              {t("admin.overview.add")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {allergies.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {allergies.map((allergy) => (
              <div key={allergy.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">
                    {allergy.category === "no_known_allergies" ? t("admin.clinical.allergyCategories.no_known_allergies") : allergy.substance}
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                    {allergy.reaction && <span>{allergy.reaction}</span>}
                    <VerificationBadge status={allergy.verificationStatus} />
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archivePatientAllergyAction, allergy.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.clinical.medications")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddMedicationOpen(true)}>
              {t("admin.overview.add")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {medications.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {medications.map((medication) => (
              <div key={medication.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">
                    {medication.name}
                    {medication.dose ? ` · ${medication.dose}` : ""}
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                    <span>{t(`admin.clinical.medicationStatuses.${medication.medicationStatus}`)}</span>
                    <span>{t(`admin.clinical.reportedOrPrescribed.${medication.reportedOrPrescribed}`)}</span>
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archivePatientMedicationAction, medication.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.clinical.procedures")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddProcedureOpen(true)}>
              {t("admin.overview.add")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {procedures.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {procedures.map((procedure) => (
              <div key={procedure.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{procedure.procedureName}</p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                    <span dir="ltr">{formatDate(procedure.performedFrom)}</span>
                    <span>{t(`admin.clinical.procedureStatuses.${procedure.procedureStatus}`)}</span>
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archivePatientProcedureAction, procedure.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.clinical.productUsage")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddProductUsageOpen(true)}>
              {t("admin.overview.add")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {productUsage.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {productUsage.map((usage) => (
              <div key={usage.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{usage.productName}</p>
                  <p className="text-muted-foreground text-xs">{t(`admin.clinical.productCategories.${usage.category}`)}</p>
                </div>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archivePatientProductUsageAction, usage.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.clinical.symptoms")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddSymptomOpen(true)}>
              {t("admin.overview.add")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {symptoms.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {symptoms.map((symptom) => (
              <div key={symptom.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{symptom.name}</p>
                  {symptom.onsetDate && (
                    <p dir="ltr" className="text-muted-foreground text-xs">
                      {formatDate(symptom.onsetDate)}
                    </p>
                  )}
                </div>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => archive(archivePatientSymptomAction, symptom.id)}>
                  {t("admin.clinical.archive")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AddConditionDialog patientId={patientId} open={addConditionOpen} onOpenChange={setAddConditionOpen} />
      <AddProcedureDialog patientId={patientId} open={addProcedureOpen} onOpenChange={setAddProcedureOpen} />
      <AddAllergyDialog patientId={patientId} open={addAllergyOpen} onOpenChange={setAddAllergyOpen} />
      <AddMedicationDialog patientId={patientId} open={addMedicationOpen} onOpenChange={setAddMedicationOpen} />
      <AddProductUsageDialog patientId={patientId} open={addProductUsageOpen} onOpenChange={setAddProductUsageOpen} />
      <AddSymptomDialog patientId={patientId} open={addSymptomOpen} onOpenChange={setAddSymptomOpen} />
    </div>
  );
}
