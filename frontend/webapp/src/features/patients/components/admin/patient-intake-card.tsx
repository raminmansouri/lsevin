"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { INTAKE_CONDITION_KEYS, intakeCompletionPercent, type HealthIntakeRow } from "../../intake-schemas";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

/**
 * Read-only view of the patient's own health questionnaire for the care
 * team. Everything here is self-reported; conditions answered "yes" also
 * appear as self-reported rows in the clinical lists below.
 */
export function PatientIntakeCard({ intake }: { intake: HealthIntakeRow | null }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  if (!intake) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.healthIntake.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("admin.healthIntake.notStarted")}</CardContent>
      </Card>
    );
  }

  const row = (label: string, value: string | number | null | undefined) =>
    value === null || value === undefined || value === "" ? null : (
      <div className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 py-1.5 text-sm">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="break-words">{value}</dd>
      </div>
    );

  const conditionLines = INTAKE_CONDITION_KEYS.flatMap((key) => {
    const answer = intake.conditionAnswers?.[key];
    if (!answer) return [];
    return [`${key}: ${answer.answer}${answer.details ? ` (${answer.details})` : ""}`];
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("admin.healthIntake.title")}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t("admin.healthIntake.selfReported")}</Badge>
          <Badge variant={intake.completedAt ? "default" : "secondary"}>{intakeCompletionPercent(intake)}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {row(t("admin.healthIntake.fields.height"), intake.heightCm)}
          {row(t("admin.healthIntake.fields.weight"), intake.weightKg)}
          {row(t("admin.healthIntake.fields.bloodType"), intake.bloodType)}
          {row(t("admin.healthIntake.fields.mainConcern"), intake.mainConcern)}
          {row(t("admin.healthIntake.fields.bodyArea"), intake.concernBodyArea)}
          {row(t("admin.healthIntake.fields.duration"), intake.concernDuration)}
          {row(t("admin.healthIntake.fields.severity"), intake.concernSeverity !== null ? `${intake.concernSeverity}/10` : null)}
          {row(t("admin.healthIntake.fields.desiredTreatment"), intake.desiredTreatment)}
          {row(t("admin.healthIntake.fields.conditions"), conditionLines.join(" · "))}
          {row(t("admin.healthIntake.fields.pregnancy"), intake.pregnancyStatus)}
          {row(
            t("admin.healthIntake.fields.anesthesia"),
            intake.anesthesiaProblems ? `${intake.anesthesiaProblems}${intake.anesthesiaDetails ? ` (${intake.anesthesiaDetails})` : ""}` : null
          )}
          {row(t("admin.healthIntake.fields.bloodThinners"), intake.takesBloodThinners)}
          {row(t("admin.healthIntake.fields.smoking"), intake.smoking)}
          {row(t("admin.healthIntake.fields.alcohol"), intake.alcohol)}
          {row(t("admin.healthIntake.fields.activity"), intake.activityLevel)}
          {row(t("admin.healthIntake.fields.updated"), new Date(intake.lastModifiedDate).toLocaleString())}
        </dl>
      </CardContent>
    </Card>
  );
}
