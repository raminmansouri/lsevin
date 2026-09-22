/**
 * Patient 360 V2 (Clinical Record MVP). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0050_patient_clinical_core.sql.
 */

export type VerificationStatus =
  | "patient_reported"
  | "imported"
  | "unverified"
  | "provisional"
  | "verified"
  | "refuted"
  | "entered_in_error";

/** Fields every V2 clinical entity shares (spec V2.1). */
type ClinicalCommon = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  encounterId: string | null;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceType: string;
  sourceId: string | null;
  verificationStatus: VerificationStatus;
  providerId: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type PatientConditionRow = ClinicalCommon & {
  code: string | null;
  codingSystem: string | null;
  displayName: string;
  patientEnteredName: string | null;
  clinicalStatus: string;
  severity: string | null;
  bodySite: string | null;
  onsetDate: string | null;
  resolvedDate: string | null;
  notes: string | null;
};

export type PatientProcedureRow = ClinicalCommon & {
  procedureCode: string | null;
  procedureName: string;
  category: string | null;
  procedureStatus: string;
  performedFrom: string;
  performedUntil: string | null;
  bodySite: string | null;
  outcome: string | null;
  complications: string | null;
  countryCode: string | null;
  city: string | null;
  notes: string | null;
};

export type PatientAllergyRow = ClinicalCommon & {
  substance: string | null;
  allergenCode: string | null;
  category: string;
  reaction: string | null;
  severity: string | null;
  criticality: string | null;
  onsetDate: string | null;
  notes: string | null;
};

export type PatientMedicationRow = ClinicalCommon & {
  medicationId: string | null;
  name: string;
  genericName: string | null;
  brandName: string | null;
  dose: string | null;
  doseUnit: string | null;
  route: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  medicationStatus: string;
  reportedOrPrescribed: "patient_reported" | "prescribed";
  reason: string | null;
  prescribedBy: string | null;
  notes: string | null;
};

export type PatientProductUsageRow = ClinicalCommon & {
  productId: string | null;
  shopOrderItemId: string | null;
  productName: string;
  category: string;
  startedAt: string | null;
  endedAt: string | null;
  usageFrequency: string | null;
  reason: string | null;
  effectReported: string | null;
  adverseEffect: string | null;
  recommendedBy: string | null;
  notes: string | null;
};

export type PatientSymptomRow = ClinicalCommon & {
  name: string;
  bodySite: string | null;
  severity: string | null;
  patientDescription: string | null;
  onsetDate: string | null;
  resolvedDate: string | null;
};

/** V2.8 Clinical summary: critical allergies, active conditions, current
 * medications, major previous procedures, recent symptoms -- unverified/
 * self-reported items must stay visibly labeled as such in the UI, never
 * presented as confirmed fact (spec V2.8). */
export type PatientClinicalSummary = {
  criticalAllergies: PatientAllergyRow[];
  activeConditions: PatientConditionRow[];
  currentMedications: PatientMedicationRow[];
  recentProcedures: PatientProcedureRow[];
  recentSymptoms: PatientSymptomRow[];
};
