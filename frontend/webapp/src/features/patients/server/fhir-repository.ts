import "server-only";

import db from "@/config/database/db";

import type { TerminologyMapping } from "../fhir-mapping";
import {
  buildPatientBundle,
  toFhirAllergyIntolerance,
  toFhirCondition,
  toFhirConsent,
  toFhirDiagnosticReport,
  toFhirDocumentReference,
  toFhirEncounter,
  toFhirImagingStudy,
  toFhirMedicationStatement,
  toFhirObservation,
  toFhirPatient,
  toFhirProcedure,
  type FhirBundle,
  type FhirResource,
} from "../fhir-mapping";
import { getPatientById, listIdentifiersForPatient } from "./repository";
import { listAllergiesForPatient, listConditionsForPatient, listMedicationsForPatient, listProceduresForPatient } from "./clinical-repository";
import {
  listDiagnosticReportsForPatient,
  listDocumentsForPatient,
  listImagingStudiesForPatient,
  listObservationsForPatient,
} from "./documents-repository";
import { listConsentsForPatient } from "./sharing-repository";

/** V7.2 terminology lookup: case-insensitive exact match on the curated
 * free-text term. Ships unseeded (see 0056's header comment) -- this will
 * return null for effectively everything until someone curates mappings;
 * every FHIR mapper already handles that by degrading to text-only. */
export async function findTerminologyMapping(sourceText: string): Promise<TerminologyMapping | null> {
  const rows = await db<any[]>`
    select target_system, target_code, target_display from patient.terminology_mappings
    where lower(source_text) = lower(${sourceText})
    order by create_date desc
    limit 1
  `;
  if (!rows[0]) return null;
  return { targetSystem: rows[0].target_system, targetCode: rows[0].target_code, targetDisplay: rows[0].target_display };
}

const FHIR_RESOURCE_TYPES = [
  "Condition",
  "AllergyIntolerance",
  "Procedure",
  "MedicationStatement",
  "Observation",
  "DiagnosticReport",
  "ImagingStudy",
  "DocumentReference",
  "Encounter",
  "Consent",
] as const;
export type FhirResourceType = (typeof FHIR_RESOURCE_TYPES)[number];
export function isFhirResourceType(value: string): value is FhirResourceType {
  return (FHIR_RESOURCE_TYPES as readonly string[]).includes(value);
}

/** One resource type's worth of a patient's data, mapped to FHIR. Used by
 * both the single-type export route and the full-bundle export. */
export async function getFhirResourcesForPatient(patientId: string, resourceType: FhirResourceType): Promise<FhirResource[]> {
  switch (resourceType) {
    case "Condition": {
      const rows = await listConditionsForPatient(patientId);
      return Promise.all(rows.map(async (r) => toFhirCondition(r, await findTerminologyMapping(r.displayName))));
    }
    case "AllergyIntolerance": {
      const rows = await listAllergiesForPatient(patientId);
      return Promise.all(rows.map(async (r) => toFhirAllergyIntolerance(r, r.substance ? await findTerminologyMapping(r.substance) : null)));
    }
    case "Procedure": {
      const rows = await listProceduresForPatient(patientId);
      return Promise.all(rows.map(async (r) => toFhirProcedure(r, await findTerminologyMapping(r.procedureName))));
    }
    case "MedicationStatement": {
      const rows = await listMedicationsForPatient(patientId);
      return Promise.all(rows.map(async (r) => toFhirMedicationStatement(r, await findTerminologyMapping(r.name))));
    }
    case "Observation": {
      const rows = await listObservationsForPatient(patientId);
      return Promise.all(rows.map(async (r) => toFhirObservation(r, await findTerminologyMapping(r.displayName))));
    }
    case "DiagnosticReport": {
      const rows = await listDiagnosticReportsForPatient(patientId);
      return rows.map(toFhirDiagnosticReport);
    }
    case "ImagingStudy": {
      const rows = await listImagingStudiesForPatient(patientId);
      return rows.map(toFhirImagingStudy);
    }
    case "DocumentReference": {
      const rows = await listDocumentsForPatient(patientId);
      return rows.map(toFhirDocumentReference);
    }
    case "Encounter": {
      // No case scoping here -- every encounter across every case for this
      // patient, matching the rest of the bundle's "whole patient" scope.
      const rows = await db<any[]>`select * from patient.clinical_encounters where patient_id = ${patientId} order by started_at desc`;
      return rows.map((row) =>
        toFhirEncounter({
          id: row.id,
          patientId: row.patient_id,
          medicalCaseId: row.medical_case_id,
          encounterType: row.encounter_type,
          encounterStatus: row.encounter_status,
          startedAt: row.started_at,
          endedAt: row.ended_at,
          providerId: row.provider_id,
          organizationId: row.organization_id,
          reason: row.reason,
          summary: row.summary,
          createdAt: row.create_date,
        })
      );
    }
    case "Consent": {
      const rows = await listConsentsForPatient(patientId);
      return rows.map(toFhirConsent);
    }
    default:
      return [];
  }
}

export async function exportFhirPatientBundle(patientId: string): Promise<FhirBundle | null> {
  const patient = await getPatientById(patientId);
  if (!patient) return null;

  const identifiers = await listIdentifiersForPatient(patientId);
  const resourceLists = await Promise.all(FHIR_RESOURCE_TYPES.map((type) => getFhirResourcesForPatient(patientId, type)));

  return buildPatientBundle([toFhirPatient(patient, identifiers), ...resourceLists.flat()]);
}
