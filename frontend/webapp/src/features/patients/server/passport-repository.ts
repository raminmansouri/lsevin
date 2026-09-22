import "server-only";

import db from "@/config/database/db";

import type { PatientPassportRow } from "../passport-types";
import { getPatientById, listContactsForPatient } from "./repository";
import { listAllergiesForPatient, listConditionsForPatient, listMedicationsForPatient, listProceduresForPatient } from "./clinical-repository";
import { listDiagnosticReportsForPatient, listImagingStudiesForPatient } from "./documents-repository";
import { exportFhirPatientBundle } from "./fhir-repository";

function mapPassport(row: any): PatientPassportRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    language: row.language,
    includedSections: row.included_sections ?? [],
    snapshot: row.snapshot ?? {},
    fhirBundle: row.fhir_bundle ?? {},
    generatedBy: row.generated_by,
    createdAt: row.create_date,
  };
}

/**
 * V7.4: builds the passport snapshot content. "Devices/implants" and
 * "immunizations" from the spec's selectable list are not available --
 * this build never implemented PatientDevice/PatientImmunization (spec
 * section 3's shared entities, never assigned to a specific spiral
 * version) -- so those two sections simply aren't offered as choices
 * (see PASSPORT_SECTIONS in ../passport-types.ts). Every other listed
 * section (demographics, allergies, medications, active conditions,
 * previous procedures, recent diagnostic results, imaging references,
 * emergency information) is real, live data.
 */
async function buildPassportSnapshot(patientId: string, sections: string[]): Promise<Record<string, unknown>> {
  const snapshot: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    verificationDisclaimer:
      "This summary may not represent the patient's complete medical history. Unverified or self-reported items are labeled as such in the source record.",
  };

  if (sections.includes("demographics")) snapshot.patient = await getPatientById(patientId);
  if (sections.includes("allergies")) snapshot.allergies = await listAllergiesForPatient(patientId);
  if (sections.includes("medications")) snapshot.medications = (await listMedicationsForPatient(patientId)).filter((m) => m.medicationStatus === "active");
  if (sections.includes("conditions")) snapshot.conditions = (await listConditionsForPatient(patientId)).filter((c) => c.clinicalStatus === "active");
  if (sections.includes("procedures")) snapshot.procedures = await listProceduresForPatient(patientId);
  if (sections.includes("diagnostic_results")) snapshot.diagnosticReports = (await listDiagnosticReportsForPatient(patientId)).slice(0, 20);
  if (sections.includes("imaging")) snapshot.imagingStudies = await listImagingStudiesForPatient(patientId);
  if (sections.includes("emergency_contact")) {
    snapshot.emergencyContacts = (await listContactsForPatient(patientId)).filter((c) => c.contactType === "emergency");
  }

  return snapshot;
}

export async function generatePatientPassport(input: {
  patientId: string;
  language: string;
  includedSections: string[];
  generatedBy?: string | null;
}): Promise<PatientPassportRow | null> {
  const patient = await getPatientById(input.patientId);
  if (!patient) return null;

  const [snapshot, fhirBundle] = await Promise.all([
    buildPassportSnapshot(input.patientId, input.includedSections),
    exportFhirPatientBundle(input.patientId),
  ]);

  const rows = await db<any[]>`
    insert into patient.patient_passports (patient_id, language, included_sections, snapshot, fhir_bundle, generated_by)
    values (${input.patientId}, ${input.language}, ${input.includedSections}, ${JSON.stringify(snapshot)}::jsonb, ${JSON.stringify(fhirBundle ?? {})}::jsonb, ${input.generatedBy ?? null})
    returning *
  `;
  return mapPassport(rows[0]);
}

export async function listPassportsForPatient(patientId: string): Promise<PatientPassportRow[]> {
  const rows = await db<any[]>`
    select id, patient_id, language, included_sections, generated_by, create_date from patient.patient_passports
    where patient_id = ${patientId}
    order by create_date desc
  `;
  // Snapshot/fhir_bundle are intentionally left out of the list query --
  // they can be large, and the list view never renders their contents.
  return rows.map((row) => mapPassport({ ...row, snapshot: {}, fhir_bundle: {} }));
}

export async function getPatientPassport(id: string): Promise<PatientPassportRow | null> {
  const rows = await db<any[]>`select * from patient.patient_passports where id = ${id}`;
  return rows[0] ? mapPassport(rows[0]) : null;
}
