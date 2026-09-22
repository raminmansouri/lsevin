import { z } from "zod/v4";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalid" });

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

export const CASE_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const ENCOUNTER_TYPES = [
  "video_consultation",
  "clinic_visit",
  "hospital_admission",
  "emergency_visit",
  "diagnostic_visit",
  "treatment_session",
  "follow_up",
  "other",
] as const;
export const REQUIREMENT_TYPES = ["document", "lab_test", "imaging", "questionnaire", "medical_clearance", "passport", "other"] as const;
export const REQUIREMENT_STATUSES = ["missing", "requested", "received", "expired", "rejected", "accepted"] as const;
export const SUBMISSION_RESPONSE_STATUSES = ["pending", "accepted", "declined", "needs_more_info"] as const;
export const PROPOSAL_STATUSES = ["proposed", "accepted", "rejected", "expired", "superseded"] as const;
export const FOLLOWUP_STATUSES = ["scheduled", "completed", "missed", "cancelled"] as const;
export const PACKAGE_SCOPES = [
  "demographics",
  "allergies",
  "conditions",
  "medications",
  "procedures",
  "lab_results",
  "imaging",
  "clinical_documents",
] as const;

export const CreateMedicalCaseSchema = z.object({
  patientId: z.uuid(),
  caseType: z.string().trim().min(1).max(100),
  specialty: z.string().trim().max(120).optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  chiefComplaint: z.string().trim().max(1000).optional(),
  priority: z.enum(CASE_PRIORITIES).optional(),
  originCountry: z.string().trim().length(2).optional(),
  originCity: z.string().trim().max(120).optional(),
  desiredCountry: z.string().trim().length(2).optional(),
  desiredCity: z.string().trim().max(120).optional(),
});
export type CreateMedicalCaseInput = z.input<typeof CreateMedicalCaseSchema>;

export const TransitionCaseStatusSchema = z.object({
  medicalCaseId: z.uuid(),
  toStatus: z.enum(MEDICAL_CASE_STATUSES),
  note: z.string().trim().max(1000).optional(),
});
export type TransitionCaseStatusInput = z.input<typeof TransitionCaseStatusSchema>;

export const AddClinicalEncounterSchema = z.object({
  patientId: z.uuid(),
  medicalCaseId: z.uuid().optional(),
  encounterType: z.enum(ENCOUNTER_TYPES),
  startedAt: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
  summary: z.string().trim().max(2000).optional(),
});
export type AddClinicalEncounterInput = z.input<typeof AddClinicalEncounterSchema>;

export const AddCaseRequirementSchema = z.object({
  medicalCaseId: z.uuid(),
  requirementType: z.enum(REQUIREMENT_TYPES),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(1000).optional(),
  expiresAt: isoDate.optional(),
});
export type AddCaseRequirementInput = z.input<typeof AddCaseRequirementSchema>;

export const UpdateCaseRequirementStatusSchema = z.object({
  id: z.uuid(),
  requirementStatus: z.enum(REQUIREMENT_STATUSES),
  fulfilledDocumentId: z.uuid().optional(),
});
export type UpdateCaseRequirementStatusInput = z.input<typeof UpdateCaseRequirementStatusSchema>;

export const GenerateCasePackageSchema = z.object({
  medicalCaseId: z.uuid(),
  patientId: z.uuid(),
  includedScopes: z.array(z.enum(PACKAGE_SCOPES)).min(1),
});
export type GenerateCasePackageInput = z.input<typeof GenerateCasePackageSchema>;

export const AddProviderSubmissionSchema = z.object({
  medicalCaseId: z.uuid(),
  providerId: z.uuid(),
  providerNotes: z.string().trim().max(1000).optional(),
});
export type AddProviderSubmissionInput = z.input<typeof AddProviderSubmissionSchema>;

export const UpdateSubmissionResponseSchema = z.object({
  id: z.uuid(),
  responseStatus: z.enum(SUBMISSION_RESPONSE_STATUSES),
  providerNotes: z.string().trim().max(1000).optional(),
});
export type UpdateSubmissionResponseInput = z.input<typeof UpdateSubmissionResponseSchema>;

export const AddTreatmentProposalSchema = z.object({
  medicalCaseId: z.uuid(),
  diagnosis: z.string().trim().max(500).optional(),
  suggestedProcedure: z.string().trim().max(300).optional(),
  treatmentPlan: z.string().trim().max(2000).optional(),
  estimatedStayDays: z.number().int().nonnegative().optional(),
  priceQuoteReference: z.string().trim().max(200).optional(),
  validUntil: isoDate.optional(),
});
export type AddTreatmentProposalInput = z.input<typeof AddTreatmentProposalSchema>;

export const AddSecondOpinionSchema = z.object({
  medicalCaseId: z.uuid(),
  providerId: z.uuid(),
  opinionDate: isoDate,
  conclusion: z.string().trim().min(1).max(3000),
});
export type AddSecondOpinionInput = z.input<typeof AddSecondOpinionSchema>;

export const AddFollowUpSchema = z.object({
  medicalCaseId: z.uuid(),
  scheduledDate: isoDate,
  requiredItems: z.string().trim().max(500).optional(),
  providerNotes: z.string().trim().max(1000).optional(),
});
export type AddFollowUpInput = z.input<typeof AddFollowUpSchema>;

export const ArchiveCaseRecordSchema = z.object({
  id: z.uuid(),
});
export type ArchiveCaseRecordInput = z.input<typeof ArchiveCaseRecordSchema>;
