import "server-only";

import db from "@/config/database/db";

import type { MergePreview, PatientMatchCandidateRow, PatientMergeRow, ReconciliationConflict } from "../identity-types";
import { scoreWeakMatch } from "../identity-matching";
import { getPatientById } from "./repository";

function mapCandidate(row: any): PatientMatchCandidateRow {
  return {
    id: row.id,
    patientAId: row.patient_a_id,
    patientBId: row.patient_b_id,
    matchScore: row.match_score,
    matchReasons: row.match_reasons ?? [],
    candidateStatus: row.candidate_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.create_date,
  };
}

function mapMerge(row: any): PatientMergeRow {
  return {
    id: row.id,
    survivingPatientId: row.surviving_patient_id,
    mergedPatientId: row.merged_patient_id,
    reason: row.reason,
    mergedBy: row.merged_by,
    mergedAt: row.merged_at,
    reversedBy: row.reversed_by,
    reversedAt: row.reversed_at,
  };
}

// --- V6.1/V6.2 Matching engine & candidates ---------------------------

/**
 * Weak-attribute scoring only (spec V6.1: "never automatically merge using
 * only weak attributes" -- this never merges anything, it only proposes a
 * reviewable candidate). Exact identifier matches are a separate, existing
 * mechanism (findPatientIdByIdentifier, V0.6) that links/blocks at creation
 * time rather than needing a candidate review step at all.
 *
 * Deliberately scoped as "check one patient against the rest," not a
 * full-database background sweep -- this codebase has no job queue/worker
 * to run an O(n^2) scan safely, and adding one is out of scope here.
 */
export async function scanForDuplicates(patientId: string, actorId?: string | null): Promise<PatientMatchCandidateRow[]> {
  const patient = await getPatientById(patientId);
  if (!patient) return [];

  const rows = await db<any[]>`
    select p.*,
      (lower(p.first_name) = lower(${patient.firstName}) and lower(p.last_name) = lower(${patient.lastName})) as name_match,
      (p.birth_date is not null and p.birth_date = ${patient.birthDate}::date) as dob_match,
      exists (
        select 1 from patient.patient_contacts c1
        join patient.patient_contacts c2 on lower(c1.value) = lower(c2.value)
        where c1.patient_id = ${patientId} and c2.patient_id = p.id and c1.valid_until is null and c2.valid_until is null
      ) as contact_match
    from patient.patients p
    where p.id != ${patientId} and p.status not in ('merged', 'archived')
      and (
        (lower(p.first_name) = lower(${patient.firstName}) and lower(p.last_name) = lower(${patient.lastName}))
        or (p.birth_date is not null and p.birth_date = ${patient.birthDate}::date)
      )
  `;

  const created: PatientMatchCandidateRow[] = [];
  for (const row of rows) {
    const { score, reasons } = scoreWeakMatch({
      nameMatch: Boolean(row.name_match),
      dobMatch: Boolean(row.dob_match),
      contactMatch: Boolean(row.contact_match),
    });
    if (score === 0) continue;

    const candidate = await recordMatchCandidate(patientId, row.id, score, reasons, actorId);
    if (candidate) created.push(candidate);
  }
  return created;
}

/** Always stores the pair with the lexicographically smaller id first, so
 * (a,b) and (b,a) are recognized as the same candidate (spec 0055's unique
 * constraint relies on this). Re-scanning an already-reviewed pair updates
 * the score/reasons in place rather than reopening a decided candidate. */
export async function recordMatchCandidate(
  patientId: string,
  otherPatientId: string,
  score: number,
  reasons: string[],
  actorId?: string | null
): Promise<PatientMatchCandidateRow | null> {
  const [a, b] = [patientId, otherPatientId].sort();
  const rows = await db<any[]>`
    insert into patient.patient_match_candidates (patient_a_id, patient_b_id, match_score, match_reasons)
    values (${a}, ${b}, ${score}, ${reasons})
    on conflict (patient_a_id, patient_b_id) do update
      set match_score = excluded.match_score, match_reasons = excluded.match_reasons
      where patient.patient_match_candidates.candidate_status = 'pending'
    returning *
  `;
  void actorId;
  return rows[0] ? mapCandidate(rows[0]) : null;
}

export async function listMatchCandidatesForPatient(patientId: string): Promise<PatientMatchCandidateRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_match_candidates
    where (patient_a_id = ${patientId} or patient_b_id = ${patientId}) and candidate_status = 'pending'
    order by match_score desc
  `;
  return rows.map(mapCandidate);
}

export async function reviewMatchCandidate(
  id: string,
  decision: "confirmed_same_person" | "confirmed_different" | "ignored",
  reviewerId: string
): Promise<PatientMatchCandidateRow | null> {
  const rows = await db<any[]>`
    update patient.patient_match_candidates
    set candidate_status = ${decision}, reviewed_by = ${reviewerId}, reviewed_at = now()
    where id = ${id} and candidate_status = 'pending'
    returning *
  `;
  return rows[0] ? mapCandidate(rows[0]) : null;
}

// --- V6.3/V6.4 Merge & unmerge -------------------------------------------

/** Direct `patient_id`-bearing tables reassigned on merge. Child tables that
 * only reference a case/document/encounter id (not patient_id directly)
 * follow automatically once their parent row moves -- no entry needed for
 * those (e.g. medical_case_requirements follows medical_case_id).
 * patient.audit_log is deliberately excluded: it's a historical record of
 * what happened to which patient_id at the time, not a live reference --
 * rewriting it on merge would falsify history. */
const MERGE_REASSIGN_TABLES = [
  "patient_contacts",
  "patient_addresses",
  "patient_conditions",
  "patient_procedures",
  "patient_allergies",
  "patient_medications",
  "patient_product_usage",
  "patient_symptoms",
  "clinical_documents",
  "lab_orders",
  "diagnostic_reports",
  "clinical_observations",
  "imaging_studies",
  "medical_cases",
  "clinical_encounters",
  "medical_case_packages",
  "patient_internal_notes",
  "patient_consents",
  "share_grants",
] as const;

async function countByPatientId(table: string, patientId: string): Promise<number> {
  const rows = await db<{ count: string }[]>`select count(*)::text as count from patient.${db(table)} where patient_id = ${patientId}`;
  return Number(rows[0]?.count ?? 0);
}

export async function previewMerge(survivingPatientId: string, mergedPatientId: string): Promise<MergePreview> {
  const affectedRecordCounts: Record<string, number> = {};
  for (const table of MERGE_REASSIGN_TABLES) {
    affectedRecordCounts[table] = await countByPatientId(table, mergedPatientId);
  }

  const [identifierConflicts] = await db<{ count: string }[]>`
    select count(*)::text as count from patient.patient_identifiers m
    where m.patient_id = ${mergedPatientId} and m.status = 'active'
      and exists (
        select 1 from patient.patient_identifiers s
        where s.patient_id = ${survivingPatientId} and s.status = 'active'
          and s.identifier_type = m.identifier_type
          and coalesce(s.issuing_country_code, '') = coalesce(m.issuing_country_code, '')
          and coalesce(s.issuing_authority, '') = coalesce(m.issuing_authority, '')
          and s.normalized_value_hash = m.normalized_value_hash
      )
  `;
  const [accountLinkConflicts] = await db<{ count: string }[]>`
    select count(*)::text as count from patient.account_patient_links m
    where m.patient_id = ${mergedPatientId} and m.valid_until is null
      and exists (
        select 1 from patient.account_patient_links s
        where s.patient_id = ${survivingPatientId} and s.valid_until is null and s.account_id = m.account_id
      )
  `;

  affectedRecordCounts.account_patient_links = await countByPatientId("account_patient_links", mergedPatientId);
  affectedRecordCounts.patient_identifiers = await countByPatientId("patient_identifiers", mergedPatientId);

  return {
    survivingPatientId,
    mergedPatientId,
    affectedRecordCounts,
    identifierConflicts: Number(identifierConflicts?.count ?? 0),
    activeAccountLinkConflicts: Number(accountLinkConflicts?.count ?? 0),
  };
}

export async function mergePatients(input: {
  survivingPatientId: string;
  mergedPatientId: string;
  reason: string;
  mergedBy?: string | null;
}): Promise<PatientMergeRow | "already_merged" | "not_found"> {
  const [survivor, merged] = await Promise.all([getPatientById(input.survivingPatientId), getPatientById(input.mergedPatientId)]);
  if (!survivor || !merged) return "not_found";
  if (survivor.status === "merged" || merged.status === "merged") return "already_merged";

  return db.begin(async (tx) => {
    const reassignedRecordIds: Record<string, string[]> = {};
    for (const table of MERGE_REASSIGN_TABLES) {
      const rows = await tx<{ id: string }[]>`select id from patient.${tx(table)} where patient_id = ${input.mergedPatientId}`;
      reassignedRecordIds[table] = rows.map((r) => r.id);
      if (rows.length > 0) {
        await tx`update patient.${tx(table)} set patient_id = ${input.survivingPatientId} where patient_id = ${input.mergedPatientId}`;
      }
    }

    // Identifiers: reassign all, but an identifier that collides with one
    // the survivor already has active can't stay 'active' too (unique
    // constraint) -- flip it to 'superseded' and remember which ids were
    // flipped so unmerge can restore exactly those.
    const conflictingIdentifiers = await tx<{ id: string }[]>`
      select m.id from patient.patient_identifiers m
      where m.patient_id = ${input.mergedPatientId} and m.status = 'active'
        and exists (
          select 1 from patient.patient_identifiers s
          where s.patient_id = ${input.survivingPatientId} and s.status = 'active'
            and s.identifier_type = m.identifier_type
            and coalesce(s.issuing_country_code, '') = coalesce(m.issuing_country_code, '')
            and coalesce(s.issuing_authority, '') = coalesce(m.issuing_authority, '')
            and s.normalized_value_hash = m.normalized_value_hash
        )
    `;
    const conflictingIdentifierIds = conflictingIdentifiers.map((r) => r.id);
    const allIdentifierIds = (
      await tx<{ id: string }[]>`select id from patient.patient_identifiers where patient_id = ${input.mergedPatientId}`
    ).map((r) => r.id);
    if (allIdentifierIds.length > 0) {
      await tx`update patient.patient_identifiers set patient_id = ${input.survivingPatientId} where patient_id = ${input.mergedPatientId}`;
    }
    if (conflictingIdentifierIds.length > 0) {
      await tx`update patient.patient_identifiers set status = 'superseded' where id = any(${conflictingIdentifierIds})`;
    }

    // Account links: same shape -- an active link the survivor already has
    // for the same account can't have a second active row after reassign.
    const conflictingLinks = await tx<{ id: string }[]>`
      select m.id from patient.account_patient_links m
      where m.patient_id = ${input.mergedPatientId} and m.valid_until is null
        and exists (
          select 1 from patient.account_patient_links s
          where s.patient_id = ${input.survivingPatientId} and s.valid_until is null and s.account_id = m.account_id
        )
    `;
    const conflictingLinkIds = conflictingLinks.map((r) => r.id);
    const allLinkIds = (
      await tx<{ id: string }[]>`select id from patient.account_patient_links where patient_id = ${input.mergedPatientId}`
    ).map((r) => r.id);
    if (allLinkIds.length > 0) {
      await tx`update patient.account_patient_links set patient_id = ${input.survivingPatientId} where patient_id = ${input.mergedPatientId}`;
    }
    if (conflictingLinkIds.length > 0) {
      await tx`update patient.account_patient_links set valid_until = now() where id = any(${conflictingLinkIds})`;
    }

    reassignedRecordIds.patient_identifiers = allIdentifierIds;
    reassignedRecordIds.account_patient_links = allLinkIds;

    await tx`update patient.patients set status = 'merged', last_modified_date = now() where id = ${input.mergedPatientId}`;

    const rows = await tx<any[]>`
      insert into patient.patient_merges (surviving_patient_id, merged_patient_id, reason, reassigned_record_ids, reassigned_conflicts, merged_by)
      values (
        ${input.survivingPatientId}, ${input.mergedPatientId}, ${input.reason},
        ${JSON.stringify(reassignedRecordIds)}::jsonb,
        ${JSON.stringify({ patient_identifiers: conflictingIdentifierIds, account_patient_links: conflictingLinkIds })}::jsonb,
        ${input.mergedBy ?? null}
      )
      returning *
    `;

    await tx`
      update patient.patient_match_candidates set candidate_status = 'merged'
      where (patient_a_id = ${input.survivingPatientId} and patient_b_id = ${input.mergedPatientId})
         or (patient_a_id = ${input.mergedPatientId} and patient_b_id = ${input.survivingPatientId})
    `;

    return mapMerge(rows[0]);
  });
}

export async function getPatientMerge(id: string): Promise<PatientMergeRow | null> {
  const rows = await db<any[]>`select * from patient.patient_merges where id = ${id}`;
  return rows[0] ? mapMerge(rows[0]) : null;
}

export async function listMergesForPatient(patientId: string): Promise<PatientMergeRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_merges
    where surviving_patient_id = ${patientId} or merged_patient_id = ${patientId}
    order by merged_at desc
  `;
  return rows.map(mapMerge);
}

/**
 * Reverses exactly the rows this merge moved (per reassigned_record_ids)
 * back to the merged patient, and exactly the status/valid_until flips this
 * merge caused (per reassigned_conflicts) -- never anything added to the
 * surviving patient afterward, which by definition wasn't part of this
 * merge (spec V6.4: "track pre-merge ownership... prevent irreversible
 * reassignment without audit information").
 */
export async function unmergePatients(mergeId: string, actorId?: string | null): Promise<PatientMergeRow | "not_found" | "already_reversed"> {
  const merge = await getPatientMerge(mergeId);
  if (!merge) return "not_found";
  if (merge.reversedAt) return "already_reversed";

  return db.begin(async (tx) => {
    const [row] = await tx<any[]>`select reassigned_record_ids, reassigned_conflicts from patient.patient_merges where id = ${mergeId}`;
    const recordIds: Record<string, string[]> = row.reassigned_record_ids ?? {};
    const conflicts: Record<string, string[]> = row.reassigned_conflicts ?? {};

    for (const [table, ids] of Object.entries(recordIds)) {
      if (!ids || ids.length === 0) continue;
      await tx`
        update patient.${tx(table)} set patient_id = ${merge.mergedPatientId}
        where id = any(${ids}) and patient_id = ${merge.survivingPatientId}
      `;
    }

    if (conflicts.patient_identifiers?.length) {
      await tx`update patient.patient_identifiers set status = 'active' where id = any(${conflicts.patient_identifiers})`;
    }
    if (conflicts.account_patient_links?.length) {
      await tx`update patient.account_patient_links set valid_until = null where id = any(${conflicts.account_patient_links})`;
    }

    await tx`update patient.patients set status = 'active', last_modified_date = now() where id = ${merge.mergedPatientId}`;

    const rows = await tx<any[]>`
      update patient.patient_merges set reversed_by = ${actorId ?? null}, reversed_at = now()
      where id = ${mergeId}
      returning *
    `;
    return mapMerge(rows[0]);
  });
}

// --- V6.5 Record reconciliation (scoped) -----------------------------
//
// Detection only, for the four clinical entities most likely to carry
// genuine duplicate/conflicting entries after a merge or a double-entry
// mistake. "Create a synthesized reconciled record" (the fourth reviewer
// option in the spec) is out of scope here -- it needs a per-field merge UI;
// what's implemented is the three outcomes that map onto existing status
// values: keep both (no-op, just audited), mark outdated (archive), mark
// entered in error.

async function findDuplicateActiveRows(
  table: "patient_conditions" | "patient_allergies" | "patient_medications" | "patient_procedures",
  nameColumn: string,
  patientId: string,
  recordType: ReconciliationConflict["recordType"]
): Promise<ReconciliationConflict[]> {
  const rows = await db<any[]>`
    select a.id as a_id, b.id as b_id, a.${db(nameColumn)} as label
    from patient.${db(table)} a
    join patient.${db(table)} b on a.patient_id = b.patient_id and lower(a.${db(nameColumn)}) = lower(b.${db(nameColumn)}) and a.id < b.id
    where a.patient_id = ${patientId} and a.status = 'active' and b.status = 'active'
  `;
  return rows.map((row) => ({
    recordType,
    recordAId: row.a_id,
    recordBId: row.b_id,
    label: row.label,
    reason: "duplicate_active_entry",
  }));
}

export async function findReconciliationConflicts(patientId: string): Promise<ReconciliationConflict[]> {
  const [conditions, allergies, medications, procedures] = await Promise.all([
    findDuplicateActiveRows("patient_conditions", "display_name", patientId, "condition"),
    findDuplicateActiveRows("patient_allergies", "substance", patientId, "allergy"),
    findDuplicateActiveRows("patient_medications", "name", patientId, "medication"),
    findDuplicateActiveRows("patient_procedures", "procedure_name", patientId, "procedure"),
  ]);
  return [...conditions, ...allergies, ...medications, ...procedures];
}

const RECONCILIATION_TABLES: Record<ReconciliationConflict["recordType"], string> = {
  condition: "patient_conditions",
  allergy: "patient_allergies",
  medication: "patient_medications",
  procedure: "patient_procedures",
};

export async function resolveReconciliationConflict(
  recordType: ReconciliationConflict["recordType"],
  discardId: string,
  action: "mark_outdated" | "entered_in_error"
): Promise<boolean> {
  const table = RECONCILIATION_TABLES[recordType];
  const status = action === "mark_outdated" ? "archived" : "entered_in_error";
  const rows = await db<{ id: string }[]>`
    update patient.${db(table)} set status = ${status} where id = ${discardId} and status = 'active' returning id
  `;
  return rows.length > 0;
}
