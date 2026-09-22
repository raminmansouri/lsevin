"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertSuperAdmin, assertAdmin } from "@/lib/auth/admin-guard";

import {
  MergePatientsSchema,
  PreviewMergeSchema,
  ReviewMatchCandidateSchema,
  ScanForDuplicatesSchema,
  UnmergePatientsSchema,
  type MergePatientsInput,
  type PreviewMergeInput,
  type ReviewMatchCandidateInput,
  type ScanForDuplicatesInput,
  type UnmergePatientsInput,
} from "../identity-schemas";
import type { MergePreview, PatientMatchCandidateRow, PatientMergeRow, ReconciliationConflict } from "../identity-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import {
  mergePatients,
  previewMerge,
  resolveReconciliationConflict,
  reviewMatchCandidate,
  scanForDuplicates,
  unmergePatients,
} from "./identity-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function scanForDuplicatesAction(
  input: ScanForDuplicatesInput
): Promise<PatientActionResult<PatientMatchCandidateRow[]>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = ScanForDuplicatesSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const candidates = await scanForDuplicates(values.patientId, ctx.userId);
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "duplicate_scan_run",
    entityType: "patient",
    entityId: values.patientId,
    metadata: { patientId: values.patientId, candidatesFound: candidates.length },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: candidates };
}

export async function reviewMatchCandidateAction(
  input: ReviewMatchCandidateInput
): Promise<PatientActionResult<PatientMatchCandidateRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = ReviewMatchCandidateSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const candidate = await reviewMatchCandidate(values.id, values.decision, ctx.userId ?? "");
  if (!candidate) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "match_candidate_reviewed",
    entityType: "patient_match_candidate",
    entityId: candidate.id,
    metadata: { patientId: candidate.patientAId, decision: values.decision },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${candidate.patientAId}`);
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${candidate.patientBId}`);
  return { ok: true, data: candidate };
}

export async function previewMergeAction(input: PreviewMergeInput): Promise<PatientActionResult<MergePreview>> {
  await assertSuperAdmin();
  const values = PreviewMergeSchema.parse(input);
  const preview = await previewMerge(values.survivingPatientId, values.mergedPatientId);
  return { ok: true, data: preview };
}

/**
 * Merge is restricted to super admins (spec V6.3: "Add restricted merge
 * permission") -- the one write in this entire feature gated a level above
 * assertAdmin(), since it's the one operation that changes which patient a
 * whole record history belongs to.
 */
export async function mergePatientsAction(input: MergePatientsInput): Promise<PatientActionResult<PatientMergeRow>> {
  const ctx = await assertSuperAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = MergePatientsSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const merge = await mergePatients({ ...values, mergedBy: ctx.userId ?? null });
  if (merge === "not_found") return { ok: false, error: t("errors.notFound") };
  if (merge === "already_merged") return { ok: false, error: t("admin.identity.errors.alreadyMerged") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "patient_merged",
    entityType: "patient_merge",
    entityId: merge.id,
    metadata: { patientId: merge.survivingPatientId, mergedPatientId: merge.mergedPatientId },
    beforeState: { mergedPatientId: merge.mergedPatientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${merge.survivingPatientId}`);
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${merge.mergedPatientId}`);
  return { ok: true, data: merge };
}

export async function unmergePatientsAction(input: UnmergePatientsInput): Promise<PatientActionResult<PatientMergeRow>> {
  const ctx = await assertSuperAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = UnmergePatientsSchema.parse(input);

  const merge = await unmergePatients(values.mergeId, ctx.userId);
  if (merge === "not_found") return { ok: false, error: t("errors.notFound") };
  if (merge === "already_reversed") return { ok: false, error: t("admin.identity.errors.alreadyReversed") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "patient_unmerged",
    entityType: "patient_merge",
    entityId: merge.id,
    metadata: { patientId: merge.survivingPatientId, mergedPatientId: merge.mergedPatientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${merge.survivingPatientId}`);
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${merge.mergedPatientId}`);
  return { ok: true, data: merge };
}

export async function resolveReconciliationConflictAction(input: {
  patientId: string;
  recordType: ReconciliationConflict["recordType"];
  discardId: string;
  action: "keep_both" | "mark_outdated" | "entered_in_error";
}): Promise<PatientActionResult<{ resolved: boolean }>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);

  if (input.action !== "keep_both") {
    const resolved = await resolveReconciliationConflict(input.recordType, input.discardId, input.action);
    if (!resolved) return { ok: false, error: t("errors.notFound") };
  }

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "reconciliation_resolved",
    entityType: `patient_${input.recordType}`,
    entityId: input.discardId,
    metadata: { patientId: input.patientId, decision: input.action },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${input.patientId}`);
  return { ok: true, data: { resolved: true } };
}
