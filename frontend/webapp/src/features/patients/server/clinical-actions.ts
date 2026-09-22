"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  AddPatientAllergySchema,
  AddPatientConditionSchema,
  AddPatientMedicationSchema,
  AddPatientProcedureSchema,
  AddPatientProductUsageSchema,
  AddPatientSymptomSchema,
  ArchiveClinicalRecordSchema,
  type AddPatientAllergyInput,
  type AddPatientConditionInput,
  type AddPatientMedicationInput,
  type AddPatientProcedureInput,
  type AddPatientProductUsageInput,
  type AddPatientSymptomInput,
  type ArchiveClinicalRecordInput,
} from "../clinical-schemas";
import type {
  PatientAllergyRow,
  PatientConditionRow,
  PatientMedicationRow,
  PatientProcedureRow,
  PatientProductUsageRow,
  PatientSymptomRow,
} from "../clinical-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { getPatientById } from "./repository";
import {
  addPatientAllergy,
  addPatientCondition,
  addPatientMedication,
  addPatientProcedure,
  addPatientProductUsage,
  addPatientSymptom,
  archivePatientAllergy,
  archivePatientCondition,
  archivePatientMedication,
  archivePatientProcedure,
  archivePatientProductUsage,
  archivePatientSymptom,
} from "./clinical-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

async function requirePatient(patientId: string, t: Awaited<ReturnType<typeof getTranslations>>) {
  const patient = await getPatientById(patientId);
  if (!patient) return { ok: false as const, error: t("errors.notFound") };
  return { ok: true as const, patient };
}

export async function addPatientConditionAction(
  input: AddPatientConditionInput
): Promise<PatientActionResult<PatientConditionRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientConditionSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const found = await requirePatient(values.patientId, t);
  if (!found.ok) return found;

  const condition = await addPatientCondition({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "condition_added",
    entityType: "patient_condition",
    entityId: condition.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: condition };
}

export async function archivePatientConditionAction(input: ArchiveClinicalRecordInput): Promise<PatientActionResult<PatientConditionRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveClinicalRecordSchema.parse(input);
  const condition = await archivePatientCondition(values.id);
  if (!condition) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "condition_archived",
    entityType: "patient_condition",
    entityId: condition.id,
    metadata: { patientId: condition.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${condition.patientId}`);
  return { ok: true, data: condition };
}

export async function addPatientProcedureAction(
  input: AddPatientProcedureInput
): Promise<PatientActionResult<PatientProcedureRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientProcedureSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const found = await requirePatient(values.patientId, t);
  if (!found.ok) return found;

  const procedure = await addPatientProcedure({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "procedure_added",
    entityType: "patient_procedure",
    entityId: procedure.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: procedure };
}

export async function archivePatientProcedureAction(input: ArchiveClinicalRecordInput): Promise<PatientActionResult<PatientProcedureRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveClinicalRecordSchema.parse(input);
  const procedure = await archivePatientProcedure(values.id);
  if (!procedure) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "procedure_archived",
    entityType: "patient_procedure",
    entityId: procedure.id,
    metadata: { patientId: procedure.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${procedure.patientId}`);
  return { ok: true, data: procedure };
}

export async function addPatientAllergyAction(input: AddPatientAllergyInput): Promise<PatientActionResult<PatientAllergyRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientAllergySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const found = await requirePatient(values.patientId, t);
  if (!found.ok) return found;

  const allergy = await addPatientAllergy({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "allergy_added",
    entityType: "patient_allergy",
    entityId: allergy.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: allergy };
}

export async function archivePatientAllergyAction(input: ArchiveClinicalRecordInput): Promise<PatientActionResult<PatientAllergyRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveClinicalRecordSchema.parse(input);
  const allergy = await archivePatientAllergy(values.id);
  if (!allergy) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "allergy_archived",
    entityType: "patient_allergy",
    entityId: allergy.id,
    metadata: { patientId: allergy.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${allergy.patientId}`);
  return { ok: true, data: allergy };
}

export async function addPatientMedicationAction(
  input: AddPatientMedicationInput
): Promise<PatientActionResult<PatientMedicationRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientMedicationSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const found = await requirePatient(values.patientId, t);
  if (!found.ok) return found;

  const medication = await addPatientMedication({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "medication_added",
    entityType: "patient_medication",
    entityId: medication.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: medication };
}

export async function archivePatientMedicationAction(
  input: ArchiveClinicalRecordInput
): Promise<PatientActionResult<PatientMedicationRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveClinicalRecordSchema.parse(input);
  const medication = await archivePatientMedication(values.id);
  if (!medication) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "medication_archived",
    entityType: "patient_medication",
    entityId: medication.id,
    metadata: { patientId: medication.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${medication.patientId}`);
  return { ok: true, data: medication };
}

export async function addPatientProductUsageAction(
  input: AddPatientProductUsageInput
): Promise<PatientActionResult<PatientProductUsageRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientProductUsageSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const found = await requirePatient(values.patientId, t);
  if (!found.ok) return found;

  const usage = await addPatientProductUsage({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "product_usage_added",
    entityType: "patient_product_usage",
    entityId: usage.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: usage };
}

export async function archivePatientProductUsageAction(
  input: ArchiveClinicalRecordInput
): Promise<PatientActionResult<PatientProductUsageRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveClinicalRecordSchema.parse(input);
  const usage = await archivePatientProductUsage(values.id);
  if (!usage) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "product_usage_archived",
    entityType: "patient_product_usage",
    entityId: usage.id,
    metadata: { patientId: usage.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${usage.patientId}`);
  return { ok: true, data: usage };
}

export async function addPatientSymptomAction(input: AddPatientSymptomInput): Promise<PatientActionResult<PatientSymptomRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientSymptomSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const found = await requirePatient(values.patientId, t);
  if (!found.ok) return found;

  const symptom = await addPatientSymptom({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "symptom_added",
    entityType: "patient_symptom",
    entityId: symptom.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: symptom };
}

export async function archivePatientSymptomAction(input: ArchiveClinicalRecordInput): Promise<PatientActionResult<PatientSymptomRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveClinicalRecordSchema.parse(input);
  const symptom = await archivePatientSymptom(values.id);
  if (!symptom) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "symptom_archived",
    entityType: "patient_symptom",
    entityId: symptom.id,
    metadata: { patientId: symptom.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${symptom.patientId}`);
  return { ok: true, data: symptom };
}
