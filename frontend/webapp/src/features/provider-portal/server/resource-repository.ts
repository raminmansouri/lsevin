import "server-only";

import sql from "@/config/database/db";

import { getProviderResourceConfig, type ProviderResourceConfig, type ProviderResourceField } from "../resource-config";

export type ProviderResourceRow = Record<string, any> & { id: string };
export type ProviderResourceOption = { value: string; label: string };

function quoteIdent(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) throw new Error(`Unsafe identifier: ${identifier}`);
  return `"${identifier}"`;
}

function tableParts(table: string) {
  const parts = table.split(".");
  if (parts.length !== 2) throw new Error(`Unsafe table name: ${table}`);
  return { schema: parts[0], table: parts[1] };
}

function splitTable(table: string) {
  const parts = tableParts(table);
  return `${quoteIdent(parts.schema)}.${quoteIdent(parts.table)}`;
}

function castForId(config: ProviderResourceConfig, param = "$2") {
  if (config.idType === "integer") return `${param}::int`;
  if (config.idType === "text") return `${param}::text`;
  return `${param}::uuid`;
}

function fieldsForSelect(config: ProviderResourceConfig) {
  const names = new Set<string>([config.idColumn, ...config.fields.map((field) => field.name)]);
  return [`r.${quoteIdent(config.idColumn)}::text as id`, ...Array.from(names).map((name) => `r.${quoteIdent(name)} as ${quoteIdent(name)}`)].join(",\n      ");
}

function ownershipWhere(config: ProviderResourceConfig, providerParam = "$1") {
  switch (config.ownership.kind) {
    case "provider":
      return `r.${quoteIdent(config.ownership.providerColumn)} = ${providerParam}::uuid`;
    case "providerService":
      return `exists (select 1 from category.provider_services ps where ps.id = r.${quoteIdent(config.ownership.serviceColumn)} and ps.service_provider_id = ${providerParam}::uuid)`;
    case "staff":
      return `exists (select 1 from category.provider_staffs pst where pst.staff_id = r.${quoteIdent(config.ownership.staffColumn)} and pst.service_provider_id = ${providerParam}::uuid)`;
    case "booking":
      return `r.${quoteIdent(config.ownership.providerColumn)} = ${providerParam}::uuid`;
    case "none":
      return "true";
  }
}

async function requirePermission(_userId: string, _providerId: string, config: ProviderResourceConfig, mode: "read" | "create" | "update" | "delete") {
  // Temporary development mode: bypass membership/role checks so every menu item and form is visible locally.
  // Keep table-level creatable/editable/deletable flags so read-only records stay read-only.
  if (mode === "create" && !config.create) throw new Error("This provider resource is not creatable from the portal.");
  if (mode === "update" && !config.update) throw new Error("This provider resource is not editable from the portal.");
  if (mode === "delete" && !config.delete) throw new Error("This provider resource is not deletable from the portal.");
  return "owner";
}

export async function listProviderResourceRows(userId: string, providerId: string, resourceKey: string): Promise<{ config: ProviderResourceConfig; rows: ProviderResourceRow[]; role: string }> {
  const config = getProviderResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown provider portal resource.");
  const role = await requirePermission(userId, providerId, config, "read");
  const table = splitTable(config.table);
  const orderBy = config.orderBy ? ` order by ${config.orderBy}` : "";
  const rows = await sql.unsafe(`select ${fieldsForSelect(config)} from ${table} r where ${ownershipWhere(config, "$1")} ${orderBy} limit 500`, [providerId]);
  return { config, rows: rows as ProviderResourceRow[], role };
}

export async function getProviderResourceRow(userId: string, providerId: string, resourceKey: string, recordId: string): Promise<{ config: ProviderResourceConfig; row: ProviderResourceRow; role: string }> {
  const config = getProviderResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown provider portal resource.");
  const role = await requirePermission(userId, providerId, config, "read");
  const table = splitTable(config.table);
  const rows = await sql.unsafe(`select ${fieldsForSelect(config)} from ${table} r where ${ownershipWhere(config, "$1")} and r.${quoteIdent(config.idColumn)} = ${castForId(config, "$2")} limit 1`, [providerId, recordId]);
  if (!rows[0]) throw new Error("Record not found for this provider.");
  return { config, row: rows[0] as ProviderResourceRow, role };
}

function parseJson(value: string, fallback: any) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try { return JSON.parse(trimmed); } catch { throw new Error("Invalid JSON value. Please enter valid JSON."); }
}

function normalizeFieldValue(field: ProviderResourceField, value: FormDataEntryValue | null) {
  if (field.readOnly) return undefined;
  if (field.type === "boolean") return value === "on" || value === "true";
  const stringValue = typeof value === "string" ? value.trim() : "";
  if (!stringValue && !field.required) return null;
  if (field.required && !stringValue) throw new Error(`${field.label} is required.`);
  switch (field.type) {
    case "number": return stringValue ? Number(stringValue) : null;
    case "translations": return parseJson(stringValue, {});
    case "json": return parseJson(stringValue, {});
    case "csv": return stringValue ? stringValue.split(",").map((item) => item.trim()).filter(Boolean) : [];
    case "datetime": return stringValue ? stringValue.replace("T", " ") : null;
    default: return stringValue || null;
  }
}

function fieldsFromForm(config: ProviderResourceConfig, formData: FormData) {
  const values: Record<string, any> = {};
  for (const field of config.fields) {
    const value = normalizeFieldValue(field, formData.get(field.name));
    if (value !== undefined) values[field.name] = value;
  }
  return values;
}

function providerOwnershipInsertValues(config: ProviderResourceConfig, providerId: string, values: Record<string, any>) {
  if (config.ownership.kind === "provider") values[config.ownership.providerColumn] = providerId;
  if (config.ownership.kind === "booking") values[config.ownership.providerColumn] = providerId;
  return values;
}

async function assertRelationBelongsToProvider(providerId: string, field: ProviderResourceField, value: any) {
  if (!value || typeof value !== "string") return;
  if (field.optionSource === "provider-services") {
    const rows = await sql<{ ok: boolean }[]>`select true as ok from category.provider_services where id = ${value}::uuid and service_provider_id = ${providerId}::uuid limit 1`;
    if (!rows[0]) throw new Error("Selected provider service does not belong to this provider.");
  }
  if (field.optionSource === "provider-staff") {
    const rows = await sql<{ ok: boolean }[]>`select true as ok from category.provider_staffs where staff_id = ${value}::uuid and service_provider_id = ${providerId}::uuid limit 1`;
    if (!rows[0]) throw new Error("Selected staff member does not belong to this provider.");
  }
}

async function assertOwnedRelations(providerId: string, config: ProviderResourceConfig, values: Record<string, any>) {
  for (const field of config.fields) await assertRelationBelongsToProvider(providerId, field, values[field.name]);
}

async function getTableColumnNames(config: ProviderResourceConfig) {
  const parts = tableParts(config.table);
  const rows = await sql<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema = ${parts.schema}
      and table_name = ${parts.table}
  `;
  return new Set(rows.map((row) => row.column_name));
}

function isSqlExpression(value: any): value is { __sql: string } {
  return value && typeof value === "object" && typeof value.__sql === "string";
}

async function addInsertAuditValues(config: ProviderResourceConfig, values: Record<string, any>) {
  const columns = await getTableColumnNames(config);
  if (config.idType !== "integer" && config.idType !== "text" && columns.has(config.idColumn) && values[config.idColumn] === undefined) values[config.idColumn] = { __sql: "gen_random_uuid()" };
  if (columns.has("create_date") && values.create_date === undefined) values.create_date = { __sql: "now()" };
  if (columns.has("created_at") && values.created_at === undefined) values.created_at = { __sql: "now()" };
  if (columns.has("last_modified_date") && values.last_modified_date === undefined) values.last_modified_date = { __sql: "now()" };
  if (columns.has("updated_at") && values.updated_at === undefined) values.updated_at = { __sql: "now()" };
  return values;
}

async function addUpdateAuditValues(config: ProviderResourceConfig, values: Record<string, any>) {
  const columns = await getTableColumnNames(config);
  if (columns.has("last_modified_date")) values.last_modified_date = { __sql: "now()" };
  if (columns.has("updated_at")) values.updated_at = { __sql: "now()" };
  return values;
}

export async function createProviderResourceRow(userId: string, providerId: string, resourceKey: string, formData: FormData) {
  const config = getProviderResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown provider portal resource.");
  await requirePermission(userId, providerId, config, "create");
  const table = splitTable(config.table);
  const values = await addInsertAuditValues(config, providerOwnershipInsertValues(config, providerId, fieldsFromForm(config, formData)));
  await assertOwnedRelations(providerId, config, values);
  const columns = Object.keys(values).filter((name) => values[name] !== undefined);
  const args: any[] = [];
  const params = columns.map((name) => {
    const value = values[name];
    if (isSqlExpression(value)) return value.__sql;
    args.push(value);
    return `$${args.length}`;
  });
  const rows = await sql.unsafe(`insert into ${table} (${columns.map(quoteIdent).join(", ")}) values (${params.join(", ")}) returning ${quoteIdent(config.idColumn)}::text as id`, args);
  return String(rows[0]?.id || "");
}

export async function updateProviderResourceRow(userId: string, providerId: string, resourceKey: string, recordId: string, formData: FormData) {
  const config = getProviderResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown provider portal resource.");
  await requirePermission(userId, providerId, config, "update");
  await getProviderResourceRow(userId, providerId, resourceKey, recordId);
  const table = splitTable(config.table);
  const values = await addUpdateAuditValues(config, fieldsFromForm(config, formData));
  await assertOwnedRelations(providerId, config, values);
  const columns = Object.keys(values).filter((name) => values[name] !== undefined && name !== config.idColumn);
  if (!columns.length) return true;
  const args: any[] = [providerId, recordId];
  const setSql = columns.map((name) => {
    const value = values[name];
    if (isSqlExpression(value)) return `${quoteIdent(name)} = ${value.__sql}`;
    args.push(value);
    return `${quoteIdent(name)} = $${args.length}`;
  }).join(", ");
  await sql.unsafe(`update ${table} r set ${setSql} where ${ownershipWhere(config, "$1")} and r.${quoteIdent(config.idColumn)} = ${castForId(config, "$2")}`, args);
  return true;
}

export async function deleteProviderResourceRow(userId: string, providerId: string, resourceKey: string, recordId: string) {
  const config = getProviderResourceConfig(resourceKey);
  if (!config) throw new Error("Unknown provider portal resource.");
  await requirePermission(userId, providerId, config, "delete");
  await getProviderResourceRow(userId, providerId, resourceKey, recordId);
  const table = splitTable(config.table);
  const args = [providerId, recordId];
  const query = config.softDeleteColumn
    ? `update ${table} r set ${quoteIdent(config.softDeleteColumn)} = false where ${ownershipWhere(config, "$1")} and r.${quoteIdent(config.idColumn)} = ${castForId(config, "$2")}`
    : `delete from ${table} r where ${ownershipWhere(config, "$1")} and r.${quoteIdent(config.idColumn)} = ${castForId(config, "$2")}`;
  await sql.unsafe(query, args);
  return true;
}

export async function getProviderResourceOptions(providerId: string, source: ProviderResourceField["optionSource"], locale: string): Promise<ProviderResourceOption[]> {
  if (!source) return [];
  const lang = locale || "en-US";
  switch (source) {
    case "provider-services": return sql<ProviderResourceOption[]>`select ps.id::text as value, common.get_translation_t(ps.display_name_translations, ${lang}, 'en-US') as label from category.provider_services ps where ps.service_provider_id = ${providerId}::uuid order by label asc`;
    case "service-definitions": return sql<ProviderResourceOption[]>`select sd.id::text as value, common.get_translation_t(sd.name_translations, ${lang}, 'en-US') as label from category.service_definitions sd where sd.is_active = true order by label asc`;
    case "provider-staff": return sql<ProviderResourceOption[]>`select s.id::text as value, common.get_translation_t(s.name_translations, ${lang}, 'en-US') as label from category.provider_staffs pst join category.staff s on s.id = pst.staff_id where pst.service_provider_id = ${providerId}::uuid order by label asc`;
    case "all-staff": return sql<ProviderResourceOption[]>`select s.id::text as value, common.get_translation_t(s.name_translations, ${lang}, 'en-US') as label from category.staff s where s.is_active = true order by label asc limit 500`;
    case "addons": return sql<ProviderResourceOption[]>`select a.id::text as value, a.name as label from category.addons a where a.is_active = true order by a.name asc`;
    case "policy-types": return sql<ProviderResourceOption[]>`select ppt.id::text as value, common.get_translation_t(ppt.name_translations, ${lang}, 'en-US') as label from category.provider_policy_types ppt where ppt.is_active = true order by ppt.display_order asc, label asc`;
    case "availability-statuses": return sql<ProviderResourceOption[]>`select id::text as value, name as label from category.staff_availability_statuses order by id asc`;
    case "currencies": return sql<ProviderResourceOption[]>`select code as value, concat(code, ' - ', name) as label from finance.currencies where is_active = true order by sort_order asc, code asc`;
    default: return [];
  }
}

export async function getOptionsForResourceForm(providerId: string, config: ProviderResourceConfig, locale: string) {
  const result: Record<string, ProviderResourceOption[]> = {};
  for (const field of config.fields) if (field.optionSource) result[field.name] = await getProviderResourceOptions(providerId, field.optionSource, locale);
  return result;
}
