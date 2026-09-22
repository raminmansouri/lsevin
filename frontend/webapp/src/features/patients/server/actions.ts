"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  AddPatientAddressSchema,
  AddPatientContactSchema,
  AddPatientIdentifierSchema,
  CreatePatientSchema,
  FindPatientByIdentifierSchema,
  LinkAccountToPatientSchema,
  UpdatePatientSchema,
  type AddPatientAddressInput,
  type AddPatientContactInput,
  type AddPatientIdentifierInput,
  type CreatePatientInput,
  type FindPatientByIdentifierInput,
  type LinkAccountToPatientInput,
  type UpdatePatientInput,
} from "../schemas";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import {
  addPatientAddress,
  addPatientContact,
  addPatientIdentifier,
  createPatient,
  findActiveAccountPatientLink,
  findPatientIdByIdentifier,
  getPatientById,
  isUniqueViolation,
  linkAccountToPatient,
  updatePatient,
} from "./repository";

import type { AccountPatientLinkRow, PatientAddressRow, PatientContactRow, PatientIdentifierRow, PatientRow } from "../types";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

/**
 * V0.6 creation workflow, exact-match branch only. Weak (name/DOB) matching
 * that opens a duplicate-review candidate instead of a hard yes/no is V6's
 * PatientMatchCandidate queue (spec section V6), which doesn't exist yet --
 * deliberately out of scope here. Every caller that's about to create a new
 * patient from an identifier should call this first.
 */
export async function findPatientByIdentifierAction(
  input: FindPatientByIdentifierInput
): Promise<PatientActionResult<{ patientId: string | null }>> {
  await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = FindPatientByIdentifierSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }
  const patientId = await findPatientIdByIdentifier(values);
  return { ok: true, data: { patientId } };
}

export async function createPatientAction(input: CreatePatientInput): Promise<PatientActionResult<PatientRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = CreatePatientSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const patient = await createPatient({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "patient_created",
    entityType: "patient",
    entityId: patient.id,
    afterState: patient,
    metadata: { createdBySource: values.createdBySource },
  });
  revalidatePath(ADMIN_PATIENTS_PATH);
  return { ok: true, data: patient };
}

export async function updatePatientAction(input: UpdatePatientInput): Promise<PatientActionResult<PatientRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = UpdatePatientSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const before = await getPatientById(values.patientId);
  if (!before) {
    return { ok: false, error: t("errors.notFound") };
  }

  const { patientId, version, ...rest } = values;
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) patch[key] = value;
  }

  const updated = await updatePatient(patientId, version, patch, ctx.userId);
  if (!updated) {
    return { ok: false, error: t("errors.versionConflict") };
  }

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "patient_updated",
    entityType: "patient",
    entityId: updated.id,
    beforeState: before,
    afterState: updated,
  });
  revalidatePath(ADMIN_PATIENTS_PATH);
  return { ok: true, data: updated };
}

export async function addPatientIdentifierAction(
  input: AddPatientIdentifierInput
): Promise<PatientActionResult<PatientIdentifierRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientIdentifierSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const patient = await getPatientById(values.patientId);
  if (!patient) {
    return { ok: false, error: t("errors.notFound") };
  }

  let identifier: PatientIdentifierRow;
  try {
    identifier = await addPatientIdentifier(values);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: t("errors.duplicateIdentifier") };
    }
    throw error;
  }

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "identifier_added",
    entityType: "patient_identifier",
    entityId: identifier.id,
    afterState: { ...identifier, maskedValue: identifier.maskedValue },
    metadata: { patientId: values.patientId },
  });
  revalidatePath(ADMIN_PATIENTS_PATH);
  return { ok: true, data: identifier };
}

export async function linkAccountToPatientAction(
  input: LinkAccountToPatientInput
): Promise<PatientActionResult<AccountPatientLinkRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = LinkAccountToPatientSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const existing = await findActiveAccountPatientLink(values.accountId, values.patientId);
  if (existing) {
    return { ok: true, data: existing };
  }

  const link = await linkAccountToPatient({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "account_linked",
    entityType: "account_patient_link",
    entityId: link.id,
    afterState: link,
  });
  revalidatePath(ADMIN_PATIENTS_PATH);
  return { ok: true, data: link };
}

export async function addPatientContactAction(
  input: AddPatientContactInput
): Promise<PatientActionResult<PatientContactRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientContactSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const patient = await getPatientById(values.patientId);
  if (!patient) {
    return { ok: false, error: t("errors.notFound") };
  }

  const contact = await addPatientContact(values);
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "contact_added",
    entityType: "patient_contact",
    entityId: contact.id,
    metadata: { patientId: values.patientId, contactType: values.contactType },
  });
  revalidatePath(ADMIN_PATIENTS_PATH);
  return { ok: true, data: contact };
}

export async function addPatientAddressAction(
  input: AddPatientAddressInput
): Promise<PatientActionResult<PatientAddressRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddPatientAddressSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const patient = await getPatientById(values.patientId);
  if (!patient) {
    return { ok: false, error: t("errors.notFound") };
  }

  const address = await addPatientAddress(values);
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "address_added",
    entityType: "patient_address",
    entityId: address.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(ADMIN_PATIENTS_PATH);
  return { ok: true, data: address };
}
