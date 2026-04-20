// db-introspection.ts
import postgres from "postgres";

export type SqlClient = ReturnType<typeof postgres>;

export type TableRefInput =
  | string
  | {
      schema?: string;
      table: string;
    };

export type TableRef = {
  schema: string;
  table: string;
};

export type RelationDirection = "many_to_one" | "one_to_many";

export type ColumnRelation = {
  direction: RelationDirection;
  constraintName: string;
  localSchema: string;
  localTable: string;
  localColumn: string;
  foreignSchema: string;
  foreignTable: string;
  foreignColumn: string;
  onUpdate: "no_action" | "restrict" | "cascade" | "set_null" | "set_default" | "unknown";
  onDelete: "no_action" | "restrict" | "cascade" | "set_null" | "set_default" | "unknown";
  matchType: "full" | "partial" | "simple" | "unknown";
};

export type TableRelation = {
  constraintName: string;
  direction: RelationDirection;
  localSchema: string;
  localTable: string;
  foreignSchema: string;
  foreignTable: string;
  columnPairs: Array<{
    localColumn: string;
    foreignColumn: string;
  }>;
  onUpdate: "no_action" | "restrict" | "cascade" | "set_null" | "set_default" | "unknown";
  onDelete: "no_action" | "restrict" | "cascade" | "set_null" | "set_default" | "unknown";
  matchType: "full" | "partial" | "simple" | "unknown";
};

export type TableMetadata = {
  schemaName: string;
  tableName: string;
  fullName: string;
  tableOid: number;
  tableKind: "table" | "partitioned_table";
  comment: string | null;
  description: string | null; // alias of comment for UI/builders
  owner: string;
  estimatedRows: number | null;
  totalBytes: number | string | null;
  tableBytes: number | string | null;
  indexesBytes: number | string | null;
  columnCount: number;
  hasIndexes: boolean;
  rowLevelSecurity: boolean;
  isPartition: boolean;
  persistence: "permanent" | "unlogged" | "temporary" | "unknown";
};

export type ColumnMetadata = {
  schemaName: string;
  tableName: string;
  columnName: string;
  ordinalPosition: number;
  comment: string | null;
  description: string | null; // alias of comment for UI/builders
  fullDataType: string;
  dataType: string;
  udtName: string;
  isEnum: boolean;
  isArray: boolean;
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
  datetimePrecision: number | null;
  isNullable: boolean;
  columnDefault: string | null;
  isIdentity: boolean;
  identityGeneration: string | null;
  isGenerated: boolean;
  generationExpression: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  manyToOne: ColumnRelation[];
  oneToMany: ColumnRelation[];
};

export type RelatedTableWithMetadata = {
  relation: TableRelation;
  table: TableMetadata;
  columns: ColumnMetadata[];
};

function parseTableRef(input: TableRefInput, defaultSchema = "public"): TableRef {
  if (typeof input !== "string") {
    return {
      schema: input.schema ?? defaultSchema,
      table: input.table,
    };
  }

  const parts = input.split(".");
  if (parts.length === 2) {
    return { schema: parts[0], table: parts[1] };
  }

  return { schema: defaultSchema, table: input };
}

function decodeAction(
  code: string | null | undefined
): "no_action" | "restrict" | "cascade" | "set_null" | "set_default" | "unknown" {
  switch (code) {
    case "a":
      return "no_action";
    case "r":
      return "restrict";
    case "c":
      return "cascade";
    case "n":
      return "set_null";
    case "d":
      return "set_default";
    default:
      return "unknown";
  }
}

function decodeMatchType(code: string | null | undefined): "full" | "partial" | "simple" | "unknown" {
  switch (code) {
    case "f":
      return "full";
    case "p":
      return "partial";
    case "s":
      return "simple";
    default:
      return "unknown";
  }
}

function decodePersistence(code: string | null | undefined): "permanent" | "unlogged" | "temporary" | "unknown" {
  switch (code) {
    case "p":
      return "permanent";
    case "u":
      return "unlogged";
    case "t":
      return "temporary";
    default:
      return "unknown";
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Useful extra helper:
 * If the caller passes just "users" and multiple schemas have that table,
 * this lets you discover ambiguity before calling table-specific functions.
 */
export async function findTablesByName(sql: SqlClient, tableName: string): Promise<TableMetadata[]> {
  const rows = await sql`
    SELECT
      n.nspname AS "schemaName",
      c.relname AS "tableName",
      n.nspname || '.' || c.relname AS "fullName",
      c.oid AS "tableOid",
      CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'p' THEN 'partitioned_table'
      END AS "tableKind",
      obj_description(c.oid, 'pg_class') AS "comment",
      obj_description(c.oid, 'pg_class') AS "description",
      pg_get_userbyid(c.relowner) AS "owner",
      CASE
        WHEN c.reltuples < 0 THEN NULL
        ELSE c.reltuples::bigint
      END AS "estimatedRows",
      pg_total_relation_size(c.oid) AS "totalBytes",
      pg_relation_size(c.oid) AS "tableBytes",
      pg_indexes_size(c.oid) AS "indexesBytes",
      (
        SELECT count(*)::int
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attnum > 0
          AND NOT a.attisdropped
      ) AS "columnCount",
      c.relhasindex AS "hasIndexes",
      c.relrowsecurity AS "rowLevelSecurity",
      c.relispartition AS "isPartition",
      c.relpersistence AS "persistenceCode"
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND c.relname = ${tableName}
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname NOT LIKE 'pg_toast%'
    ORDER BY n.nspname, c.relname
  `;

  return rows.map((r: any) => ({
    ...r,
    persistence: decodePersistence(r.persistenceCode),
  }));
}

/**
 * 1) Get all tables with comments and metadata.
 */
export async function getAllTables(sql: SqlClient): Promise<TableMetadata[]> {
  const rows = await sql`
    SELECT
      n.nspname AS "schemaName",
      c.relname AS "tableName",
      n.nspname || '.' || c.relname AS "fullName",
      c.oid AS "tableOid",
      CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'p' THEN 'partitioned_table'
      END AS "tableKind",
      obj_description(c.oid, 'pg_class') AS "comment",
      obj_description(c.oid, 'pg_class') AS "description",
      pg_get_userbyid(c.relowner) AS "owner",
      CASE
        WHEN c.reltuples < 0 THEN NULL
        ELSE c.reltuples::bigint
      END AS "estimatedRows",
      pg_total_relation_size(c.oid) AS "totalBytes",
      pg_relation_size(c.oid) AS "tableBytes",
      pg_indexes_size(c.oid) AS "indexesBytes",
      (
        SELECT count(*)::int
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attnum > 0
          AND NOT a.attisdropped
      ) AS "columnCount",
      c.relhasindex AS "hasIndexes",
      c.relrowsecurity AS "rowLevelSecurity",
      c.relispartition AS "isPartition",
      c.relpersistence AS "persistenceCode"
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname NOT LIKE 'pg_toast%'
    ORDER BY n.nspname, c.relname
  `;

  return rows.map((r: any) => ({
    ...r,
    persistence: decodePersistence(r.persistenceCode),
  }));
}

/**
 * Get all FK relationships touching a table.
 * Outgoing FK = many_to_one from local table to foreign table.
 * Incoming FK = one_to_many from local table to child tables.
 */
export async function getTableRelations(
  sql: SqlClient,
  tableRefInput: TableRefInput
): Promise<TableRelation[]> {
  const { schema, table } = parseTableRef(tableRefInput);

  const rows = await sql`
    WITH fk_pairs AS (
      SELECT
        con.oid AS constraint_oid,
        con.conname AS constraint_name,
        src_ns.nspname AS source_schema,
        src.relname AS source_table,
        tgt_ns.nspname AS target_schema,
        tgt.relname AS target_table,
        src_ord.ord AS position,
        src_att.attname AS source_column,
        tgt_att.attname AS target_column,
        con.confupdtype AS on_update_code,
        con.confdeltype AS on_delete_code,
        con.confmatchtype AS match_type_code
      FROM pg_constraint con
      JOIN pg_class src
        ON src.oid = con.conrelid
      JOIN pg_namespace src_ns
        ON src_ns.oid = src.relnamespace
      JOIN pg_class tgt
        ON tgt.oid = con.confrelid
      JOIN pg_namespace tgt_ns
        ON tgt_ns.oid = tgt.relnamespace
      JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS src_ord(attnum, ord)
        ON true
      JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS tgt_ord(attnum, ord)
        ON tgt_ord.ord = src_ord.ord
      JOIN pg_attribute src_att
        ON src_att.attrelid = src.oid
       AND src_att.attnum = src_ord.attnum
      JOIN pg_attribute tgt_att
        ON tgt_att.attrelid = tgt.oid
       AND tgt_att.attnum = tgt_ord.attnum
      WHERE con.contype = 'f'
        AND (
          (src_ns.nspname = ${schema} AND src.relname = ${table})
          OR
          (tgt_ns.nspname = ${schema} AND tgt.relname = ${table})
        )
    )
    SELECT
      constraint_oid AS "constraintOid",
      constraint_name AS "constraintName",
      source_schema AS "sourceSchema",
      source_table AS "sourceTable",
      target_schema AS "targetSchema",
      target_table AS "targetTable",
      json_agg(
        json_build_object(
          'sourceColumn', source_column,
          'targetColumn', target_column
        )
        ORDER BY position
      ) AS "columnPairs",
      min(on_update_code) AS "onUpdateCode",
      min(on_delete_code) AS "onDeleteCode",
      min(match_type_code) AS "matchTypeCode"
    FROM fk_pairs
    GROUP BY
      constraint_oid,
      constraint_name,
      source_schema,
      source_table,
      target_schema,
      target_table
    ORDER BY
      source_schema,
      source_table,
      target_schema,
      target_table,
      constraint_name
  `;

  return rows.map((r: any) => {
    const isOutgoing = r.sourceSchema === schema && r.sourceTable === table;

    return {
      constraintName: r.constraintName,
      direction: isOutgoing ? "many_to_one" : "one_to_many",
      localSchema: schema,
      localTable: table,
      foreignSchema: isOutgoing ? r.targetSchema : r.sourceSchema,
      foreignTable: isOutgoing ? r.targetTable : r.sourceTable,
      columnPairs: (r.columnPairs ?? []).map((pair: any) => ({
        localColumn: isOutgoing ? pair.sourceColumn : pair.targetColumn,
        foreignColumn: isOutgoing ? pair.targetColumn : pair.sourceColumn,
      })),
      onUpdate: decodeAction(r.onUpdateCode),
      onDelete: decodeAction(r.onDeleteCode),
      matchType: decodeMatchType(r.matchTypeCode),
    } satisfies TableRelation;
  });
}

/**
 * 2) Get columns + metadata for one table.
 * Includes per-column many-to-one and one-to-many relationship info.
 */
export async function getColumnsAndMetadataByTableName(
  sql: SqlClient,
  tableRefInput: TableRefInput
): Promise<ColumnMetadata[]> {
  const { schema, table } = parseTableRef(tableRefInput);

  const [columnRows, relations] = await Promise.all([
    sql`
      SELECT
        n.nspname AS "schemaName",
        c.relname AS "tableName",
        a.attname AS "columnName",
        a.attnum AS "ordinalPosition",
        col_description(c.oid, a.attnum) AS "comment",
        col_description(c.oid, a.attnum) AS "description",
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS "fullDataType",
        COALESCE(ic.data_type, 'USER-DEFINED') AS "dataType",
        t.typname AS "udtName",
        (t.typtype = 'e') AS "isEnum",
        (a.attndims > 0 OR t.typcategory = 'A') AS "isArray",
        ic.character_maximum_length AS "characterMaximumLength",
        ic.numeric_precision AS "numericPrecision",
        ic.numeric_scale AS "numericScale",
        ic.datetime_precision AS "datetimePrecision",
        (ic.is_nullable = 'YES') AS "isNullable",
        pg_get_expr(ad.adbin, ad.adrelid) AS "columnDefault",
        (a.attidentity IN ('a', 'd')) AS "isIdentity",
        NULLIF(a.attidentity, '') AS "identityGeneration",
        (a.attgenerated <> '') AS "isGenerated",
        CASE
          WHEN a.attgenerated <> '' THEN pg_get_expr(ad.adbin, ad.adrelid)
          ELSE NULL
        END AS "generationExpression",
        EXISTS (
          SELECT 1
          FROM pg_constraint pk
          WHERE pk.conrelid = c.oid
            AND pk.contype = 'p'
            AND a.attnum = ANY(pk.conkey)
        ) AS "isPrimaryKey",
        EXISTS (
          SELECT 1
          FROM pg_constraint uq
          WHERE uq.conrelid = c.oid
            AND uq.contype IN ('p', 'u')
            AND a.attnum = ANY(uq.conkey)
        ) AS "isUnique"
      FROM pg_attribute a
      JOIN pg_class c
        ON c.oid = a.attrelid
      JOIN pg_namespace n
        ON n.oid = c.relnamespace
      JOIN pg_type t
        ON t.oid = a.atttypid
      LEFT JOIN information_schema.columns ic
        ON ic.table_schema = n.nspname
       AND ic.table_name = c.relname
       AND ic.column_name = a.attname
      LEFT JOIN pg_attrdef ad
        ON ad.adrelid = c.oid
       AND ad.adnum = a.attnum
      WHERE n.nspname = ${schema}
        AND c.relname = ${table}
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `,
    getTableRelations(sql, { schema, table }),
  ]);

  return columnRows.map((row: any) => {
    const manyToOne: ColumnRelation[] = [];
    const oneToMany: ColumnRelation[] = [];

    for (const rel of relations) {
      for (const pair of rel.columnPairs) {
        if (rel.direction === "many_to_one" && pair.localColumn === row.columnName) {
          manyToOne.push({
            direction: "many_to_one",
            constraintName: rel.constraintName,
            localSchema: rel.localSchema,
            localTable: rel.localTable,
            localColumn: pair.localColumn,
            foreignSchema: rel.foreignSchema,
            foreignTable: rel.foreignTable,
            foreignColumn: pair.foreignColumn,
            onUpdate: rel.onUpdate,
            onDelete: rel.onDelete,
            matchType: rel.matchType,
          });
        }

        if (rel.direction === "one_to_many" && pair.localColumn === row.columnName) {
          oneToMany.push({
            direction: "one_to_many",
            constraintName: rel.constraintName,
            localSchema: rel.localSchema,
            localTable: rel.localTable,
            localColumn: pair.localColumn,
            foreignSchema: rel.foreignSchema,
            foreignTable: rel.foreignTable,
            foreignColumn: pair.foreignColumn,
            onUpdate: rel.onUpdate,
            onDelete: rel.onDelete,
            matchType: rel.matchType,
          });
        }
      }
    }

    return {
      ...row,
      characterMaximumLength: toNumberOrNull(row.characterMaximumLength),
      numericPrecision: toNumberOrNull(row.numericPrecision),
      numericScale: toNumberOrNull(row.numericScale),
      datetimePrecision: toNumberOrNull(row.datetimePrecision),
      manyToOne,
      oneToMany,
    } satisfies ColumnMetadata;
  });
}

/**
 * Table-level metadata for one table.
 */
export async function getTableMetadataByName(
  sql: SqlClient,
  tableRefInput: TableRefInput
): Promise<TableMetadata | null> {
  const { schema, table } = parseTableRef(tableRefInput);

  const rows = await sql`
    SELECT
      n.nspname AS "schemaName",
      c.relname AS "tableName",
      n.nspname || '.' || c.relname AS "fullName",
      c.oid AS "tableOid",
      CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'p' THEN 'partitioned_table'
      END AS "tableKind",
      obj_description(c.oid, 'pg_class') AS "comment",
      obj_description(c.oid, 'pg_class') AS "description",
      pg_get_userbyid(c.relowner) AS "owner",
      CASE
        WHEN c.reltuples < 0 THEN NULL
        ELSE c.reltuples::bigint
      END AS "estimatedRows",
      pg_total_relation_size(c.oid) AS "totalBytes",
      pg_relation_size(c.oid) AS "tableBytes",
      pg_indexes_size(c.oid) AS "indexesBytes",
      (
        SELECT count(*)::int
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attnum > 0
          AND NOT a.attisdropped
      ) AS "columnCount",
      c.relhasindex AS "hasIndexes",
      c.relrowsecurity AS "rowLevelSecurity",
      c.relispartition AS "isPartition",
      c.relpersistence AS "persistenceCode"
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname = ${schema}
      AND c.relname = ${table}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    persistence: decodePersistence((row as any).persistenceCode),
  } satisfies TableMetadata;
}

/**
 * 3) Get related table names + their columns + metadata for a given table.
 */
export async function getRelatedTablesWithMetadata(
  sql: SqlClient,
  tableRefInput: TableRefInput
): Promise<RelatedTableWithMetadata[]> {
  const tableRef = parseTableRef(tableRefInput);
  const relations = await getTableRelations(sql, tableRef);

  const uniqueTargets = new Map<string, TableRef>();

  for (const rel of relations) {
    const key = `${rel.foreignSchema}.${rel.foreignTable}`;
    if (!uniqueTargets.has(key)) {
      uniqueTargets.set(key, {
        schema: rel.foreignSchema,
        table: rel.foreignTable,
      });
    }
  }

  const relatedTables = Array.from(uniqueTargets.values());

  const [tablesMeta, columnsByTable] = await Promise.all([
    Promise.all(relatedTables.map((t) => getTableMetadataByName(sql, t))),
    Promise.all(
      relatedTables.map(async (t) => ({
        key: `${t.schema}.${t.table}`,
        columns: await getColumnsAndMetadataByTableName(sql, t),
      }))
    ),
  ]);

  const tableMetaMap = new Map(
    tablesMeta.filter(Boolean).map((t) => [`${t!.schemaName}.${t!.tableName}`, t!])
  );
  const columnMap = new Map(columnsByTable.map((x) => [x.key, x.columns]));

  return relations.map((rel) => {
    const key = `${rel.foreignSchema}.${rel.foreignTable}`;
    const table = tableMetaMap.get(key);
    if (!table) {
      throw new Error(`Related table metadata not found for ${key}`);
    }

    return {
      relation: rel,
      table,
      columns: columnMap.get(key) ?? [],
    };
  });
}

/**
 * 4) Strongly recommended extra:
 * get one self-contained definition for a builder.
 */
export async function getTableDefinition(
  sql: SqlClient,
  tableRefInput: TableRefInput
) {
  const tableRef = parseTableRef(tableRefInput);

  const [table, columns, relations, relatedTables] = await Promise.all([
    getTableMetadataByName(sql, tableRef),
    getColumnsAndMetadataByTableName(sql, tableRef),
    getTableRelations(sql, tableRef),
    getRelatedTablesWithMetadata(sql, tableRef),
  ]);

  if (!table) {
    return null;
  }

  return {
    table,
    columns,
    relations,
    relatedTables,
  };
}

/**
 * Another useful extra for builder bootstrap:
 * returns the whole non-system schema graph.
 */
export async function getSchemaSnapshot(sql: SqlClient) {
  const tables = await getAllTables(sql);

  const tableDefinitions = await Promise.all(
    tables.map((t) => getTableDefinition(sql, { schema: t.schemaName, table: t.tableName }))
  );

  return tableDefinitions.filter(Boolean);
}

/**
 * Helpful for form builders: enum options for a table.
 */
export async function getEnumColumnsWithValues(
  sql: SqlClient,
  tableRefInput: TableRefInput
) {
  const { schema, table } = parseTableRef(tableRefInput);

  return sql`
    SELECT
      n.nspname AS "schemaName",
      c.relname AS "tableName",
      a.attname AS "columnName",
      t.typname AS "enumTypeName",
      et.enumsortorder AS "sortOrder",
      et.enumlabel AS "value"
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = c.oid
     AND a.attnum > 0
     AND NOT a.attisdropped
    JOIN pg_type t
      ON t.oid = a.atttypid
     AND t.typtype = 'e'
    JOIN pg_enum et
      ON et.enumtypid = t.oid
    WHERE n.nspname = ${schema}
      AND c.relname = ${table}
    ORDER BY a.attname, et.enumsortorder
  `;
}