export type AdminAction = "list" | "single" | "create" | "update" | "delete";

export type AdminLocaleConfig = {
  supported: string[];
  defaultLocale: string;
  fallbackLocale: string;
};

export type AdminFieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "json"
  | "enum"
  | "file"
  | "image"
  | "relation"
  | "multilingual"
  | "hidden"
  | "readonly"
  | "many-to-many";

export type AdminFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "ilike"
  | "in"
  | "between"
  | "is_null"
  | "is_not_null";

export type AdminRelationOverride = {
  displayField?: string;
  searchableFields?: string[];
};

export type AdminManyToManyOverride = {
  junctionSchema: string;
  junctionTable: string;
  sourceForeignKey: string;
  targetForeignKey: string;
  targetSchema: string;
  targetTable: string;
  targetDisplayField?: string;
};

export type AdminChildCollectionOverride = {
  label?: string;
  description?: string;
  hidden?: boolean;
  icon?: string;
  listColumns?: string[];
  pageSize?: number;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  defaultSort?: { field: string; direction: "asc" | "desc" };
};

export type AdminColumnOverride = {
  label?: string;
  description?: string;
  hidden?: boolean;
  readOnly?: boolean;
  list?: boolean;
  form?: boolean;
  fieldKind?: AdminFieldKind;
  relation?: AdminRelationOverride;
  width?: number;
  required?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  filterOperators?: AdminFilterOperator[];
  placeholder?: string;
  locales?: string[];
  accept?: string;
  manyToMany?: AdminManyToManyOverride;
};

export type AdminTableOverride = {
  label?: string;
  icon?: string;
  hidden?: boolean;
  listColumns?: string[];
  defaultSort?: { field: string; direction: "asc" | "desc" };
  defaultFilters?: Record<string, unknown>;
  pageTitle?: string;
  readonly?: boolean;
  columns?: Record<string, AdminColumnOverride>;
  children?: Record<string, AdminChildCollectionOverride>;
};

export type AdminOverrideMap = Record<string, AdminTableOverride>;

export type ResolvedFieldDefinition = {
  columnName: string;
  label: string;
  description: string | null;
  fieldKind: AdminFieldKind;
  hidden: boolean;
  readOnly: boolean;
  required: boolean;
  searchable: boolean;
  sortable: boolean;
  list: boolean;
  form: boolean;
  filterOperators: AdminFilterOperator[];
  placeholder?: string;
  accept?: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  dataType: string;
  udtName: string;
  isEnum: boolean;
  enumValues: string[];
  isArray: boolean;
  isLocalized: boolean;
  locales?: string[];
  relation?: {
    foreignSchema: string;
    foreignTable: string;
    foreignColumn: string;
    displayField: string;
    searchableFields: string[];
  };
  manyToMany?: AdminManyToManyOverride;
};

export type ResolvedChildCollectionDefinition = {
  key: string;
  constraintName: string;
  schema: string;
  table: string;
  label: string;
  description?: string | null;
  icon?: string;
  parentColumn: string;
  foreignKeyColumn: string;
  listColumns?: string[];
  pageSize: number;
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  defaultSort?: { field: string; direction: "asc" | "desc" };
};

export type ResolvedTableDefinition = {
  key: string;
  schema: string;
  table: string;
  label: string;
  pageTitle: string;
  icon?: string;
  readonly: boolean;
  primaryKey: string | null;
  fields: ResolvedFieldDefinition[];
  listFields: ResolvedFieldDefinition[];
  formFields: ResolvedFieldDefinition[];
  childCollections: ResolvedChildCollectionDefinition[];
  defaultSort: { field: string; direction: "asc" | "desc" };
};

export type ListQueryFilter = {
  field: string;
  op: AdminFilterOperator;
  value?: unknown;
};

export type ListQueryInput = {
  page: number;
  pageSize: number;
  q?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  filters?: ListQueryFilter[];
};

export type ListQueryResultRow = Record<string, unknown> & {
  __pk?: unknown;
};

export type ListQueryResult = {
  rows: ListQueryResultRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type RelationOption = {
  value: string;
  label: string;
};
