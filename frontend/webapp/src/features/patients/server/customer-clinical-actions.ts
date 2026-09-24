"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import {
  AddPatientAllergySchema,
  AddPatientConditionSchema,
  AddPatientMedicationSchema,
  AddPatientProcedureSchema,
  type AddPatientAllergyInput,
  type AddPatientConditionInput,
  type AddPatientMedicationInput,
  type AddPatientProcedureInput,
} from "../clinical-schemas";
import type { PatientAllergyRow, PatientConditionRow, PatientMedicationRow, PatientProcedureRow } from "../clinical-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { addPatientAllergy, addPatientCondition, addPatientMedication, addPatientProcedure } from "./clinical-repository";
import { findActiveAccountPatientLink } from "./repository";

const MY_HEALTH_RECORD_PATH = "/n/app/mobile/profile/my-health-record";

/**
 * Self-declaration (خوداظهاری): a customer adding to their own (or a
 * linked family member's) clinical record. Every write here is hard-coded
 * to sourceType "patient" / verificationStatus "patient_reported" --
 * whatever the schema would otherwise allow is ignored, since a customer
 * asserting their own record is verified would defeat the entire point of
 * the verification_status column (spec: "AI-derived data MUST NOT become
 * verified medical facts automatically" -- same principle applies to
 * self-reported data). Same object-level rule as every other customer
 * action this session: active, non-"limited" account_patient_links row
 * required.
 */
async function requireOwnedLink(patientId: string) {
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return null;
  const link = await findActiveAccountPatientLink(accountId, patientId);
  if (!link || link.accessRole === "limited") return null;
  return { accountId };
}

export async function addMyConditionAction(input: AddPatientConditionInput): Promise<PatientActionResult<PatientConditionRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientConditionSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const condition = await addPatientCondition({
    ...values,
    sourceType: "patient",
    verificationStatus: "patient_reported",
    createdBy: owned.accountId,
  });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "condition_added",
    entityType: "patient_condition",
    entityId: condition.id,
    metadata: { patientId: values.patientId, selfService: true },
  });
  revalidatePath(MY_HEALTH_RECORD_PATH);
  return { ok: true, data: condition };
}

export async function addMyAllergyAction(input: AddPatientAllergyInput): Promise<PatientActionResult<PatientAllergyRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientAllergySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const allergy = await addPatientAllergy({
    ...values,
    sourceType: "patient",
    verificationStatus: "patient_reported",
    createdBy: owned.accountId,
  });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "allergy_added",
    entityType: "patient_allergy",
    entityId: allergy.id,
    metadata: { patientId: values.patientId, selfService: true },
  });
  revalidatePath(MY_HEALTH_RECORD_PATH);
  return { ok: true, data: allergy };
}

export async function addMyMedicationAction(input: AddPatientMedicationInput): Promise<PatientActionResult<PatientMedicationRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientMedicationSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const medication = await addPatientMedication({
    ...values,
    reportedOrPrescribed: "patient_reported",
    sourceType: "patient",
    createdBy: owned.accountId,
  });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "medication_added",
    entityType: "patient_medication",
    entityId: medication.id,
    metadata: { patientId: values.patientId, selfService: true },
  });
  revalidatePath(MY_HEALTH_RECORD_PATH);
  return { ok: true, data: medication };
}

export async function addMyProcedureAction(input: AddPatientProcedureInput): Promise<PatientActionResult<PatientProcedureRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientProcedureSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const procedure = await addPatientProcedure({
    ...values,
    sourceType: "patient",
    createdBy: owned.accountId,
  });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "procedure_added",
    entityType: "patient_procedure",
    entityId: procedure.id,
    metadata: { patientId: values.patientId, selfService: true },
  });
  revalidatePath(MY_HEALTH_RECORD_PATH);
  return { ok: true, data: procedure };
}
