import "server-only";

import { adminLocales, adminOverrides } from "./config";
import { getAdminSql } from "./db";
import {
  ColumnMetadata,
  TableRefInput,
  getTableDefinition,
} from "./core/db-introspection";
import { getEnumValuesForColumn } from "./core/db-builder-enums";
import {
  ResolvedFieldDefinition,
  ResolvedTableDefinition,
} from "./types";
import {
  inferDisplayField,
  inferFieldKind,
  inferFieldLabel,
  inferLocales,
  inferSearchableFields,
  isTranslationColumn,
} from "./inference";

const cache = new Map<string, Promise<ResolvedTableDefinition | null>>();

function keyOf(ref: TableRefInput) {
  if (typeof ref === "string") return ref;
  return `${ref.schema ?? "public"}.${ref.table}`;
}

function defaultFilterOperators(column: ColumnMetadata, fieldKind: string) {
  if (fieldKind === "boolean") return ["eq"] as const;
  if (fieldKind === "number") return ["eq", "gt", "gte", "lt", "lte", "between"] as const;
  if (fieldKind === "date" || fieldKind === "datetime" || fieldKind === "time") {
    return ["eq", "between", "gte", "lte"] as const;
  }
  if (fieldKind === "relation" || column.isEnum) return ["eq", "in", "is_null", "is_not_null"] as const;
  return ["ilike", "eq", "is_null", "is_not_null"] as const;
}

export async function getResolvedTableDefinition(
  tableRefInput: TableRefInput
): Promise<ResolvedTableDefinition | null> {
  const cacheKey = keyOf(tableRefInput);
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const promise = (async () => {
    const sql = getAdminSql();
    const definition = await getTableDefinition(sql, tableRefInput);

    if (!definition) return null;

    const tableKey = `${definition.table.schemaName}.${definition.table.tableName}`;
    const override = adminOverrides[tableKey];
    const enumCache = new Map<string, string[]>();

    const resolvedFields: ResolvedFieldDefinition[] = await Promise.all(
      definition.columns.map(async (column) => {
        const columnOverride = override?.columns?.[column.columnName];
        const fieldKind = columnOverride?.fieldKind ?? inferFieldKind(column);
        const relatedColumns =
          column.manyToOne.length === 1
            ? definition.relatedTables.find(
                (x) =>
                  x.table.schemaName === column.manyToOne[0].foreignSchema &&
                  x.table.tableName === column.manyToOne[0].foreignTable
              )?.columns ?? []
            : [];

        let enumValues: string[] = [];
        if (column.isEnum) {
          const cached = enumCache.get(column.columnName);
          if (cached) {
            enumValues = cached;
          } else {
            enumValues = await getEnumValuesForColumn(sql, {
              schema: definition.table.schemaName,
              table: definition.table.tableName,
              column,
            });
            enumCache.set(column.columnName, enumValues);
          }
        }

        const relation =
          fieldKind === "relation" && column.manyToOne.length === 1
            ? {
                foreignSchema: column.manyToOne[0].foreignSchema,
                foreignTable: column.manyToOne[0].foreignTable,
                foreignColumn: column.manyToOne[0].foreignColumn,
                displayField:
                  columnOverride?.relation?.displayField ??
                  inferDisplayField(relatedColumns),
                searchableFields:
                  columnOverride?.relation?.searchableFields ??
                  inferSearchableFields(relatedColumns),
              }
            : undefined;

        return {
          columnName: column.columnName,
          label: columnOverride?.label ?? inferFieldLabel(column.columnName),
          description: columnOverride?.description ?? column.description,
          fieldKind,
          hidden: columnOverride?.hidden ?? false,
          readOnly: columnOverride?.readOnly ?? column.isGenerated || column.isIdentity || column.isPrimaryKey,
          required: columnOverride?.required ?? (!column.isNullable && !column.columnDefault && !column.isIdentity && !column.isGenerated),
          searchable: columnOverride?.searchable ?? (isTranslationColumn(column) || ["text", "character varying", "uuid"].includes(column.dataType.toLowerCase())),
          sortable: columnOverride?.sortable ?? true,
          list: columnOverride?.list ?? !["json", "textarea", "richtext", "hidden"].includes(fieldKind),
          form: columnOverride?.form ?? fieldKind !== "hidden",
          filterOperators: [...(columnOverride?.filterOperators ?? defaultFilterOperators(column, fieldKind))],
          placeholder: columnOverride?.placeholder,
          accept: columnOverride?.accept,
          isPrimaryKey: column.isPrimaryKey,
          isNullable: column.isNullable,
          dataType: column.dataType,
          udtName: column.udtName,
          isEnum: column.isEnum,
          enumValues,
          isArray: column.isArray,
          isLocalized: isTranslationColumn(column),
          locales: columnOverride?.locales ?? inferLocales(column.columnName),
          relation,
          manyToMany: columnOverride?.manyToMany,
        } satisfies ResolvedFieldDefinition;
      })
    );

    const primaryKey = definition.columns.find((c) => c.isPrimaryKey)?.columnName ?? null;
    const listFields = (
      override?.listColumns?.map((name) => resolvedFields.find((f) => f.columnName === name)).filter(Boolean) as ResolvedFieldDefinition[] | undefined
    ) ?? resolvedFields.filter((f) => !f.hidden && f.list);

    const formFields = resolvedFields.filter((f) => !f.hidden && f.form);

    return {
      key: tableKey,
      schema: definition.table.schemaName,
      table: definition.table.tableName,
      label: override?.label ?? inferFieldLabel(definition.table.tableName),
      pageTitle: override?.pageTitle ?? override?.label ?? inferFieldLabel(definition.table.tableName),
      icon: override?.icon,
      readonly: override?.readonly ?? false,
      primaryKey,
      fields: resolvedFields,
      listFields,
      formFields,
      defaultSort: override?.defaultSort ?? {
        field: primaryKey ?? resolvedFields[0]?.columnName ?? "id",
        direction: "desc",
      },
    } satisfies ResolvedTableDefinition;
  })();

  cache.set(cacheKey, promise);

  try {
    return await promise;
  } catch (error) {
    cache.delete(cacheKey);
    throw error;
  }
}

export async function getResolvedAdminNavigation() {
  const sql = getAdminSql();
  const { getAllTables } = await import("./core/db-introspection");
  const tables = await getAllTables(sql);

  return Promise.all(
    tables.map(async (t) => {
      const resolved = await getResolvedTableDefinition({
        schema: t.schemaName,
        table: t.tableName,
      });
      return resolved;
    })
  ).then((items) => items.filter(Boolean) as ResolvedTableDefinition[]);
}

export function getLocaleConfig() {
  return adminLocales;
}
