import type { Sql } from "postgres";

import type {
  AllergySeverity,
  EmergencyContact,
  MedicalProfileAllergy,
  MedicalProfileCondition,
  MedicalProfileDocument,
  MedicalProfileMedication,
  MedicalProfilePageData,
} from "./types";

export async function resolveCustomerFromIdentityUser(
  sql: Sql,
  identityUserId: string,
): Promise<{ customerId: string }> {
  const identityRows = await sql<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number_country_code: string;
    phone_number: string;
    birth_date: string | null;
    gender: string | null;
    city: string | null;
    country: string | null;
  }[]>`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone_number_country_code,
      phone_number,
      birth_date,
      gender,
      city,
      country
    FROM identity.asp_net_users
    WHERE id = ${identityUserId}
    LIMIT 1
  `;

  const identityUser = identityRows[0];
  if (!identityUser) {
    throw new Error("Authenticated user was not found.");
  }

  const customerRows = await sql<{ id: string }[]>`
    SELECT id
    FROM customer.customers
    WHERE id = ${identityUserId}
    LIMIT 1
  `;

  if (!customerRows[0]) {
    await sql`
      INSERT INTO customer.customers (
        id,
        phone_number,
        phone_number_country_code,
        email,
        birth_date,
        city,
        country,
        first_name,
        last_name,
        gender,
        is_active,
        is_profile_confirmed,
        profile_confirmed_at,
        create_date,
        last_modified_date
      )
      VALUES (
        ${identityUser.id},
        ${identityUser.phone_number},
        ${identityUser.phone_number_country_code},
        ${identityUser.email},
        ${identityUser.birth_date},
        ${identityUser.city},
        ${identityUser.country},
        ${identityUser.first_name},
        ${identityUser.last_name},
        ${identityUser.gender},
        true,
        false,
        null,
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  await sql`
    INSERT INTO customer.medical_profiles (customer_id)
    VALUES (${identityUserId})
    ON CONFLICT (customer_id) DO NOTHING
  `;

  return { customerId: identityUserId };
}

export async function getMedicalProfilePageData(
  sql: Sql,
  identityUserId: string,
): Promise<MedicalProfilePageData> {
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);

  const [profileRows, allergyRows, medicationRows, conditionRows, documentRows] = await Promise.all([
    sql<{
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      emergency_contact_relationship: string | null;
    }[]>`
      SELECT
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship
      FROM customer.medical_profiles
      WHERE customer_id = ${customerId}
      LIMIT 1
    `,
    sql<{
      id: string;
      name: string;
      severity: AllergySeverity;
      notes: string | null;
      create_date: string;
    }[]>`
      SELECT id, name, severity, notes, create_date
      FROM customer.medical_profile_allergies
      WHERE customer_id = ${customerId}
      ORDER BY create_date DESC, name ASC
    `,
    sql<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      notes: string | null;
      create_date: string;
    }[]>`
      SELECT id, name, dosage, frequency, notes, create_date
      FROM customer.medical_profile_medications
      WHERE customer_id = ${customerId}
      ORDER BY create_date DESC, name ASC
    `,
    sql<{
      id: string;
      name: string;
      diagnosed_date: string | null;
      notes: string | null;
      create_date: string;
    }[]>`
      SELECT id, name, diagnosed_date, notes, create_date
      FROM customer.medical_profile_conditions
      WHERE customer_id = ${customerId}
      ORDER BY create_date DESC, name ASC
    `,
    sql<{
      id: string;
      title: string;
      file_name: string;
      file_url: string;
      mime_type: string | null;
      size_bytes: number | null;
      create_date: string;
    }[]>`
      SELECT id, title, file_name, file_url, mime_type, size_bytes, create_date
      FROM customer.medical_profile_documents
      WHERE customer_id = ${customerId}
        AND is_archived = false
      ORDER BY create_date DESC, title ASC
    `,
  ]);

  const profile = profileRows[0];

  return {
    customerId,
    allergies: allergyRows.map((row): MedicalProfileAllergy => ({
      id: row.id,
      name: row.name,
      severity: row.severity,
      notes: row.notes,
      createDate: row.create_date,
    })),
    medications: medicationRows.map((row): MedicalProfileMedication => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      notes: row.notes,
      createDate: row.create_date,
    })),
    conditions: conditionRows.map((row): MedicalProfileCondition => ({
      id: row.id,
      name: row.name,
      diagnosedDate: row.diagnosed_date,
      notes: row.notes,
      createDate: row.create_date,
    })),
    documents: documentRows.map((row): MedicalProfileDocument => ({
      id: row.id,
      title: row.title,
      fileName: row.file_name,
      fileUrl: row.file_url,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      createDate: row.create_date,
    })),
    emergencyContact: {
      name: profile?.emergency_contact_name ?? "",
      phone: profile?.emergency_contact_phone ?? "",
      relationship: profile?.emergency_contact_relationship ?? "",
    },
  };
}

export async function insertMedicalProfileAllergy(
  sql: Sql,
  customerId: string,
  input: { name: string; severity: AllergySeverity; notes?: string | null },
): Promise<MedicalProfileAllergy> {
  const rows = await sql<{
    id: string;
    name: string;
    severity: AllergySeverity;
    notes: string | null;
    create_date: string;
  }[]>`
    INSERT INTO customer.medical_profile_allergies (
      customer_id,
      name,
      severity,
      notes,
      create_date,
      last_modified_date
    )
    VALUES (
      ${customerId},
      ${input.name},
      ${input.severity},
      ${input.notes ?? null},
      now(),
      now()
    )
    RETURNING id, name, severity, notes, create_date
  `;

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    severity: row.severity,
    notes: row.notes,
    createDate: row.create_date,
  };
}

export async function deleteMedicalProfileAllergy(
  sql: Sql,
  customerId: string,
  allergyId: string,
): Promise<void> {
  await sql`
    DELETE FROM customer.medical_profile_allergies
    WHERE id = ${allergyId}
      AND customer_id = ${customerId}
  `;
}

export async function insertMedicalProfileMedication(
  sql: Sql,
  customerId: string,
  input: { name: string; dosage: string; frequency: string; notes?: string | null },
): Promise<MedicalProfileMedication> {
  const rows = await sql<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    notes: string | null;
    create_date: string;
  }[]>`
    INSERT INTO customer.medical_profile_medications (
      customer_id,
      name,
      dosage,
      frequency,
      notes,
      create_date,
      last_modified_date
    )
    VALUES (
      ${customerId},
      ${input.name},
      ${input.dosage},
      ${input.frequency},
      ${input.notes ?? null},
      now(),
      now()
    )
    RETURNING id, name, dosage, frequency, notes, create_date
  `;

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    notes: row.notes,
    createDate: row.create_date,
  };
}

export async function deleteMedicalProfileMedication(
  sql: Sql,
  customerId: string,
  medicationId: string,
): Promise<void> {
  await sql`
    DELETE FROM customer.medical_profile_medications
    WHERE id = ${medicationId}
      AND customer_id = ${customerId}
  `;
}

export async function insertMedicalProfileCondition(
  sql: Sql,
  customerId: string,
  input: { name: string; diagnosedDate?: string | null; notes?: string | null },
): Promise<MedicalProfileCondition> {
  const rows = await sql<{
    id: string;
    name: string;
    diagnosed_date: string | null;
    notes: string | null;
    create_date: string;
  }[]>`
    INSERT INTO customer.medical_profile_conditions (
      customer_id,
      name,
      diagnosed_date,
      notes,
      create_date,
      last_modified_date
    )
    VALUES (
      ${customerId},
      ${input.name},
      ${input.diagnosedDate ?? null},
      ${input.notes ?? null},
      now(),
      now()
    )
    RETURNING id, name, diagnosed_date, notes, create_date
  `;

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    diagnosedDate: row.diagnosed_date,
    notes: row.notes,
    createDate: row.create_date,
  };
}

export async function deleteMedicalProfileCondition(
  sql: Sql,
  customerId: string,
  conditionId: string,
): Promise<void> {
  await sql`
    DELETE FROM customer.medical_profile_conditions
    WHERE id = ${conditionId}
      AND customer_id = ${customerId}
  `;
}

export async function upsertMedicalProfileEmergencyContact(
  sql: Sql,
  customerId: string,
  input: EmergencyContact,
): Promise<EmergencyContact> {
  const rows = await sql<{
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relationship: string | null;
  }[]>`
    INSERT INTO customer.medical_profiles (
      customer_id,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      create_date,
      last_modified_date
    )
    VALUES (
      ${customerId},
      ${input.name || null},
      ${input.phone || null},
      ${input.relationship || null},
      now(),
      now()
    )
    ON CONFLICT (customer_id)
    DO UPDATE SET
      emergency_contact_name = EXCLUDED.emergency_contact_name,
      emergency_contact_phone = EXCLUDED.emergency_contact_phone,
      emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
      last_modified_date = now()
    RETURNING
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship
  `;

  const row = rows[0];
  return {
    name: row.emergency_contact_name ?? "",
    phone: row.emergency_contact_phone ?? "",
    relationship: row.emergency_contact_relationship ?? "",
  };
}

export async function insertMedicalProfileDocument(
  sql: Sql,
  customerId: string,
  input: {
    title: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    createdBy?: string | null;
    documentTypeId?: number | null;
  },
): Promise<MedicalProfileDocument> {
  const rows = await sql<{
    id: string;
    title: string;
    file_name: string;
    file_url: string;
    mime_type: string | null;
    size_bytes: number | null;
    create_date: string;
  }[]>`
    INSERT INTO customer.medical_profile_documents (
      customer_id,
      document_type_id,
      title,
      file_name,
      file_url,
      mime_type,
      size_bytes,
      created_by,
      create_date,
      last_modified_date,
      is_archived
    )
    VALUES (
      ${customerId},
      ${input.documentTypeId ?? null},
      ${input.title},
      ${input.fileName},
      ${input.fileUrl},
      ${input.mimeType ?? null},
      ${input.sizeBytes ?? null},
      ${input.createdBy ?? null},
      now(),
      now(),
      false
    )
    RETURNING id, title, file_name, file_url, mime_type, size_bytes, create_date
  `;

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createDate: row.create_date,
  };
}
