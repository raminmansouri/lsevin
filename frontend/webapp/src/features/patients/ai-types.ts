/**
 * Patient 360 V8 (AI-Assisted Medical Record). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0057_patient_ai_assistance.sql.
 */

export type DocumentClassificationRow = {
  id: string;
  documentId: string;
  suggestedType: string;
  confidence: number;
  model: string;
  modelVersion: string;
  requiresReview: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  acceptedType: string | null;
  createdAt: string;
};

export type ExtractionCandidateType = "condition" | "medication" | "lab_observation" | "procedure" | "provider_facility";
export type ExtractionReviewStatus = "pending" | "approved" | "corrected" | "rejected" | "deferred";

export type AiExtractionCandidateRow = {
  id: string;
  patientId: string;
  documentId: string;
  candidateType: ExtractionCandidateType;
  extractedData: Record<string, unknown>;
  confidence: number;
  model: string;
  modelVersion: string;
  extractedAt: string;
  reviewStatus: ExtractionReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  resultingRecordType: string | null;
  resultingRecordId: string | null;
};

export type AiSummaryRow = {
  id: string;
  patientId: string;
  summaryText: string;
  sourceReferences: { recordType: string; recordId: string }[];
  model: string;
  modelVersion: string;
  version: number;
  isCurrent: boolean;
  generatedBy: string | null;
  createdAt: string;
};

/** V8.5: rule-based, no AI needed -- see server/readiness-repository.ts. */
export type CaseReadinessAlert = {
  alertType: "missing_requirement" | "expired_requirement" | "duplicate_document";
  severity: "info" | "warning";
  label: string;
  recordId: string;
};
