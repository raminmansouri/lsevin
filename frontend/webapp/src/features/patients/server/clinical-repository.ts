import "server-only";

import db from "@/config/database/db";

import type {
  PatientAllergyRow,
  PatientClinicalSummary,
  PatientConditionRow,
  PatientMedicationRow,
  PatientProcedureRow,
  PatientProductUsageRow,
  PatientSymptomRow,
} from "../clinical-types";

function mapCommon(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    encounterId: row.encounter_id,
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    sourceType: row.source_type,
    sourceId: row.source_id,
    verificationStatus: row.verification_status,
    providerId: row.provider_id,
    organizationId: row.organization_id,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
    version: row.version,
  };
}

function mapCondition(row: any): PatientConditionRow {
  return {
    ...mapCommon(row),
    code: row.code,
    codingSystem: row.coding_system,
    displayName: row.display_name,
    patientEnteredName: row.patient_entered_name,
    clinicalStatus: row.clinical_status,
    severity: row.severity,
    bodySite: row.body_site,
    onsetDate: row.onset_date,
    resolvedDate: row.resolved_date,
    notes: row.notes,
  };
}

function mapProcedure(row: any): PatientProcedureRow {
  return {
    ...mapCommon(row),
    procedureCode: row.procedure_code,
    procedureName: row.procedure_name,
    category: row.category,
    procedureStatus: row.procedure_status,
    performedFrom: row.performed_from,
    performedUntil: row.performed_until,
    bodySite: row.body_site,
    outcome: row.outcome,
    complications: row.complications,
    countryCode: row.country_code,
    city: row.city,
    notes: row.notes,
  };
}

function mapAllergy(row: any): PatientAllergyRow {
  return {
    ...mapCommon(row),
    substance: row.substance,
    allergenCode: row.allergen_code,
    category: row.category,
    reaction: row.reaction,
    severity: row.severity,
    criticality: row.criticality,
    onsetDate: row.onset_date,
    notes: row.notes,
  };
}

function mapMedication(row: any): PatientMedicationRow {
  return {
    ...mapCommon(row),
    medicationId: row.medication_id,
    name: row.name,
    genericName: row.generic_name,
    brandName: row.brand_name,
    dose: row.dose,
    doseUnit: row.dose_unit,
    route: row.route,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    medicationStatus: row.medication_status,
    reportedOrPrescribed: row.reported_or_prescribed,
    reason: row.reason,
    prescribedBy: row.prescribed_by,
    notes: row.notes,
  };
}

function mapProductUsage(row: any): PatientProductUsageRow {
  return {
    ...mapCommon(row),
    productId: row.product_id,
    shopOrderItemId: row.shop_order_item_id,
    productName: row.product_name,
    category: row.category,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    usageFrequency: row.usage_frequency,
    reason: row.reason,
    effectReported: row.effect_reported,
    adverseEffect: row.adverse_effect,
    recommendedBy: row.recommended_by,
    notes: row.notes,
  };
}

function mapSymptom(row: any): PatientSymptomRow {
  return {
    ...mapCommon(row),
    name: row.name,
    bodySite: row.body_site,
    severity: row.severity,
    patientDescription: row.patient_description,
    onsetDate: row.onset_date,
    resolvedDate: row.resolved_date,
  };
}

// --- Conditions --------------------------------------------------------

export async function addPatientCondition(input: {
  patientId: string;
  displayName: string;
  clinicalStatus?: string;
  severity?: string;
  bodySite?: string;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
  verificationStatus?: string;
  createdBy?: string | null;
}): Promise<PatientConditionRow> {
  const rows = await db<any[]>`
    insert into patient.patient_conditions (
      patient_id, display_name, clinical_status, severity, body_site, onset_date, resolved_date, notes,
      verification_status, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.displayName}, ${input.clinicalStatus ?? "active"}, ${input.severity ?? null},
      ${input.bodySite ?? null}, ${input.onsetDate ?? null}, ${input.resolvedDate ?? null}, ${input.notes ?? null},
      ${input.verificationStatus ?? "unverified"}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapCondition(rows[0]);
}

export async function listConditionsForPatient(patientId: string): Promise<PatientConditionRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_conditions where patient_id = ${patientId} and status != 'archived'
    order by coalesce(onset_date, create_date::date) desc
  `;
  return rows.map(mapCondition);
}

export async function archivePatientCondition(id: string): Promise<PatientConditionRow | null> {
  const rows = await db<any[]>`
    update patient.patient_conditions set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapCondition(rows[0]) : null;
}

// --- Procedures ----------------------------------------------------------

export async function addPatientProcedure(input: {
  patientId: string;
  procedureName: string;
  category?: string;
  procedureStatus?: string;
  performedFrom: string;
  performedUntil?: string;
  bodySite?: string;
  outcome?: string;
  countryCode?: string;
  city?: string;
  notes?: string;
  createdBy?: string | null;
}): Promise<PatientProcedureRow> {
  const rows = await db<any[]>`
    insert into patient.patient_procedures (
      patient_id, procedure_name, category, procedure_status, performed_from, performed_until,
      body_site, outcome, country_code, city, notes, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.procedureName}, ${input.category ?? null}, ${input.procedureStatus ?? "completed"},
      ${input.performedFrom}, ${input.performedUntil ?? null}, ${input.bodySite ?? null}, ${input.outcome ?? null},
      ${input.countryCode ?? null}, ${input.city ?? null}, ${input.notes ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapProcedure(rows[0]);
}

export async function listProceduresForPatient(patientId: string): Promise<PatientProcedureRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_procedures where patient_id = ${patientId} and status != 'archived'
    order by performed_from desc
  `;
  return rows.map(mapProcedure);
}

export async function archivePatientProcedure(id: string): Promise<PatientProcedureRow | null> {
  const rows = await db<any[]>`
    update patient.patient_procedures set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapProcedure(rows[0]) : null;
}

// --- Allergies -------------------------------------------------------------

export async function addPatientAllergy(input: {
  patientId: string;
  substance?: string;
  category: string;
  reaction?: string;
  severity?: string;
  criticality?: string;
  onsetDate?: string;
  notes?: string;
  createdBy?: string | null;
}): Promise<PatientAllergyRow> {
  const rows = await db<any[]>`
    insert into patient.patient_allergies (
      patient_id, substance, category, reaction, severity, criticality, onset_date, notes, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.substance ?? null}, ${input.category}, ${input.reaction ?? null}, ${input.severity ?? null},
      ${input.criticality ?? null}, ${input.onsetDate ?? null}, ${input.notes ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapAllergy(rows[0]);
}

export async function listAllergiesForPatient(patientId: string): Promise<PatientAllergyRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_allergies where patient_id = ${patientId} and status not in ('archived')
    order by (criticality is not null) desc, create_date desc
  `;
  return rows.map(mapAllergy);
}

export async function archivePatientAllergy(id: string): Promise<PatientAllergyRow | null> {
  // Verified allergies must never be silently deleted (spec V2.4) -- archiving
  // (not deleting) is the only removal path, and this still records who/when.
  const rows = await db<any[]>`
    update patient.patient_allergies set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapAllergy(rows[0]) : null;
}

// --- Medications -------------------------------------------------------

export async function addPatientMedication(input: {
  patientId: string;
  name: string;
  dose?: string;
  doseUnit?: string;
  route?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  medicationStatus?: string;
  reportedOrPrescribed?: string;
  reason?: string;
  notes?: string;
  createdBy?: string | null;
}): Promise<PatientMedicationRow> {
  const rows = await db<any[]>`
    insert into patient.patient_medications (
      patient_id, name, dose, dose_unit, route, frequency, start_date, end_date,
      medication_status, reported_or_prescribed, reason, notes, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.name}, ${input.dose ?? null}, ${input.doseUnit ?? null}, ${input.route ?? null},
      ${input.frequency ?? null}, ${input.startDate ?? null}, ${input.endDate ?? null},
      ${input.medicationStatus ?? "active"}, ${input.reportedOrPrescribed ?? "patient_reported"}, ${input.reason ?? null},
      ${input.notes ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapMedication(rows[0]);
}

export async function listMedicationsForPatient(patientId: string): Promise<PatientMedicationRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_medications where patient_id = ${patientId} and status != 'archived'
    order by (medication_status = 'active') desc, create_date desc
  `;
  return rows.map(mapMedication);
}

export async function archivePatientMedication(id: string): Promise<PatientMedicationRow | null> {
  const rows = await db<any[]>`
    update patient.patient_medications set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapMedication(rows[0]) : null;
}

// --- Product usage -------------------------------------------------------

export async function addPatientProductUsage(input: {
  patientId: string;
  productName: string;
  category: string;
  startedAt?: string;
  endedAt?: string;
  usageFrequency?: string;
  reason?: string;
  effectReported?: string;
  adverseEffect?: string;
  notes?: string;
  createdBy?: string | null;
}): Promise<PatientProductUsageRow> {
  const rows = await db<any[]>`
    insert into patient.patient_product_usage (
      patient_id, product_name, category, started_at, ended_at, usage_frequency, reason,
      effect_reported, adverse_effect, notes, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.productName}, ${input.category}, ${input.startedAt ?? null}, ${input.endedAt ?? null},
      ${input.usageFrequency ?? null}, ${input.reason ?? null}, ${input.effectReported ?? null}, ${input.adverseEffect ?? null},
      ${input.notes ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapProductUsage(rows[0]);
}

export async function listProductUsageForPatient(patientId: string): Promise<PatientProductUsageRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_product_usage where patient_id = ${patientId} and status != 'archived'
    order by create_date desc
  `;
  return rows.map(mapProductUsage);
}

export async function archivePatientProductUsage(id: string): Promise<PatientProductUsageRow | null> {
  const rows = await db<any[]>`
    update patient.patient_product_usage set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapProductUsage(rows[0]) : null;
}

// --- Symptoms --------------------------------------------------------------

export async function addPatientSymptom(input: {
  patientId: string;
  name: string;
  bodySite?: string;
  severity?: string;
  patientDescription?: string;
  onsetDate?: string;
  resolvedDate?: string;
  createdBy?: string | null;
}): Promise<PatientSymptomRow> {
  const rows = await db<any[]>`
    insert into patient.patient_symptoms (
      patient_id, name, body_site, severity, patient_description, onset_date, resolved_date, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.name}, ${input.bodySite ?? null}, ${input.severity ?? null}, ${input.patientDescription ?? null},
      ${input.onsetDate ?? null}, ${input.resolvedDate ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapSymptom(rows[0]);
}

export async function listSymptomsForPatient(patientId: string): Promise<PatientSymptomRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_symptoms where patient_id = ${patientId} and status != 'archived'
    order by coalesce(onset_date, create_date::date) desc
  `;
  return rows.map(mapSymptom);
}

export async function archivePatientSymptom(id: string): Promise<PatientSymptomRow | null> {
  const rows = await db<any[]>`
    update patient.patient_symptoms set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id} and status != 'archived' returning *
  `;
  return rows[0] ? mapSymptom(rows[0]) : null;
}

// --- Clinical summary (V2.8) ----------------------------------------------

export async function getPatientClinicalSummary(patientId: string): Promise<PatientClinicalSummary> {
  const [allergies, conditions, medications, procedures, symptoms] = await Promise.all([
    db<any[]>`
      select * from patient.patient_allergies
      where patient_id = ${patientId} and status = 'active' and category != 'no_known_allergies'
        and (criticality is not null or severity is not null)
      order by create_date desc limit 10
    `,
    db<any[]>`
      select * from patient.patient_conditions
      where patient_id = ${patientId} and status = 'active' and clinical_status = 'active'
      order by coalesce(onset_date, create_date::date) desc limit 10
    `,
    db<any[]>`
      select * from patient.patient_medications
      where patient_id = ${patientId} and status = 'active' and medication_status = 'active'
      order by create_date desc limit 10
    `,
    db<any[]>`
      select * from patient.patient_procedures
      where patient_id = ${patientId} and status = 'active'
      order by performed_from desc limit 5
    `,
    db<any[]>`
      select * from patient.patient_symptoms
      where patient_id = ${patientId} and status = 'active'
      order by coalesce(onset_date, create_date::date) desc limit 5
    `,
  ]);

  return {
    criticalAllergies: allergies.map(mapAllergy),
    activeConditions: conditions.map(mapCondition),
    currentMedications: medications.map(mapMedication),
    recentProcedures: procedures.map(mapProcedure),
    recentSymptoms: symptoms.map(mapSymptom),
  };
}
