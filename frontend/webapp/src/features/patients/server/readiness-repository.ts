import "server-only";

import db from "@/config/database/db";

import type { CaseReadinessAlert } from "../ai-types";

/**
 * V8.5 Case Readiness Assistant. Deliberately rule-based, no AI involved --
 * the spec's own language ("detect," "suggest," "present as operational
 * assistance," "do not decide medical eligibility") describes exactly the
 * kind of check that doesn't need a model: missing/expired requirements and
 * duplicate documents are both already fully tracked by V3/V4 tables.
 */
export async function detectMissingOrExpiredRequirements(medicalCaseId: string): Promise<CaseReadinessAlert[]> {
  const rows = await db<any[]>`
    select id, title, requirement_status, expires_at from patient.medical_case_requirements
    where medical_case_id = ${medicalCaseId}
      and (
        requirement_status = 'missing'
        or (expires_at is not null and expires_at < current_date and requirement_status not in ('rejected'))
      )
  `;
  return rows.map((row) => ({
    alertType: row.requirement_status === "missing" ? ("missing_requirement" as const) : ("expired_requirement" as const),
    severity: row.requirement_status === "missing" ? ("info" as const) : ("warning" as const),
    label: row.title,
    recordId: row.id,
  }));
}

export async function detectDuplicateDocuments(patientId: string): Promise<CaseReadinessAlert[]> {
  const rows = await db<any[]>`
    select d.id, d.title from patient.clinical_documents d
    where d.patient_id = ${patientId} and d.status not in ('archived', 'superseded')
      and exists (
        select 1 from patient.clinical_documents d2
        where d2.patient_id = d.patient_id and d2.id != d.id and d2.status not in ('archived', 'superseded')
          and d2.original_name = d.original_name and d2.file_size = d.file_size
          and d2.original_name is not null
      )
  `;
  return rows.map((row) => ({
    alertType: "duplicate_document" as const,
    severity: "info" as const,
    label: row.title,
    recordId: row.id,
  }));
}

export async function getCaseReadinessAlerts(medicalCaseId: string, patientId: string): Promise<CaseReadinessAlert[]> {
  const [requirementAlerts, duplicateAlerts] = await Promise.all([
    detectMissingOrExpiredRequirements(medicalCaseId),
    detectDuplicateDocuments(patientId),
  ]);
  return [...requirementAlerts, ...duplicateAlerts];
}

/**
 * "Suggest relevant existing patient records for a case" (spec V8.5) --
 * a light heuristic, not medical judgment: the patient's most recently
 * active conditions and most recent documents, since those are the records
 * a coordinator assembling a case is most likely to want to attach next.
 * Never auto-attaches anything; the case-requirements UI still requires an
 * explicit action to actually link a document.
 */
export async function suggestRelevantRecordsForCase(patientId: string): Promise<{
  conditions: { id: string; displayName: string }[];
  documents: { id: string; title: string }[];
}> {
  const [conditions, documents] = await Promise.all([
    db<{ id: string; display_name: string }[]>`
      select id, display_name from patient.patient_conditions
      where patient_id = ${patientId} and status = 'active' and clinical_status = 'active'
      order by coalesce(onset_date, create_date::date) desc
      limit 5
    `,
    db<{ id: string; title: string }[]>`
      select id, title from patient.clinical_documents
      where patient_id = ${patientId} and status = 'active'
      order by create_date desc
      limit 5
    `,
  ]);
  return {
    conditions: conditions.map((c) => ({ id: c.id, displayName: c.display_name })),
    documents: documents.map((d) => ({ id: d.id, title: d.title })),
  };
}
