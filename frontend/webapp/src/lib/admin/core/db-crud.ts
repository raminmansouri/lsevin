// db-crud.ts
import { getEnumValuesForColumn } from "./db-builder-enums";
import {
  SqlClient,
  TableRefInput,
  TableMetadata,
  ColumnMetadata,
  getTableMetadataByName,
  getColumnsAndMetadataByTableName,
} from "./db-introspection";


export type CrudOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "like"
  | "ilike"
  | "between"
  | "is_null"
  | "is_not_null";

export type CrudPredicate = {
  op: CrudOperator;
  value?: unknown;
};

export type CrudWhere = Record<string, unknown | CrudPredicate>;

export type CrudOrderBy = {
  field: string;
  direction?: "asc" | "desc";
};

export type CrudReturning = "*" | string[];

export type SelectOptions = {
  columns?: string[];
  where?: CrudWhere;
  orderBy?: CrudOrderBy[];
  limit?: number;
  offset?: number;
};

export type MutationOptions = {
  returning?: CrudReturning;
  validateForeignKeys?: boolean;
};

export type UpdateBulkInput = {
  keyColumn?: string;
  rows: Array<{
    key: unknown;
    data: Record<string, unknown>;
  }>;
};

export class CrudValidationError extends Error {
  public issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = "CrudValidationError";
    this.issues = issues;
  }
}

type TableRef = {
  schema: string;
  table: string;
};

type TableRuntimeMeta = {
  ref: TableRef;
  table: TableMetadata;
  columns: ColumnMetadata[];
  columnsByName: Map<string, ColumnMetadata>;
  primaryKey: string | null;
  enumCache: Map<string, string[]>;
};

const tableMetaCache = new Map<string, Promise<TableRuntimeMeta>>();

function parseTableRef(input: TableRefInput, defaultSchema = "public"): TableRef {
  if (typeof input !== "string") {
    return {
      schema: input.schema ?? defaultSchema,
      table: input.table,
    };
  }

  const parts = input.split(".");
  if (parts.length === 2) {
    return {
      schema: parts[0],
      table: parts[1],
    };
  }

  return {
    schema: defaultSchema,
    table: input,
  };
}

function getTableCacheKey(ref: TableRef): string {
  return `${ref.schema}.${ref.table}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function joinFragments(sql: SqlClient, fragments: any[], separator: any) {
  return fragments.flatMap((fragment, index) => [index ? separator : sql``, fragment]);
}

function normalizeDataObject(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function getPrimaryKey(columns: ColumnMetadata[]): string | null {
  return columns.find((c) => c.isPrimaryKey)?.columnName ?? null;
}

function isInsertableColumn(column: ColumnMetadata): boolean {
  if (column.isGenerated) return false;
  if (column.isIdentity) return false;
  return true;
}

function isUpdatableColumn(column: ColumnMetadata): boolean {
  if (column.isGenerated) return false;
  if (column.isIdentity) return false;
  // if (column.isPrimaryKey) return false;
  return true;
}

function ensureNonEmptyObject(obj: Record<string, unknown>, message: string) {
  if (Object.keys(obj).length === 0) {
    throw new CrudValidationError(message);
  }
}

function ensureValidColumnsExist(
  columnsByName: Map<string, ColumnMetadata>,
  keys: string[],
  context: string
) {
  const invalid = keys.filter((key) => !columnsByName.has(key));
  if (invalid.length > 0) {
    throw new CrudValidationError(`Invalid ${context} column(s).`, invalid.map((x) => `${context}: ${x}`));
  }
}

function ensureLimitOffset(limit?: number, offset?: number) {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) {
    throw new CrudValidationError("limit must be a non-negative integer.");
  }
  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    throw new CrudValidationError("offset must be a non-negative integer.");
  }
}

function ensureReturningColumns(meta: TableRuntimeMeta, returning?: CrudReturning) {
  if (!returning || returning === "*") return;
  ensureValidColumnsExist(meta.columnsByName, returning, "returning");
}

function buildQualifiedTable(sql: SqlClient, ref: TableRef) {
  return sql`${sql(ref.schema)}.${sql(ref.table)}`;
}

function buildColumnsFragment(sql: SqlClient, columns: string[]) {
  return sql`${joinFragments(
    sql,
    columns.map((column) => sql`${sql(column)}`),
    sql`,`
  )}`;
}

function buildReturningFragment(sql: SqlClient, meta: TableRuntimeMeta, returning?: CrudReturning) {
  ensureReturningColumns(meta, returning);
  if (!returning) return sql``;
  if (returning === "*") return sql` returning *`;
  return sql` returning ${buildColumnsFragment(sql, returning)}`;
}

function buildOrderByFragment(sql: SqlClient, meta: TableRuntimeMeta, orderBy?: CrudOrderBy[]) {
  if (!orderBy || orderBy.length === 0) return sql``;

  const fields = orderBy.map((x) => x.field);
  ensureValidColumnsExist(meta.columnsByName, fields, "orderBy");

  return sql`
    order by ${joinFragments(
      sql,
      orderBy.map((item) => sql`${sql(item.field)} ${item.direction === "desc" ? sql`desc` : sql`asc`}`),
      sql`,`
    )}
  `;
}

function normalizePredicate(input: unknown): CrudPredicate {
  if (isPlainObject(input) && "op" in input) {
    return input as CrudPredicate;
  }
  return { op: "eq", value: input };
}

function isUuid(value: string): boolean {
  return true;
  //return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isIntegerDataType(type: string): boolean {
  return ["smallint", "integer"].includes(type);
}

function isBigIntDataType(type: string): boolean {
  return ["bigint"].includes(type);
}

function isNumericDataType(type: string): boolean {
  return [
    "smallint",
    "integer",
    "bigint",
    "numeric",
    "decimal",
    "real",
    "double precision",
  ].includes(type);
}

function isStringDataType(type: string, udt: string): boolean {
  return ["text", "character varying", "character"].includes(type) || ["varchar", "bpchar", "text"].includes(udt);
}

function isJsonDataType(type: string, udt: string): boolean {
  return type === "json" || type === "jsonb" || udt === "json" || udt === "jsonb";
}

function isBooleanDataType(type: string): boolean {
  return type === "boolean";
}

function isDateDataType(type: string): boolean {
  return type === "date";
}

function isTimeDataType(type: string): boolean {
  return type === "time without time zone" || type === "time with time zone" || type === "time";
}

function isTimestampDataType(type: string): boolean {
  return type === "timestamp without time zone" || type === "timestamp with time zone";
}

async function getEnumValues(sql: SqlClient, meta: TableRuntimeMeta, column: ColumnMetadata): Promise<string[]> {
  if (!column.isEnum) return [];

  const cached = meta.enumCache.get(column.columnName);
  if (cached) return cached;

  const values = await getEnumValuesForColumn(sql, {
    schema: meta.ref.schema,
    table: meta.ref.table,
    column,
  });

  meta.enumCache.set(column.columnName, values);
  return values;
}

async function coerceScalarValue(
  sql: SqlClient,
  meta: TableRuntimeMeta,
  column: ColumnMetadata,
  rawValue: unknown,
  mode: "insert" | "update" | "where"
): Promise<unknown> {
  if (rawValue === undefined) return undefined;
  if (rawValue === '' && (column.columnDefault || column.isNullable)) return rawValue;

  if (rawValue === null) {
    if (!column.isNullable && mode !== "where") {
      throw new CrudValidationError(`Column "${column.columnName}" does not allow null.`);
    }
    return null;
  }

  const type = column.dataType.toLowerCase();
  const udt = column.udtName.toLowerCase();

  if (column.isEnum) {
    const allowed = await getEnumValues(sql, meta, column);
    const value = String(rawValue);
    if (!allowed.includes(value)) {
      throw new CrudValidationError(
        `Invalid enum value for column "${column.columnName}".`,
        [`Allowed values: ${allowed.join(", ")}`]
      );
    }
    return value;
  }

  if (udt === "uuid") {
    const value = String(rawValue);
    if (!isUuid(value)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects a UUID.`);
    }
    return value;
  }

  if (isBooleanDataType(type)) {
    if (typeof rawValue === "boolean") return rawValue;
    if (rawValue === "true" || rawValue === "1" || rawValue === 1) return true;
    if (rawValue === "false" || rawValue === "0" || rawValue === 0) return false;
    throw new CrudValidationError(`Column "${column.columnName}" expects a boolean.`);
  }

  if (isIntegerDataType(type)) {
    const parsed = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isInteger(parsed)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects an integer.`);
    }
    return parsed;
  }

  if (isBigIntDataType(type)) {
    if (typeof rawValue === "bigint") return rawValue.toString();

    if (typeof rawValue === "number") {
      if (!Number.isInteger(rawValue)) {
        throw new CrudValidationError(`Column "${column.columnName}" expects a bigint integer.`);
      }
      return Number.isSafeInteger(rawValue) ? rawValue : String(rawValue);
    }

    const value = String(rawValue);
    if (!/^-?\d+$/.test(value)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects a bigint integer.`);
    }
    return value;
  }

  if (isNumericDataType(type)) {
    if (typeof rawValue === "number") {
      if (!Number.isFinite(rawValue)) {
        throw new CrudValidationError(`Column "${column.columnName}" expects a finite number.`);
      }
      return rawValue;
    }

    const value = String(rawValue);
    if (!/^-?\d+(\.\d+)?$/.test(value)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects a numeric value.`);
    }
    return value;
  }

  if (isDateDataType(type)) {
    if (rawValue instanceof Date) {
      return rawValue.toISOString().slice(0, 10);
    }
    const value = String(rawValue);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects a date in YYYY-MM-DD format.`);
    }
    return value;
  }

  if (isTimeDataType(type)) {
    if (rawValue instanceof Date) {
      return rawValue.toISOString().slice(11, 19);
    }
    const value = String(rawValue);
    if (!/^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(value)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects a time value.`);
    }
    return value;
  }

  if (isTimestampDataType(type)) {
    if (rawValue instanceof Date) {
      return rawValue.toISOString();
    }
    const value = String(rawValue);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new CrudValidationError(`Column "${column.columnName}" expects a timestamp/datetime value.`);
    }
    return value;
  }

  if (isJsonDataType(type, udt)) {
    if (typeof rawValue === "string") {
      try {
        JSON.parse(rawValue);
        return rawValue;
      } catch {
        throw new CrudValidationError(`Column "${column.columnName}" expects valid JSON.`);
      }
    }

    try {
      return JSON.stringify(rawValue);
    } catch {
      throw new CrudValidationError(`Column "${column.columnName}" expects JSON-serializable data.`);
    }
  }

  if (column.isArray) {
    if (!Array.isArray(rawValue)) {
      throw new CrudValidationError(`Column "${column.columnName}" expects an array.`);
    }
    return rawValue;
  }

  if (isStringDataType(type, udt)) {
    const value = String(rawValue);
    if (column.characterMaximumLength && value.length > column.characterMaximumLength) {
      throw new CrudValidationError(
        `Column "${column.columnName}" exceeds max length ${column.characterMaximumLength}.`
      );
    }
    return value;
  }

  return rawValue;
}

async function validateDataForInsertOrUpdate(
  sql: SqlClient,
  meta: TableRuntimeMeta,
  input: Record<string, unknown>,
  mode: "insert" | "update"
): Promise<Record<string, unknown>> {
  const data = normalizeDataObject(input);
  ensureValidColumnsExist(meta.columnsByName, Object.keys(data), mode);

  const issues: string[] = [];
  const out: Record<string, unknown> = {};

  for (const [columnName, rawValue] of Object.entries(data)) {
    const column = meta.columnsByName.get(columnName)!;

    if (mode === "insert" && !isInsertableColumn(column)) {
      issues.push(`Column "${columnName}" cannot be explicitly inserted.`);
      continue;
    }

    if (mode === "update" && !isUpdatableColumn(column)) {
      issues.push(`Column "${columnName}" cannot be updated.`);
      continue;
    }

    try {
      out[columnName] = await coerceScalarValue(sql, meta, column, rawValue, mode);
    } catch (error) {
      if (error instanceof CrudValidationError) {
        issues.push(...(error.issues.length ? error.issues : [error.message]));
      } else {
        issues.push(`Validation failed for column "${columnName}".`);
      }
    }
  }

  if (mode === "insert") {
    for (const column of meta.columns) {
      if (!isInsertableColumn(column)) continue;
      if (column.isNullable) continue;
      if (column.columnDefault) continue;
      if (column.isPrimaryKey) continue;

      if (!(column.columnName in out)) {
        issues.push(`Required column "${column.columnName}" is missing.`);
      }
    }
  }

  if (issues.length > 0) {
    console.error(issues)
    throw new CrudValidationError(`Invalid ${mode} payload.`, issues);
  }

  return out;
}

async function validateWhereObject(
  sql: SqlClient,
  meta: TableRuntimeMeta,
  where?: CrudWhere
): Promise<Array<{ column: string; predicate: CrudPredicate; value?: unknown }>> {
  if (!where) return [];

  ensureValidColumnsExist(meta.columnsByName, Object.keys(where), "where");

  const conditions: Array<{ column: string; predicate: CrudPredicate; value?: unknown }> = [];
  const issues: string[] = [];

  for (const [columnName, rawInput] of Object.entries(where)) {
    const column = meta.columnsByName.get(columnName)!;
    const predicate = normalizePredicate(rawInput);

    try {
      switch (predicate.op) {
        case "is_null":
        case "is_not_null":
          conditions.push({ column: columnName, predicate });
          break;

        case "in":
        case "not_in": {
          if (!Array.isArray(predicate.value) || predicate.value.length === 0) {
            throw new CrudValidationError(`Where "${columnName}" with operator "${predicate.op}" expects a non-empty array.`);
          }

          const values: unknown[] = [];
          for (const item of predicate.value) {
            values.push(await coerceScalarValue(sql, meta, column, item, "where"));
          }

          conditions.push({ column: columnName, predicate, value: values });
          break;
        }

        case "between": {
          if (!Array.isArray(predicate.value) || predicate.value.length !== 2) {
            throw new CrudValidationError(`Where "${columnName}" with operator "between" expects [from, to].`);
          }

          const from = await coerceScalarValue(sql, meta, column, predicate.value[0], "where");
          const to = await coerceScalarValue(sql, meta, column, predicate.value[1], "where");
          conditions.push({ column: columnName, predicate, value: [from, to] });
          break;
        }

        case "like":
        case "ilike":
          conditions.push({
            column: columnName,
            predicate,
            value: String(predicate.value ?? ""),
          });
          break;

        default: {
          const value = await coerceScalarValue(sql, meta, column, predicate.value, "where");
          conditions.push({ column: columnName, predicate, value });
          break;
        }
      }
    } catch (error) {
      if (error instanceof CrudValidationError) {
        issues.push(...(error.issues.length ? error.issues : [error.message]));
      } else {
        issues.push(`Invalid where clause for "${columnName}".`);
      }
    }
  }

  if (issues.length > 0) {
    throw new CrudValidationError("Invalid where clause.", issues);
  }

  return conditions;
}

function buildWhereFragment(
  sql: SqlClient,
  conditions: Array<{ column: string; predicate: CrudPredicate; value?: unknown }>
) {
  if (conditions.length === 0) return sql``;

  const fragments = conditions.map(({ column, predicate, value }) => {
    switch (predicate.op) {
      case "eq":
        if (value === null) return sql`${sql(column)} is null`;
        return sql`${sql(column)} = ${value}`;

      case "neq":
        if (value === null) return sql`${sql(column)} is not null`;
        return sql`${sql(column)} <> ${value}`;

      case "gt":
        return sql`${sql(column)} > ${value}`;

      case "gte":
        return sql`${sql(column)} >= ${value}`;

      case "lt":
        return sql`${sql(column)} < ${value}`;

      case "lte":
        return sql`${sql(column)} <= ${value}`;

      case "in":
        return sql`${sql(column)} in ${sql(value as unknown[])}`;

      case "not_in":
        return sql`${sql(column)} not in ${sql(value as unknown[])}`;

      case "like":
        return sql`${sql(column)} like ${value}`;

      case "ilike":
        return sql`${sql(column)} ilike ${value}`;

      case "between":
        return sql`${sql(column)} between ${(value as unknown[])[0]} and ${(value as unknown[])[1]}`;

      case "is_null":
        return sql`${sql(column)} is null`;

      case "is_not_null":
        return sql`${sql(column)} is not null`;

      default:
        throw new CrudValidationError(`Unsupported where operator: ${predicate.op}`);
    }
  });

  return sql` where ${joinFragments(sql, fragments, sql` and `)}`;
}

async function validateForeignKeysIfRequested(
  sql: SqlClient,
  meta: TableRuntimeMeta,
  data: Record<string, unknown>,
  validateForeignKeys?: boolean
) {
  if (!validateForeignKeys) return;

  const issues: string[] = [];

  for (const [columnName, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    const column = meta.columnsByName.get(columnName);
    if (!column) continue;
    if (column.manyToOne.length !== 1) continue;

    const relation = column.manyToOne[0];
    const rows = await sql`
      select 1
      from ${sql(relation.foreignSchema)}.${sql(relation.foreignTable)}
      where ${sql(relation.foreignColumn)} = ${value}
      limit 1
    `;

    if (rows.length === 0) {
      issues.push(
        `Foreign key check failed for "${columnName}": ${relation.foreignSchema}.${relation.foreignTable}.${relation.foreignColumn} does not contain value "${String(value)}".`
      );
    }
  }

  if (issues.length > 0) {
    throw new CrudValidationError("Foreign key validation failed.", issues);
  }
}

async function getTableRuntimeMeta(sql: SqlClient, tableRefInput: TableRefInput): Promise<TableRuntimeMeta> {
  const ref = parseTableRef(tableRefInput);
  const cacheKey = getTableCacheKey(ref);

  if (tableMetaCache.has(cacheKey)) {
    return tableMetaCache.get(cacheKey)!;
  }

  const promise = (async () => {
    const [table, columns] = await Promise.all([
      getTableMetadataByName(sql, ref),
      getColumnsAndMetadataByTableName(sql, ref),
    ]);

    if (!table) {
      throw new CrudValidationError(`Table "${ref.schema}.${ref.table}" does not exist.`);
    }

    if (columns.length === 0) {
      throw new CrudValidationError(`Table "${ref.schema}.${ref.table}" has no columns or could not be introspected.`);
    }

    return {
      ref,
      table,
      columns,
      columnsByName: new Map(columns.map((column) => [column.columnName, column])),
      primaryKey: getPrimaryKey(columns),
      enumCache: new Map<string, string[]>(),
    };
  })();

  tableMetaCache.set(cacheKey, promise);

  try {
    return await promise;
  } catch (error) {
    tableMetaCache.delete(cacheKey);
    throw error;
  }
}

export function clearCrudMetadataCache(tableRefInput?: TableRefInput) {
  if (!tableRefInput) {
    tableMetaCache.clear();
    return;
  }

  const ref = parseTableRef(tableRefInput);
  tableMetaCache.delete(getTableCacheKey(ref));
}

export async function insert(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  data: Record<string, unknown>,
  options: MutationOptions = {}
) {
  const meta = await getTableRuntimeMeta(sql, tableRefInput);
  const payload = await validateDataForInsertOrUpdate(sql, meta, data, "insert");
  await validateForeignKeysIfRequested(sql, meta, payload, options.validateForeignKeys);

  const columns = Object.keys(payload);
  const returningFragment = buildReturningFragment(sql, meta, options.returning);


  if (columns.length === 0) {
    return sql`
      insert into ${buildQualifiedTable(sql, meta.ref)}
      default values
      ${returningFragment}
    `;
  }
  
  let columnsRefined = [...columns];
  for(const col of columns)
  {
      const columnMeta= meta.columns.find(f=>f.columnName==col)
      if(columnMeta.columnDefault || columnMeta.isNullable )
       {
         if(payload[col] === '')
        {
          delete payload[col];
          columnsRefined =columnsRefined.filter(f=>f!==col);
        }
       }
           
  }
  
  const values = columnsRefined.map((column) => payload[column]);


  return sql`
    insert into ${buildQualifiedTable(sql, meta.ref)}
    (${buildColumnsFragment(sql, columnsRefined)})
    values ${sql(values)}
    ${returningFragment}
  `;
}

export async function insertBulk(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  rows: Array<Record<string, unknown>>,
  options: MutationOptions = {}
) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new CrudValidationError("insertBulk requires at least one row.");
  }

  const meta = await getTableRuntimeMeta(sql, tableRefInput);
  const validatedRows = await Promise.all(
    rows.map(async (row, index) => {
      if (!isPlainObject(row)) {
        throw new CrudValidationError(`insertBulk row at index ${index} must be an object.`);
      }

      const payload = await validateDataForInsertOrUpdate(sql, meta, row, "insert");
      await validateForeignKeysIfRequested(sql, meta, payload, options.validateForeignKeys);
      return payload;
    })
  );

  const grouped = new Map<string, { columns: string[]; rows: Record<string, unknown>[] }>();

  for (const row of validatedRows) {
    const columns = Object.keys(row).sort();
    const signature = columns.join("|");

    if (!grouped.has(signature)) {
      grouped.set(signature, { columns, rows: [] });
    }

    grouped.get(signature)!.rows.push(row);
  }

  const results: any[] = [];
  const returningFragment = buildReturningFragment(sql, meta, options.returning);

  for (const group of grouped.values()) {
    if (group.columns.length === 0) {
      for (const _row of group.rows) {
        const inserted = await sql`
          insert into ${buildQualifiedTable(sql, meta.ref)}
          default values
          ${returningFragment}
        `;
        results.push(...inserted);
      }
      continue;
    }

    const matrix = group.rows.map((row) => group.columns.map((column) => row[column]));

    const inserted = await sql`
      insert into ${buildQualifiedTable(sql, meta.ref)}
      (${buildColumnsFragment(sql, group.columns)})
      values ${sql(matrix)}
      ${returningFragment}
    `;

    results.push(...inserted);
  }

  return results;
}

export async function update(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  data: Record<string, unknown>,
  where: CrudWhere,
  options: MutationOptions = {}
) {
  const meta = await getTableRuntimeMeta(sql, tableRefInput);
  const payload = await validateDataForInsertOrUpdate(sql, meta, data, "update");
  ensureNonEmptyObject(payload, "update requires at least one updatable column.");

  const conditions = await validateWhereObject(sql, meta, where);
  if (conditions.length === 0) {
    throw new CrudValidationError("update requires a non-empty where clause.");
  }

  await validateForeignKeysIfRequested(sql, meta, payload, options.validateForeignKeys);

   const assignments = Object.entries(payload)
  .filter(s=> !meta.columnsByName.get(s[0]).isPrimaryKey).map(
    ([column, value]) => sql`${sql(column)} = ${value}`
  );

  // const assignments = Object.entries(payload).map(
  //   ([column, value]) => sql`${sql(column)} = ${value}`
  // );

  return sql`
    update ${buildQualifiedTable(sql, meta.ref)}
    set ${joinFragments(sql, assignments, sql`,`)}
    ${buildWhereFragment(sql, conditions)}
    ${buildReturningFragment(sql, meta, options.returning)}
  `;
}

export async function updateBulk(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  input: UpdateBulkInput,
  options: MutationOptions = {}
) {
  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    throw new CrudValidationError("updateBulk requires at least one row.");
  }

  const meta = await getTableRuntimeMeta(sql, tableRefInput);
  const keyColumn = input.keyColumn ?? meta.primaryKey;

  if (!keyColumn) {
    throw new CrudValidationError(`No keyColumn provided and table "${meta.table.fullName}" has no primary key.`);
  }

  if (!meta.columnsByName.has(keyColumn)) {
    throw new CrudValidationError(`Invalid keyColumn "${keyColumn}".`);
  }

  const keyMeta = meta.columnsByName.get(keyColumn)!;

  return sql.begin(async (tx) => {
    const out: any[] = [];

    for (let index = 0; index < input.rows.length; index++) {
      const row = input.rows[index];

      if (!isPlainObject(row.data)) {
        throw new CrudValidationError(`updateBulk row at index ${index} has invalid "data".`);
      }

      const keyValue = await coerceScalarValue(tx, meta, keyMeta, row.key, "where");

      const updated = await update(
        tx,
        meta.ref,
        row.data,
        { [keyColumn]: { op: "eq", value: keyValue } },
        options
      );

      out.push(...updated);
    }

    return out;
  });
}

export async function deleteRows(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  where: CrudWhere,
  options: { returning?: CrudReturning } = {}
) {
  const meta = await getTableRuntimeMeta(sql, tableRefInput);
  const conditions = await validateWhereObject(sql, meta, where);

  if (conditions.length === 0) {
    throw new CrudValidationError("deleteRows requires a non-empty where clause.");
  }

  return sql`
    delete from ${buildQualifiedTable(sql, meta.ref)}
    ${buildWhereFragment(sql, conditions)}
    ${buildReturningFragment(sql, meta, options.returning)}
  `;
}

export async function select(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  options: SelectOptions = {}
) {
  const meta = await getTableRuntimeMeta(sql, tableRefInput);

  const columns = options.columns && options.columns.length > 0
    ? options.columns
    : meta.columns.map((column) => column.columnName);

  ensureValidColumnsExist(meta.columnsByName, columns, "select");
  ensureLimitOffset(options.limit, options.offset);

  const conditions = await validateWhereObject(sql, meta, options.where);
  const orderByFragment = buildOrderByFragment(sql, meta, options.orderBy);
  const limitFragment = options.limit !== undefined ? sql` limit ${options.limit}` : sql``;
  const offsetFragment = options.offset !== undefined ? sql` offset ${options.offset}` : sql``;

  return sql`
    select ${buildColumnsFragment(sql, columns)}
    from ${buildQualifiedTable(sql, meta.ref)}
    ${buildWhereFragment(sql, conditions)}
    ${orderByFragment}
    ${limitFragment}
    ${offsetFragment}
  `;
}

export async function selectOne(
  sql: SqlClient,
  tableRefInput: TableRefInput,
  options: SelectOptions = {}
) {
  const rows = await select(sql, tableRefInput, {
    ...options,
    limit: 1,
  });

  return rows[0] ?? null;
}