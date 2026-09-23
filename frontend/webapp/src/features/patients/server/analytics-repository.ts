import "server-only";

import db from "@/config/database/db";

import type {
  CaseFunnelStage,
  CaseSegmentation,
  CaseTimingMetrics,
  DataQualityMetrics,
  FollowUpCompletionMetrics,
  HealthTimelineEntry,
  OverdueFollowUp,
} from "../analytics-types";

/**
 * Every function in this file is a read-only aggregation over tables
 * V0-V8 already built -- V9.1/V9.3/V9.4 need no new schema at all. Every
 * query returns counts/averages/rates, never a raw per-patient record
 * listing -- that's this feature's answer to spec V9.3's "keep analytics
 * permissions separate from raw record access": there's no finer-grained
 * role to gate on in this app (per the project owner: admin/superadmin or
 * "customer," nothing in between -- see V5.5's notes), so the separation
 * is enforced by what these queries can return, not by a different
 * permission check.
 */

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// --- V9.3 Case operations analytics --------------------------------------

export async function getCaseFunnelMetrics(): Promise<CaseFunnelStage[]> {
  const rows = await db<{ case_status: string; count: string }[]>`
    select case_status, count(*)::text as count from patient.medical_cases group by case_status
  `;
  return rows.map((r) => ({ caseStatus: r.case_status, count: Number(r.count) }));
}

export async function getCaseTimingMetrics(): Promise<CaseTimingMetrics> {
  const intakeToReady = await db<{ days: number }[]>`
    with intake_times as (
      select medical_case_id, min(occurred_at) as intake_at
      from patient.medical_case_status_history where to_status = 'intake'
      group by medical_case_id
    ), ready_times as (
      select medical_case_id, min(occurred_at) as ready_at
      from patient.medical_case_status_history where to_status = 'ready_for_review'
      group by medical_case_id
    )
    select extract(epoch from (r.ready_at - i.intake_at)) / 86400.0 as days
    from intake_times i join ready_times r on r.medical_case_id = i.medical_case_id and r.ready_at > i.intake_at
  `;
  const providerResponse = await db<{ days: number }[]>`
    select extract(epoch from (response_at - sent_at)) / 86400.0 as days
    from patient.medical_case_provider_submissions
    where response_at is not null
  `;

  const intakeDays = intakeToReady.map((r) => Number(r.days));
  return {
    avgIntakeToReadyDays: average(intakeDays),
    medianIntakeToReadyDays: median(intakeDays),
    avgProviderResponseDays: average(providerResponse.map((r) => Number(r.days))),
    casesMeasured: intakeDays.length,
  };
}

export async function getCaseSegmentation(): Promise<CaseSegmentation> {
  const [byOriginCountry, byCaseType] = await Promise.all([
    db<{ segment: string; count: string }[]>`
      select coalesce(origin_country, 'unknown') as segment, count(*)::text as count
      from patient.medical_cases group by origin_country order by count(*) desc
    `,
    db<{ segment: string; count: string }[]>`
      select case_type as segment, count(*)::text as count
      from patient.medical_cases group by case_type order by count(*) desc
    `,
  ]);
  return {
    byOriginCountry: byOriginCountry.map((r) => ({ segment: r.segment, count: Number(r.count) })),
    byCaseType: byCaseType.map((r) => ({ segment: r.segment, count: Number(r.count) })),
  };
}

export async function getFollowUpCompletionMetrics(): Promise<FollowUpCompletionMetrics> {
  const rows = await db<{ followup_status: string; count: string }[]>`
    select followup_status, count(*)::text as count from patient.medical_case_follow_ups group by followup_status
  `;
  const byStatus = Object.fromEntries(rows.map((r) => [r.followup_status, Number(r.count)]));
  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  const completed = byStatus.completed ?? 0;
  return {
    total,
    completed,
    missed: byStatus.missed ?? 0,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

// --- V9.2 Follow-up escalation -------------------------------------------

export async function getOverdueFollowUps(): Promise<OverdueFollowUp[]> {
  const rows = await db<any[]>`
    select f.id, f.medical_case_id, c.patient_id, p.first_name, p.last_name, f.scheduled_date,
           (current_date - f.scheduled_date) as days_overdue
    from patient.medical_case_follow_ups f
    join patient.medical_cases c on c.id = f.medical_case_id
    join patient.patients p on p.id = c.patient_id
    where f.followup_status = 'scheduled' and f.scheduled_date < current_date
    order by f.scheduled_date asc
    limit 100
  `;
  return rows.map((row) => ({
    id: row.id,
    medicalCaseId: row.medical_case_id,
    patientId: row.patient_id,
    patientName: `${row.first_name} ${row.last_name}`,
    scheduledDate: row.scheduled_date,
    daysOverdue: Number(row.days_overdue),
  }));
}

// --- V9.4 Data quality -----------------------------------------------------

export async function getDataQualityMetrics(): Promise<DataQualityMetrics> {
  const [[{ total_patients }], [{ pending }], [clinicalTotals], [codeTotals], [{ stale }]] = await Promise.all([
    db<{ total_patients: string }[]>`select count(*)::text as total_patients from patient.patients where status != 'merged'`,
    db<{ pending: string }[]>`select count(*)::text as pending from patient.patient_match_candidates where candidate_status = 'pending'`,
    db<{ total: string; unverified: string }[]>`
      select count(*)::text as total, count(*) filter (where verification_status = 'unverified')::text as unverified
      from (
        select verification_status from patient.patient_conditions where status = 'active'
        union all select verification_status from patient.patient_allergies where status = 'active'
        union all select verification_status from patient.patient_medications where status = 'active'
        union all select verification_status from patient.patient_procedures where status = 'active'
      ) records
    `,
    db<{ total: string; missing_code: string }[]>`
      select count(*)::text as total, count(*) filter (where code is null)::text as missing_code
      from (
        select code from patient.patient_conditions where status = 'active'
        union all select code from patient.clinical_observations where status = 'active'
      ) records
    `,
    db<{ stale: string }[]>`
      select count(*)::text as stale from patient.patient_contacts
      where valid_until is null and is_verified = false and create_date < now() - interval '365 days'
    `,
  ]);

  const totalPatients = Number(total_patients);
  const pendingDuplicateCandidates = Number(pending);
  const clinicalTotal = Number(clinicalTotals.total);
  const codeTotal = Number(codeTotals.total);

  return {
    totalPatients,
    pendingDuplicateCandidates,
    duplicateRate: totalPatients === 0 ? 0 : Math.round((pendingDuplicateCandidates / totalPatients) * 100),
    unverifiedClinicalRecordRate: clinicalTotal === 0 ? 0 : Math.round((Number(clinicalTotals.unverified) / clinicalTotal) * 100),
    recordsMissingCodeRate: codeTotal === 0 ? 0 : Math.round((Number(codeTotals.missing_code) / codeTotal) * 100),
    staleContactCount: Number(stale),
  };
}

// --- V9.1 Health timeline intelligence (per patient) ----------------------

export async function getHealthTimelineIntelligence(patientId: string): Promise<HealthTimelineEntry[]> {
  const [medications, procedures, statusChanges] = await Promise.all([
    db<any[]>`select id, name, start_date, end_date from patient.patient_medications where patient_id = ${patientId} and status != 'archived'`,
    db<any[]>`select id, procedure_name, performed_from from patient.patient_procedures where patient_id = ${patientId} and status != 'archived'`,
    db<any[]>`
      select h.id, h.to_status, h.occurred_at, c.title as case_title
      from patient.medical_case_status_history h
      join patient.medical_cases c on c.id = h.medical_case_id
      where c.patient_id = ${patientId}
    `,
  ]);

  const entries: HealthTimelineEntry[] = [];
  for (const m of medications) {
    if (m.start_date) entries.push({ kind: "medication_start", date: m.start_date, label: m.name, recordId: m.id });
    if (m.end_date) entries.push({ kind: "medication_stop", date: m.end_date, label: m.name, recordId: m.id });
  }
  for (const p of procedures) {
    entries.push({ kind: "procedure", date: p.performed_from, label: p.procedure_name, recordId: p.id });
  }
  for (const s of statusChanges) {
    entries.push({ kind: "case_status", date: s.occurred_at, label: `${s.case_title}: ${s.to_status}`, recordId: s.id });
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
