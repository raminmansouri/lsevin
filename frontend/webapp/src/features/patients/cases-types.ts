/**
 * Patient 360 V4 (Medical Case & Medical Tourism Workflow). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0052_patient_medical_cases.sql.
 */

export const MEDICAL_CASE_STATUSES = [
  "draft",
  "intake",
  "awaiting_documents",
  "ready_for_review",
  "under_medical_review",
  "awaiting_provider",
  "treatment_proposed",
  "quote_received",
  "patient_decision",
  "booked",
  "travel_preparation",
  "in_treatment",
  "post_treatment",
  "follow_up",
  "completed",
  "cancelled",
] as const;
export type MedicalCaseStatus = (typeof MEDICAL_CASE_STATUSES)[number];

export type MedicalCaseRow = {
  id: string;
  patientId: string;
  caseNumber: string;
  caseType: string;
  specialty: string | null;
  serviceId: string | null;
  title: string;
  description: string | null;
  chiefComplaint: string | null;
  reasonForCare: string | null;
  caseStatus: MedicalCaseStatus;
  priority: "low" | "normal" | "high" | "urgent";
  originCountry: string | null;
  originCity: string | null;
  desiredCountry: string | null;
  desiredCity: string | null;
  assignedCoordinatorId: string | null;
  primaryProviderId: string | null;
  primaryOrganizationId: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MedicalCaseStatusHistoryRow = {
  id: string;
  medicalCaseId: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string | null;
  note: string | null;
  occurredAt: string;
};

export type ClinicalEncounterRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  encounterType: string;
  encounterStatus: string;
  startedAt: string;
  endedAt: string | null;
  providerId: string | null;
  organizationId: string | null;
  reason: string | null;
  summary: string | null;
  createdAt: string;
};

export type MedicalCaseRequirementRow = {
  id: string;
  medicalCaseId: string;
  requirementType: string;
  title: string;
  description: string | null;
  requirementStatus: string;
  expiresAt: string | null;
  fulfilledDocumentId: string | null;
  createdAt: string;
};

export type MedicalCasePackageRow = {
  id: string;
  medicalCaseId: string;
  patientId: string;
  includedScopes: string[];
  snapshot: Record<string, unknown>;
  generatedBy: string | null;
  createdAt: string;
};

export type MedicalCaseProviderSubmissionRow = {
  id: string;
  medicalCaseId: string;
  providerId: string;
  organizationId: string | null;
  sentAt: string;
  responseStatus: string;
  responseAt: string | null;
  attachments: string[];
  providerNotes: string | null;
  createdAt: string;
};

export type MedicalCaseTreatmentProposalRow = {
  id: string;
  medicalCaseId: string;
  diagnosis: string | null;
  suggestedProcedure: string | null;
  treatmentPlan: string | null;
  estimatedStayDays: number | null;
  estimatedTreatmentDuration: string | null;
  priceQuoteReference: string | null;
  providerId: string | null;
  validUntil: string | null;
  supportingDocuments: string[];
  proposalStatus: string;
  createdAt: string;
};

export type MedicalCaseSecondOpinionRow = {
  id: string;
  medicalCaseId: string;
  providerId: string;
  relatedDocuments: string[];
  opinionDate: string;
  conclusion: string;
  createdAt: string;
};

export type MedicalCaseFollowUpRow = {
  id: string;
  medicalCaseId: string;
  encounterId: string | null;
  scheduledDate: string;
  requiredItems: string | null;
  patientReportedOutcome: string | null;
  providerNotes: string | null;
  followupStatus: string;
  createdAt: string;
};

/** V4.4: readiness is a display-only percentage, never medical eligibility
 * (spec: "Do not treat percentage as medical eligibility"). */
export type CaseReadiness = {
  total: number;
  satisfied: number;
  percent: number;
};
