/**
 * Patient 360 V6 (Identity Resolution, Merge & Reconciliation). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0055_patient_identity_merge.sql.
 */

export type MatchCandidateStatus = "pending" | "confirmed_same_person" | "confirmed_different" | "merged" | "ignored";

export type PatientMatchCandidateRow = {
  id: string;
  patientAId: string;
  patientBId: string;
  matchScore: number;
  matchReasons: string[];
  candidateStatus: MatchCandidateStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type PatientMergeRow = {
  id: string;
  survivingPatientId: string;
  mergedPatientId: string;
  reason: string;
  mergedBy: string | null;
  mergedAt: string;
  reversedBy: string | null;
  reversedAt: string | null;
};

/** V6.3: a dry-run report of what a merge would do, computed without writing
 * anything -- spec: "Add merge simulation/preview before commit." */
export type MergePreview = {
  survivingPatientId: string;
  mergedPatientId: string;
  affectedRecordCounts: Record<string, number>;
  identifierConflicts: number;
  activeAccountLinkConflicts: number;
};

/** V6.5: a same-shape conflict between two active records of the same kind
 * for one patient (e.g. two active allergy rows for the same substance with
 * different severity) -- surfaced for review, never auto-resolved. */
export type ReconciliationConflict = {
  recordType: "condition" | "allergy" | "medication" | "procedure";
  recordAId: string;
  recordBId: string;
  label: string;
  reason: string;
};
