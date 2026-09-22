/**
 * Patient 360 V3 (Documents, Labs & Imaging). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0051_patient_documents_labs_imaging.sql.
 */

export type ClinicalDocumentRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  encounterId: string | null;
  documentType: string;
  title: string;
  mediaLibraryId: string | null;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  originalName: string | null;
  language: string | null;
  originalLanguage: string | null;
  documentDate: string | null;
  authorName: string | null;
  providerId: string | null;
  organizationId: string | null;
  sourceType: string;
  verificationStatus: string;
  isConfidential: boolean;
  status: string;
  version: number;
  supersedesDocumentId: string | null;
  replacementReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalDocumentTranslationRow = {
  id: string;
  documentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationType: "human" | "ai" | "provider";
  translatedText: string | null;
  translatedFileUrl: string | null;
  translationStatus: string;
  translatedBy: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type LabOrderRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  orderingProviderId: string | null;
  requestedTests: string[];
  orderStatus: string;
  externalLab: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

export type DiagnosticReportRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  encounterId: string | null;
  labOrderId: string | null;
  reportType: string;
  title: string;
  reportStatus: string;
  issuedAt: string | null;
  effectiveAt: string | null;
  providerId: string | null;
  organizationId: string | null;
  documentId: string | null;
  summary: string | null;
  status: string;
  createdAt: string;
};

export type ClinicalObservationRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  encounterId: string | null;
  diagnosticReportId: string | null;
  code: string | null;
  codingSystem: string | null;
  displayName: string;
  valueNumber: number | null;
  valueText: string | null;
  valueBoolean: boolean | null;
  valueCode: string | null;
  unit: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  referenceText: string | null;
  interpretation: string | null;
  effectiveAt: string;
  obsStatus: string;
  providerId: string | null;
  organizationId: string | null;
  sourceDocumentId: string | null;
  status: string;
  createdAt: string;
};

export type ImagingStudyRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  modality: string;
  bodyPart: string | null;
  studyDate: string;
  organizationId: string | null;
  radiologist: string | null;
  reportDocumentId: string | null;
  externalReference: string | null;
  status: string;
  createdAt: string;
};
