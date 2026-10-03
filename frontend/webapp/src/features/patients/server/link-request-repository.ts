import "server-only";

import db from "@/config/database/db";

import type {
  AccountLinkRequestRow,
  AccountLinkRequestWithMatch,
} from "../link-request-types";
import {
  hashIdentifierValue,
  maskIdentifierValue,
  normalizeIdentifierValue,
} from "./crypto";

function mapRequest(row: any): AccountLinkRequestRow {
  return {
    id: row.id,
    accountId: row.account_id,
    relationshipType: row.relationship_type,
    identifierType: row.identifier_type,
    identifierValueMasked: row.identifier_value_masked,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    matchedPatientId: row.matched_patient_id,
    requestStatus: row.request_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    createdAt: row.create_date,
  };
}

/** Spec V0.6, exact-match branch, verified only: does a *verified*
 * identifier with this type/normalized value already exist? Deliberately
 * separate from repository.ts's findPatientIdByIdentifier, which matches
 * any active identifier regardless of verification -- that function backs
 * the admin creation workflow, where a human is already in the loop
 * deciding what to do with the match. Here, a match is what silently
 * pre-fills matched_patient_id for a request an admin hasn't looked at
 * yet, so it has to be held to the higher bar. */
async function findVerifiedPatientIdByIdentifier(
  identifierType: string,
  value: string
): Promise<string | null> {
  const normalizedHash = hashIdentifierValue(normalizeIdentifierValue(value));
  const rows = await db<{ patient_id: string }[]>`
    select patient_id from patient.patient_identifiers
    where identifier_type = ${identifierType} and normalized_value_hash = ${normalizedHash}
      and is_verified = true and status = 'active'
    limit 1
  `;
  return rows[0]?.patient_id ?? null;
}

export async function createAccountLinkRequest(input: {
  accountId: string;
  relationshipType: string;
  identifierType: string;
  identifierValue: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
}): Promise<AccountLinkRequestRow> {
  const matchedPatientId = await findVerifiedPatientIdByIdentifier(
    input.identifierType,
    input.identifierValue
  );
  const rows = await db<any[]>`
    insert into patient.account_link_requests (
      account_id, relationship_type, identifier_type, identifier_value_hash, identifier_value_masked,
      first_name, last_name, birth_date, matched_patient_id
    ) values (
      ${input.accountId}, ${input.relationshipType}, ${input.identifierType},
      ${hashIdentifierValue(input.identifierValue)}, ${maskIdentifierValue(input.identifierValue)},
      ${input.firstName}, ${input.lastName}, ${input.birthDate ?? null}, ${matchedPatientId}
    )
    returning *
  `;
  return mapRequest(rows[0]);
}

export async function listRequestsForAccount(
  accountId: string
): Promise<AccountLinkRequestRow[]> {
  const rows = await db<any[]>`
    select * from patient.account_link_requests where account_id = ${accountId} order by create_date desc
  `;
  return rows.map(mapRequest);
}

export async function listPendingRequestsWithMatch(): Promise<
  AccountLinkRequestWithMatch[]
> {
  const rows = await db<any[]>`
    select r.*, trim(concat_ws(' ', p.first_name, p.last_name)) as matched_patient_name
    from patient.account_link_requests r
    left join patient.patients p on p.id = r.matched_patient_id
    where r.request_status = 'pending'
    order by r.create_date asc
  `;
  return rows.map((row) => ({
    ...mapRequest(row),
    matchedPatientName: row.matched_patient_name ?? null,
  }));
}

export async function getAccountLinkRequest(
  id: string
): Promise<AccountLinkRequestRow | null> {
  const rows = await db<
    any[]
  >`select * from patient.account_link_requests where id = ${id}`;
  return rows[0] ? mapRequest(rows[0]) : null;
}

export async function resolveAccountLinkRequest(input: {
  id: string;
  status: "approved" | "rejected";
  reviewedBy: string;
  reviewNotes?: string;
}): Promise<AccountLinkRequestRow | null> {
  const rows = await db<any[]>`
    update patient.account_link_requests
    set request_status = ${input.status}, reviewed_by = ${input.reviewedBy}, reviewed_at = now(),
        review_notes = ${input.reviewNotes ?? null}, last_modified_date = now()
    where id = ${input.id} and request_status = 'pending'
    returning *
  `;
  return rows[0] ? mapRequest(rows[0]) : null;
}

/**
 * Creates an empty patient profile for a reviewed `self` request that has no
 * existing identifier match, then links only the requesting account to that
 * new profile. This is deliberately admin-only at the action layer: a customer
 * can request the operation, but cannot use it to gain access to an existing
 * patient record.
 */
export async function createPatientForSelfLinkRequest(input: {
  id: string;
  reviewedBy: string;
  accessRole: "full" | "limited" | "view_only";
}): Promise<{ request: AccountLinkRequestRow; patientId: string } | null> {
  return db.begin(async (tx) => {
    const [existing] = await tx<any[]>`
      select * from patient.account_link_requests
      where id = ${input.id} and request_status = 'pending'
        and relationship_type = 'self' and matched_patient_id is null
      for update
    `;
    if (!existing) return null;

    const [currentSelfLink] = await tx<{ patientId: string }[]>`
      select patient_id::text as "patientId"
      from patient.account_patient_links
      where account_id = ${existing.account_id}::uuid
        and relationship_type = 'self' and valid_until is null
      order by is_primary_profile desc, create_date asc
      limit 1
      for update
    `;
    if (currentSelfLink) {
      const [updated] = await tx<any[]>`
        update patient.account_link_requests
        set matched_patient_id = ${currentSelfLink.patientId}::uuid,
            request_status = 'approved', reviewed_by = ${input.reviewedBy}::uuid,
            reviewed_at = now(), review_notes = 'existing_self_profile_linked',
            last_modified_date = now()
        where id = ${input.id}
        returning *
      `;
      return {
        request: mapRequest(updated),
        patientId: currentSelfLink.patientId,
      };
    }

    const [patient] = await tx<{ id: string }[]>`
      insert into patient.patients (
        first_name, last_name, birth_date, birth_date_precision,
        created_by, last_modified_by
      ) values (
        ${existing.first_name}, ${existing.last_name}, ${existing.birth_date},
        'day', ${input.reviewedBy}::uuid, ${input.reviewedBy}::uuid
      ) returning id::text
    `;

    await tx`
      insert into patient.account_patient_links (
        account_id, patient_id, relationship_type, access_role,
        is_primary_profile, created_by
      ) values (
        ${existing.account_id}::uuid, ${patient.id}::uuid, 'self',
        ${input.accessRole}, true, ${input.reviewedBy}::uuid
      )
    `;

    const [updated] = await tx<any[]>`
      update patient.account_link_requests
      set matched_patient_id = ${patient.id}::uuid,
          request_status = 'approved', reviewed_by = ${input.reviewedBy}::uuid,
          reviewed_at = now(), review_notes = 'self_profile_created',
          last_modified_date = now()
      where id = ${input.id}
      returning *
    `;
    return { request: mapRequest(updated), patientId: patient.id };
  });
}
