import "server-only";

import db from "@/config/database/db";

import type { AiExtractionCandidateRow, AiSummaryRow, DocumentClassificationRow, ExtractionReviewStatus } from "../ai-types";
import { classifyDocument, extractCandidatesFromDocument, generatePatientSummary, isErrorResult, translateDocumentText } from "./ai-provider";
import { addPatientCondition, addPatientMedication, addPatientProcedure } from "./clinical-repository";
import { addClinicalObservation, addDocumentTranslation, getClinicalDocument } from "./documents-repository";

function mapClassification(row: any): DocumentClassificationRow {
  return {
    id: row.id,
    documentId: row.document_id,
    suggestedType: row.suggested_type,
    confidence: Number(row.confidence),
    model: row.model,
    modelVersion: row.model_version,
    requiresReview: row.requires_review,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    acceptedType: row.accepted_type,
    createdAt: row.create_date,
  };
}

function mapCandidate(row: any): AiExtractionCandidateRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    documentId: row.document_id,
    candidateType: row.candidate_type,
    extractedData: row.extracted_data ?? {},
    confidence: Number(row.confidence),
    model: row.model,
    modelVersion: row.model_version,
    extractedAt: row.extracted_at,
    reviewStatus: row.review_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    resultingRecordType: row.resulting_record_type,
    resultingRecordId: row.resulting_record_id,
  };
}

function mapSummary(row: any): AiSummaryRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    summaryText: row.summary_text,
    sourceReferences: row.source_references ?? [],
    model: row.model,
    modelVersion: row.model_version,
    version: row.version,
    isCurrent: row.is_current,
    generatedBy: row.generated_by,
    createdAt: row.create_date,
  };
}

// --- V8.1 Document classification -----------------------------------

const CLASSIFICATION_REVIEW_THRESHOLD = 0.85;

export type ClassifyResult = { ok: true; classification: DocumentClassificationRow } | { ok: false; reason: "not_configured" | "not_found" };

export async function runDocumentClassification(documentId: string): Promise<ClassifyResult> {
  const document = await getClinicalDocument(documentId);
  if (!document) return { ok: false, reason: "not_found" };

  const result = await classifyDocument({ mimeType: document.mimeType, originalName: document.originalName, title: document.title });
  if (isErrorResult(result)) return { ok: false, reason: result.reason };

  const rows = await db<any[]>`
    insert into patient.document_classifications (document_id, suggested_type, confidence, model, model_version, requires_review)
    values (${documentId}, ${result.data.documentType}, ${result.data.confidence}, ${result.model}, ${result.modelVersion}, ${result.data.confidence < CLASSIFICATION_REVIEW_THRESHOLD})
    returning *
  `;
  return { ok: true, classification: mapClassification(rows[0]) };
}

export async function listClassificationsRequiringReview(patientId: string): Promise<DocumentClassificationRow[]> {
  const rows = await db<any[]>`
    select c.* from patient.document_classifications c
    join patient.clinical_documents d on d.id = c.document_id
    where d.patient_id = ${patientId} and c.requires_review = true and c.reviewed_at is null
    order by c.create_date desc
  `;
  return rows.map(mapClassification);
}

export async function reviewDocumentClassification(id: string, acceptedType: string, reviewerId: string): Promise<DocumentClassificationRow | null> {
  const rows = await db<any[]>`
    update patient.document_classifications set accepted_type = ${acceptedType}, reviewed_by = ${reviewerId}, reviewed_at = now()
    where id = ${id} returning *
  `;
  return rows[0] ? mapClassification(rows[0]) : null;
}

// --- V8.2/V8.3 Extraction candidates + human verification -----------------

export type ExtractResult = { ok: true; candidates: AiExtractionCandidateRow[] } | { ok: false; reason: "not_configured" };

export async function runExtraction(documentId: string, patientId: string): Promise<ExtractResult> {
  const result = await extractCandidatesFromDocument({ documentId, patientId });
  if (isErrorResult(result)) return { ok: false, reason: result.reason };

  const created: AiExtractionCandidateRow[] = [];
  for (const candidate of result.data) {
    const rows = await db<any[]>`
      insert into patient.ai_extraction_candidates (
        patient_id, document_id, candidate_type, extracted_data, confidence, model, model_version
      ) values (
        ${patientId}, ${documentId}, ${candidate.candidateType}, ${JSON.stringify(candidate.extractedData)}::jsonb,
        ${candidate.confidence}, ${result.model}, ${result.modelVersion}
      )
      returning *
    `;
    created.push(mapCandidate(rows[0]));
  }
  return { ok: true, candidates: created };
}

export async function listExtractionCandidatesForPatient(patientId: string, status?: ExtractionReviewStatus): Promise<AiExtractionCandidateRow[]> {
  const rows = status
    ? await db<any[]>`select * from patient.ai_extraction_candidates where patient_id = ${patientId} and review_status = ${status} order by extracted_at desc`
    : await db<any[]>`select * from patient.ai_extraction_candidates where patient_id = ${patientId} order by extracted_at desc`;
  return rows.map(mapCandidate);
}

/**
 * Approving (or correcting) a candidate creates the real structured
 * clinical record via the same repository functions the manual "add"
 * dialogs use, tagged source_type = 'ai_extraction' and source_id = the
 * candidate's own id -- spec V8.3: "maintain relationship between final
 * value and source extraction," and "never hide AI involvement" (every
 * such record's provenance says exactly how it got there). Rejecting or
 * deferring never creates anything.
 */
export async function reviewExtractionCandidate(input: {
  id: string;
  decision: "approved" | "corrected" | "rejected" | "deferred";
  correctedData?: Record<string, unknown>;
  note?: string;
  reviewerId: string;
}): Promise<AiExtractionCandidateRow | null> {
  const [existing] = await db<any[]>`select * from patient.ai_extraction_candidates where id = ${input.id}`;
  if (!existing) return null;
  const candidate = mapCandidate(existing);

  let resultingRecordType: string | null = null;
  let resultingRecordId: string | null = null;

  if (input.decision === "approved" || input.decision === "corrected") {
    const data = input.decision === "corrected" ? { ...candidate.extractedData, ...input.correctedData } : candidate.extractedData;
    const created = await createRecordFromExtraction(candidate.patientId, candidate.candidateType, data, candidate.id, input.reviewerId);
    if (created) {
      resultingRecordType = created.recordType;
      resultingRecordId = created.recordId;
    }
  }

  const rows = await db<any[]>`
    update patient.ai_extraction_candidates set
      review_status = ${input.decision}, reviewed_by = ${input.reviewerId}, reviewed_at = now(),
      review_note = ${input.note ?? null},
      resulting_record_type = coalesce(${resultingRecordType}, resulting_record_type),
      resulting_record_id = coalesce(${resultingRecordId}, resulting_record_id)
    where id = ${input.id}
    returning *
  `;
  return rows[0] ? mapCandidate(rows[0]) : null;
}

async function createRecordFromExtraction(
  patientId: string,
  candidateType: AiExtractionCandidateRow["candidateType"],
  data: Record<string, unknown>,
  candidateId: string,
  reviewerId: string
): Promise<{ recordType: string; recordId: string } | null> {
  const str = (key: string): string | undefined => (typeof data[key] === "string" ? (data[key] as string) : undefined);
  const num = (key: string): number | undefined => (typeof data[key] === "number" ? (data[key] as number) : undefined);

  switch (candidateType) {
    case "condition": {
      const displayName = str("displayName") ?? str("name");
      if (!displayName) return null;
      const row = await addPatientCondition({
        patientId,
        displayName,
        onsetDate: str("onsetDate"),
        notes: str("notes"),
        verificationStatus: "verified",
        sourceType: "ai_extraction",
        sourceId: candidateId,
        createdBy: reviewerId,
      });
      return { recordType: "patient_condition", recordId: row.id };
    }
    case "medication": {
      const name = str("name");
      if (!name) return null;
      const row = await addPatientMedication({
        patientId,
        name,
        dose: str("dose"),
        frequency: str("frequency"),
        startDate: str("startDate"),
        sourceType: "ai_extraction",
        sourceId: candidateId,
        createdBy: reviewerId,
      });
      return { recordType: "patient_medication", recordId: row.id };
    }
    case "procedure": {
      const procedureName = str("procedureName") ?? str("name");
      const performedFrom = str("performedFrom") ?? str("date");
      if (!procedureName || !performedFrom) return null;
      const row = await addPatientProcedure({
        patientId,
        procedureName,
        performedFrom,
        notes: str("notes"),
        sourceType: "ai_extraction",
        sourceId: candidateId,
        createdBy: reviewerId,
      });
      return { recordType: "patient_procedure", recordId: row.id };
    }
    case "lab_observation": {
      const displayName = str("displayName") ?? str("name");
      if (!displayName) return null;
      const row = await addClinicalObservation({
        patientId,
        displayName,
        valueNumber: num("valueNumber"),
        valueText: str("valueText"),
        unit: str("unit"),
        effectiveAt: str("effectiveAt") ?? new Date().toISOString(),
        sourceDocumentId: undefined,
        createdBy: reviewerId,
      });
      return { recordType: "clinical_observation", recordId: row.id };
    }
    case "provider_facility":
      // No structured record to create in this domain -- providers are
      // category.service_providers, a different schema this feature never
      // writes to. Reviewing this candidate type only ever records the
      // review decision, never a resulting record.
      return null;
    default:
      return null;
  }
}

// --- V8.4 AI longitudinal summary -----------------------------------

export type SummaryResult = { ok: true; summary: AiSummaryRow } | { ok: false; reason: "not_configured" };

export async function generateAndStoreSummary(patientId: string, actorId?: string | null): Promise<SummaryResult> {
  const result = await generatePatientSummary({ patientId });
  if (isErrorResult(result)) return { ok: false, reason: result.reason };

  return db.begin(async (tx) => {
    await tx`update patient.ai_summaries set is_current = false where patient_id = ${patientId} and is_current = true`;
    const [{ next_version }] = await tx<{ next_version: number }[]>`
      select coalesce(max(version), 0) + 1 as next_version from patient.ai_summaries where patient_id = ${patientId}
    `;
    const rows = await tx<any[]>`
      insert into patient.ai_summaries (patient_id, summary_text, source_references, model, model_version, version, generated_by)
      values (
        ${patientId}, ${result.data.summaryText}, ${JSON.stringify(result.data.sourceReferences)}::jsonb,
        ${result.model}, ${result.modelVersion}, ${next_version}, ${actorId ?? null}
      )
      returning *
    `;
    return { ok: true, summary: mapSummary(rows[0]) };
  });
}

export async function getCurrentSummary(patientId: string): Promise<AiSummaryRow | null> {
  const rows = await db<any[]>`select * from patient.ai_summaries where patient_id = ${patientId} and is_current = true`;
  return rows[0] ? mapSummary(rows[0]) : null;
}

export async function listSummaryHistory(patientId: string): Promise<AiSummaryRow[]> {
  const rows = await db<any[]>`select * from patient.ai_summaries where patient_id = ${patientId} order by version desc`;
  return rows.map(mapSummary);
}

// --- V8.6 AI-assisted translation ----------------------------------------

/**
 * Only ever translates a document's own free-text title as a stand-in for
 * "the document's content" -- this codebase has no OCR/text-extraction
 * pipeline for uploaded files (V3.1's documents are opaque MinIO objects),
 * so there is no extracted document body to hand to a translator yet
 * either. The row this creates preserves the original (never overwrites
 * anything) and is labeled translation_type = 'ai' so it's never mistaken
 * for a human translation, per spec V8.6.
 */
export async function requestAiTranslation(
  documentId: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ ok: true; translationId: string } | { ok: false; reason: "not_configured" | "not_found" }> {
  const document = await getClinicalDocument(documentId);
  if (!document) return { ok: false, reason: "not_found" };

  const result = await translateDocumentText({ text: document.title, sourceLanguage, targetLanguage });
  if (isErrorResult(result)) return { ok: false, reason: result.reason };

  const translation = await addDocumentTranslation({
    documentId,
    sourceLanguage,
    targetLanguage,
    translationType: "ai",
    translatedText: result.data.translatedText,
    translationStatus: "completed",
  });
  return { ok: true, translationId: translation.id };
}
