"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  AddClinicalDocumentSchema,
  AddClinicalObservationSchema,
  AddDiagnosticReportSchema,
  AddImagingStudySchema,
  AddLabOrderSchema,
  ArchiveDocumentsRecordSchema,
  ReplaceClinicalDocumentSchema,
  type AddClinicalDocumentInput,
  type AddClinicalObservationInput,
  type AddDiagnosticReportInput,
  type AddImagingStudyInput,
  type AddLabOrderInput,
  type ArchiveDocumentsRecordInput,
  type ReplaceClinicalDocumentInput,
} from "../documents-schemas";
import type {
  ClinicalDocumentRow,
  ClinicalObservationRow,
  DiagnosticReportRow,
  ImagingStudyRow,
  LabOrderRow,
} from "../documents-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { getPatientById } from "./repository";
import {
  addClinicalDocument,
  addClinicalObservation,
  addDiagnosticReport,
  addImagingStudy,
  addLabOrder,
  archiveClinicalDocument,
  archiveClinicalObservation,
  archiveDiagnosticReport,
  archiveImagingStudy,
  archiveLabOrder,
  findDuplicateDocumentCandidate,
  replaceClinicalDocument,
} from "./documents-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function addClinicalDocumentAction(
  input: AddClinicalDocumentInput
): Promise<PatientActionResult<ClinicalDocumentRow & { duplicateOf?: string }>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddClinicalDocumentSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  // Heuristic-only (no checksum computed in this pass, see 0051's header
  // comment) -- this warns, it never blocks the upload.
  const duplicate = await findDuplicateDocumentCandidate(values.patientId, values.originalName, values.fileSize);

  const document = await addClinicalDocument({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "document_added",
    entityType: "clinical_document",
    entityId: document.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: { ...document, duplicateOf: duplicate?.id } };
}

export async function replaceClinicalDocumentAction(
  input: ReplaceClinicalDocumentInput
): Promise<PatientActionResult<ClinicalDocumentRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = ReplaceClinicalDocumentSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const replaced = await replaceClinicalDocument({ ...values, createdBy: ctx.userId ?? null });
  if (!replaced) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "document_replaced",
    entityType: "clinical_document",
    entityId: replaced.id,
    metadata: { patientId: values.patientId, supersedesDocumentId: values.supersedesDocumentId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: replaced };
}

export async function archiveClinicalDocumentAction(
  input: ArchiveDocumentsRecordInput
): Promise<PatientActionResult<ClinicalDocumentRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveDocumentsRecordSchema.parse(input);
  const document = await archiveClinicalDocument(values.id);
  if (!document) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "document_archived",
    entityType: "clinical_document",
    entityId: document.id,
    metadata: { patientId: document.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${document.patientId}`);
  return { ok: true, data: document };
}

export async function addLabOrderAction(input: AddLabOrderInput): Promise<PatientActionResult<LabOrderRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddLabOrderSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const order = await addLabOrder({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "lab_order_added",
    entityType: "lab_order",
    entityId: order.id,
    metadata: { patientId: values.patientId, medicalCaseId: values.medicalCaseId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  if (values.medicalCaseId) {
    revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}/cases/${values.medicalCaseId}`);
  }
  return { ok: true, data: order };
}

export async function archiveLabOrderAction(input: ArchiveDocumentsRecordInput): Promise<PatientActionResult<LabOrderRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveDocumentsRecordSchema.parse(input);
  const order = await archiveLabOrder(values.id);
  if (!order) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "lab_order_archived",
    entityType: "lab_order",
    entityId: order.id,
    metadata: { patientId: order.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${order.patientId}`);
  return { ok: true, data: order };
}

export async function addDiagnosticReportAction(
  input: AddDiagnosticReportInput
): Promise<PatientActionResult<DiagnosticReportRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddDiagnosticReportSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const report = await addDiagnosticReport({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "diagnostic_report_added",
    entityType: "diagnostic_report",
    entityId: report.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: report };
}

export async function archiveDiagnosticReportAction(
  input: ArchiveDocumentsRecordInput
): Promise<PatientActionResult<DiagnosticReportRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveDocumentsRecordSchema.parse(input);
  const report = await archiveDiagnosticReport(values.id);
  if (!report) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "diagnostic_report_archived",
    entityType: "diagnostic_report",
    entityId: report.id,
    metadata: { patientId: report.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${report.patientId}`);
  return { ok: true, data: report };
}

export async function addClinicalObservationAction(
  input: AddClinicalObservationInput
): Promise<PatientActionResult<ClinicalObservationRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddClinicalObservationSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const observation = await addClinicalObservation({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "observation_added",
    entityType: "clinical_observation",
    entityId: observation.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: observation };
}

export async function archiveClinicalObservationAction(
  input: ArchiveDocumentsRecordInput
): Promise<PatientActionResult<ClinicalObservationRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveDocumentsRecordSchema.parse(input);
  const observation = await archiveClinicalObservation(values.id);
  if (!observation) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "observation_archived",
    entityType: "clinical_observation",
    entityId: observation.id,
    metadata: { patientId: observation.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${observation.patientId}`);
  return { ok: true, data: observation };
}

export async function addImagingStudyAction(input: AddImagingStudyInput): Promise<PatientActionResult<ImagingStudyRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddImagingStudySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const study = await addImagingStudy({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "imaging_study_added",
    entityType: "imaging_study",
    entityId: study.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: study };
}

export async function archiveImagingStudyAction(
  input: ArchiveDocumentsRecordInput
): Promise<PatientActionResult<ImagingStudyRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ArchiveDocumentsRecordSchema.parse(input);
  const study = await archiveImagingStudy(values.id);
  if (!study) return { ok: false, error: t("errors.notFound") };
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "imaging_study_archived",
    entityType: "imaging_study",
    entityId: study.id,
    metadata: { patientId: study.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${study.patientId}`);
  return { ok: true, data: study };
}
