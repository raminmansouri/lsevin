import { z } from "zod/v4";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalid" });

export const CONDITION_CLINICAL_STATUSES = ["active", "inactive", "resolved", "remission", "recurrence", "unknown"] as const;
export const PROCEDURE_STATUSES = ["planned", "in_progress", "completed", "cancelled", "entered_in_error"] as const;
export const ALLERGY_CATEGORIES = ["food", "medication", "environmental", "biologic", "no_known_allergies", "other"] as const;
export const MEDICATION_STATUSES = ["planned", "active", "completed", "stopped", "unknown"] as const;
export const PRODUCT_USAGE_CATEGORIES = ["supplement", "cosmetic", "medical_device", "nutrition", "other"] as const;

export const AddPatientConditionSchema = z.object({
  patientId: z.uuid(),
  displayName: z.string().trim().min(1).max(300),
  clinicalStatus: z.enum(CONDITION_CLINICAL_STATUSES).optional(),
  severity: z.string().trim().max(50).optional(),
  bodySite: z.string().trim().max(120).optional(),
  onsetDate: isoDate.optional(),
  resolvedDate: isoDate.optional(),
  notes: z.string().trim().max(2000).optional(),
  verificationStatus: z
    .enum(["patient_reported", "imported", "unverified", "provisional", "verified", "refuted", "entered_in_error"])
    .optional(),
});
export type AddPatientConditionInput = z.input<typeof AddPatientConditionSchema>;

export const AddPatientProcedureSchema = z.object({
  patientId: z.uuid(),
  procedureName: z.string().trim().min(1).max(300),
  category: z.string().trim().max(80).optional(),
  procedureStatus: z.enum(PROCEDURE_STATUSES).optional(),
  performedFrom: isoDate,
  performedUntil: isoDate.optional(),
  bodySite: z.string().trim().max(120).optional(),
  outcome: z.string().trim().max(500).optional(),
  countryCode: z.string().trim().length(2).optional(),
  city: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type AddPatientProcedureInput = z.input<typeof AddPatientProcedureSchema>;

export const AddPatientAllergySchema = z
  .object({
    patientId: z.uuid(),
    substance: z.string().trim().max(200).optional(),
    category: z.enum(ALLERGY_CATEGORIES),
    reaction: z.string().trim().max(500).optional(),
    severity: z.string().trim().max(50).optional(),
    criticality: z.string().trim().max(50).optional(),
    onsetDate: isoDate.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.category === "no_known_allergies" || Boolean(data.substance?.trim()), {
    path: ["substance"],
    params: { code: "required" },
  });
export type AddPatientAllergyInput = z.input<typeof AddPatientAllergySchema>;

export const AddPatientMedicationSchema = z.object({
  patientId: z.uuid(),
  name: z.string().trim().min(1).max(200),
  dose: z.string().trim().max(50).optional(),
  doseUnit: z.string().trim().max(20).optional(),
  route: z.string().trim().max(50).optional(),
  frequency: z.string().trim().max(100).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  medicationStatus: z.enum(MEDICATION_STATUSES).optional(),
  reportedOrPrescribed: z.enum(["patient_reported", "prescribed"]).optional(),
  reason: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type AddPatientMedicationInput = z.input<typeof AddPatientMedicationSchema>;

export const AddPatientProductUsageSchema = z.object({
  patientId: z.uuid(),
  productName: z.string().trim().min(1).max(200),
  category: z.enum(PRODUCT_USAGE_CATEGORIES),
  startedAt: isoDate.optional(),
  endedAt: isoDate.optional(),
  usageFrequency: z.string().trim().max(100).optional(),
  reason: z.string().trim().max(300).optional(),
  effectReported: z.string().trim().max(500).optional(),
  adverseEffect: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type AddPatientProductUsageInput = z.input<typeof AddPatientProductUsageSchema>;

export const AddPatientSymptomSchema = z.object({
  patientId: z.uuid(),
  name: z.string().trim().min(1).max(200),
  bodySite: z.string().trim().max(120).optional(),
  severity: z.string().trim().max(50).optional(),
  patientDescription: z.string().trim().max(1000).optional(),
  onsetDate: isoDate.optional(),
  resolvedDate: isoDate.optional(),
});
export type AddPatientSymptomInput = z.input<typeof AddPatientSymptomSchema>;

export const ArchiveClinicalRecordSchema = z.object({
  id: z.uuid(),
});
export type ArchiveClinicalRecordInput = z.input<typeof ArchiveClinicalRecordSchema>;
