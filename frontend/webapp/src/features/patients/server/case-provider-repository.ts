import "server-only";

import db from "@/config/database/db";

import type { BookedProviderOption, CaseProviderGrantRow } from "../case-provider-types";

function mapGrant(row: any): CaseProviderGrantRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    providerId: row.provider_id,
    bookingId: row.booking_id,
    permission: row.permission,
    scope: row.scope ?? [],
    status: row.status,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    revokedBy: row.revoked_by,
    revokedAt: row.revoked_at,
    createdAt: row.create_date,
  };
}

export async function createCaseProviderGrant(input: {
  patientId: string;
  medicalCaseId: string;
  providerId: string;
  bookingId?: string;
  permission: string;
  scope: string[];
  grantedBy: string;
}): Promise<CaseProviderGrantRow> {
  const rows = await db<any[]>`
    insert into patient.case_provider_grants (
      patient_id, medical_case_id, provider_id, booking_id, permission, scope, granted_by
    ) values (
      ${input.patientId}, ${input.medicalCaseId}, ${input.providerId}, ${input.bookingId ?? null},
      ${input.permission}, ${input.scope}, ${input.grantedBy}
    )
    returning *
  `;
  return mapGrant(rows[0]);
}

export async function listGrantsForCase(medicalCaseId: string): Promise<CaseProviderGrantRow[]> {
  const rows = await db<any[]>`
    select * from patient.case_provider_grants where medical_case_id = ${medicalCaseId} order by create_date desc
  `;
  return rows.map(mapGrant);
}

export type CaseProviderGrantWithName = CaseProviderGrantRow & { providerName: string };

/** Customer-facing listing: resolves the provider's display name so the
 * "who did I share this with" list doesn't need the caller to already know
 * it (unlike the booked-provider picker, this covers every grant ever
 * made, not just currently-booked providers). */
export async function listGrantsForCaseWithProviderNames(medicalCaseId: string, locale: string): Promise<CaseProviderGrantWithName[]> {
  const lang = locale?.trim() || "fa-IR";
  const rows = await db<any[]>`
    select g.*, coalesce(common.get_translation_t(sp.name_translations, ${lang}, 'en-US'), '-') as provider_name
    from patient.case_provider_grants g
    join category.service_providers sp on sp.id = g.provider_id
    where g.medical_case_id = ${medicalCaseId}
    order by g.create_date desc
  `;
  return rows.map((row) => ({ ...mapGrant(row), providerName: row.provider_name }));
}

export async function revokeCaseProviderGrant(id: string, revokedBy: string): Promise<CaseProviderGrantRow | null> {
  const rows = await db<any[]>`
    update patient.case_provider_grants
    set status = 'revoked', revoked_at = now(), revoked_by = ${revokedBy}
    where id = ${id} and status = 'active'
    returning *
  `;
  return rows[0] ? mapGrant(rows[0]) : null;
}

/** Provider-portal write authorization: does this provider currently hold
 * an active 'contribute' grant for this case? Used before ever accepting a
 * lab result upload -- see fulfillLabOrder in this same file. */
export async function getActiveContributeGrant(medicalCaseId: string, providerId: string): Promise<CaseProviderGrantRow | null> {
  const rows = await db<any[]>`
    select * from patient.case_provider_grants
    where medical_case_id = ${medicalCaseId} and provider_id = ${providerId}
      and status = 'active' and permission = 'contribute'
    limit 1
  `;
  return rows[0] ? mapGrant(rows[0]) : null;
}

export async function getActiveGrant(medicalCaseId: string, providerId: string): Promise<CaseProviderGrantRow | null> {
  const rows = await db<any[]>`
    select * from patient.case_provider_grants
    where medical_case_id = ${medicalCaseId} and provider_id = ${providerId} and status = 'active'
    limit 1
  `;
  return rows[0] ? mapGrant(rows[0]) : null;
}

export type GrantedCaseForProvider = CaseProviderGrantRow & {
  caseTitle: string;
  caseNumber: string;
  caseStatus: string;
  patientName: string;
};

/** Provider-portal reading list: every case currently shared with this
 * provider, active grants only. */
export async function listActiveGrantsForProvider(providerId: string): Promise<GrantedCaseForProvider[]> {
  const rows = await db<any[]>`
    select g.*, c.title as case_title, c.case_number, c.case_status, p.first_name, p.last_name
    from patient.case_provider_grants g
    join patient.medical_cases c on c.id = g.medical_case_id
    join patient.patients p on p.id = g.patient_id
    where g.provider_id = ${providerId} and g.status = 'active'
    order by g.create_date desc
  `;
  return rows.map((row) => ({
    ...mapGrant(row),
    caseTitle: row.case_title,
    caseNumber: row.case_number,
    caseStatus: row.case_status,
    patientName: `${row.first_name} ${row.last_name}`,
  }));
}

/**
 * "Share along the booking": the only providers a customer can pick from
 * when sharing a case are ones they actually have a booking with -- a
 * read-only cross-schema query against booking.bookings, same
 * soft-reference convention this feature already uses for provider/
 * organization ids on medical_cases. No schema change to the booking
 * domain.
 *
 * Scoped to booking.bookings only, not booking.booking_child_bookings:
 * that table was created by hand outside this repo's migration history
 * (see scripts/migrate.mjs's own note that hand-created schemas predate
 * it), and its exact linkage back to the customer's account couldn't be
 * confirmed from anything in this codebase -- guessing a wrong column here
 * would fail at query time, not just under-select rows.
 */
export async function listBookedProvidersForAccount(accountId: string, locale: string): Promise<BookedProviderOption[]> {
  const lang = locale?.trim() || "fa-IR";
  const rows = await db<any[]>`
    with latest as (
      select distinct on (b.provider_id) b.provider_id, b.id as booking_id
      from booking.bookings b
      where b.user_id = ${accountId} and b.provider_id is not null
      order by b.provider_id, b.create_date desc
    )
    select
      l.provider_id::text as "providerId",
      l.booking_id::text as "bookingId",
      coalesce(common.get_translation_t(sp.name_translations, ${lang}, 'en-US'), '-') as "providerName"
    from latest l
    join category.service_providers sp on sp.id = l.provider_id
    order by "providerName" asc
  `;
  return rows;
}
