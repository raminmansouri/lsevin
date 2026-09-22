/**
 * Patient 360 V7.1 FHIR R4 mapping layer -- pure functions, no DB access,
 * so they're testable in isolation. This is a good-faith mapping to the
 * FHIR R4 shape, not a spec-conformance-tested implementation: there is no
 * FHIR validator wired in here (see validateFhirResource below for what
 * "Validate exported resources" actually means in this pass -- structural
 * sanity, not full StructureDefinition conformance).
 *
 * Terminology (V7.2): every mapper accepts an optional pre-resolved
 * TerminologyMapping for its free-text field. When present, the coding is
 * included alongside the original text (spec: "preserve source/local codes
 * even when standardized mapping exists"); when absent (the common case --
 * patient.terminology_mappings ships empty, see 0056's header comment),
 * the CodeableConcept degrades to `{ text }` only, which is valid FHIR.
 */

import type {
  PatientAllergyRow,
  PatientConditionRow,
  PatientMedicationRow,
  PatientProcedureRow,
} from "./clinical-types";
import type { ClinicalEncounterRow } from "./cases-types";
import type { ClinicalDocumentRow, ClinicalObservationRow, DiagnosticReportRow, ImagingStudyRow } from "./documents-types";
import type { PatientConsentRow } from "./sharing-types";
import type { PatientIdentifierRow, PatientRow, PatientTimelineEventRow } from "./types";

export type FhirCodeableConcept = { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
export type FhirReference = { reference: string; display?: string };
export type FhirResource = { resourceType: string; id: string; [key: string]: unknown };
export type FhirBundle = { resourceType: "Bundle"; type: string; timestamp: string; total: number; entry: { resource: FhirResource }[] };

export type TerminologyMapping = {
  targetSystem: "icd10" | "icd11" | "snomed_ct" | "loinc" | "lsevin_internal" | "provider_local";
  targetCode: string;
  targetDisplay: string | null;
};

const TERMINOLOGY_SYSTEM_URIS: Record<TerminologyMapping["targetSystem"], string> = {
  icd10: "http://hl7.org/fhir/sid/icd-10",
  icd11: "http://id.who.int/icd/release/11/mms",
  snomed_ct: "http://snomed.info/sct",
  loinc: "http://loinc.org",
  lsevin_internal: "urn:lsevin:internal-code",
  provider_local: "urn:lsevin:provider-local-code",
};

function codeableConcept(text: string | null | undefined, mapping?: TerminologyMapping | null): FhirCodeableConcept | undefined {
  if (!text) return undefined;
  if (!mapping) return { text };
  return {
    coding: [{ system: TERMINOLOGY_SYSTEM_URIS[mapping.targetSystem], code: mapping.targetCode, display: mapping.targetDisplay ?? text }],
    text,
  };
}

function patientRef(patientId: string): FhirReference {
  return { reference: `Patient/${patientId}` };
}

/** Structural sanity check, not FHIR conformance validation (see file
 * header) -- every mapper here is expected to always pass this; it exists
 * as a defensive check before a resource leaves the export route. */
export function validateFhirResource(resource: FhirResource): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!resource.resourceType || typeof resource.resourceType !== "string") errors.push("missing resourceType");
  if (!resource.id || typeof resource.id !== "string") errors.push("missing id");
  return { valid: errors.length === 0, errors };
}

export function toFhirPatient(patient: PatientRow, identifiers: PatientIdentifierRow[]): FhirResource {
  return {
    resourceType: "Patient",
    id: patient.id,
    identifier: [
      { system: "urn:lsevin:public-id", value: patient.publicId },
      ...identifiers.map((i) => ({ system: `urn:lsevin:identifier:${i.identifierType}`, value: i.maskedValue })),
    ],
    active: patient.status === "active",
    name: [{ family: patient.lastName, given: [patient.firstName, ...(patient.middleName ? [patient.middleName] : [])] }],
    gender: patient.sexAtBirth === "male" || patient.sexAtBirth === "female" ? patient.sexAtBirth : "unknown",
    birthDate: patient.birthDate ?? undefined,
    deceasedBoolean: patient.status === "deceased" ? true : undefined,
  };
}

export function toFhirCondition(row: PatientConditionRow, mapping?: TerminologyMapping | null): FhirResource {
  return {
    resourceType: "Condition",
    id: row.id,
    subject: patientRef(row.patientId),
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: row.clinicalStatus }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: row.verificationStatus }] },
    code: codeableConcept(row.displayName, mapping),
    bodySite: row.bodySite ? [{ text: row.bodySite }] : undefined,
    onsetDateTime: row.onsetDate ?? undefined,
    abatementDateTime: row.resolvedDate ?? undefined,
    note: row.notes ? [{ text: row.notes }] : undefined,
  };
}

export function toFhirAllergyIntolerance(row: PatientAllergyRow, mapping?: TerminologyMapping | null): FhirResource {
  return {
    resourceType: "AllergyIntolerance",
    id: row.id,
    patient: patientRef(row.patientId),
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: row.status }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", code: row.verificationStatus }] },
    category: row.category !== "no_known_allergies" ? [row.category] : undefined,
    code: row.category === "no_known_allergies" ? { text: "No known allergies" } : codeableConcept(row.substance, mapping),
    criticality: row.criticality ?? undefined,
    onsetDateTime: row.onsetDate ?? undefined,
    reaction: row.reaction ? [{ description: row.reaction, severity: row.severity ?? undefined }] : undefined,
  };
}

export function toFhirProcedure(row: PatientProcedureRow, mapping?: TerminologyMapping | null): FhirResource {
  return {
    resourceType: "Procedure",
    id: row.id,
    subject: patientRef(row.patientId),
    status: row.procedureStatus === "completed" ? "completed" : row.procedureStatus === "cancelled" ? "not-done" : "in-progress",
    code: codeableConcept(row.procedureName, mapping),
    bodySite: row.bodySite ? [{ text: row.bodySite }] : undefined,
    performedPeriod: { start: row.performedFrom, end: row.performedUntil ?? undefined },
    outcome: row.outcome ? { text: row.outcome } : undefined,
    complication: row.complications ? [{ text: row.complications }] : undefined,
    note: row.notes ? [{ text: row.notes }] : undefined,
  };
}

export function toFhirMedicationStatement(row: PatientMedicationRow, mapping?: TerminologyMapping | null): FhirResource {
  return {
    resourceType: "MedicationStatement",
    id: row.id,
    subject: patientRef(row.patientId),
    status: row.medicationStatus === "active" ? "active" : row.medicationStatus === "stopped" ? "stopped" : row.medicationStatus,
    medicationCodeableConcept: codeableConcept(row.name, mapping),
    effectivePeriod: row.startDate ? { start: row.startDate, end: row.endDate ?? undefined } : undefined,
    dosage: row.dose ? [{ text: [row.dose, row.doseUnit, row.frequency].filter(Boolean).join(" ") }] : undefined,
    informationSource: row.reportedOrPrescribed === "prescribed" ? undefined : { display: "Patient" },
    note: row.notes ? [{ text: row.notes }] : undefined,
  };
}

export function toFhirObservation(row: ClinicalObservationRow, mapping?: TerminologyMapping | null): FhirResource {
  const value: Record<string, unknown> = {};
  if (row.valueNumber !== null) value.valueQuantity = { value: row.valueNumber, unit: row.unit ?? undefined };
  else if (row.valueText !== null) value.valueString = row.valueText;
  else if (row.valueBoolean !== null) value.valueBoolean = row.valueBoolean;
  else if (row.valueCode !== null) value.valueCodeableConcept = { text: row.valueCode };

  return {
    resourceType: "Observation",
    id: row.id,
    subject: patientRef(row.patientId),
    status: row.obsStatus,
    code: codeableConcept(row.displayName, mapping),
    effectiveDateTime: row.effectiveAt,
    referenceRange:
      row.referenceLow !== null || row.referenceHigh !== null
        ? [{ low: row.referenceLow !== null ? { value: row.referenceLow } : undefined, high: row.referenceHigh !== null ? { value: row.referenceHigh } : undefined }]
        : undefined,
    interpretation: row.interpretation ? [{ text: row.interpretation }] : undefined,
    ...value,
  };
}

export function toFhirDiagnosticReport(row: DiagnosticReportRow): FhirResource {
  return {
    resourceType: "DiagnosticReport",
    id: row.id,
    subject: patientRef(row.patientId),
    status: row.reportStatus === "final" ? "final" : row.reportStatus,
    code: { text: row.title },
    category: [{ text: row.reportType }],
    effectiveDateTime: row.effectiveAt ?? undefined,
    issued: row.issuedAt ?? undefined,
    conclusion: row.summary ?? undefined,
  };
}

export function toFhirImagingStudy(row: ImagingStudyRow): FhirResource {
  return {
    resourceType: "ImagingStudy",
    id: row.id,
    subject: patientRef(row.patientId),
    status: "available",
    started: row.studyDate,
    modality: [{ code: row.modality.toUpperCase() }],
    // Imaging FILES (DICOM) are explicitly out of scope (spec V3.8) -- this
    // resource carries study metadata only, same as the source table.
    note: row.bodyPart ? [{ text: row.bodyPart }] : undefined,
  };
}

export function toFhirDocumentReference(row: ClinicalDocumentRow): FhirResource {
  return {
    resourceType: "DocumentReference",
    id: row.id,
    subject: patientRef(row.patientId),
    status: row.status === "archived" ? "entered-in-error" : "current",
    type: { text: row.documentType },
    date: row.documentDate ?? row.createdAt,
    content: [{ attachment: { contentType: row.mimeType ?? undefined, title: row.title } }],
    // Deliberately no direct file URL here -- a FHIR bundle is exported
    // data at rest, not a live authorized session; the actual bytes stay
    // behind this app's own audited download route (V3.1/V5.5).
  };
}

export function toFhirEncounter(row: ClinicalEncounterRow): FhirResource {
  return {
    resourceType: "Encounter",
    id: row.id,
    subject: patientRef(row.patientId),
    status: row.encounterStatus === "completed" ? "finished" : row.encounterStatus === "cancelled" ? "cancelled" : "in-progress",
    class: { code: row.encounterType },
    period: { start: row.startedAt, end: row.endedAt ?? undefined },
    reasonCode: row.reason ? [{ text: row.reason }] : undefined,
  };
}

export function toFhirConsent(row: PatientConsentRow): FhirResource {
  return {
    resourceType: "Consent",
    id: row.id,
    patient: patientRef(row.patientId),
    status: row.consentStatus === "active" ? "active" : row.consentStatus === "withdrawn" ? "inactive" : "expired",
    scope: { text: row.consentType },
    category: [{ text: row.recipientType }],
    dateTime: row.grantedAt,
    provision: { period: { start: row.validFrom, end: row.validUntil ?? undefined } },
  };
}

/** patient.audit_log rows -> FHIR AuditEvent. Uses the same shape the
 * patient timeline reads (V1.2's PatientTimelineEventRow) since both read
 * the same table. */
export function toFhirAuditEvent(row: PatientTimelineEventRow, patientId: string): FhirResource {
  return {
    resourceType: "AuditEvent",
    id: row.id,
    type: { text: row.action },
    recorded: row.occurredAt,
    agent: [{ who: row.actorUserId ? { reference: `Practitioner/${row.actorUserId}` } : undefined, requestor: Boolean(row.actorUserId) }],
    entity: [{ what: patientRef(patientId), type: { text: row.entityType } }],
  };
}

export function buildPatientBundle(resources: FhirResource[], type: "collection" | "searchset" = "collection"): FhirBundle {
  return {
    resourceType: "Bundle",
    type,
    timestamp: new Date().toISOString(),
    total: resources.length,
    entry: resources.map((resource) => ({ resource })),
  };
}
