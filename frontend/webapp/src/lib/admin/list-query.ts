import "server-only";

import { getAdminSql } from "./db";
import { getLocaleConfig } from "./metadata";
import { getResolvedTableDefinition } from "./metadata";
import { ListQueryInput, ListQueryResult, ListQueryResultRow, RelationOption } from "./types";
import { AdminNotFoundError } from "./errors";
import { SqlClient } from "./core/db-introspection";

function join(sql: SqlClient, parts: any[], separator: any) {
  return parts.flatMap((part, index) => [index ? separator : sql``, part]);
}

function qIdentifier(sql: SqlClient, ...parts: string[]) {
  if (parts.length === 1) return sql(parts[0]);
  return sql`${sql(parts[0])}.${qIdentifier(sql, ...parts.slice(1))}`;
}

function buildLocalizedExpr(
  sql: SqlClient,
  alias: string,
  column: string,
  locale: string,
  fallback: string
) {
  return sql`common.get_translation(${qIdentifier(sql, alias, column)}, ${locale}, ${fallback})`;
}

function coercePageNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseListQuery(searchParams: Record<string, string | string[] | undefined>): ListQueryInput {
  const filtersRaw = typeof searchParams.filters === "string" ? searchParams.filters : undefined;
  const sortField = typeof searchParams.sortField === "string" ? searchParams.sortField : undefined;
  const sortDirection = typeof searchParams.sortDirection === "string" && searchParams.sortDirection === "asc" ? "asc" : "desc";

  return {
    page: coercePageNumber(searchParams.page, 1),
    pageSize: Math.min(coercePageNumber(searchParams.pageSize, 25), 100),
    q: typeof searchParams.q === "string" ? searchParams.q.trim() : "",
    sortField,
    sortDirection,
    filters: filtersRaw ? JSON.parse(filtersRaw) : [],
  };
}

function buildWhereClause(
  sql: SqlClient,
  input: ListQueryInput,
  listFields: Awaited<ReturnType<typeof getResolvedTableDefinition>>["listFields"],
  locale: string,
  fallbackLocale: string
) {
  const conditions: any[] = [];
  const searchableFields = listFields.filter((f) => f.searchable);

  if (input.q) {
    const like = `%${input.q}%`;
    const searchParts = searchableFields.flatMap((field) => {
      if (field.isLocalized) {
        return [sql`${buildLocalizedExpr(sql, "t", field.columnName, locale, fallbackLocale)} ilike ${like}`];
      }

      if (field.relation) {
        return [sql`${qIdentifier(sql, `${field.columnName}__rel`, field.relation.displayField)}::text ilike ${like}`];
      }

      return [sql`${qIdentifier(sql, "t", field.columnName)}::text ilike ${like}`];
    });

    if (searchParts.length) {
      conditions.push(sql`(${join(sql, searchParts, sql` or `)})`);
    }
  }

  for (const filter of input.filters ?? []) {
    const field = listFields.find((x) => x.columnName === filter.field);
    if (!field) continue;

    const expr = field.isLocalized
      ? buildLocalizedExpr(sql, "t", field.columnName, locale, fallbackLocale)
      : field.relation
        ? qIdentifier(sql, `${field.columnName}__rel`, field.relation.displayField)
        : qIdentifier(sql, "t", field.columnName);

    switch (filter.op) {
      case "eq":
        conditions.push(sql`${expr} = ${filter.value}`);
        break;
      case "neq":
        conditions.push(sql`${expr} <> ${filter.value}`);
        break;
      case "gt":
        conditions.push(sql`${expr} > ${filter.value}`);
        break;
      case "gte":
        conditions.push(sql`${expr} >= ${filter.value}`);
        break;
      case "lt":
        conditions.push(sql`${expr} < ${filter.value}`);
        break;
      case "lte":
        conditions.push(sql`${expr} <= ${filter.value}`);
        break;
      case "ilike":
        conditions.push(sql`${expr}::text ilike ${`%${String(filter.value ?? "")}%`}`);
        break;
      case "in":
        conditions.push(sql`${expr} in ${sql(Array.isArray(filter.value) ? filter.value : [filter.value])}`);
        break;
      case "between": {
        const [from, to] = Array.isArray(filter.value) ? filter.value : [undefined, undefined];
        if (from !== undefined && to !== undefined) {
          conditions.push(sql`${expr} between ${from} and ${to}`);
        }
        break;
      }
      case "is_null":
        conditions.push(sql`${expr} is null`);
        break;
      case "is_not_null":
        conditions.push(sql`${expr} is not null`);
        break;
    }
  }

  return conditions.length ? sql`where ${join(sql, conditions, sql` and `)}` : sql``;
}

function buildRelationJoins(
  sql: SqlClient,
  fields: Awaited<ReturnType<typeof getResolvedTableDefinition>>["listFields"]
) {
  const joins: any[] = [];

  for (const field of fields) {
    if (!field.relation) continue;
    joins.push(sql`
      left join ${qIdentifier(sql, field.relation.foreignSchema, field.relation.foreignTable)} as ${sql(`${field.columnName}__rel`)}
        on ${qIdentifier(sql, "t", field.columnName)} = ${qIdentifier(sql, `${field.columnName}__rel`, field.relation.foreignColumn)}
    `);
  }

  return joins.length ? sql`${join(sql, joins, sql` `)}` : sql``;
}

function buildSelectList(
  sql: SqlClient,
  fields: Awaited<ReturnType<typeof getResolvedTableDefinition>>["listFields"],
  primaryKey: string | null,
  locale: string,
  fallbackLocale: string
) {
  const selectParts: any[] = [];

  if (primaryKey) {
    selectParts.push(sql`${qIdentifier(sql, "t", primaryKey)} as "__pk"`);
  }

  for (const field of fields) {
    if (field.relation) {
      const labelExpr =
        field.relation.displayField.endsWith("_translations")
          ? buildLocalizedExpr(sql, `${field.columnName}__rel`, field.relation.displayField, locale, fallbackLocale)
          : qIdentifier(sql, `${field.columnName}__rel`, field.relation.displayField);

      selectParts.push(sql`${qIdentifier(sql, "t", field.columnName)} as ${sql(field.columnName)}`);
      selectParts.push(sql`${labelExpr} as ${sql(`${field.columnName}__label`)}`);
      continue;
    }

    if (field.isLocalized) {
      selectParts.push(
        sql`${buildLocalizedExpr(sql, "t", field.columnName, locale, fallbackLocale)} as ${sql(field.columnName)}`
      );
      continue;
    }

    selectParts.push(sql`${qIdentifier(sql, "t", field.columnName)} as ${sql(field.columnName)}`);
  }

  return sql`${join(sql, selectParts, sql`,`)}`;
}

function buildOrderClause(
  sql: SqlClient,
  input: ListQueryInput,
  resolved: Awaited<ReturnType<typeof getResolvedTableDefinition>>,
  locale: string,
  fallbackLocale: string
) {
  const sortFieldName = input.sortField ?? resolved.defaultSort.field;
  const direction = input.sortDirection ?? resolved.defaultSort.direction;
  const field = resolved.listFields.find((f) => f.columnName === sortFieldName) ?? resolved.listFields[0];

  if (!field) return sql``;

  const expr = field.relation
    ? field.relation.displayField.endsWith("_translations")
      ? buildLocalizedExpr(sql, `${field.columnName}__rel`, field.relation.displayField, locale, fallbackLocale)
      : qIdentifier(sql, `${field.columnName}__rel`, field.relation.displayField)
    : field.isLocalized
      ? buildLocalizedExpr(sql, "t", field.columnName, locale, fallbackLocale)
      : qIdentifier(sql, "t", field.columnName);

  return sql`order by ${expr} ${direction === "asc" ? sql`asc` : sql`desc`}`;
}

export async function runListQuery(
  tableRef: { schema: string; table: string },
  input: ListQueryInput,
  locale: string
): Promise<ListQueryResult> {
  const sql = getAdminSql();
  const resolved = await getResolvedTableDefinition(tableRef);

  if (!resolved) {
    throw new AdminNotFoundError(`Table ${tableRef.schema}.${tableRef.table} not found.`);
  }

  const localeConfig = getLocaleConfig();
  const fallbackLocale = localeConfig.fallbackLocale;
  const page = Math.max(1, input.page);
  const pageSize = Math.min(Math.max(1, input.pageSize), 100);
  const offset = (page - 1) * pageSize;

  const relationJoins = buildRelationJoins(sql, resolved.listFields);
  const whereClause = buildWhereClause(sql, input, resolved.listFields, locale, fallbackLocale);
  const selectList = buildSelectList(sql, resolved.listFields, resolved.primaryKey, locale, fallbackLocale);
  const orderBy = buildOrderClause(sql, input, resolved, locale, fallbackLocale);

  const rows = await sql`
    select ${selectList}
    from ${qIdentifier(sql, resolved.schema, resolved.table)} as t
    ${relationJoins}
    ${whereClause}
    ${orderBy}
    limit ${pageSize}
    offset ${offset}
  ` as ListQueryResultRow[];

  const totalRows = await sql`
    select count(*)::int as count
    from ${qIdentifier(sql, resolved.schema, resolved.table)} as t
    ${relationJoins}
    ${whereClause}
  ` as Array<{ count: number }>;

  const total = totalRows[0]?.count ?? 0;

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}


export async function getDirectTableOptions(args: {
  schema: string;
  table: string;
  displayField?: string;
  search?: string;
  limit?: number;
  locale: string;
}): Promise<RelationOption[]> {
  const sql = getAdminSql();
  const resolved = await getResolvedTableDefinition({ schema: args.schema, table: args.table });
  if (!resolved) throw new AdminNotFoundError();

  const localeConfig = getLocaleConfig();
  const fallback = localeConfig.fallbackLocale;
  const displayField = args.displayField ?? resolved.listFields[0]?.columnName ?? resolved.primaryKey ?? "id";
  const pk = resolved.primaryKey ?? "id";

  const displayExpr = displayField.endsWith("_translations")
    ? buildLocalizedExpr(sql, "r", displayField, args.locale, fallback)
    : qIdentifier(sql, "r", displayField);

  const searchFields = resolved.fields
    .filter((f) => f.searchable)
    .slice(0, 5)
    .map((f) => f.columnName);

  const whereParts: any[] = [];
  if (args.search) {
    const like = `%${args.search.trim()}%`;
    for (const field of searchFields) {
      if (field.endsWith("_translations")) {
        whereParts.push(sql`${buildLocalizedExpr(sql, "r", field, args.locale, fallback)} ilike ${like}`);
      } else {
        whereParts.push(sql`${qIdentifier(sql, "r", field)}::text ilike ${like}`);
      }
    }
  }

  const rows = await sql`
    select
      ${qIdentifier(sql, "r", pk)}::text as value,
      ${displayExpr}::text as label
    from ${qIdentifier(sql, args.schema, args.table)} as r
    ${whereParts.length ? sql`where (${join(sql, whereParts, sql` or `)})` : sql``}
    order by ${displayExpr} asc
    limit ${Math.min(args.limit ?? 20, 50)}
  ` as RelationOption[];

  return rows;
}

export async function getRelationOptions(args: {
  schema: string;
  table: string;
  column: string;
  search?: string;
  limit?: number;
  locale: string;
}): Promise<RelationOption[]> {
  const sql = getAdminSql();
  const resolved = await getResolvedTableDefinition({ schema: args.schema, table: args.table });
  if (!resolved) throw new AdminNotFoundError();

  const field = resolved.fields.find((x) => x.columnName === args.column);
  if (!field?.relation) {
    return [];
  }

  const localeConfig = getLocaleConfig();
  const fallback = localeConfig.fallbackLocale;
  const relatedResolved = await getResolvedTableDefinition({
    schema: field.relation.foreignSchema,
    table: field.relation.foreignTable,
  });

  const displayField = field.relation.displayField;
  const searchableFields = field.relation.searchableFields;
  const search = args.search?.trim();
  const limit = Math.min(args.limit ?? 20, 50);

  const displayExpr = displayField.endsWith("_translations")
    ? buildLocalizedExpr(sql, "r", displayField, args.locale, fallback)
    : qIdentifier(sql, "r", displayField);

  const whereParts: any[] = [];
  if (search) {
    const like = `%${search}%`;
    for (const searchField of searchableFields) {
      if (searchField.endsWith("_translations")) {
        whereParts.push(sql`${buildLocalizedExpr(sql, "r", searchField, args.locale, fallback)} ilike ${like}`);
      } else {
        whereParts.push(sql`${qIdentifier(sql, "r", searchField)}::text ilike ${like}`);
      }
    }
  }

  const pk = relatedResolved?.primaryKey ?? field.relation.foreignColumn;

  const rows = await sql`
    select
      ${qIdentifier(sql, "r", pk)}::text as value,
      ${displayExpr}::text as label
    from ${qIdentifier(sql, field.relation.foreignSchema, field.relation.foreignTable)} as r
    ${whereParts.length ? sql`where (${join(sql, whereParts, sql` or `)})` : sql``}
    order by ${displayExpr} asc
    limit ${limit}
  ` as RelationOption[];

  return rows;
}
