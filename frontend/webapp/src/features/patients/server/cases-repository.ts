import "server-only";

import db from "@/config/database/db";

import type {
  CaseReadiness,
  ClinicalEncounterRow,
  MedicalCaseFollowUpRow,
  MedicalCasePackageRow,
  MedicalCaseProviderSubmissionRow,
  MedicalCaseRequirementRow,
  MedicalCaseRow,
  MedicalCaseSecondOpinionRow,
  MedicalCaseStatus,
  MedicalCaseStatusHistoryRow,
  MedicalCaseTreatmentProposalRow,
} from "../cases-types";
import { isValidCaseTransition } from "../cases-transitions";
import { buildPatientRecordSnapshot } from "./snapshot";

function mapCase(row: any): MedicalCaseRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    caseNumber: row.case_number,
    caseType: row.case_type,
    specialty: row.specialty,
    serviceId: row.service_id,
    title: row.title,
    description: row.description,
    chiefComplaint: row.chief_complaint,
    reasonForCare: row.reason_for_care,
    caseStatus: row.case_status,
    priority: row.priority,
    originCountry: row.origin_country,
    originCity: row.origin_city,
    desiredCountry: row.desired_country,
    desiredCity: row.desired_city,
    assignedCoordinatorId: row.assigned_coordinator_id,
    primaryProviderId: row.primary_provider_id,
    primaryOrganizationId: row.primary_organization_id,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

function mapStatusHistory(row: any): MedicalCaseStatusHistoryRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorId: row.actor_id,
    note: row.note,
    occurredAt: row.occurred_at,
  };
}

function mapEncounter(row: any): ClinicalEncounterRow {
  return {
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
  };
}

function mapRequirement(row: any): MedicalCaseRequirementRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    requirementType: row.requirement_type,
    title: row.title,
    description: row.description,
    requirementStatus: row.requirement_status,
    expiresAt: row.expires_at,
    fulfilledDocumentId: row.fulfilled_document_id,
    createdAt: row.create_date,
  };
}

function mapPackage(row: any): MedicalCasePackageRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    patientId: row.patient_id,
    includedScopes: row.included_scopes ?? [],
    snapshot: row.snapshot ?? {},
    generatedBy: row.generated_by,
    createdAt: row.create_date,
  };
}

function mapSubmission(row: any): MedicalCaseProviderSubmissionRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    providerId: row.provider_id,
    organizationId: row.organization_id,
    sentAt: row.sent_at,
    responseStatus: row.response_status,
    responseAt: row.response_at,
    attachments: row.attachments ?? [],
    providerNotes: row.provider_notes,
    createdAt: row.create_date,
  };
}

function mapProposal(row: any): MedicalCaseTreatmentProposalRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    diagnosis: row.diagnosis,
    suggestedProcedure: row.suggested_procedure,
    treatmentPlan: row.treatment_plan,
    estimatedStayDays: row.estimated_stay_days,
    estimatedTreatmentDuration: row.estimated_treatment_duration,
    priceQuoteReference: row.price_quote_reference,
    providerId: row.provider_id,
    validUntil: row.valid_until,
    supportingDocuments: row.supporting_documents ?? [],
    proposalStatus: row.proposal_status,
    createdAt: row.create_date,
  };
}

function mapSecondOpinion(row: any): MedicalCaseSecondOpinionRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    providerId: row.provider_id,
    relatedDocuments: row.related_documents ?? [],
    opinionDate: row.opinion_date,
    conclusion: row.conclusion,
    createdAt: row.create_date,
  };
}

function mapFollowUp(row: any): MedicalCaseFollowUpRow {
  return {
    id: row.id,
    medicalCaseId: row.medical_case_id,
    encounterId: row.encounter_id,
    scheduledDate: row.scheduled_date,
    requiredItems: row.required_items,
    patientReportedOutcome: row.patient_reported_outcome,
    providerNotes: row.provider_notes,
    followupStatus: row.followup_status,
    createdAt: row.create_date,
  };
}

// --- Medical cases -----------------------------------------------------

export async function createMedicalCase(input: {
  patientId: string;
  caseType: string;
  specialty?: string;
  title: string;
  description?: string;
  chiefComplaint?: string;
  priority?: string;
  originCountry?: string;
  originCity?: string;
  desiredCountry?: string;
  desiredCity?: string;
  createdBy?: string | null;
}): Promise<MedicalCaseRow> {
  const rows = await db<any[]>`
    insert into patient.medical_cases (
      patient_id, case_type, specialty, title, description, chief_complaint, priority,
      origin_country, origin_city, desired_country, desired_city, created_by, last_modified_by
    ) values (
      ${input.patientId}, ${input.caseType}, ${input.specialty ?? null}, ${input.title}, ${input.description ?? null},
      ${input.chiefComplaint ?? null}, ${input.priority ?? "normal"}, ${input.originCountry ?? null}, ${input.originCity ?? null},
      ${input.desiredCountry ?? null}, ${input.desiredCity ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  const created = mapCase(rows[0]);
  await db`
    insert into patient.medical_case_status_history (medical_case_id, from_status, to_status, actor_id)
    values (${created.id}, null, ${created.caseStatus}, ${input.createdBy ?? null})
  `;
  return created;
}

export async function listCasesForPatient(patientId: string): Promise<MedicalCaseRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_cases where patient_id = ${patientId} order by create_date desc
  `;
  return rows.map(mapCase);
}

export async function getMedicalCase(id: string): Promise<MedicalCaseRow | null> {
  const rows = await db<any[]>`select * from patient.medical_cases where id = ${id}`;
  return rows[0] ? mapCase(rows[0]) : null;
}

/** Returns null if the transition isn't permitted from the case's current
 * status -- the caller distinguishes that from "not found." */
export async function transitionCaseStatus(
  medicalCaseId: string,
  toStatus: MedicalCaseStatus,
  actorId: string | null,
  note?: string
): Promise<MedicalCaseRow | null | "invalid_transition"> {
  const current = await getMedicalCase(medicalCaseId);
  if (!current) return null;
  if (!isValidCaseTransition(current.caseStatus, toStatus)) return "invalid_transition";

  return db.begin(async (tx) => {
    const rows = await tx<any[]>`
      update patient.medical_cases set
        case_status = ${toStatus},
        closed_at = case when ${toStatus} in ('completed', 'cancelled') then now() else closed_at end,
        last_modified_date = now(),
        last_modified_by = ${actorId}
      where id = ${medicalCaseId}
      returning *
    `;
    await tx`
      insert into patient.medical_case_status_history (medical_case_id, from_status, to_status, actor_id, note)
      values (${medicalCaseId}, ${current.caseStatus}, ${toStatus}, ${actorId}, ${note ?? null})
    `;
    return mapCase(rows[0]);
  });
}

export async function listCaseStatusHistory(medicalCaseId: string): Promise<MedicalCaseStatusHistoryRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_status_history where medical_case_id = ${medicalCaseId} order by occurred_at desc
  `;
  return rows.map(mapStatusHistory);
}

// --- Clinical encounters -----------------------------------------------

export async function addClinicalEncounter(input: {
  patientId: string;
  medicalCaseId?: string;
  encounterType: string;
  startedAt: string;
  reason?: string;
  summary?: string;
  createdBy?: string | null;
}): Promise<ClinicalEncounterRow> {
  const rows = await db<any[]>`
    insert into patient.clinical_encounters (patient_id, medical_case_id, encounter_type, started_at, reason, summary, created_by)
    values (${input.patientId}, ${input.medicalCaseId ?? null}, ${input.encounterType}, ${input.startedAt}, ${input.reason ?? null}, ${input.summary ?? null}, ${input.createdBy ?? null})
    returning *
  `;
  return mapEncounter(rows[0]);
}

export async function listEncountersForCase(medicalCaseId: string): Promise<ClinicalEncounterRow[]> {
  const rows = await db<any[]>`
    select * from patient.clinical_encounters where medical_case_id = ${medicalCaseId} order by started_at desc
  `;
  return rows.map(mapEncounter);
}

// --- Case requirements / readiness ----------------------------------------

export async function addCaseRequirement(input: {
  medicalCaseId: string;
  requirementType: string;
  title: string;
  description?: string;
  expiresAt?: string;
  createdBy?: string | null;
}): Promise<MedicalCaseRequirementRow> {
  const rows = await db<any[]>`
    insert into patient.medical_case_requirements (medical_case_id, requirement_type, title, description, expires_at, created_by)
    values (${input.medicalCaseId}, ${input.requirementType}, ${input.title}, ${input.description ?? null}, ${input.expiresAt ?? null}, ${input.createdBy ?? null})
    returning *
  `;
  return mapRequirement(rows[0]);
}

export async function listRequirementsForCase(medicalCaseId: string): Promise<MedicalCaseRequirementRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_requirements where medical_case_id = ${medicalCaseId} order by create_date asc
  `;
  return rows.map(mapRequirement);
}

export async function updateRequirementStatus(
  id: string,
  requirementStatus: string,
  fulfilledDocumentId?: string
): Promise<MedicalCaseRequirementRow | null> {
  const rows = await db<any[]>`
    update patient.medical_case_requirements set
      requirement_status = ${requirementStatus},
      fulfilled_document_id = coalesce(${fulfilledDocumentId ?? null}, fulfilled_document_id),
      last_modified_date = now()
    where id = ${id}
    returning *
  `;
  return rows[0] ? mapRequirement(rows[0]) : null;
}

/** V4.4: display-only readiness percentage -- "received" and "accepted" both
 * count as satisfied; never presented as medical eligibility. */
export function computeCaseReadiness(requirements: MedicalCaseRequirementRow[]): CaseReadiness {
  const total = requirements.length;
  const satisfied = requirements.filter((r) => r.requirementStatus === "received" || r.requirementStatus === "accepted").length;
  return { total, satisfied, percent: total === 0 ? 0 : Math.round((satisfied / total) * 100) };
}

// --- Provider medical package (V4.5) --------------------------------------
//
// PDF generation is deliberately out of scope for this pass: it would need
// a new PDF-rendering dependency, and this codebase's convention (see
// CLAUDE.md) is to not add packages without explicit sign-off. The
// structured JSON snapshot below satisfies "store package snapshot, record
// exact records/versions included" on its own -- a PDF export can render
// from this same snapshot later without changing its shape.

export async function generateCasePackage(input: {
  medicalCaseId: string;
  patientId: string;
  includedScopes: string[];
  generatedBy?: string | null;
}): Promise<MedicalCasePackageRow> {
  const snapshot = await buildPatientRecordSnapshot(input.patientId, input.includedScopes);

  const rows = await db<any[]>`
    insert into patient.medical_case_packages (medical_case_id, patient_id, included_scopes, snapshot, generated_by)
    values (${input.medicalCaseId}, ${input.patientId}, ${input.includedScopes}, ${JSON.stringify(snapshot)}::jsonb, ${input.generatedBy ?? null})
    returning *
  `;
  return mapPackage(rows[0]);
}

export async function listPackagesForCase(medicalCaseId: string): Promise<MedicalCasePackageRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_packages where medical_case_id = ${medicalCaseId} order by create_date desc
  `;
  return rows.map(mapPackage);
}

// --- Provider submissions --------------------------------------------------

export async function addProviderSubmission(input: {
  medicalCaseId: string;
  providerId: string;
  providerNotes?: string;
  createdBy?: string | null;
}): Promise<MedicalCaseProviderSubmissionRow> {
  const rows = await db<any[]>`
    insert into patient.medical_case_provider_submissions (medical_case_id, provider_id, provider_notes, created_by)
    values (${input.medicalCaseId}, ${input.providerId}, ${input.providerNotes ?? null}, ${input.createdBy ?? null})
    returning *
  `;
  return mapSubmission(rows[0]);
}

export async function listSubmissionsForCase(medicalCaseId: string): Promise<MedicalCaseProviderSubmissionRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_provider_submissions where medical_case_id = ${medicalCaseId} order by sent_at desc
  `;
  return rows.map(mapSubmission);
}

export async function updateSubmissionResponse(
  id: string,
  responseStatus: string,
  providerNotes?: string
): Promise<MedicalCaseProviderSubmissionRow | null> {
  const rows = await db<any[]>`
    update patient.medical_case_provider_submissions set
      response_status = ${responseStatus}, response_at = now(),
      provider_notes = coalesce(${providerNotes ?? null}, provider_notes)
    where id = ${id}
    returning *
  `;
  return rows[0] ? mapSubmission(rows[0]) : null;
}

// --- Treatment proposals -----------------------------------------------

export async function addTreatmentProposal(input: {
  medicalCaseId: string;
  diagnosis?: string;
  suggestedProcedure?: string;
  treatmentPlan?: string;
  estimatedStayDays?: number;
  priceQuoteReference?: string;
  validUntil?: string;
  createdBy?: string | null;
}): Promise<MedicalCaseTreatmentProposalRow> {
  const rows = await db<any[]>`
    insert into patient.medical_case_treatment_proposals (
      medical_case_id, diagnosis, suggested_procedure, treatment_plan, estimated_stay_days,
      price_quote_reference, valid_until, created_by
    ) values (
      ${input.medicalCaseId}, ${input.diagnosis ?? null}, ${input.suggestedProcedure ?? null}, ${input.treatmentPlan ?? null},
      ${input.estimatedStayDays ?? null}, ${input.priceQuoteReference ?? null}, ${input.validUntil ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapProposal(rows[0]);
}

export async function listProposalsForCase(medicalCaseId: string): Promise<MedicalCaseTreatmentProposalRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_treatment_proposals where medical_case_id = ${medicalCaseId} order by create_date desc
  `;
  return rows.map(mapProposal);
}

// --- Second opinions -------------------------------------------------------

export async function addSecondOpinion(input: {
  medicalCaseId: string;
  providerId: string;
  opinionDate: string;
  conclusion: string;
  createdBy?: string | null;
}): Promise<MedicalCaseSecondOpinionRow> {
  const rows = await db<any[]>`
    insert into patient.medical_case_second_opinions (medical_case_id, provider_id, opinion_date, conclusion, created_by)
    values (${input.medicalCaseId}, ${input.providerId}, ${input.opinionDate}, ${input.conclusion}, ${input.createdBy ?? null})
    returning *
  `;
  return mapSecondOpinion(rows[0]);
}

export async function listSecondOpinionsForCase(medicalCaseId: string): Promise<MedicalCaseSecondOpinionRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_second_opinions where medical_case_id = ${medicalCaseId} order by opinion_date desc
  `;
  return rows.map(mapSecondOpinion);
}

// --- Follow-ups --------------------------------------------------------

export async function addFollowUp(input: {
  medicalCaseId: string;
  scheduledDate: string;
  requiredItems?: string;
  providerNotes?: string;
  createdBy?: string | null;
}): Promise<MedicalCaseFollowUpRow> {
  const rows = await db<any[]>`
    insert into patient.medical_case_follow_ups (medical_case_id, scheduled_date, required_items, provider_notes, created_by)
    values (${input.medicalCaseId}, ${input.scheduledDate}, ${input.requiredItems ?? null}, ${input.providerNotes ?? null}, ${input.createdBy ?? null})
    returning *
  `;
  return mapFollowUp(rows[0]);
}

export async function listFollowUpsForCase(medicalCaseId: string): Promise<MedicalCaseFollowUpRow[]> {
  const rows = await db<any[]>`
    select * from patient.medical_case_follow_ups where medical_case_id = ${medicalCaseId} order by scheduled_date desc
  `;
  return rows.map(mapFollowUp);
}

export async function updateFollowUpStatus(id: string, followupStatus: string): Promise<MedicalCaseFollowUpRow | null> {
  const rows = await db<any[]>`
    update patient.medical_case_follow_ups set followup_status = ${followupStatus}, last_modified_date = now()
    where id = ${id}
    returning *
  `;
  return rows[0] ? mapFollowUp(rows[0]) : null;
}
