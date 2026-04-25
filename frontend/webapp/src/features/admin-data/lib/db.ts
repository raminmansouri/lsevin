import "server-only";

import sql from "@/config/database/db";

import { ADMIN_TABLES_BY_KEY, getAdminTableConfig } from "../config";
import type { AdminListResult, AdminRelationOption, AdminRow, AdminSchemaName, AdminTableConfig, RelationConfig } from "../types";
import { coerceFieldValue } from "./values";

function qIdent(value: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `"${value}"`;
}

function tableIdent(schema: string, table: string) {
  return `${qIdent(schema)}.${qIdent(table)}`;
}

function ph(index: number) {
  return `$${index}`;
}

function assertTable(schema: string, table: string): AdminTableConfig {
  const config = getAdminTableConfig(schema, table);
  if (!config) throw new Error(`Admin table is not whitelisted: ${schema}.${table}`);
  return config;
}

function assertRelation(relation: RelationConfig) {
  const key = `${relation.schema}.${relation.table}`;
  const inAdminWhitelist = Boolean(ADMIN_TABLES_BY_KEY[key]);
  const allowedLookup = relation.schema === "category";
  if (!inAdminWhitelist && !allowedLookup) throw new Error(`Relation table is not whitelisted: ${key}`);
}

function fieldNames(config: AdminTableConfig) {
  return config.fields.map((field) => field.name);
}

function createPayload(config: AdminTableConfig, input: Record<string, unknown>, mode: "create" | "update") {
  const allowed = new Set(fieldNames(config));
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (!allowed.has(field.name)) continue;
    if (field.hidden || field.readonly) continue;
    if (mode === "create" && field.createHidden) continue;
    if (mode === "update" && field.updateHidden) continue;
    if (config.primaryKey.includes(field.name) && mode === "update") continue;
    if (!(field.name in input)) continue;
    payload[field.name] = coerceFieldValue(field, input[field.name]);
  }

  return payload;
}

function buildSearchWhere(config: AdminTableConfig, search?: string, startIndex = 1) {
  if (!search?.trim() || !config.searchableColumns?.length) return { sql: "", params: [] as unknown[] };
  const term = `%${search.trim()}%`;
  const clauses = config.searchableColumns.map((column, index) => `${qIdent(column)}::text ilike ${ph(startIndex + index)}`);
  return { sql: ` where (${clauses.join(" or ")})`, params: config.searchableColumns.map(() => term) };
}

function buildPkWhere(config: AdminTableConfig, id: Record<string, unknown>, startIndex = 1) {
  const missing = config.primaryKey.filter((key) => id[key] === undefined || id[key] === null || id[key] === "");
  if (missing.length) throw new Error(`Missing primary key: ${missing.join(", ")}`);
  const clauses = config.primaryKey.map((column, index) => `${qIdent(column)} = ${ph(startIndex + index)}`);
  return { sql: clauses.join(" and "), params: config.primaryKey.map((key) => id[key]) };
}

function normalizeSort(config: AdminTableConfig, sort?: string) {
  if (!sort) return config.defaultOrderBy || config.primaryKey.map(qIdent).join(", ");
  const [column, direction] = sort.split(":");
  const allowed = new Set(fieldNames(config));
  if (!allowed.has(column)) return config.defaultOrderBy || config.primaryKey.map(qIdent).join(", ");
  const dir = direction?.toLowerCase() === "asc" ? "asc" : "desc";
  return `${qIdent(column)} ${dir}`;
}

export async function listAdminRows(args: {
  schema: AdminSchemaName;
  table: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
}): Promise<AdminListResult> {
  const config = assertTable(args.schema, args.table);
  const page = Math.max(1, Number(args.page || 1));
  const pageSize = Math.min(100, Math.max(5, Number(args.pageSize || 20)));
  const offset = (page - 1) * pageSize;
  const where = buildSearchWhere(config, args.search, 1);
  const orderBy = normalizeSort(config, args.sort);
  const tableSql = tableIdent(config.schema, config.table);
  const limitParam = where.params.length + 1;
  const offsetParam = where.params.length + 2;

  const rows = await sql.unsafe(
    `select * from ${tableSql}${where.sql} order by ${orderBy} limit ${ph(limitParam)} offset ${ph(offsetParam)}`,
    [...where.params, pageSize, offset]
  ) as AdminRow[];

  const countRows = await sql.unsafe(
    `select count(*)::int as total from ${tableSql}${where.sql}`,
    where.params
  ) as { total: number }[];

  const total = Number(countRows[0]?.total || 0);
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAdminRow(schema: AdminSchemaName, table: string, id: Record<string, unknown>) {
  const config = assertTable(schema, table);
  const where = buildPkWhere(config, id, 1);
  const rows = await sql.unsafe(
    `select * from ${tableIdent(config.schema, config.table)} where ${where.sql} limit 1`,
    where.params
  ) as AdminRow[];
  return rows[0] || null;
}

export async function createAdminRow(schema: AdminSchemaName, table: string, values: Record<string, unknown>) {
  const config = assertTable(schema, table);
  if (config.readOnly) throw new Error(`${config.title} is read-only.`);
  const payload = createPayload(config, values, "create");
  const columns = Object.keys(payload);
  if (!columns.length) throw new Error("Nothing to create.");
  const columnSql = columns.map(qIdent).join(", ");
  const placeholders = columns.map((_, index) => ph(index + 1)).join(", ");
  const returning = config.primaryKey.map(qIdent).join(", ");
  const rows = await sql.unsafe(
    `insert into ${tableIdent(config.schema, config.table)} (${columnSql}) values (${placeholders}) returning ${returning}`,
    columns.map((column) => payload[column])
  ) as AdminRow[];
  return rows[0];
}

export async function updateAdminRow(schema: AdminSchemaName, table: string, id: Record<string, unknown>, values: Record<string, unknown>) {
  const config = assertTable(schema, table);
  if (config.readOnly) throw new Error(`${config.title} is read-only.`);
  const payload = createPayload(config, values, "update");
  const columns = Object.keys(payload);
  if (!columns.length) throw new Error("Nothing to update.");
  const setSql = columns.map((column, index) => `${qIdent(column)} = ${ph(index + 1)}`).join(", ");
  const where = buildPkWhere(config, id, columns.length + 1);
  const returning = config.primaryKey.map(qIdent).join(", ");
  const rows = await sql.unsafe(
    `update ${tableIdent(config.schema, config.table)} set ${setSql} where ${where.sql} returning ${returning}`,
    [...columns.map((column) => payload[column]), ...where.params]
  ) as AdminRow[];
  return rows[0];
}

export async function deleteAdminRow(schema: AdminSchemaName, table: string, id: Record<string, unknown>) {
  const config = assertTable(schema, table);
  if (config.readOnly) throw new Error(`${config.title} is read-only.`);
  const where = buildPkWhere(config, id, 1);
  await sql.unsafe(`delete from ${tableIdent(config.schema, config.table)} where ${where.sql}`, where.params);
  return true;
}

export async function listRelationOptions(relation: RelationConfig, search?: string): Promise<AdminRelationOption[]> {
  assertRelation(relation);
  const tableSql = tableIdent(relation.schema, relation.table);
  const searchColumns = relation.searchColumns || [];
  const params: unknown[] = [];
  const whereParts: string[] = [];

  if (relation.where) whereParts.push(`(${relation.where})`);
  if (search?.trim() && searchColumns.length) {
    const term = `%${search.trim()}%`;
    const start = params.length + 1;
    whereParts.push(`(${searchColumns.map((column, index) => `${qIdent(column)}::text ilike ${ph(start + index)}`).join(" or ")})`);
    params.push(...searchColumns.map(() => term));
  }

  const whereSql = whereParts.length ? ` where ${whereParts.join(" and ")}` : "";
  const orderBy = relation.orderBy || `${qIdent(relation.valueColumn)} asc`;
  const rows = await sql.unsafe(
    `select ${qIdent(relation.valueColumn)}::text as value, ${relation.labelExpression}::text as label from ${tableSql}${whereSql} order by ${orderBy} limit 50`,
    params
  ) as AdminRelationOption[];

  return rows.map((row) => ({ value: row.value, label: row.label || row.value }));
}

export async function getAdminDashboardCounts() {
  const results = [];
  for (const config of Object.values(ADMIN_TABLES_BY_KEY)) {
    const rows = await sql.unsafe(`select count(*)::int as total from ${tableIdent(config.schema, config.table)}`) as { total: number }[];
    results.push({
      schema: config.schema,
      table: config.table,
      title: config.title,
      description: config.description,
      total: Number(rows[0]?.total || 0),
      href: `/admin/platform-data/${config.schema}/${config.table}`,
      readOnly: config.readOnly,
    });
  }
  return results;
}

export async function runIdentityUserCommand(command: "activate" | "suspend" | "confirm-profile" | "clear-lockout", userId: string) {
  if (command === "activate") await sql.unsafe(`update identity.asp_net_users set user_state = 'Active' where id = $1`, [userId]);
  if (command === "suspend") await sql.unsafe(`update identity.asp_net_users set user_state = 'Suspended' where id = $1`, [userId]);
  if (command === "confirm-profile") {
    await sql.unsafe(`update identity.asp_net_users set is_profile_confirmed = true, profile_confirmed_at = now() where id = $1`, [userId]);
    await sql.unsafe(`update customer.customers set is_profile_confirmed = true, profile_confirmed_at = now() where id = $1`, [userId]);
  }
  if (command === "clear-lockout") await sql.unsafe(`update identity.asp_net_users set access_failed_count = 0, lockout_end = null where id = $1`, [userId]);
  return true;
}

export async function revokeRefreshToken(tokenId: string) {
  await sql.unsafe(`update identity.refresh_tokens set revoked_at = now() where id = $1 and revoked_at is null`, [tokenId]);
  return true;
}
