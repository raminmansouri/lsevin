"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import {
  INTAKE_CONDITION_KEYS,
  RemoveMyRecordSchema,
  SaveIntakeStepSchema,
  StartMyHealthRecordSchema,
  type HealthIntakeRow,
  type IntakeConditionAnswer,
  type RemoveMyRecordInput,
  type SaveIntakeStepInput,
  type StartMyHealthRecordInput,
} from "../intake-schemas";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { addPatientCondition, archivePatientCondition } from "./clinical-repository";
import {
  archiveSelfReportedRecord,
  createSelfPatientForAccount,
  getHealthIntake,
  saveHealthIntakeStep,
  type HealthIntakePatch,
} from "./intake-repository";
import { findActiveAccountPatientLink, getPatientById, updatePatient } from "./repository";

const MY_HEALTH_RECORD_PATH = "/n/app/mobile/profile/my-health-record";

const ARCHIVE_AUDIT_ACTIONS = {
  condition: "condition_archived",
  allergy: "allergy_archived",
  medication: "medication_archived",
  procedure: "procedure_archived",
} as const;

/** Same object-level rule as every other customer patient action: an active, non-"limited" link. */
async function requireOwnedLink(patientId: string) {
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return null;
  const link = await findActiveAccountPatientLink(accountId, patientId);
  if (!link || link.accessRole === "limited") return null;
  return { accountId };
}

function revalidateHealthRecord() {
  revalidatePath(MY_HEALTH_RECORD_PATH);
  revalidatePath(`${MY_HEALTH_RECORD_PATH}/questionnaire`);
}

/**
 * "Start my health record": creates the account's own record straight away
 * from name / birth date / sex. No ID number and no review, because it only
 * ever creates a new empty record (see createSelfPatientForAccount).
 */
export async function startMyHealthRecordAction(
  input: StartMyHealthRecordInput
): Promise<PatientActionResult<{ patientId: string }>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return { ok: false, error: t("errors.notFound") };

  let values;
  try {
    values = StartMyHealthRecordSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }

  const { patientId, created } = await createSelfPatientForAccount({ accountId, ...values });
  if (created) {
    await recordPatientAuditEvent({
      actorUserId: accountId,
      action: "patient_created",
      entityType: "patient",
      entityId: patientId,
      metadata: { selfService: true, source: "health_questionnaire" },
    });
    await recordPatientAuditEvent({
      actorUserId: accountId,
      action: "account_linked",
      entityType: "patient",
      entityId: patientId,
      metadata: { accountId, relationshipType: "self", selfService: true },
    });
  }
  revalidateHealthRecord();
  return { ok: true, data: { patientId } };
}

function emptyToNull<T>(value: T | undefined): T | null {
  if (value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/**
 * Saves one questionnaire step. Each step writes only its own columns; the
 * "conditions" step also keeps patient_conditions in step with the
 * checklist (a "yes" creates a self-reported condition, changing it back
 * archives that same row), so the care team sees the answers in the
 * clinical tab and not only on the questionnaire card.
 */
export async function saveIntakeStepAction(input: SaveIntakeStepInput): Promise<PatientActionResult<HealthIntakeRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = SaveIntakeStepSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  let patch: HealthIntakePatch = {};

  switch (values.step) {
    case "about": {
      // Two tries: the version check can lose to an admin editing the same
      // record at that moment; re-reading and retrying once is enough here.
      for (let attempt = 0; attempt < 2; attempt++) {
        const patient = await getPatientById(values.patientId);
        if (!patient) return { ok: false, error: t("errors.notFound") };
        const updated = await updatePatient(
          values.patientId,
          patient.version,
          {
            ...(values.firstName ? { firstName: values.firstName } : {}),
            ...(values.lastName ? { lastName: values.lastName } : {}),
            ...(values.birthDate ? { birthDate: values.birthDate, birthDatePrecision: "day" } : {}),
            ...(values.sexAtBirth ? { sexAtBirth: values.sexAtBirth } : {}),
          },
          owned.accountId
        );
        if (updated) break;
        if (attempt === 1) return { ok: false, error: t("errors.serverError") };
      }
      patch = {
        height_cm: values.heightCm ?? null,
        weight_kg: values.weightKg ?? null,
        blood_type: values.bloodType ?? null,
      };
      break;
    }
    case "concern":
      patch = {
        main_concern: emptyToNull(values.mainConcern),
        concern_body_area: emptyToNull(values.concernBodyArea),
        concern_duration: values.concernDuration ?? null,
        concern_severity: values.concernSeverity ?? null,
        desired_treatment: emptyToNull(values.desiredTreatment),
      };
      break;
    case "conditions": {
      const tLabels = await getTranslations("MobileProfile.myHealthRecord.intake.conditions.items");
      const previous = (await getHealthIntake(values.patientId))?.conditionAnswers ?? {};
      const next: Record<string, IntakeConditionAnswer> = {};
      for (const key of INTAKE_CONDITION_KEYS) {
        const answer = values.answers[key];
        const before = previous[key];
        if (!answer) {
          if (before) next[key] = before;
          continue;
        }
        const details = emptyToNull(answer.details) ?? undefined;
        let conditionId = before?.conditionId;
        if (answer.answer === "yes" && !conditionId) {
          const condition = await addPatientCondition({
            patientId: values.patientId,
            displayName: tLabels(key),
            clinicalStatus: "active",
            notes: details,
            sourceType: "patient",
            verificationStatus: "patient_reported",
            createdBy: owned.accountId,
          });
          conditionId = condition.id;
          await recordPatientAuditEvent({
            actorUserId: owned.accountId,
            action: "condition_added",
            entityType: "patient_condition",
            entityId: condition.id,
            metadata: { patientId: values.patientId, selfService: true, intakeKey: key },
          });
        } else if (answer.answer !== "yes" && conditionId) {
          await archivePatientCondition(conditionId);
          await recordPatientAuditEvent({
            actorUserId: owned.accountId,
            action: "condition_archived",
            entityType: "patient_condition",
            entityId: conditionId,
            metadata: { patientId: values.patientId, selfService: true, intakeKey: key },
          });
          conditionId = undefined;
        }
        next[key] = { answer: answer.answer, ...(details ? { details } : {}), ...(conditionId ? { conditionId } : {}) };
      }
      patch = { condition_answers: next, pregnancy_status: values.pregnancyStatus ?? null };
      break;
    }
    case "surgeries":
      patch = {
        anesthesia_problems: values.anesthesiaProblems ?? null,
        anesthesia_details: values.anesthesiaProblems === "yes" ? emptyToNull(values.anesthesiaDetails) : null,
      };
      break;
    case "medicines":
      patch = { takes_blood_thinners: values.takesBloodThinners ?? null };
      break;
    case "lifestyle":
      patch = {
        smoking: values.smoking ?? null,
        alcohol: values.alcohol ?? null,
        activity_level: values.activityLevel ?? null,
      };
      break;
    case "documents":
    case "review":
      break;
  }

  const intake = await saveHealthIntakeStep({
    patientId: values.patientId,
    step: values.step,
    patch,
    markComplete: values.step === "review",
    actorId: owned.accountId,
  });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "health_intake_updated",
    entityType: "health_intake",
    entityId: intake.id,
    metadata: { patientId: values.patientId, step: values.step, selfService: true },
  });
  revalidateHealthRecord();
  return { ok: true, data: intake };
}

/** Removes (archives) a condition, allergy, medicine or surgery the patient entered themselves. */
export async function removeMyRecordAction(input: RemoveMyRecordInput): Promise<PatientActionResult<{ id: string }>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = RemoveMyRecordSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const removed = await archiveSelfReportedRecord(values.kind, values.id, values.patientId);
  if (!removed) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: ARCHIVE_AUDIT_ACTIONS[values.kind],
    entityType: `patient_${values.kind}`,
    entityId: values.id,
    metadata: { patientId: values.patientId, selfService: true },
  });
  revalidateHealthRecord();
  return { ok: true, data: { id: values.id } };
}
