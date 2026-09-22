import "server-only";

import db from "@/config/database/db";

import {
  encryptIdentifierValue,
  hashIdentifierValue,
  maskIdentifierValue,
  normalizeIdentifierValue,
} from "./crypto";

import type {
  AccountPatientLinkRow,
  PatientAddressRow,
  PatientContactRow,
  PatientIdentifierRow,
  PatientRow,
} from "../types";

export async function patientSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('patient.patients') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function mapPatientRow(row: any): PatientRow {
  return {
    id: row.id,
    publicId: row.public_id,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    birthDate: row.birth_date,
    birthDatePrecision: row.birth_date_precision,
    sexAtBirth: row.sex_at_birth,
    gender: row.gender,
    nationalityCountryCode: row.nationality_country_code,
    primaryLanguage: row.primary_language,
    status: row.status,
    version: row.version,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

function mapIdentifierRow(row: any): PatientIdentifierRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    identifierType: row.identifier_type,
    maskedValue: row.identifier_value_masked,
    issuingCountryCode: row.issuing_country_code,
    issuingAuthority: row.issuing_authority,
    system: row.system,
    isPrimary: row.is_primary,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    status: row.status,
    createdAt: row.create_date,
  };
}

function mapAccountLinkRow(row: any): AccountPatientLinkRow {
  return {
    id: row.id,
    accountId: row.account_id,
    patientId: row.patient_id,
    relationshipType: row.relationship_type,
    accessRole: row.access_role,
    isPrimaryProfile: row.is_primary_profile,
    isVerified: row.is_verified,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    createdAt: row.create_date,
  };
}

function mapContactRow(row: any): PatientContactRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    contactType: row.contact_type,
    value: row.value,
    countryCode: row.country_code,
    isPrimary: row.is_primary,
    isVerified: row.is_verified,
    createdAt: row.create_date,
  };
}

function mapAddressRow(row: any): PatientAddressRow {
  return {
    id: row.id,
    patientId: row.patient_id,
    countryCode: row.country_code,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    isPrimary: row.is_primary,
    createdAt: row.create_date,
  };
}

/** postgres.js surfaces a unique-violation as an error with `.code === "23505"`. */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

export async function createPatient(input: {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  birthDate?: string;
  birthDatePrecision?: string;
  sexAtBirth?: string;
  gender?: string;
  nationalityCountryCode?: string;
  primaryLanguage?: string;
  createdBy?: string | null;
}): Promise<PatientRow> {
  const rows = await db<any[]>`
    insert into patient.patients (
      first_name, middle_name, last_name, preferred_name,
      birth_date, birth_date_precision, sex_at_birth, gender,
      nationality_country_code, primary_language, created_by, last_modified_by
    ) values (
      ${input.firstName}, ${input.middleName ?? null}, ${input.lastName}, ${input.preferredName ?? null},
      ${input.birthDate ?? null}, ${input.birthDatePrecision ?? "day"}, ${input.sexAtBirth ?? null}, ${input.gender ?? null},
      ${input.nationalityCountryCode ?? null}, ${input.primaryLanguage ?? null}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapPatientRow(rows[0]);
}

export async function getPatientById(patientId: string): Promise<PatientRow | null> {
  const rows = await db<any[]>`select * from patient.patients where id = ${patientId}`;
  return rows[0] ? mapPatientRow(rows[0]) : null;
}

/** Optimistic concurrency: returns null (not an error) when `expectedVersion`
 * no longer matches -- the caller decides how to surface a conflict. */
export async function updatePatient(
  patientId: string,
  expectedVersion: number,
  patch: Partial<{
    firstName: string;
    middleName: string | null;
    lastName: string;
    preferredName: string | null;
    birthDate: string | null;
    birthDatePrecision: string;
    sexAtBirth: string | null;
    gender: string | null;
    nationalityCountryCode: string | null;
    primaryLanguage: string | null;
    status: string;
  }>,
  actorId?: string | null
): Promise<PatientRow | null> {
  const rows = await db<any[]>`
    update patient.patients set
      first_name = coalesce(${patch.firstName ?? null}, first_name),
      middle_name = case when ${"middleName" in patch} then ${patch.middleName ?? null} else middle_name end,
      last_name = coalesce(${patch.lastName ?? null}, last_name),
      preferred_name = case when ${"preferredName" in patch} then ${patch.preferredName ?? null} else preferred_name end,
      birth_date = case when ${"birthDate" in patch} then ${patch.birthDate ?? null} else birth_date end,
      birth_date_precision = coalesce(${patch.birthDatePrecision ?? null}, birth_date_precision),
      sex_at_birth = case when ${"sexAtBirth" in patch} then ${patch.sexAtBirth ?? null} else sex_at_birth end,
      gender = case when ${"gender" in patch} then ${patch.gender ?? null} else gender end,
      nationality_country_code = case when ${"nationalityCountryCode" in patch} then ${patch.nationalityCountryCode ?? null} else nationality_country_code end,
      primary_language = case when ${"primaryLanguage" in patch} then ${patch.primaryLanguage ?? null} else primary_language end,
      status = coalesce(${patch.status ?? null}, status),
      version = version + 1,
      last_modified_date = now(),
      last_modified_by = ${actorId ?? null}
    where id = ${patientId} and version = ${expectedVersion}
    returning *
  `;
  return rows[0] ? mapPatientRow(rows[0]) : null;
}

export async function listIdentifiersForPatient(
  patientId: string,
  pagination?: { limit?: number; offset?: number }
): Promise<PatientIdentifierRow[]> {
  const limit = Math.min(Math.max(pagination?.limit ?? 50, 1), 200);
  const offset = Math.max(pagination?.offset ?? 0, 0);
  const rows = await db<any[]>`
    select * from patient.patient_identifiers
    where patient_id = ${patientId} and status = 'active'
    order by is_primary desc, create_date asc
    limit ${limit} offset ${offset}
  `;
  return rows.map(mapIdentifierRow);
}

/** V0.6 creation workflow, exact-match branch: does an active identifier with
 * this type/issuer/normalized value already exist? Weak (name/DOB-only)
 * matching that creates a review candidate instead of linking/creating is
 * V6's PatientMatchCandidate queue (spec section V6.1-V6.2), which doesn't
 * exist yet -- intentionally out of scope for V0. */
export async function findPatientIdByIdentifier(input: {
  identifierType: string;
  value: string;
  issuingCountryCode?: string;
  issuingAuthority?: string;
}): Promise<string | null> {
  const normalizedHash = hashIdentifierValue(normalizeIdentifierValue(input.value));
  const rows = await db<{ patient_id: string }[]>`
    select patient_id from patient.patient_identifiers
    where identifier_type = ${input.identifierType}
      and coalesce(issuing_country_code, '') = ${input.issuingCountryCode ?? ""}
      and coalesce(issuing_authority, '') = ${input.issuingAuthority ?? ""}
      and normalized_value_hash = ${normalizedHash}
      and status = 'active'
    limit 1
  `;
  return rows[0]?.patient_id ?? null;
}

/** Throws a postgres unique-violation (code 23505) if the same
 * type/issuer/normalized-value identifier is already attached (to any
 * patient) -- callers should check findPatientIdByIdentifier first when
 * they want to distinguish "attach to this patient" from "this belongs to
 * someone else." */
export async function addPatientIdentifier(input: {
  patientId: string;
  identifierType: string;
  value: string;
  issuingCountryCode?: string;
  issuingAuthority?: string;
  system?: string;
  isPrimary?: boolean;
  validFrom?: string;
  validUntil?: string;
}): Promise<PatientIdentifierRow> {
  const normalized = normalizeIdentifierValue(input.value);
  const rows = await db<any[]>`
    insert into patient.patient_identifiers (
      patient_id, identifier_type, identifier_value_encrypted, identifier_value_hash,
      identifier_value_masked, normalized_value_hash,
      issuing_country_code, issuing_authority, system, is_primary, valid_from, valid_until
    ) values (
      ${input.patientId}, ${input.identifierType}, ${encryptIdentifierValue(input.value)}, ${hashIdentifierValue(input.value)},
      ${maskIdentifierValue(input.value)}, ${hashIdentifierValue(normalized)},
      ${input.issuingCountryCode ?? null}, ${input.issuingAuthority ?? null}, ${input.system ?? null},
      ${input.isPrimary ?? false}, ${input.validFrom ?? null}, ${input.validUntil ?? null}
    )
    returning *
  `;
  return mapIdentifierRow(rows[0]);
}

export async function verifyPatientIdentifier(
  identifierId: string,
  verifiedBy: string,
  method: string
): Promise<PatientIdentifierRow | null> {
  const rows = await db<any[]>`
    update patient.patient_identifiers set
      is_verified = true, verification_method = ${method}, verified_at = now(), verified_by = ${verifiedBy},
      last_modified_date = now()
    where id = ${identifierId}
    returning *
  `;
  return rows[0] ? mapIdentifierRow(rows[0]) : null;
}

export async function listPatientsForAccount(
  accountId: string,
  pagination?: { limit?: number; offset?: number }
): Promise<PatientRow[]> {
  const limit = Math.min(Math.max(pagination?.limit ?? 50, 1), 200);
  const offset = Math.max(pagination?.offset ?? 0, 0);
  const rows = await db<any[]>`
    select p.* from patient.patients p
    join patient.account_patient_links l on l.patient_id = p.id
    where l.account_id = ${accountId} and l.valid_until is null
    order by l.is_primary_profile desc, l.create_date asc
    limit ${limit} offset ${offset}
  `;
  return rows.map(mapPatientRow);
}

export async function findActiveAccountPatientLink(
  accountId: string,
  patientId: string
): Promise<AccountPatientLinkRow | null> {
  const rows = await db<any[]>`
    select * from patient.account_patient_links
    where account_id = ${accountId} and patient_id = ${patientId} and valid_until is null
  `;
  return rows[0] ? mapAccountLinkRow(rows[0]) : null;
}

export async function linkAccountToPatient(input: {
  accountId: string;
  patientId: string;
  relationshipType: string;
  accessRole?: string;
  isPrimaryProfile?: boolean;
  createdBy?: string | null;
}): Promise<AccountPatientLinkRow> {
  const rows = await db<any[]>`
    insert into patient.account_patient_links (
      account_id, patient_id, relationship_type, access_role, is_primary_profile, created_by
    ) values (
      ${input.accountId}, ${input.patientId}, ${input.relationshipType}, ${input.accessRole ?? "full"},
      ${input.isPrimaryProfile ?? false}, ${input.createdBy ?? null}
    )
    returning *
  `;
  return mapAccountLinkRow(rows[0]);
}

export async function unlinkAccountFromPatient(accountId: string, patientId: string): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    update patient.account_patient_links set valid_until = now()
    where account_id = ${accountId} and patient_id = ${patientId} and valid_until is null
    returning id
  `;
  return rows.length > 0;
}

export async function addPatientContact(input: {
  patientId: string;
  contactType: string;
  value: string;
  countryCode?: string;
  isPrimary?: boolean;
}): Promise<PatientContactRow> {
  const rows = await db<any[]>`
    insert into patient.patient_contacts (patient_id, contact_type, value, country_code, is_primary)
    values (${input.patientId}, ${input.contactType}, ${input.value}, ${input.countryCode ?? null}, ${input.isPrimary ?? false})
    returning *
  `;
  return mapContactRow(rows[0]);
}

export async function listContactsForPatient(patientId: string): Promise<PatientContactRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_contacts
    where patient_id = ${patientId} and valid_until is null
    order by is_primary desc, create_date asc
  `;
  return rows.map(mapContactRow);
}

export async function addPatientAddress(input: {
  patientId: string;
  countryCode?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  isPrimary?: boolean;
}): Promise<PatientAddressRow> {
  const rows = await db<any[]>`
    insert into patient.patient_addresses (
      patient_id, country_code, city, region, postal_code, address_line1, address_line2, is_primary
    ) values (
      ${input.patientId}, ${input.countryCode ?? null}, ${input.city ?? null}, ${input.region ?? null},
      ${input.postalCode ?? null}, ${input.addressLine1 ?? null}, ${input.addressLine2 ?? null}, ${input.isPrimary ?? false}
    )
    returning *
  `;
  return mapAddressRow(rows[0]);
}

export async function listAddressesForPatient(patientId: string): Promise<PatientAddressRow[]> {
  const rows = await db<any[]>`
    select * from patient.patient_addresses
    where patient_id = ${patientId} and valid_until is null
    order by is_primary desc, create_date asc
  `;
  return rows.map(mapAddressRow);
}
