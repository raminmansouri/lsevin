import "server-only";

import db from "@/config/database/db";

import type {
  ClinicalDocumentRow,
  ClinicalDocumentTranslationRow,
  ClinicalObservationRow,
  DiagnosticReportRow,
  ImagingStudyRow,
  LabOrderRow,
} from "../documents-types";

function mapDocument(row: any): ClinicalDocumentRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    encounterId: row.encounter_id,
    documentType: row.document_type,
    title: row.title,
    mediaLibraryId: row.media_library_id,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    fileSize: row.file_size === null ? null : Number(row.file_size),
    checksum: row.checksum,
    originalName: row.original_name,
    language: row.language,
    originalLanguage: row.original_language,
    documentDate: row.document_date,
    authorName: row.author_name,
    providerId: row.provider_id,
    organizationId: row.organization_id,
    sourceType: row.source_type,
    verificationStatus: row.verification_status,
    isConfidential: row.is_confidential,
    status: row.status,
    version: row.version,
    supersedesDocumentId: row.supersedes_document_id,
    replacementReason: row.replacement_reason,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

function mapLabOrder(row: any): LabOrderRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    orderingProviderId: row.ordering_provider_id,
    requestedTests: row.requested_tests ?? [],
    orderStatus: row.order_status,
    externalLab: row.external_lab,
    notes: row.notes,
    status: row.status,
    createdAt: row.create_date,
  };
}

function mapDiagnosticReport(row: any): DiagnosticReportRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    encounterId: row.encounter_id,
    labOrderId: row.lab_order_id,
    reportType: row.report_type,
    title: row.title,
    reportStatus: row.report_status,
    issuedAt: row.issued_at,
    effectiveAt: row.effective_at,
    providerId: row.provider_id,
    organizationId: row.organization_id,
    documentId: row.document_id,
    summary: row.summary,
    status: row.status,
    createdAt: row.create_date,
  };
}

function mapObservation(row: any): ClinicalObservationRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    encounterId: row.encounter_id,
    diagnosticReportId: row.diagnostic_report_id,
    code: row.code,
    codingSystem: row.coding_system,
    displayName: row.display_name,
    valueNumber: row.value_number === null ? null : Number(row.value_number),
    valueText: row.value_text,
    valueBoolean: row.value_boolean,
    valueCode: row.value_code,
    unit: row.unit,
    referenceLow: row.reference_low === null ? null : Number(row.reference_low),
    referenceHigh: row.reference_high === null ? null : Number(row.reference_high),
    referenceText: row.reference_text,
    interpretation: row.interpretation,
    effectiveAt: row.effective_at,
    obsStatus: row.obs_status,
    providerId: row.provider_id,
    organizationId: row.organization_id,
    sourceDocumentId: row.source_document_id,
    status: row.status,
    createdAt: row.create_date,
  };
}

function mapImagingStudy(row: any): ImagingStudyRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    modality: row.modality,
    bodyPart: row.body_part,
    studyDate: row.study_date,
    organizationId: row.organization_id,
    radiologist: row.radiologist,
    reportDocumentId: row.report_document_id,
    externalReference: row.external_reference,
    status: row.status,
    createdAt: row.create_date,
  };
}

// --- Clinical documents ----------------------------------------------------

export async function findDuplicateDocumentCandidate(
  patientId: string,
  originalName: string | undefined,
  fileSize: number | undefined
): Promise<ClinicalDocumentRow | null> {
  if (!originalName || fileSize === undefined) return null;
  const rows = await db<any[]>`
    select * from patient.clinical_documents
    where patient_id = ${patientId} and status != 'archived' and original_name = ${originalName} and file_size = ${fileSize}
    limit 1
  `;
  return rows[0] ? mapDocument(rows[0]) : null;
}

export async function addClinicalDocument(input: {
  patientId: string;
  documentType: string;
  title: string;
  mediaLibraryId?: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  originalName?: string;
  language?: string;
  documentDate?: string;
  isConfidential?: boolean;
  createdBy?: string | null;
}): Promise<ClinicalDocumentRow> {
  const rows = await db<any[]>`
    insert into patient.clinical_documents (
      patient_id, document_type, title, media_library_id, file_url, mime_type, file_size,
      original_name, language, document_date, is_confidential, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.documentType}, ${input.title}, ${input.mediaLibraryId ?? null}, ${input.fileUrl},
      ${input.mimeType ?? null}, ${input.fileSize ?? null}, ${input.originalName ?? null}, ${input.language ?? null},
      ${input.documentDate ?? null}, ${input.isConfidential ?? false}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapDocument(rows[0]);
}

/** V3.2 versioning: the old row becomes 'superseded' (never overwritten or
 * deleted), a new row is inserted pointing back at it via
 * supersedes_document_id, carrying the replacement reason. Both writes run
 * in one transaction so a half-applied replacement can't happen. */
export async function replaceClinicalDocument(input: {
  supersedesDocumentId: string;
  patientId: string;
  documentType: string;
  title: string;
  mediaLibraryId?: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  originalName?: string;
  replacementReason: string;
  createdBy?: string | null;
}): Promise<ClinicalDocumentRow | null> {
  return db.begin(async (tx) => {
    const previous = await tx<any[]>`
      select * from patient.clinical_documents where id = ${input.supersedesDocumentId} and patient_id = ${input.patientId}
    `;
    if (!previous[0]) return null;

    await tx`update patient.clinical_documents set status = 'superseded', last_modified_date = now() where id = ${input.supersedesDocumentId}`;

    const rows = await tx<any[]>`
      insert into patient.clinical_documents (
        patient_id, document_type, title, media_library_id, file_url, mime_type, file_size, original_name,
        version, supersedes_document_id, replacement_reason, created_by, last_modified_by
      ) values (
        ${input.patientId}, ${input.documentType}, ${input.title}, ${input.mediaLibraryId ?? null}, ${input.fileUrl},
        ${input.mimeType ?? null}, ${input.fileSize ?? null}, ${input.originalName ?? null},
        ${previous[0].version + 1}, ${input.supersedesDocumentId}, ${input.replacementReason},
        ${input.createdBy ?? null}, ${input.createdBy ?? null}
      )
      returning *
    `;
    return mapDocument(rows[0]);
  });
}

export async function listDocumentsForPatient(patientId: string): Promise<ClinicalDocumentRow[]> {
  const rows = await db<any[]>`
    select * from patient.clinical_documents
    where patient_id = ${patientId} and status not in ('superseded', 'archived')
    order by create_date desc
  `;
  return rows.map(mapDocument);
}

export async function getClinicalDocument(id: string): Promise<ClinicalDocumentRow | null> {
  const rows = await db<any[]>`select * from patient.clinical_documents where id = ${id}`;
  return rows[0] ? mapDocument(rows[0]) : null;
}

export async function archiveClinicalDocument(id: string): Promise<ClinicalDocumentRow | null> {
  const rows = await db<any[]>`
    update patient.clinical_documents set status = 'archived', last_modified_date = now()
    where id = ${id} and status not in ('archived') returning *
  `;
  return rows[0] ? mapDocument(rows[0]) : null;
}

// --- Lab orders --------------------------------------------------------

export async function addLabOrder(input: {
  patientId: string;
  requestedTests: string[];
  orderStatus?: string;
  externalLab?: string;
  notes?: string;
  createdBy?: string | null;
}): Promise<LabOrderRow> {
  const rows = await db<any[]>`
    insert into patient.lab_orders (patient_id, requested_tests, order_status, external_lab, notes, created_by)
    values (${input.patientId}, ${input.requestedTests}, ${input.orderStatus ?? "ordered"}, ${input.externalLab ?? null}, ${input.notes ?? null}, ${input.createdBy ?? null})
    returning *
  `;
  return mapLabOrder(rows[0]);
}

export async function listLabOrdersForPatient(patientId: string): Promise<LabOrderRow[]> {
  const rows = await db<any[]>`
    select * from patient.lab_orders where patient_id = ${patientId} and status != 'archived' order by create_date desc
  `;
  return rows.map(mapLabOrder);
}

export async function archiveLabOrder(id: string): Promise<LabOrderRow | null> {
  const rows = await db<any[]>`
    update patient.lab_orders set status = 'archived', last_modified_date = now() where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapLabOrder(rows[0]) : null;
}

// --- Diagnostic reports --------------------------------------------------

export async function addDiagnosticReport(input: {
  patientId: string;
  labOrderId?: string;
  reportType: string;
  title: string;
  reportStatus?: string;
  documentId?: string;
  summary?: string;
  createdBy?: string | null;
}): Promise<DiagnosticReportRow> {
  const rows = await db<any[]>`
    insert into patient.diagnostic_reports (
      patient_id, lab_order_id, report_type, title, report_status, document_id, summary, created_by
    ) values (
      ${input.patientId}, ${input.labOrderId ?? null}, ${input.reportType}, ${input.title}, ${input.reportStatus ?? "preliminary"},
      ${input.documentId ?? null}, ${input.summary ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapDiagnosticReport(rows[0]);
}

export async function listDiagnosticReportsForPatient(patientId: string): Promise<DiagnosticReportRow[]> {
  const rows = await db<any[]>`
    select * from patient.diagnostic_reports where patient_id = ${patientId} and status != 'archived' order by create_date desc
  `;
  return rows.map(mapDiagnosticReport);
}

export async function archiveDiagnosticReport(id: string): Promise<DiagnosticReportRow | null> {
  const rows = await db<any[]>`
    update patient.diagnostic_reports set status = 'archived', last_modified_date = now() where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapDiagnosticReport(rows[0]) : null;
}

// --- Clinical observations -----------------------------------------------

export async function addClinicalObservation(input: {
  patientId: string;
  diagnosticReportId?: string;
  code?: string;
  displayName: string;
  valueNumber?: number;
  valueText?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  interpretation?: string;
  effectiveAt: string;
  sourceDocumentId?: string;
  createdBy?: string | null;
}): Promise<ClinicalObservationRow> {
  const rows = await db<any[]>`
    insert into patient.clinical_observations (
      patient_id, diagnostic_report_id, code, display_name, value_number, value_text, unit,
      reference_low, reference_high, interpretation, effective_at, source_document_id, created_by
    ) values (
      ${input.patientId}, ${input.diagnosticReportId ?? null}, ${input.code ?? null}, ${input.displayName},
      ${input.valueNumber ?? null}, ${input.valueText ?? null}, ${input.unit ?? null},
      ${input.referenceLow ?? null}, ${input.referenceHigh ?? null}, ${input.interpretation ?? null},
      ${input.effectiveAt}, ${input.sourceDocumentId ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapObservation(rows[0]);
}

export async function listObservationsForPatient(patientId: string): Promise<ClinicalObservationRow[]> {
  const rows = await db<any[]>`
    select * from patient.clinical_observations where patient_id = ${patientId} and status != 'archived' order by effective_at desc
  `;
  return rows.map(mapObservation);
}

/** V3.7 result trends: every observation sharing a code (falling back to
 * display_name when no coded value was captured) for this patient, oldest
 * first, so the UI can render a simple time series. */
export async function getObservationTrend(patientId: string, codeOrName: string): Promise<ClinicalObservationRow[]> {
  const rows = await db<any[]>`
    select * from patient.clinical_observations
    where patient_id = ${patientId} and status != 'archived'
      and (code = ${codeOrName} or (code is null and display_name = ${codeOrName}))
    order by effective_at asc
  `;
  return rows.map(mapObservation);
}

export async function archiveClinicalObservation(id: string): Promise<ClinicalObservationRow | null> {
  const rows = await db<any[]>`
    update patient.clinical_observations set status = 'archived' where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapObservation(rows[0]) : null;
}

// --- Imaging studies -------------------------------------------------------

export async function addImagingStudy(input: {
  patientId: string;
  modality: string;
  bodyPart?: string;
  studyDate: string;
  radiologist?: string;
  reportDocumentId?: string;
  externalReference?: string;
  createdBy?: string | null;
}): Promise<ImagingStudyRow> {
  const rows = await db<any[]>`
    insert into patient.imaging_studies (
      patient_id, modality, body_part, study_date, radiologist, report_document_id, external_reference, created_by
    ) values (
      ${input.patientId}, ${input.modality}, ${input.bodyPart ?? null}, ${input.studyDate}, ${input.radiologist ?? null},
      ${input.reportDocumentId ?? null}, ${input.externalReference ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapImagingStudy(rows[0]);
}

export async function listImagingStudiesForPatient(patientId: string): Promise<ImagingStudyRow[]> {
  const rows = await db<any[]>`
    select * from patient.imaging_studies where patient_id = ${patientId} and status != 'archived' order by study_date desc
  `;
  return rows.map(mapImagingStudy);
}

export async function archiveImagingStudy(id: string): Promise<ImagingStudyRow | null> {
  const rows = await db<any[]>`
    update patient.imaging_studies set status = 'archived', last_modified_date = now() where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapImagingStudy(rows[0]) : null;
}

// --- Document translations (V3.3 table, CRUD closed out here for V8.6) ----

function mapDocumentTranslation(row: any): ClinicalDocumentTranslationRow {
  return {
    id: row.id,
    documentId: row.document_id,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    translationType: row.translation_type,
    translatedText: row.translated_text,
    translatedFileUrl: row.translated_file_url,
    translationStatus: row.translation_status,
    translatedBy: row.translated_by,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.create_date,
  };
}

export async function addDocumentTranslation(input: {
  documentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationType: "human" | "ai" | "provider";
  translatedText?: string;
  translationStatus?: string;
  translatedBy?: string | null;
}): Promise<ClinicalDocumentTranslationRow> {
  const rows = await db<any[]>`
    insert into patient.clinical_document_translations (
      document_id, source_language, target_language, translation_type, translated_text, translation_status, translated_by
    ) values (
      ${input.documentId}, ${input.sourceLanguage}, ${input.targetLanguage}, ${input.translationType},
      ${input.translatedText ?? null}, ${input.translationStatus ?? "pending"}, ${input.translatedBy ?? null}
    )
    returning *
  `;
  return mapDocumentTranslation(rows[0]);
}

export async function listTranslationsForDocument(documentId: string): Promise<ClinicalDocumentTranslationRow[]> {
  const rows = await db<any[]>`
    select * from patient.clinical_document_translations where document_id = ${documentId} order by create_date desc
  `;
  return rows.map(mapDocumentTranslation);
}

/** Human verification never edits a machine translation in place -- it
 * marks it verified, preserving that the text originated from a model
 * (spec V8.6: "label machine translated output... support human
 * verification"). A corrected translation is a new row, same as document
 * versioning's own "never overwrite" rule. */
export async function verifyDocumentTranslation(id: string, verifierId: string): Promise<ClinicalDocumentTranslationRow | null> {
  const rows = await db<any[]>`
    update patient.clinical_document_translations
    set translation_status = 'completed', verified_by = ${verifierId}, verified_at = now()
    where id = ${id}
    returning *
  `;
  return rows[0] ? mapDocumentTranslation(rows[0]) : null;
}
