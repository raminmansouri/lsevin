import "server-only";

import db from "@/config/database/db";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";
import { createSelfPatientForAccount } from "@/features/patients/server/intake-repository";

import type { RecordSharePart } from "../patient-booking-types";

/**
 * Video consultation <-> health record (migration 0124). Callers check
 * recordShareReady() first: before that migration none of these columns exist.
 */

/**
 * The account's own health record, made from the booking form when the account has none yet.
 * Same rule as "start my health record": it only ever creates a brand-new empty record, so it
 * grants access to nothing that already exists.
 */
export async function ensureRecordForBooking(input: {
  accountId: string;
  patientName: string;
  patientGender: "male" | "female" | "other" | null;
}): Promise<string> {
  const parts = input.patientName.trim().split(/\s+/);
  const firstName = parts[0] ?? input.patientName.trim();
  const lastName = parts.slice(1).join(" ") || "-";
  const { patientId, created } = await createSelfPatientForAccount({
    accountId: input.accountId,
    firstName,
    lastName,
    sexAtBirth: input.patientGender === "male" || input.patientGender === "female" ? input.patientGender : undefined,
  });
  if (created) {
    await recordPatientAuditEvent({
      actorUserId: input.accountId,
      action: "patient_created",
      entityType: "patient",
      entityId: patientId,
      metadata: { selfService: true, source: "video_consultation_booking" },
    });
    await recordPatientAuditEvent({
      actorUserId: input.accountId,
      action: "account_linked",
      entityType: "patient",
      entityId: patientId,
      metadata: { accountId: input.accountId, relationshipType: "self", selfService: true },
    });
  }
  return patientId;
}

export async function recordShareAudit(input: {
  accountId: string;
  patientId: string;
  sessionId: string;
  action: "consultation_record_shared" | "consultation_record_share_revoked";
  scope: string[];
}) {
  await recordPatientAuditEvent({
    actorUserId: input.accountId,
    action: input.action,
    entityType: "patient",
    entityId: input.patientId,
    metadata: { videoSessionId: input.sessionId, scope: input.scope },
    purpose: "video_consultation",
  });
}

export type SessionRecordShare = {
  scope: RecordSharePart[];
  /** When the doctor's access ends (21 days after the call). */
  expiresAt: string;
  revoked: boolean;
  /** Whether the doctor can open it right now: paid, not revoked, not expired. */
  active: boolean;
};

/** What the patient shared on one of their own sessions, or null when nothing was. */
export async function getRecordShareForSession(userId: string, sessionId: string): Promise<SessionRecordShare | null> {
  const rows = await db<{ scope: string[]; expires_at: Date; revoked: boolean; active: boolean }[]>`
    select s.record_share_scope as scope,
      consultation.fn_record_share_expires_at(s.scheduled_at, s.duration_minutes, s.ended_at) as expires_at,
      (s.record_share_revoked_at is not null) as revoked,
      (s.record_share_revoked_at is null
        and s.status in ('scheduled', 'in_progress', 'completed')
        and now() < consultation.fn_record_share_expires_at(s.scheduled_at, s.duration_minutes, s.ended_at)) as active
    from consultation.video_sessions s
    where s.id = ${sessionId}::uuid and s.patient_user_id = ${userId}::uuid
      and cardinality(s.record_share_scope) > 0
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    scope: row.scope as RecordSharePart[],
    expiresAt: new Date(row.expires_at).toISOString(),
    revoked: row.revoked,
    active: row.active,
  };
}

/** Stops the doctor seeing the record for this session. Only the session's own patient can. */
export async function revokeRecordShare(userId: string, sessionId: string): Promise<boolean> {
  const rows = await db<{ patient_id: string | null; scope: string[] }[]>`
    update consultation.video_sessions
       set record_share_revoked_at = now()
     where id = ${sessionId}::uuid and patient_user_id = ${userId}::uuid
       and record_share_revoked_at is null and cardinality(record_share_scope) > 0
    returning record_patient_id::text as patient_id, record_share_scope as scope
  `;
  const row = rows[0];
  if (!row) return false;
  if (row.patient_id) {
    await recordShareAudit({
      accountId: userId,
      patientId: row.patient_id,
      sessionId,
      action: "consultation_record_share_revoked",
      scope: row.scope,
    });
  }
  return true;
}

export type ConsultationVisit = {
  id: string;
  startedAt: string;
  doctorNameFa: string | null;
  doctorNameEn: string | null;
  reason: string | null;
  advice: string | null;
  nextSteps: string | null;
  suggestion: string | null;
  summary: string | null;
};

/** The video consultations filed in this patient's record, with the doctor's summary. */
export async function listConsultationVisits(patientId: string): Promise<ConsultationVisit[]> {
  return db<ConsultationVisit[]>`
    select e.id::text as id, e.started_at::text as "startedAt",
      vd.name_fa as "doctorNameFa", vd.name_en as "doctorNameEn",
      e.reason, e.summary,
      nullif(btrim(s.summary_advice), '') as advice,
      nullif(btrim(s.summary_next_steps), '') as "nextSteps",
      nullif(btrim(s.summary_suggestion), '') as suggestion
    from patient.clinical_encounters e
    left join consultation.video_sessions s on s.record_encounter_id = e.id
    left join consultation.video_doctors vd on vd.id = s.doctor_id
    where e.patient_id = ${patientId}::uuid and e.encounter_type = 'video_consultation'
    order by e.started_at desc
    limit 50
  `;
}
