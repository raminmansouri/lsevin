import "server-only";

import db from "@/config/database/db";

import type { HealthIntakeRow, IntakeConditionAnswer, IntakeConditionKey, IntakeStep } from "../intake-schemas";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapIntake(row: any): HealthIntakeRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    heightCm: toNumber(row.height_cm),
    weightKg: toNumber(row.weight_kg),
    bloodType: row.blood_type,
    mainConcern: row.main_concern,
    concernBodyArea: row.concern_body_area,
    concernDuration: row.concern_duration,
    concernSeverity: toNumber(row.concern_severity),
    desiredTreatment: row.desired_treatment,
    conditionAnswers: (row.condition_answers ?? {}) as Partial<Record<IntakeConditionKey, IntakeConditionAnswer>>,
    pregnancyStatus: row.pregnancy_status,
    anesthesiaProblems: row.anesthesia_problems,
    anesthesiaDetails: row.anesthesia_details,
    takesBloodThinners: row.takes_blood_thinners,
    smoking: row.smoking,
    alcohol: row.alcohol,
    activityLevel: row.activity_level,
    completedSteps: (row.completed_steps ?? []) as IntakeStep[],
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    lastModifiedDate: new Date(row.last_modified_date).toISOString(),
  };
}

export async function getHealthIntake(patientId: string): Promise<HealthIntakeRow | null> {
  const rows = await db<any[]>`select * from patient.health_intakes where patient_id = ${patientId}`;
  return rows[0] ? mapIntake(rows[0]) : null;
}

/** Columns a step may write. Keys are the table's column names. */
export type HealthIntakePatch = Partial<{
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  main_concern: string | null;
  concern_body_area: string | null;
  concern_duration: string | null;
  concern_severity: number | null;
  desired_treatment: string | null;
  condition_answers: Record<string, IntakeConditionAnswer>;
  pregnancy_status: string | null;
  anesthesia_problems: string | null;
  anesthesia_details: string | null;
  takes_blood_thinners: string | null;
  smoking: string | null;
  alcohol: string | null;
  activity_level: string | null;
}>;

/**
 * Upserts the patient's single questionnaire row with the given columns and
 * marks `step` as done. Only the columns present in `patch` are touched, so
 * saving one step never blanks another step's answers.
 */
export async function saveHealthIntakeStep(input: {
  patientId: string;
  step: IntakeStep;
  patch: HealthIntakePatch;
  markComplete?: boolean;
  actorId: string;
}): Promise<HealthIntakeRow> {
  const patch: Record<string, unknown> = { ...input.patch };
  if ("condition_answers" in patch) patch.condition_answers = db.json(patch.condition_answers as never);
  const columns = Object.keys(patch);

  return db.begin(async (tx) => {
    await tx`
      insert into patient.health_intakes (patient_id, created_by, last_modified_by)
      values (${input.patientId}::uuid, ${input.actorId}::uuid, ${input.actorId}::uuid)
      on conflict (patient_id) do nothing
    `;
    const rows = await tx<any[]>`
      update patient.health_intakes set
        ${columns.length ? (tx as unknown as (row: Record<string, unknown>, keys: string[]) => never)(patch, columns) : tx`patient_id = patient_id`},
        completed_steps = case
          when ${input.step} = any(completed_steps) then completed_steps
          else array_append(completed_steps, ${input.step}::text)
        end,
        completed_at = case when ${input.markComplete ?? false} then coalesce(completed_at, now()) else completed_at end,
        version = version + 1,
        last_modified_date = now(),
        last_modified_by = ${input.actorId}::uuid
      where patient_id = ${input.patientId}::uuid
      returning *
    `;
    return mapIntake(rows[0]);
  });
}

const SELF_RECORD_TABLES = {
  condition: "patient_conditions",
  allergy: "patient_allergies",
  medication: "patient_medications",
  procedure: "patient_procedures",
} as const;

/**
 * Archives a clinical row the patient entered themselves. Scoped to the
 * patient and to source_type 'patient', so a customer can take back their
 * own answers but can never remove something the care team recorded.
 * Archive, not delete: the row and its history stay for the audit trail.
 */
export async function archiveSelfReportedRecord(
  kind: keyof typeof SELF_RECORD_TABLES,
  id: string,
  patientId: string
): Promise<boolean> {
  const table = SELF_RECORD_TABLES[kind];
  const rows = await db<{ id: string }[]>`
    update ${db(`patient.${table}`)}
    set status = 'archived', version = version + 1, last_modified_date = now()
    where id = ${id}::uuid and patient_id = ${patientId}::uuid
      and source_type = 'patient' and status != 'archived'
    returning id::text
  `;
  return rows.length > 0;
}

/** Self-reported rows of every list the questionnaire edits, for prefilling its steps. */
export async function listSelfEditableRecords(patientId: string) {
  const [conditions, allergies, medications, procedures] = await Promise.all([
    db<any[]>`
      select id::text, display_name as "name", notes, source_type as "sourceType"
      from patient.patient_conditions where patient_id = ${patientId}::uuid and status = 'active'
      order by create_date desc
    `,
    db<any[]>`
      select id::text, substance as "name", category, reaction, severity, source_type as "sourceType"
      from patient.patient_allergies where patient_id = ${patientId}::uuid and status = 'active'
      order by create_date desc
    `,
    db<any[]>`
      select id::text, name, dose, frequency, reason, source_type as "sourceType"
      from patient.patient_medications where patient_id = ${patientId}::uuid and status = 'active'
        and medication_status in ('active', 'planned', 'unknown')
      order by create_date desc
    `,
    db<any[]>`
      select id::text, procedure_name as "name", performed_from::text as "performedFrom", notes, source_type as "sourceType"
      from patient.patient_procedures where patient_id = ${patientId}::uuid and status = 'active'
      order by performed_from desc nulls last
    `,
  ]);
  return { conditions, allergies, medications, procedures } as {
    conditions: { id: string; name: string; notes: string | null; sourceType: string }[];
    allergies: { id: string; name: string | null; category: string; reaction: string | null; severity: string | null; sourceType: string }[];
    medications: { id: string; name: string; dose: string | null; frequency: string | null; reason: string | null; sourceType: string }[];
    procedures: { id: string; name: string; performedFrom: string | null; notes: string | null; sourceType: string }[];
  };
}
export type SelfEditableRecords = Awaited<ReturnType<typeof listSelfEditableRecords>>;

/**
 * Creates a fresh patient record for the signed-in account and links it as
 * "self", in one transaction. Never matches or attaches to an existing
 * patient: a brand-new, empty record grants access to nothing that already
 * exists, which is why this needs no ID number and no admin review (linking
 * to a record the care team created still goes through the link-request
 * review). If the account already has a self record, that one is returned.
 */
export async function createSelfPatientForAccount(input: {
  accountId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  sexAtBirth?: string;
}): Promise<{ patientId: string; created: boolean }> {
  return db.begin(async (tx) => {
    // Serialise concurrent "start" clicks for the same account.
    await tx`select pg_advisory_xact_lock(hashtext(${`patient-self:${input.accountId}`}))`;
    const [existing] = await tx<{ patientId: string }[]>`
      select patient_id::text as "patientId" from patient.account_patient_links
      where account_id = ${input.accountId}::uuid and relationship_type = 'self' and valid_until is null
      order by is_primary_profile desc, create_date asc
      limit 1
    `;
    if (existing) return { patientId: existing.patientId, created: false };

    const [patient] = await tx<{ id: string }[]>`
      insert into patient.patients (
        first_name, last_name, birth_date, birth_date_precision, sex_at_birth, created_by, last_modified_by
      ) values (
        ${input.firstName}, ${input.lastName}, ${input.birthDate ?? null},
        ${input.birthDate ? "day" : "unknown"}, ${input.sexAtBirth ?? null},
        ${input.accountId}::uuid, ${input.accountId}::uuid
      ) returning id::text
    `;
    await tx`
      insert into patient.account_patient_links (
        account_id, patient_id, relationship_type, access_role, is_primary_profile, created_by
      ) values (
        ${input.accountId}::uuid, ${patient.id}::uuid, 'self', 'full', true, ${input.accountId}::uuid
      )
    `;
    return { patientId: patient.id, created: true };
  });
}
