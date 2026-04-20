// db-builder-contract.ts
import { SqlClient, TableRefInput, TableMetadata, ColumnMetadata, TableRelation, RelatedTableWithMetadata, getTableDefinition } from "./db-introspection";

export type BuilderFieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "json"
  | "uuid"
  | "email"
  | "url"
  | "enum"
  | "select"
  | "multiselect"
  | "file"
  | "unknown";

export type BuilderFilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "is_null"
  | "is_not_null";

export type BuilderRelationPicker = {
  type: "many_to_one" | "one_to_many";
  columnName?: string;
  relationName: string;
  targetSchema: string;
  targetTable: string;
  targetLabel: string;
  localColumn?: string;
  foreignColumn?: string;
  displayColumnCandidates: string[];
  multiple: boolean;
  required: boolean;
};

export type BuilderField = {
  name: string;
  label: string;
  description: string | null;
  comment: string | null;
  kind: BuilderFieldKind;
  dbType: string;
  nullable: boolean;
  required: boolean;
  readOnly: boolean;
  hiddenInCreate: boolean;
  hiddenInEdit: boolean;
  hiddenInList: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isArray: boolean;
  isEnum: boolean;
  enumValues?: string[];
  relation?: BuilderRelationPicker | null;
  filterOperators: BuilderFilterOperator[];
};

export type BuilderGridColumn = {
  name: string;
  label: string;
  kind: BuilderFieldKind;
  sortable: boolean;
  filterable: boolean;
  hidden: boolean;
  width?: number;
  align?: "left" | "center" | "right";
  relationDisplay?: {
    targetTable: string;
    displayColumnCandidates: string[];
  };
};

export type BuilderSort = {
  field: string;
  direction: "asc" | "desc";
};

export type BuilderFormSection = {
  key: string;
  label: string;
  fields: string[];
};

export type BuilderFormConfig = {
  titleField: string | null;
  sections: BuilderFormSection[];
  createFields: string[];
  editFields: string[];
};

export type BuilderGridConfig = {
  titleField: string | null;
  columns: BuilderGridColumn[];
  defaultSort: BuilderSort[];
  quickSearchColumns: string[];
};

export type BuilderFiltersConfig = {
  fields: Array<{
    name: string;
    label: string;
    operators: BuilderFilterOperator[];
    kind: BuilderFieldKind;
  }>;
};

export type BuilderRelationsConfig = {
  manyToOne: BuilderRelationPicker[];
  oneToMany: BuilderRelationPicker[];
};

export type BuilderContract = {
  entity: {
    schema: string;
    table: string;
    fullName: string;
    label: string;
    singularLabel: string;
    description: string | null;
    comment: string | null;
    primaryKey: string | null;
    titleField: string | null;
  };
  table: TableMetadata;
  fields: BuilderField[];
  form: BuilderFormConfig;
  grid: BuilderGridConfig;
  filters: BuilderFiltersConfig;
  relations: BuilderRelationsConfig;
  raw: {
    columns: ColumnMetadata[];
    relations: TableRelation[];
    relatedTables: RelatedTableWithMetadata[];
  };
};

function toTitleCase(input: string): string {
  return input
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function singularize(input: string): string {
  if (input.endsWith("ies")) return input.slice(0, -3) + "y";
  if (input.endsWith("sses")) return input.slice(0, -2);
  if (input.endsWith("ses")) return input.slice(0, -1);
  if (input.endsWith("s") && !input.endsWith("ss")) return input.slice(0, -1);
  return input;
}

function isAuditColumn(name: string): boolean {
  const n = name.toLowerCase();
  return [
    "created_at",
    "updated_at",
    "deleted_at",
    "created_by",
    "updated_by",
    "deleted_by",
    "create_date",
    "last_modified_date",
    "modified_at",
    "modified_by",
    "timestamp",
    "row_version",
    "xmin",
  ].includes(n);
}

function isLikelyTitleColumn(name: string): boolean {
  const n = name.toLowerCase();
  return [
    "name",
    "title",
    "label",
    "display_name",
    "full_name",
    "code",
    "slug",
    "email",
    "username",
    "number",
    "reference",
    "ref",
  ].includes(n);
}

function pickTitleField(columns: ColumnMetadata[]): string | null {
  const preferred = [
    "display_name",
    "name",
    "title",
    "label",
    "full_name",
    "email",
    "code",
    "slug",
  ];

  for (const candidate of preferred) {
    const hit = columns.find((c) => c.columnName.toLowerCase() === candidate);
    if (hit) return hit.columnName;
  }

  const stringish = columns.find((c) =>
    ["character varying", "text", "character"].includes(c.fullDataType.toLowerCase()) ||
    ["varchar", "text", "bpchar"].includes(c.udtName.toLowerCase())
  );

  return stringish?.columnName ?? null;
}

function pickPrimaryKey(columns: ColumnMetadata[]): string | null {
  return columns.find((c) => c.isPrimaryKey)?.columnName ?? null;
}

function pickDisplayCandidates(columns: ColumnMetadata[]): string[] {
  const preferred = [
    "display_name",
    "name",
    "title",
    "label",
    "full_name",
    "email",
    "code",
    "slug",
  ];

  const candidates = preferred.filter((p) =>
    columns.some((c) => c.columnName.toLowerCase() === p)
  );

  if (candidates.length > 0) {
    return columns
      .filter((c) => candidates.includes(c.columnName.toLowerCase()))
      .map((c) => c.columnName);
  }

  return columns
    .filter((c) =>
      ["text", "character varying", "character"].includes(c.dataType.toLowerCase()) ||
      ["varchar", "text", "bpchar"].includes(c.udtName.toLowerCase())
    )
    .slice(0, 3)
    .map((c) => c.columnName);
}

function inferFieldKind(column: ColumnMetadata): BuilderFieldKind {
  const name = column.columnName.toLowerCase();
  const type = column.dataType.toLowerCase();
  const fullType = column.fullDataType.toLowerCase();
  const udt = column.udtName.toLowerCase();

  if (column.isEnum) return "enum";
  if (column.isArray) return "multiselect";

  if (name.includes("email")) return "email";
  if (name.includes("url") || name.includes("link") || name.includes("website")) return "url";
  if (name.includes("file") || name.includes("image") || name.includes("avatar") || name.includes("document")) return "file";

  if (udt === "uuid") return "uuid";
  if (type === "boolean") return "boolean";
  if (type === "json" || type === "jsonb") return "json";

  if (type === "date") return "date";
  if (type.includes("timestamp")) return "datetime";
  if (type.includes("time")) return "time";

  if (
    type === "smallint" ||
    type === "integer" ||
    type === "bigint" ||
    type === "numeric" ||
    type === "decimal" ||
    type === "real" ||
    type === "double precision"
  ) {
    return "number";
  }

  if (type === "text") return "textarea";

  if (
    type === "character varying" ||
    type === "character" ||
    udt === "varchar" ||
    udt === "bpchar"
  ) {
    if (column.characterMaximumLength && column.characterMaximumLength > 300) {
      return "textarea";
    }
    return "text";
  }

  if (fullType.includes("text")) return "textarea";

  return "unknown";
}

function inferFilterOperators(kind: BuilderFieldKind): BuilderFilterOperator[] {
  switch (kind) {
    case "text":
    case "textarea":
    case "email":
    case "url":
    case "uuid":
      return ["contains", "eq", "neq", "starts_with", "ends_with", "is_null", "is_not_null"];
    case "number":
    case "date":
    case "datetime":
    case "time":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "between", "is_null", "is_not_null"];
    case "boolean":
      return ["eq", "neq", "is_null", "is_not_null"];
    case "enum":
    case "select":
    case "multiselect":
      return ["eq", "neq", "in", "not_in", "is_null", "is_not_null"];
    case "json":
      return ["is_null", "is_not_null"];
    default:
      return ["eq", "neq", "is_null", "is_not_null"];
  }
}

function inferReadOnly(column: ColumnMetadata): boolean {
  if (column.isGenerated || column.isIdentity) return true;
  if (column.isPrimaryKey) return true;
  return false;
}

function inferRequired(column: ColumnMetadata): boolean {
  if (column.isGenerated || column.isIdentity) return false;
  if (!column.isNullable && !column.columnDefault) return true;
  return false;
}

function inferHiddenInList(column: ColumnMetadata): boolean {
  const n = column.columnName.toLowerCase();
  if (column.dataType.toLowerCase() === "json" || column.udtName.toLowerCase() === "jsonb") return true;
  if (column.isArray) return true;
  if (n.endsWith("_id") && !column.isPrimaryKey) return true;
  if (isAuditColumn(n)) return true;
  return false;
}

function inferHiddenInCreate(column: ColumnMetadata): boolean {
  const n = column.columnName.toLowerCase();
  if (column.isGenerated || column.isIdentity) return true;
  if (isAuditColumn(n)) return true;
  return false;
}

function inferHiddenInEdit(column: ColumnMetadata): boolean {
  const n = column.columnName.toLowerCase();
  if (column.isGenerated || column.isIdentity || column.isPrimaryKey) return true;
  if (isAuditColumn(n)) return true;
  return false;
}

function inferGridWidth(kind: BuilderFieldKind, name: string): number | undefined {
  const n = name.toLowerCase();
  if (n === "id") return 140;
  if (kind === "boolean") return 100;
  if (kind === "date") return 120;
  if (kind === "datetime") return 180;
  if (kind === "number") return 120;
  if (n.includes("email")) return 220;
  if (n.includes("name") || n.includes("title")) return 220;
  return undefined;
}

function inferAlign(kind: BuilderFieldKind): "left" | "center" | "right" {
  if (kind === "number") return "right";
  if (kind === "boolean") return "center";
  return "left";
}

function buildRelationPickerForManyToOne(
  column: ColumnMetadata,
  relatedTables: RelatedTableWithMetadata[]
): BuilderRelationPicker | null {
  const rel = column.manyToOne[0];
  if (!rel) return null;

  const target = relatedTables.find(
    (x) =>
      x.table.schemaName === rel.foreignSchema &&
      x.table.tableName === rel.foreignTable
  );

  const displayColumnCandidates = target
    ? pickDisplayCandidates(target.columns)
    : ["name", "title", "label"];

  return {
    type: "many_to_one",
    columnName: column.columnName,
    relationName: rel.constraintName,
    targetSchema: rel.foreignSchema,
    targetTable: rel.foreignTable,
    targetLabel: toTitleCase(singularize(rel.foreignTable)),
    localColumn: rel.localColumn,
    foreignColumn: rel.foreignColumn,
    displayColumnCandidates,
    multiple: false,
    required: inferRequired(column),
  };
}

function buildOneToManyRelations(
  columns: ColumnMetadata[],
  relatedTables: RelatedTableWithMetadata[]
): BuilderRelationPicker[] {
  const map = new Map<string, BuilderRelationPicker>();

  for (const column of columns) {
    for (const rel of column.oneToMany) {
      const key = `${rel.constraintName}:${rel.foreignSchema}.${rel.foreignTable}`;
      if (map.has(key)) continue;

      const target = relatedTables.find(
        (x) =>
          x.table.schemaName === rel.foreignSchema &&
          x.table.tableName === rel.foreignTable
      );

      const displayColumnCandidates = target
        ? pickDisplayCandidates(target.columns)
        : ["name", "title", "label"];

      map.set(key, {
        type: "one_to_many",
        relationName: rel.constraintName,
        targetSchema: rel.foreignSchema,
        targetTable: rel.foreignTable,
        targetLabel: toTitleCase(rel.foreignTable),
        localColumn: rel.localColumn,
        foreignColumn: rel.foreignColumn,
        displayColumnCandidates,
        multiple: true,
        required: false,
      });
    }
  }

  return Array.from(map.values());
}

export async function buildTableBuilderContract(
  sql: SqlClient,
  tableRef: TableRefInput,
  options?: {
    enumValuesProvider?: (args: {
      schema: string;
      table: string;
      column: ColumnMetadata;
    }) => Promise<string[]>;
  }
): Promise<BuilderContract | null> {
  const def = await getTableDefinition(sql, tableRef);
  if (!def) return null;

  const titleField = pickTitleField(def.columns);
  const primaryKey = pickPrimaryKey(def.columns);

  const fields: BuilderField[] = [];
  for (const column of def.columns) {
    const baseKind = inferFieldKind(column);
    const relation = buildRelationPickerForManyToOne(column, def.relatedTables);
    const kind = relation ? "select" : baseKind;

    const enumValues =
      column.isEnum && options?.enumValuesProvider
        ? await options.enumValuesProvider({
            schema: def.table.schemaName,
            table: def.table.tableName,
            column,
          })
        : undefined;

    fields.push({
      name: column.columnName,
      label: toTitleCase(column.columnName),
      description: column.description,
      comment: column.comment,
      kind,
      dbType: column.fullDataType,
      nullable: column.isNullable,
      required: inferRequired(column),
      readOnly: inferReadOnly(column),
      hiddenInCreate: inferHiddenInCreate(column),
      hiddenInEdit: inferHiddenInEdit(column),
      hiddenInList: inferHiddenInList(column),
      defaultValue: column.columnDefault,
      maxLength: column.characterMaximumLength,
      numericPrecision: column.numericPrecision,
      numericScale: column.numericScale,
      isPrimaryKey: column.isPrimaryKey,
      isUnique: column.isUnique,
      isArray: column.isArray,
      isEnum: column.isEnum,
      enumValues,
      relation,
      filterOperators: inferFilterOperators(kind),
    });
  }

  const manyToOneRelations = fields
    .map((f) => f.relation)
    .filter((x): x is BuilderRelationPicker => !!x && x.type === "many_to_one");

  const oneToManyRelations = buildOneToManyRelations(def.columns, def.relatedTables);

  const gridColumns: BuilderGridColumn[] = fields.map((field) => ({
    name: field.name,
    label: field.label,
    kind: field.kind,
    sortable: !["json", "textarea", "file", "multiselect"].includes(field.kind),
    filterable: true,
    hidden: field.hiddenInList,
    width: inferGridWidth(field.kind, field.name),
    align: inferAlign(field.kind),
    relationDisplay: field.relation
      ? {
          targetTable: field.relation.targetTable,
          displayColumnCandidates: field.relation.displayColumnCandidates,
        }
      : undefined,
  }));

  const createFields = fields
    .filter((f) => !f.hiddenInCreate)
    .map((f) => f.name);

  const editFields = fields
    .filter((f) => !f.hiddenInEdit)
    .map((f) => f.name);

  const identityAndPk = new Set(
    fields.filter((f) => f.readOnly || f.isPrimaryKey).map((f) => f.name)
  );

  const defaultSortCandidates = [
    "display_order",
    "sort_order",
    "position",
    "sequence",
    "name",
    "title",
    "created_at",
    "create_date",
    "id",
  ];

  const defaultSort: BuilderSort[] = [];
  for (const candidate of defaultSortCandidates) {
    const field = fields.find((f) => f.name.toLowerCase() === candidate);
    if (field && !field.hiddenInList) {
      defaultSort.push({
        field: field.name,
        direction:
          candidate === "created_at" || candidate === "create_date" || candidate === "id"
            ? "desc"
            : "asc",
      });
      break;
    }
  }

  const quickSearchColumns = fields
    .filter((f) =>
      ["text", "textarea", "email", "url", "uuid"].includes(f.kind) &&
      !f.hiddenInList
    )
    .sort((a, b) => {
      const aa = isLikelyTitleColumn(a.name) ? 1 : 0;
      const bb = isLikelyTitleColumn(b.name) ? 1 : 0;
      return bb - aa;
    })
    .slice(0, 5)
    .map((f) => f.name);

  const mainFields = fields
    .filter((f) => !identityAndPk.has(f.name) && !isAuditColumn(f.name))
    .map((f) => f.name);

  const systemFields = fields
    .filter((f) => isAuditColumn(f.name))
    .map((f) => f.name);

  const sections: BuilderFormSection[] = [];

  if (mainFields.length > 0) {
    sections.push({
      key: "main",
      label: "Main",
      fields: mainFields,
    });
  }

  if (systemFields.length > 0) {
    sections.push({
      key: "system",
      label: "System",
      fields: systemFields,
    });
  }

  if (sections.length === 0) {
    sections.push({
      key: "default",
      label: "Fields",
      fields: fields.map((f) => f.name),
    });
  }

  return {
    entity: {
      schema: def.table.schemaName,
      table: def.table.tableName,
      fullName: def.table.fullName,
      label: toTitleCase(def.table.tableName),
      singularLabel: toTitleCase(singularize(def.table.tableName)),
      description: def.table.description,
      comment: def.table.comment,
      primaryKey,
      titleField,
    },
    table: def.table,
    fields,
    form: {
      titleField,
      sections,
      createFields,
      editFields,
    },
    grid: {
      titleField,
      columns: gridColumns,
      defaultSort,
      quickSearchColumns,
    },
    filters: {
      fields: fields.map((f) => ({
        name: f.name,
        label: f.label,
        operators: f.filterOperators,
        kind: f.kind,
      })),
    },
    relations: {
      manyToOne: manyToOneRelations,
      oneToMany: oneToManyRelations,
    },
    raw: {
      columns: def.columns,
      relations: def.relations,
      relatedTables: def.relatedTables,
    },
  };
}