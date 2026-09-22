import "server-only";

import db from "@/config/database/db";

import type { PatientConsentRow, ShareGrantRow } from "../sharing-types";
import { generateShareToken, hashShareSecret } from "./crypto";

function mapConsent(row: any): PatientConsentRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    consentType: row.consent_type,
    purpose: row.purpose,
    recipientType: row.recipient_type,
    recipientId: row.recipient_id,
    scope: row.scope ?? [],
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    consentStatus: row.consent_status,
    documentId: row.document_id,
    grantedAt: row.granted_at,
    withdrawnAt: row.withdrawn_at,
    createdAt: row.create_date,
  };
}

function mapShareGrant(row: any): ShareGrantRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicalCaseId: row.medical_case_id,
    createdBy: row.created_by,
    recipientName: row.recipient_name,
    recipientContact: row.recipient_contact,
    scope: row.scope ?? [],
    validFrom: row.valid_from,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    accessCount: row.access_count,
    maxAccessCount: row.max_access_count,
    createdAt: row.create_date,
  };
}

// --- Consent (V5.1) ------------------------------------------------------

export async function grantConsent(input: {
  patientId: string;
  consentType: string;
  purpose: string;
  recipientType: string;
  recipientId?: string;
  scope: string[];
  validUntil?: string;
  createdBy?: string | null;
}): Promise<PatientConsentRow> {
  const rows = await db<any[]>`
    insert into patient.patient_consents (
      patient_id, consent_type, purpose, recipient_type, recipient_id, scope, valid_until, created_by
    ) values (
      ${input.patientId}, ${input.consentType}, ${input.purpose}, ${input.recipientType}, ${input.recipientId ?? null},
      ${input.scope}, ${input.validUntil ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapConsent(rows[0]);
}

export async function listConsentsForPatient(patientId: string): Promise<PatientConsentRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_consents where patient_id = ${patientId} order by create_date desc
  `;
  return rows.map(mapConsent);
}

/** Consent withdrawal never deletes the row or the audit trail that led to
 * it (spec V5.1: "Do not retroactively erase audit events after consent
 * withdrawal") -- it only flips consent_status and stamps withdrawn_at. */
export async function withdrawConsent(id: string): Promise<PatientConsentRow | null> {
  const rows = await db<any[]>`
    update patient.patient_consents set consent_status = 'withdrawn', withdrawn_at = now()
    where id = ${id} and consent_status = 'active'
    returning *
  `;
  return rows[0] ? mapConsent(rows[0]) : null;
}

// --- Temporary sharing (V5.3) ---------------------------------------------

export async function createShareGrant(input: {
  patientId: string;
  medicalCaseId?: string;
  recipientName?: string;
  recipientContact?: string;
  scope: string[];
  expiresInHours: number;
  pin?: string;
  maxAccessCount?: number;
  createdBy?: string | null;
}): Promise<{ grant: ShareGrantRow; token: string }> {
  const token = generateShareToken();
  const rows = await db<any[]>`
    insert into patient.share_grants (
      patient_id, medical_case_id, recipient_name, recipient_contact, scope, token_hash, pin_hash,
      expires_at, max_access_count, created_by
    ) values (
      ${input.patientId}, ${input.medicalCaseId ?? null}, ${input.recipientName ?? null}, ${input.recipientContact ?? null},
      ${input.scope}, ${hashShareSecret(token)}, ${input.pin ? hashShareSecret(input.pin) : null},
      now() + make_interval(hours => ${input.expiresInHours}), ${input.maxAccessCount ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return { grant: mapShareGrant(rows[0]), token };
}

export async function listShareGrantsForPatient(patientId: string): Promise<ShareGrantRow[]> {
  const rows = await db<any[]>`
    select * from patient.share_grants where patient_id = ${patientId} order by create_date desc
  `;
  return rows.map(mapShareGrant);
}

export async function revokeShareGrant(id: string): Promise<ShareGrantRow | null> {
  const rows = await db<any[]>`
    update patient.share_grants set revoked_at = now() where id = ${id} and revoked_at is null returning *
  `;
  return rows[0] ? mapShareGrant(rows[0]) : null;
}

export type ShareGrantLookupResult =
  | { ok: true; grant: ShareGrantRow }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "max_reached" | "pin_required" | "pin_invalid" };

/**
 * Looks up a presented token by its hash (deterministic HMAC, same pattern
 * as patient_identifiers' lookup hash) and validates it without consuming
 * an access yet -- the caller records the audit event and calls
 * `consumeShareGrantAccess` only once it has actually rendered the data
 * (spec V5.3: "Log every view").
 */
export async function lookupShareGrant(token: string, pin?: string): Promise<ShareGrantLookupResult> {
  const rows = await db<any[]>`select * from patient.share_grants where token_hash = ${hashShareSecret(token)}`;
  const row = rows[0];
  if (!row) return { ok: false, reason: "not_found" };

  const grant = mapShareGrant(row);
  if (grant.revokedAt) return { ok: false, reason: "revoked" };
  if (new Date(grant.expiresAt).getTime() <= Date.now()) return { ok: false, reason: "expired" };
  if (grant.maxAccessCount !== null && grant.accessCount >= grant.maxAccessCount) return { ok: false, reason: "max_reached" };
  if (row.pin_hash) {
    if (!pin) return { ok: false, reason: "pin_required" };
    if (hashShareSecret(pin) !== row.pin_hash) return { ok: false, reason: "pin_invalid" };
  }
  return { ok: true, grant };
}

export async function consumeShareGrantAccess(id: string): Promise<void> {
  await db`update patient.share_grants set access_count = access_count + 1 where id = ${id}`;
}
