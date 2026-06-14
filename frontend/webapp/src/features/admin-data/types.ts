export type AdminSchemaName = "booking" | "identity" | "customer";

export type AdminFieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "datetime"
  | "time"
  | "json"
  | "localized"
  | "localized-rich"
  | "array"
  | "media-single"
  | "media-multi";

export type RelationConfig = {
  schema: string;
  table: string;
  valueColumn: string;
  labelExpression: string;
  searchColumns?: string[];
  where?: string;
  orderBy?: string;
  /** When present, relation fields render through LazyAdminLookupSelect instead of static Select. */
  lookupType?: string;
  contentClassName?: string;
};

export type AdminFieldConfig = {
  name: string;
  label?: string;
  kind?: AdminFieldKind;
  required?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  createHidden?: boolean;
  updateHidden?: boolean;
  defaultValue?: unknown;
  options?: string[];
  relation?: RelationConfig;
  placeholder?: string;
  description?: string;
  mediaType?: "image" | "video" | "all";
  rows?: number;
  maxLength?: number;
};

export type AdminTableConfig = {
  schema: AdminSchemaName;
  table: string;
  title: string;
  description: string;
  icon?: string;
  primaryKey: string[];
  fields: AdminFieldConfig[];
  readOnly?: boolean;
  dangerousDelete?: boolean;
  defaultOrderBy?: string;
  searchableColumns?: string[];
  listColumns?: string[];
  badgeColumn?: string;
  amountColumn?: string;
  dateColumn?: string;
  systemTable?: boolean;
};

export type AdminRow = Record<string, unknown>;

export type AdminListResult = {
  rows: AdminRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminRelationOption = {
  value: string;
  label: string;
};

export type AdminDashboardCard = {
  schema: AdminSchemaName;
  table: string;
  title: string;
  description: string;
  total: number;
  href: string;
  readOnly?: boolean;
};
