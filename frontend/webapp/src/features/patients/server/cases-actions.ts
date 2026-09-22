"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  AddCaseRequirementSchema,
  AddClinicalEncounterSchema,
  AddFollowUpSchema,
  AddProviderSubmissionSchema,
  AddSecondOpinionSchema,
  AddTreatmentProposalSchema,
  CreateMedicalCaseSchema,
  GenerateCasePackageSchema,
  TransitionCaseStatusSchema,
  UpdateCaseRequirementStatusSchema,
  UpdateSubmissionResponseSchema,
  type AddCaseRequirementInput,
  type AddClinicalEncounterInput,
  type AddFollowUpInput,
  type AddProviderSubmissionInput,
  type AddSecondOpinionInput,
  type AddTreatmentProposalInput,
  type CreateMedicalCaseInput,
  type GenerateCasePackageInput,
  type TransitionCaseStatusInput,
  type UpdateCaseRequirementStatusInput,
  type UpdateSubmissionResponseInput,
} from "../cases-schemas";
import type {
  ClinicalEncounterRow,
  MedicalCaseFollowUpRow,
  MedicalCasePackageRow,
  MedicalCaseProviderSubmissionRow,
  MedicalCaseRequirementRow,
  MedicalCaseRow,
  MedicalCaseSecondOpinionRow,
  MedicalCaseTreatmentProposalRow,
} from "../cases-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { getPatientById } from "./repository";
import {
  addCaseRequirement,
  addClinicalEncounter,
  addFollowUp,
  addProviderSubmission,
  addSecondOpinion,
  addTreatmentProposal,
  createMedicalCase,
  generateCasePackage,
  getMedicalCase,
  transitionCaseStatus,
  updateRequirementStatus,
  updateSubmissionResponse,
} from "./cases-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function createMedicalCaseAction(input: CreateMedicalCaseInput): Promise<PatientActionResult<MedicalCaseRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = CreateMedicalCaseSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const medicalCase = await createMedicalCase({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_created",
    entityType: "medical_case",
    entityId: medicalCase.id,
    metadata: { patientId: values.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: medicalCase };
}

export async function transitionCaseStatusAction(
  input: TransitionCaseStatusInput
): Promise<PatientActionResult<MedicalCaseRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = TransitionCaseStatusSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const result = await transitionCaseStatus(values.medicalCaseId, values.toStatus, ctx.userId ?? null, values.note);
  if (result === null) return { ok: false, error: t("errors.notFound") };
  if (result === "invalid_transition") return { ok: false, error: t("admin.cases.errors.invalidTransition") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_status_changed",
    entityType: "medical_case",
    entityId: result.id,
    metadata: { patientId: result.patientId, toStatus: values.toStatus },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${result.patientId}/cases/${result.id}`);
  return { ok: true, data: result };
}

export async function addClinicalEncounterAction(
  input: AddClinicalEncounterInput
): Promise<PatientActionResult<ClinicalEncounterRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddClinicalEncounterSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const encounter = await addClinicalEncounter({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "encounter_added",
    entityType: "clinical_encounter",
    entityId: encounter.id,
    metadata: { patientId: values.patientId, medicalCaseId: values.medicalCaseId },
  });
  if (values.medicalCaseId) revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: encounter };
}

export async function addCaseRequirementAction(
  input: AddCaseRequirementInput
): Promise<PatientActionResult<MedicalCaseRequirementRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddCaseRequirementSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const medicalCase = await getMedicalCase(values.medicalCaseId);
  if (!medicalCase) return { ok: false, error: t("errors.notFound") };

  const requirement = await addCaseRequirement({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_requirement_added",
    entityType: "medical_case_requirement",
    entityId: requirement.id,
    metadata: { patientId: medicalCase.patientId, medicalCaseId: values.medicalCaseId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: requirement };
}

export async function updateCaseRequirementStatusAction(
  input: UpdateCaseRequirementStatusInput
): Promise<PatientActionResult<MedicalCaseRequirementRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = UpdateCaseRequirementStatusSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const requirement = await updateRequirementStatus(values.id, values.requirementStatus, values.fulfilledDocumentId);
  if (!requirement) return { ok: false, error: t("errors.notFound") };
  const medicalCase = await getMedicalCase(requirement.medicalCaseId);

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_requirement_updated",
    entityType: "medical_case_requirement",
    entityId: requirement.id,
    metadata: { patientId: medicalCase?.patientId, medicalCaseId: requirement.medicalCaseId },
  });
  if (medicalCase) revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${requirement.medicalCaseId}`);
  return { ok: true, data: requirement };
}

export async function generateCasePackageAction(
  input: GenerateCasePackageInput
): Promise<PatientActionResult<MedicalCasePackageRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = GenerateCasePackageSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const medicalCase = await getMedicalCase(values.medicalCaseId);
  if (!medicalCase) return { ok: false, error: t("errors.notFound") };

  const pkg = await generateCasePackage({ ...values, generatedBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_package_generated",
    entityType: "medical_case_package",
    entityId: pkg.id,
    metadata: { patientId: values.patientId, medicalCaseId: values.medicalCaseId, scopes: values.includedScopes },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: pkg };
}

export async function addProviderSubmissionAction(
  input: AddProviderSubmissionInput
): Promise<PatientActionResult<MedicalCaseProviderSubmissionRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddProviderSubmissionSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const medicalCase = await getMedicalCase(values.medicalCaseId);
  if (!medicalCase) return { ok: false, error: t("errors.notFound") };

  const submission = await addProviderSubmission({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_submission_added",
    entityType: "medical_case_provider_submission",
    entityId: submission.id,
    metadata: { patientId: medicalCase.patientId, medicalCaseId: values.medicalCaseId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: submission };
}

export async function updateSubmissionResponseAction(
  input: UpdateSubmissionResponseInput
): Promise<PatientActionResult<MedicalCaseProviderSubmissionRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = UpdateSubmissionResponseSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const submission = await updateSubmissionResponse(values.id, values.responseStatus, values.providerNotes);
  if (!submission) return { ok: false, error: t("errors.notFound") };
  const medicalCase = await getMedicalCase(submission.medicalCaseId);

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_submission_updated",
    entityType: "medical_case_provider_submission",
    entityId: submission.id,
    metadata: { patientId: medicalCase?.patientId, medicalCaseId: submission.medicalCaseId },
  });
  if (medicalCase) revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${submission.medicalCaseId}`);
  return { ok: true, data: submission };
}

export async function addTreatmentProposalAction(
  input: AddTreatmentProposalInput
): Promise<PatientActionResult<MedicalCaseTreatmentProposalRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddTreatmentProposalSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const medicalCase = await getMedicalCase(values.medicalCaseId);
  if (!medicalCase) return { ok: false, error: t("errors.notFound") };

  const proposal = await addTreatmentProposal({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_proposal_added",
    entityType: "medical_case_treatment_proposal",
    entityId: proposal.id,
    metadata: { patientId: medicalCase.patientId, medicalCaseId: values.medicalCaseId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: proposal };
}

export async function addSecondOpinionAction(
  input: AddSecondOpinionInput
): Promise<PatientActionResult<MedicalCaseSecondOpinionRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddSecondOpinionSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const medicalCase = await getMedicalCase(values.medicalCaseId);
  if (!medicalCase) return { ok: false, error: t("errors.notFound") };

  const opinion = await addSecondOpinion({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_second_opinion_added",
    entityType: "medical_case_second_opinion",
    entityId: opinion.id,
    metadata: { patientId: medicalCase.patientId, medicalCaseId: values.medicalCaseId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: opinion };
}

export async function addFollowUpAction(input: AddFollowUpInput): Promise<PatientActionResult<MedicalCaseFollowUpRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddFollowUpSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const medicalCase = await getMedicalCase(values.medicalCaseId);
  if (!medicalCase) return { ok: false, error: t("errors.notFound") };

  const followUp = await addFollowUp({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "case_followup_added",
    entityType: "medical_case_follow_up",
    entityId: followUp.id,
    metadata: { patientId: medicalCase.patientId, medicalCaseId: values.medicalCaseId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${medicalCase.patientId}/cases/${values.medicalCaseId}`);
  return { ok: true, data: followUp };
}
