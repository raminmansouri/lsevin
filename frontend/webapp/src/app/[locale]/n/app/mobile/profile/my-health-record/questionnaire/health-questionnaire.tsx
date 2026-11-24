"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import {
  ACTIVITY_LEVELS,
  ALCOHOL_STATUSES,
  BLOOD_TYPES,
  CONCERN_DURATIONS,
  INTAKE_CONDITION_KEYS,
  INTAKE_STEPS,
  PREGNANCY_STATUSES,
  SEX_AT_BIRTH,
  SMOKING_STATUSES,
  YES_NO_UNSURE,
  type HealthIntakeRow,
  type IntakeConditionKey,
  type IntakeStep,
  type SaveIntakeStepInput,
} from "@/features/patients/intake-schemas";
import type { SelfEditableRecords } from "@/features/patients/server/intake-repository";
import { saveIntakeStepAction } from "@/features/patients/server/customer-intake-actions";
import { Link, useRouter } from "@/i18n/navigation";
import type { TranslationType } from "@/types/next";

import { DocumentsStep, MedicinesStep, SurgeriesStep } from "./list-steps";
import { Card, Choice, Field, StepHeading, inputClass } from "./ui";

export type QuestionnairePatient = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  sexAtBirth: string | null;
  relationshipType: string;
};

export type QuestionnaireDocument = { id: string; title: string; documentType: string };

type ConditionDraft = Partial<Record<IntakeConditionKey, { answer?: (typeof YES_NO_UNSURE)[number]; details?: string }>>;

const HEALTH_RECORD_PATH = "/n/app/mobile/profile/my-health-record";

function numberOrUndefined(value: string): number | undefined {
  const normalized = value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (!normalized.trim()) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

export function HealthQuestionnaire({
  initialStep,
  patient,
  intake,
  records,
  documents,
}: {
  initialStep: IntakeStep;
  patient: QuestionnairePatient;
  intake: HealthIntakeRow | null;
  records: SelfEditableRecords;
  documents: QuestionnaireDocument[];
}) {
  const t = useTranslations("MobileProfile.myHealthRecord.intake") as TranslationType;
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<IntakeStep>(initialStep);
  const stepIndex = INTAKE_STEPS.indexOf(step);

  // --- answers, prefilled from what is already saved ---
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [birthDate, setBirthDate] = useState(patient.birthDate ?? "");
  const [sexAtBirth, setSexAtBirth] = useState<(typeof SEX_AT_BIRTH)[number] | undefined>(
    (SEX_AT_BIRTH as readonly string[]).includes(patient.sexAtBirth ?? "") ? (patient.sexAtBirth as (typeof SEX_AT_BIRTH)[number]) : undefined
  );
  const [height, setHeight] = useState(intake?.heightCm != null ? String(intake.heightCm) : "");
  const [weight, setWeight] = useState(intake?.weightKg != null ? String(intake.weightKg) : "");
  const [bloodType, setBloodType] = useState<(typeof BLOOD_TYPES)[number] | undefined>((intake?.bloodType as never) ?? undefined);

  const [mainConcern, setMainConcern] = useState(intake?.mainConcern ?? "");
  const [bodyArea, setBodyArea] = useState(intake?.concernBodyArea ?? "");
  const [duration, setDuration] = useState<(typeof CONCERN_DURATIONS)[number] | undefined>((intake?.concernDuration as never) ?? undefined);
  const [severity, setSeverity] = useState<number | undefined>(intake?.concernSeverity ?? undefined);
  const [desiredTreatment, setDesiredTreatment] = useState(intake?.desiredTreatment ?? "");

  const [conditions, setConditions] = useState<ConditionDraft>(() => {
    const draft: ConditionDraft = {};
    for (const key of INTAKE_CONDITION_KEYS) {
      const saved = intake?.conditionAnswers?.[key];
      if (saved) draft[key] = { answer: saved.answer, details: saved.details };
    }
    return draft;
  });
  const [pregnancy, setPregnancy] = useState<(typeof PREGNANCY_STATUSES)[number] | undefined>((intake?.pregnancyStatus as never) ?? undefined);

  const [anesthesia, setAnesthesia] = useState<(typeof YES_NO_UNSURE)[number] | undefined>((intake?.anesthesiaProblems as never) ?? undefined);
  const [anesthesiaDetails, setAnesthesiaDetails] = useState(intake?.anesthesiaDetails ?? "");
  const [bloodThinners, setBloodThinners] = useState<(typeof YES_NO_UNSURE)[number] | undefined>((intake?.takesBloodThinners as never) ?? undefined);

  const [smoking, setSmoking] = useState<(typeof SMOKING_STATUSES)[number] | undefined>((intake?.smoking as never) ?? undefined);
  const [alcohol, setAlcohol] = useState<(typeof ALCOHOL_STATUSES)[number] | undefined>((intake?.alcohol as never) ?? undefined);
  const [activity, setActivity] = useState<(typeof ACTIVITY_LEVELS)[number] | undefined>((intake?.activityLevel as never) ?? undefined);

  const options = <T extends string>(values: readonly T[], prefix: string) =>
    values.map((value) => ({ value, label: t(`${prefix}.${value}`) }));
  const yesNo = options(YES_NO_UNSURE, "answers");

  const goTo = (next: IntakeStep) => {
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const payloadFor = (current: IntakeStep): SaveIntakeStepInput | null => {
    const patientId = patient.id;
    switch (current) {
      case "about":
        return {
          step: "about",
          patientId,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          birthDate: birthDate || undefined,
          sexAtBirth,
          heightCm: numberOrUndefined(height),
          weightKg: numberOrUndefined(weight),
          bloodType,
        };
      case "concern":
        return {
          step: "concern",
          patientId,
          mainConcern: mainConcern.trim() || undefined,
          concernBodyArea: bodyArea.trim() || undefined,
          concernDuration: duration,
          concernSeverity: severity,
          desiredTreatment: desiredTreatment.trim() || undefined,
        };
      case "conditions": {
        const answers: Record<string, { answer: (typeof YES_NO_UNSURE)[number]; details?: string }> = {};
        for (const key of INTAKE_CONDITION_KEYS) {
          const entry = conditions[key];
          if (entry?.answer) answers[key] = { answer: entry.answer, details: entry.answer === "yes" ? entry.details?.trim() || undefined : undefined };
        }
        return { step: "conditions", patientId, answers, pregnancyStatus: sexAtBirth === "female" ? pregnancy : undefined };
      }
      case "surgeries":
        return { step: "surgeries", patientId, anesthesiaProblems: anesthesia, anesthesiaDetails: anesthesiaDetails.trim() || undefined };
      case "medicines":
        return { step: "medicines", patientId, takesBloodThinners: bloodThinners };
      case "lifestyle":
        return { step: "lifestyle", patientId, smoking, alcohol, activityLevel: activity };
      case "documents":
        return { step: "documents", patientId };
      case "review":
        return { step: "review", patientId };
    }
  };

  const saveAndContinue = () => {
    const payload = payloadFor(step);
    if (!payload) {
      toast.error(t("errors.nameRequired"));
      return;
    }
    startTransition(async () => {
      const result = await saveIntakeStepAction(payload);
      if (!result.ok) {
        toast.error(result.error || t("errors.generic"));
        return;
      }
      if (step === "review") {
        toast.success(t("finished"));
        router.push(HEALTH_RECORD_PATH);
        router.refresh();
        return;
      }
      router.refresh();
      goTo(INTAKE_STEPS[stepIndex + 1]);
    });
  };

  const progress = Math.round(((stepIndex + 1) * 100) / INTAKE_STEPS.length);
  const whoFor =
    patient.relationshipType === "self" ? null : t("forPerson", { name: `${patient.firstName} ${patient.lastName}`.trim() });

  return (
    <div className="min-h-screen bg-[#faf6ee] pb-32">
      <div className="mx-auto max-w-3xl px-5 pt-6 xl:pt-10">
        <Link href={HEALTH_RECORD_PATH} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f5a45]">
          <ArrowRight size={16} className="ltr:rotate-180" />
          {t("backToRecord")}
        </Link>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-bold tracking-wide text-[#c9a55a]">
              {t("stepOf", { current: stepIndex + 1, total: INTAKE_STEPS.length })}
            </p>
            {whoFor ? <p className="text-xs font-semibold text-[#6b6150]">{whoFor}</p> : null}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efe5cf]">
            <div className="h-full rounded-full bg-[#083f30] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 hidden gap-1.5 sm:flex">
            {INTAKE_STEPS.map((key, index) => {
              const done = intake?.completedSteps.includes(key);
              const current = key === step;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => goTo(key)}
                  className={`flex-1 truncate rounded-full px-2 py-1 text-[11px] font-semibold transition ${
                    current ? "bg-[#083f30] text-white" : done ? "bg-[#e3efe9] text-[#0f5a45]" : "bg-white text-[#8a806d] ring-1 ring-[#e7dcc4]"
                  }`}
                  title={t(`steps.${key}.title`)}
                >
                  {index + 1}. {t(`steps.${key}.short`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-[28px] bg-white/70 p-5 ring-1 ring-[#e7dcc4] backdrop-blur-sm sm:p-8">
          <StepHeading title={t(`steps.${step}.title`)} hint={t(`steps.${step}.hint`)} />

          {step === "about" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("about.firstName")}>
                  <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label={t("about.lastName")}>
                  <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
              </div>
              <Field label={t("about.birthDate")}>
                <DatePicker value={birthDate || undefined} onChange={setBirthDate} disableFuture enableMonthYearSelect placeholder={t("pickDate")} />
              </Field>
              <Field label={t("about.sex")}>
                <Choice value={sexAtBirth} options={options(SEX_AT_BIRTH, "about.sexes")} onChange={setSexAtBirth} columns={3} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("about.height")} hint={t("about.heightHint")}>
                  <input className={inputClass} inputMode="decimal" dir="ltr" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
                </Field>
                <Field label={t("about.weight")} hint={t("about.weightHint")}>
                  <input className={inputClass} inputMode="decimal" dir="ltr" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
                </Field>
              </div>
              <Field label={t("about.bloodType")} hint={t("about.bloodTypeHint")}>
                <Choice
                  value={bloodType}
                  options={BLOOD_TYPES.map((value) => ({ value, label: value === "unknown" ? t("about.bloodTypeUnknown") : value }))}
                  onChange={setBloodType}
                />
              </Field>
            </div>
          )}

          {step === "concern" && (
            <div className="space-y-5">
              <Field label={t("concern.main")} hint={t("concern.mainHint")}>
                <textarea className={`${inputClass} min-h-28`} value={mainConcern} onChange={(e) => setMainConcern(e.target.value)} placeholder={t("concern.mainPlaceholder")} />
              </Field>
              <Field label={t("concern.bodyArea")}>
                <input className={inputClass} value={bodyArea} onChange={(e) => setBodyArea(e.target.value)} placeholder={t("concern.bodyAreaPlaceholder")} />
              </Field>
              <Field label={t("concern.duration")}>
                <Choice value={duration} options={options(CONCERN_DURATIONS, "concern.durations")} onChange={setDuration} columns={4} />
              </Field>
              <Field label={t("concern.severity")} hint={t("concern.severityHint")}>
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                  {Array.from({ length: 11 }, (_, value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={severity === value}
                      onClick={() => setSeverity(severity === value ? undefined : value)}
                      className={`h-10 rounded-xl text-sm font-bold transition ${
                        severity === value
                          ? value >= 7 ? "bg-red-600 text-white" : value >= 4 ? "bg-amber-500 text-white" : "bg-[#083f30] text-white"
                          : "bg-white text-[#3d362a] ring-1 ring-[#e7dcc4] hover:ring-[#c9a55a]"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-[#8a806d]">
                  <span>{t("concern.severityLow")}</span>
                  <span>{t("concern.severityHigh")}</span>
                </div>
              </Field>
              <Field label={t("concern.desiredTreatment")} hint={t("concern.desiredTreatmentHint")}>
                <input className={inputClass} value={desiredTreatment} onChange={(e) => setDesiredTreatment(e.target.value)} />
              </Field>
            </div>
          )}

          {step === "conditions" && (
            <div className="space-y-3">
              {INTAKE_CONDITION_KEYS.map((key) => {
                const entry = conditions[key];
                return (
                  <Card key={key} tone={entry?.answer === "yes" ? "muted" : undefined}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#0e1a16]">{t(`conditions.items.${key}`)}</p>
                        <p className="mt-0.5 text-xs text-[#8a806d]">{t(`conditions.examples.${key}`)}</p>
                      </div>
                      <div className="shrink-0">
                        <Choice
                          value={entry?.answer}
                          options={yesNo}
                          onChange={(answer) => setConditions((current) => ({ ...current, [key]: { ...current[key], answer } }))}
                        />
                      </div>
                    </div>
                    {entry?.answer === "yes" && (
                      <input
                        className={`${inputClass} mt-3`}
                        value={entry.details ?? ""}
                        onChange={(e) => setConditions((current) => ({ ...current, [key]: { ...current[key], details: e.target.value } }))}
                        placeholder={t("conditions.detailsPlaceholder")}
                      />
                    )}
                  </Card>
                );
              })}
              {sexAtBirth === "female" && (
                <div className="pt-3">
                  <Field label={t("conditions.pregnancy")} hint={t("conditions.pregnancyHint")}>
                    <Choice value={pregnancy} options={options(PREGNANCY_STATUSES, "conditions.pregnancyStatuses")} onChange={setPregnancy} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === "surgeries" && (
            <div className="space-y-6">
              <SurgeriesStep patientId={patient.id} procedures={records.procedures} />
              <Field label={t("surgeries.anesthesia")} hint={t("surgeries.anesthesiaHint")}>
                <Choice value={anesthesia} options={yesNo} onChange={setAnesthesia} columns={3} />
              </Field>
              {anesthesia === "yes" && (
                <Field label={t("surgeries.anesthesiaDetails")}>
                  <input className={inputClass} value={anesthesiaDetails} onChange={(e) => setAnesthesiaDetails(e.target.value)} />
                </Field>
              )}
            </div>
          )}

          {step === "medicines" && (
            <MedicinesStep
              patientId={patient.id}
              medications={records.medications}
              allergies={records.allergies}
              bloodThinnersSlot={
                <Field label={t("medicines.bloodThinners")} hint={t("medicines.bloodThinnersHint")}>
                  <Choice value={bloodThinners} options={yesNo} onChange={setBloodThinners} columns={3} />
                </Field>
              }
            />
          )}

          {step === "lifestyle" && (
            <div className="space-y-6">
              <Field label={t("lifestyle.smoking")}>
                <Choice value={smoking} options={options(SMOKING_STATUSES, "lifestyle.smokingOptions")} onChange={setSmoking} columns={3} />
              </Field>
              <Field label={t("lifestyle.alcohol")}>
                <Choice value={alcohol} options={options(ALCOHOL_STATUSES, "lifestyle.alcoholOptions")} onChange={setAlcohol} columns={3} />
              </Field>
              <Field label={t("lifestyle.activity")}>
                <Choice value={activity} options={options(ACTIVITY_LEVELS, "lifestyle.activityOptions")} onChange={setActivity} columns={3} />
              </Field>
              <p className="text-xs leading-5 text-[#8a806d]">{t("lifestyle.privacy")}</p>
            </div>
          )}

          {step === "documents" && <DocumentsStep patientId={patient.id} documents={documents} />}

          {step === "review" && (
            <ReviewStep
              t={t}
              onEdit={goTo}
              rows={{
                about: [
                  `${firstName} ${lastName}`.trim(),
                  birthDate ? formatDate(birthDate, locale) : null,
                  sexAtBirth ? t(`about.sexes.${sexAtBirth}`) : null,
                  height ? t("review.height", { value: height }) : null,
                  weight ? t("review.weight", { value: weight }) : null,
                  bloodType ? t("review.bloodType", { value: bloodType === "unknown" ? t("about.bloodTypeUnknown") : bloodType }) : null,
                ],
                concern: [
                  mainConcern || null,
                  bodyArea || null,
                  duration ? t(`concern.durations.${duration}`) : null,
                  severity !== undefined ? t("review.severity", { value: severity }) : null,
                  desiredTreatment || null,
                ],
                conditions: [
                  ...INTAKE_CONDITION_KEYS.filter((key) => conditions[key]?.answer === "yes").map((key) =>
                    [t(`conditions.items.${key}`), conditions[key]?.details].filter(Boolean).join(": ")
                  ),
                  ...(INTAKE_CONDITION_KEYS.some((key) => conditions[key]?.answer) &&
                  !INTAKE_CONDITION_KEYS.some((key) => conditions[key]?.answer === "yes")
                    ? [t("review.noConditions")]
                    : []),
                  sexAtBirth === "female" && pregnancy ? t(`conditions.pregnancyStatuses.${pregnancy}`) : null,
                ],
                surgeries: [
                  ...records.procedures.map((procedure) => procedure.name),
                  anesthesia ? `${t("surgeries.anesthesia")} ${t(`answers.${anesthesia}`)}` : null,
                ],
                medicines: [
                  ...records.medications.map((medication) => [medication.name, medication.dose].filter(Boolean).join(" ")),
                  ...records.allergies.map((allergy) =>
                    allergy.category === "no_known_allergies" ? t("medicines.noKnownAllergies") : `${t("review.allergy")}: ${allergy.name ?? ""}`
                  ),
                  bloodThinners ? `${t("medicines.bloodThinners")} ${t(`answers.${bloodThinners}`)}` : null,
                ],
                lifestyle: [
                  smoking ? `${t("lifestyle.smoking")} ${t(`lifestyle.smokingOptions.${smoking}`)}` : null,
                  alcohol ? `${t("lifestyle.alcohol")} ${t(`lifestyle.alcoholOptions.${alcohol}`)}` : null,
                  activity ? `${t("lifestyle.activity")} ${t(`lifestyle.activityOptions.${activity}`)}` : null,
                ],
                documents: documents.map((document) => document.title),
              }}
            />
          )}
        </div>
      </div>

      {/* Sticky footer navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7dcc4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={stepIndex === 0 || isPending}
            onClick={() => goTo(INTAKE_STEPS[stepIndex - 1])}
            className="inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-[#0f5a45] disabled:opacity-30"
          >
            <ArrowRight size={16} className="ltr:rotate-180" />
            {t("nav.back")}
          </button>
          <div className="flex-1" />
          {step !== "review" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => goTo(INTAKE_STEPS[stepIndex + 1])}
              className="h-12 rounded-full px-4 text-sm font-semibold text-[#8a806d] disabled:opacity-40"
            >
              {t("nav.skip")}
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={saveAndContinue}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#083f30] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f5a45] disabled:opacity-60"
          >
            {step === "review" ? <Check size={16} /> : null}
            {isPending ? t("nav.saving") : step === "review" ? t("nav.finish") : t("nav.next")}
            {step !== "review" ? <ArrowLeft size={16} className="ltr:rotate-180" /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  t,
  rows,
  onEdit,
}: {
  t: TranslationType;
  rows: Partial<Record<IntakeStep, (string | null | undefined)[]>>;
  onEdit: (step: IntakeStep) => void;
}) {
  return (
    <div className="space-y-3">
      {INTAKE_STEPS.filter((step) => step !== "review").map((step) => {
        const lines = (rows[step] ?? []).filter((line): line is string => Boolean(line && line.trim()));
        return (
          <Card key={step}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0e1a16]">{t(`steps.${step}.title`)}</p>
                {lines.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-[#3d362a]">
                    {lines.map((line, index) => (
                      <li key={index} className="break-words">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#b5ab97]">{t("review.notAnswered")}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onEdit(step)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-[#0f5a45] ring-1 ring-[#e7dcc4] hover:ring-[#c9a55a]"
              >
                <Pencil size={12} />
                {t("review.edit")}
              </button>
            </div>
          </Card>
        );
      })}
      <p className="pt-2 text-xs leading-5 text-[#8a806d]">{t("review.selfReportedNotice")}</p>
    </div>
  );
}
