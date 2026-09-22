"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  ClassifyDocumentSchema,
  GenerateSummarySchema,
  RequestAiTranslationSchema,
  ReviewExtractionCandidateSchema,
  RunExtractionSchema,
  type ClassifyDocumentInput,
  type GenerateSummaryInput,
  type RequestAiTranslationInput,
  type ReviewExtractionCandidateInput,
  type RunExtractionInput,
} from "../ai-schemas";
import type { AiExtractionCandidateRow, AiSummaryRow, DocumentClassificationRow } from "../ai-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { isErrorResult } from "./ai-provider";
import {
  generateAndStoreSummary,
  requestAiTranslation,
  reviewExtractionCandidate,
  runDocumentClassification,
  runExtraction,
} from "./ai-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";
const NOT_CONFIGURED_KEY = "admin.ai.errors.notConfigured";

export async function classifyDocumentAction(input: ClassifyDocumentInput): Promise<PatientActionResult<DocumentClassificationRow>> {
  await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ClassifyDocumentSchema.parse(input);

  const result = await runDocumentClassification(values.documentId);
  if (isErrorResult(result)) {
    return { ok: false, error: result.reason === "not_configured" ? t(NOT_CONFIGURED_KEY) : t("errors.notFound") };
  }
  return { ok: true, data: result.classification };
}

export async function runExtractionAction(input: RunExtractionInput): Promise<PatientActionResult<AiExtractionCandidateRow[]>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = RunExtractionSchema.parse(input);

  const result = await runExtraction(values.documentId, values.patientId);
  if (!result.ok) return { ok: false, error: t(NOT_CONFIGURED_KEY) };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "ai_extraction_run",
    entityType: "clinical_document",
    entityId: values.documentId,
    metadata: { patientId: values.patientId, candidatesFound: result.candidates.length },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: result.candidates };
}

export async function reviewExtractionCandidateAction(
  input: ReviewExtractionCandidateInput
): Promise<PatientActionResult<AiExtractionCandidateRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = ReviewExtractionCandidateSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }

  const candidate = await reviewExtractionCandidate({ ...values, reviewerId: ctx.userId ?? "" });
  if (!candidate) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "ai_extraction_reviewed",
    entityType: "ai_extraction_candidate",
    entityId: candidate.id,
    metadata: { patientId: candidate.patientId, decision: values.decision, resultingRecordType: candidate.resultingRecordType },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${candidate.patientId}`);
  return { ok: true, data: candidate };
}

export async function generateSummaryAction(input: GenerateSummaryInput): Promise<PatientActionResult<AiSummaryRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = GenerateSummarySchema.parse(input);

  const result = await generateAndStoreSummary(values.patientId, ctx.userId);
  if (!result.ok) return { ok: false, error: t(NOT_CONFIGURED_KEY) };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "ai_summary_generated",
    entityType: "ai_summary",
    entityId: result.summary.id,
    metadata: { patientId: values.patientId, version: result.summary.version },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: result.summary };
}

export async function requestAiTranslationAction(input: RequestAiTranslationInput): Promise<PatientActionResult<{ translationId: string }>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = RequestAiTranslationSchema.parse(input);

  const result = await requestAiTranslation(values.documentId, "auto", values.targetLanguage);
  if (isErrorResult(result)) {
    return { ok: false, error: result.reason === "not_configured" ? t(NOT_CONFIGURED_KEY) : t("errors.notFound") };
  }

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "ai_translation_requested",
    entityType: "clinical_document_translation",
    entityId: result.translationId,
    metadata: { documentId: values.documentId, targetLanguage: values.targetLanguage },
  });
  return { ok: true, data: { translationId: result.translationId } };
}
