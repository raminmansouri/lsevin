"use server";

import sql from "@/config/database/db";

import { getEntityConfig } from "../constants";
import { revalidateMarketingLoyaltyCache } from "../db/cache";
import { UpsertMarketingLoyaltyRecordSchema } from "../schemas";
import type { AdminFieldConfig } from "../types";

export type MarketingLoyaltyActionResult = {
  data?: string;
  error?: {
    detail: string;
  };
};

export async function upsertMarketingLoyaltyRecordAction(input: unknown): Promise<MarketingLoyaltyActionResult> {
  const parsed = UpsertMarketingLoyaltyRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { detail: parsed.error.issues[0]?.message || "Invalid form data." } };
  }

  const { entityKey, id, values } = parsed.data;
  const config = getEntityConfig(entityKey);
  const isEdit = Boolean(id);

  if (config.appendOnly && isEdit) {
    return { error: { detail: "This record is append-only and cannot be edited." } };
  }

  const writableFields = config.fields.filter((field) => {
    if (field.readOnly || field.kind === "readonly") return false;
    if (isEdit && field.hiddenOnUpdate) return false;
    if (!isEdit && field.hiddenOnCreate) return false;
    return true;
  });

  const validationError = validateRequiredFields(writableFields, values);
  if (validationError) return { error: { detail: validationError } };

  try {
    if (entityKey === "loyalty-ledger") {
      const newId = await createLedgerEntry(values);
      revalidateMarketingLoyaltyCache({ entityKey, id: newId });
      revalidateMarketingLoyaltyCache({ entityKey: "loyalty-accounts", id: String(values.customerId || "") });
      return { data: newId };
    }

    const normalized = writableFields.map((field) => ({
      field,
      value: normalizeValueForDb(field, values[field.name]),
    }));

    if (isEdit) {
      const updates = normalized.map(({ field }, index) => `"${field.column}" = $${index + 1}`);
      const queryValues = normalized.map(({ value }) => value);

      if (config.updateTimestampColumn) {
        updates.push(`"${config.updateTimestampColumn}" = now()`);
      }

      await sql.unsafe(
        `update "${config.schemaName}"."${config.tableName}" set ${updates.join(", ")} where "${config.primaryKey}" = $${queryValues.length + 1}`,
        [...queryValues, id]
      );

      revalidateMarketingLoyaltyCache({ entityKey, id });
      return { data: id };
    }

    const columns = normalized.map(({ field }) => `"${field.column}"`);
    const placeholders = normalized.map((_, index) => `$${index + 1}`);
    const queryValues = normalized.map(({ value }) => value);
    const [row] = await sql.unsafe<Array<{ id: string }>>(
      `insert into "${config.schemaName}"."${config.tableName}" (${columns.join(", ")}) values (${placeholders.join(", ")}) returning "${config.primaryKey}"::text as id`,
      queryValues
    );

    revalidateMarketingLoyaltyCache({ entityKey, id: row.id });
    return { data: row.id };
  } catch (error) {
    return { error: { detail: error instanceof Error ? error.message : "Database operation failed." } };
  }
}

function validateRequiredFields(fields: AdminFieldConfig[], values: Record<string, unknown>) {
  for (const field of fields) {
    if (!field.required) continue;
    const value = values[field.name];
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      return `${field.label} is required.`;
    }
  }
  return undefined;
}

function normalizeValueForDb(field: AdminFieldConfig, value: unknown) {
  if (value === "" || value === undefined) {
    if (field.required && field.kind === "boolean") return false;
    return null;
  }

  switch (field.kind) {
    case "number":
      return Number(value);
    case "integer":
      return Number.parseInt(String(value), 10);
    case "boolean":
      return Boolean(value);
    case "json":
      if (typeof value === "string") return JSON.parse(value || "null");
      return value;
    case "localized-text":
    case "localized-rich-text":
      return value && typeof value === "object" ? value : null;
    case "richtext":
      return typeof value === "string" ? value.trim() || null : value;
    case "datetime":
      return value ? String(value).replace("T", " ") : null;
    default:
      return typeof value === "string" ? value.trim() || null : value;
  }
}

async function createLedgerEntry(values: Record<string, unknown>) {
  const customerId = String(values.customerId || "");
  const bookingId = values.bookingId ? String(values.bookingId) : null;
  const entryType = String(values.entryType || "Adjustment");
  const pointsDelta = Number.parseInt(String(values.pointsDelta || 0), 10);
  const moneyDelta = values.moneyDelta === "" || values.moneyDelta === undefined ? null : Number(values.moneyDelta);
  const description = String(values.description || "").trim();
  const metadata = typeof values.metadata === "string" ? JSON.parse(values.metadata || "{}") : values.metadata || {};

  if (!customerId) throw new Error("Customer is required.");
  if (!description) throw new Error("Description is required.");

  const [row] = await sql.begin(async (trx) => {
    const [inserted] = await trx<Array<{ id: string }>>`
      insert into loyalty.ledger (
        customer_id,
        booking_id,
        entry_type,
        points_delta,
        money_delta,
        description,
        metadata
      ) values (
        ${customerId},
        ${bookingId},
        ${entryType},
        ${pointsDelta},
        ${moneyDelta},
        ${description},
        ${metadata}
      ) returning id::text as id
    `;

    await trx`
      insert into loyalty.accounts (
        customer_id,
        points_balance,
        lifetime_points,
        referral_code,
        create_date,
        last_modified_date
      ) values (
        ${customerId},
        ${pointsDelta},
        ${Math.max(pointsDelta, 0)},
        upper(substr(replace(${customerId}::text, '-', ''), 1, 8)),
        now(),
        now()
      )
      on conflict (customer_id) do update set
        points_balance = loyalty.accounts.points_balance + ${pointsDelta},
        lifetime_points = loyalty.accounts.lifetime_points + ${Math.max(pointsDelta, 0)},
        last_modified_date = now()
    `;

    return [inserted];
  });

  return row.id;
}
