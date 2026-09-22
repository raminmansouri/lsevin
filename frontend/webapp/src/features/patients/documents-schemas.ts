import { z } from "zod/v4";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalid" });

export const DOCUMENT_TYPES = [
  "lab_report",
  "imaging_report",
  "mri_image",
  "ct_image",
  "x_ray",
  "ultrasound",
  "prescription",
  "discharge_summary",
  "pathology",
  "referral",
  "doctor_note",
  "operative_report",
  "medical_history",
  "insurance",
  "consent",
  "treatment_plan",
  "second_opinion",
  "passport",
  "other",
] as const;

export const LAB_ORDER_STATUSES = ["ordered", "in_progress", "completed", "cancelled"] as const;
export const DIAGNOSTIC_REPORT_STATUSES = ["registered", "preliminary", "final", "amended", "cancelled"] as const;
export const IMAGING_MODALITIES = ["mri", "ct", "pet", "x_ray", "ultrasound", "mammography", "other"] as const;
export const OBSERVATION_INTERPRETATIONS = ["normal", "high", "low", "critical_high", "critical_low", "abnormal"] as const;

export const AddClinicalDocumentSchema = z.object({
  patientId: z.uuid(),
  documentType: z.enum(DOCUMENT_TYPES),
  title: z.string().trim().min(1).max(300),
  mediaLibraryId: z.uuid().optional(),
  fileUrl: z.string().trim().min(1).max(2000),
  mimeType: z.string().trim().max(200).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  originalName: z.string().trim().max(300).optional(),
  language: z.string().trim().max(10).optional(),
  documentDate: isoDate.optional(),
  isConfidential: z.boolean().optional(),
});
export type AddClinicalDocumentInput = z.input<typeof AddClinicalDocumentSchema>;

export const ReplaceClinicalDocumentSchema = z.object({
  supersedesDocumentId: z.uuid(),
  patientId: z.uuid(),
  documentType: z.enum(DOCUMENT_TYPES),
  title: z.string().trim().min(1).max(300),
  mediaLibraryId: z.uuid().optional(),
  fileUrl: z.string().trim().min(1).max(2000),
  mimeType: z.string().trim().max(200).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  originalName: z.string().trim().max(300).optional(),
  replacementReason: z.string().trim().min(1).max(500),
});
export type ReplaceClinicalDocumentInput = z.input<typeof ReplaceClinicalDocumentSchema>;

export const AddLabOrderSchema = z.object({
  patientId: z.uuid(),
  requestedTests: z.array(z.string().trim().min(1).max(200)).min(1),
  orderStatus: z.enum(LAB_ORDER_STATUSES).optional(),
  externalLab: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type AddLabOrderInput = z.input<typeof AddLabOrderSchema>;

export const AddDiagnosticReportSchema = z.object({
  patientId: z.uuid(),
  labOrderId: z.uuid().optional(),
  reportType: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300),
  reportStatus: z.enum(DIAGNOSTIC_REPORT_STATUSES).optional(),
  documentId: z.uuid().optional(),
  summary: z.string().trim().max(2000).optional(),
});
export type AddDiagnosticReportInput = z.input<typeof AddDiagnosticReportSchema>;

export const AddClinicalObservationSchema = z
  .object({
    patientId: z.uuid(),
    diagnosticReportId: z.uuid().optional(),
    code: z.string().trim().max(50).optional(),
    displayName: z.string().trim().min(1).max(200),
    valueNumber: z.number().optional(),
    valueText: z.string().trim().max(500).optional(),
    unit: z.string().trim().max(30).optional(),
    referenceLow: z.number().optional(),
    referenceHigh: z.number().optional(),
    interpretation: z.enum(OBSERVATION_INTERPRETATIONS).optional(),
    effectiveAt: z.string().min(1),
  })
  .refine((data) => data.valueNumber === undefined || data.valueText === undefined, {
    path: ["valueText"],
    params: { code: "invalid" },
  });
export type AddClinicalObservationInput = z.input<typeof AddClinicalObservationSchema>;

export const AddImagingStudySchema = z.object({
  patientId: z.uuid(),
  modality: z.enum(IMAGING_MODALITIES),
  bodyPart: z.string().trim().max(120).optional(),
  studyDate: isoDate,
  radiologist: z.string().trim().max(200).optional(),
  reportDocumentId: z.uuid().optional(),
  externalReference: z.string().trim().max(300).optional(),
});
export type AddImagingStudyInput = z.input<typeof AddImagingStudySchema>;

export const ArchiveDocumentsRecordSchema = z.object({
  id: z.uuid(),
});
export type ArchiveDocumentsRecordInput = z.input<typeof ArchiveDocumentsRecordSchema>;
