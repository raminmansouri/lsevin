export type AdminDependentParentFilter = {
  parentField: string;
  targetColumn: string;
  required?: boolean;
};

export type AdminDependentRelationConfig = {
  key: string;
  schema: string;
  table: string;
  valueColumn: string;
  labelColumn: string;
  labelMode?: "text" | "translation";
  descriptionColumn?: string;
  descriptionMode?: "text" | "translation";
  searchColumns?: string[];
  staticFilters?: Array<{
    column: string;
    op: "eq" | "true" | "false";
    value?: string | number | boolean;
  }>;
  parentFilters?: AdminDependentParentFilter[];
  orderBy?: {
    column: string;
    direction: "asc" | "desc";
    mode?: "text" | "translation";
  };
  pageSize?: number;
  placeholder?: string;
  placeholderWhenMissingParents?: string;
  resetOnParentChange?: boolean;
};

type AdminFormFieldAugmentation = {
  before?: React.ReactNode;
  replace?: React.ReactNode;
  after?: React.ReactNode;
};

export const adminVirtualFields = {
  "marketing.offers": [
    {
      key: "marketing.offers.__provider_id",
      name: "__provider_id",
      component: "relation-single",
      transient: true,
      schema: "category",
      table: "service_providers",
      valueColumn: "id",
      labelColumn: "name_translations",
      labelMode: "translation",
      searchColumns: ["name_translations", "country", "city"],
      placeholder: "Select provider",
    },
  ],
} as const;

export const adminDependentRelations: Record<string, AdminDependentRelationConfig> = {
  "booking.bookings.service_id": {
    key: "booking.bookings.service_id",
    schema: "category",
    table: "provider_services",
    valueColumn: "id",
    labelColumn: "display_name_translations",
    labelMode: "translation",
    descriptionColumn: "description_translations",
    descriptionMode: "translation",
    searchColumns: ["display_name_translations", "description_translations"],
    staticFilters: [{ column: "is_active", op: "true" }],
    parentFilters: [
      {
        parentField: "provider_id",
        targetColumn: "service_provider_id",
        required: true,
      },
    ],
    orderBy: {
      column: "display_name_translations",
      direction: "asc",
      mode: "translation",
    },
    pageSize: 20,
    placeholder: "Select service",
    placeholderWhenMissingParents: "Select provider first",
    resetOnParentChange: true,
  },
  "marketing.offers.provider_service_id": {
  key: "marketing.offers.provider_service_id",
  schema: "category",
  table: "provider_services",
  valueColumn: "id",
  labelColumn: "display_name_translations",
  labelMode: "translation",
  descriptionColumn: "description_translations",
  descriptionMode: "translation",
  searchColumns: ["display_name_translations", "description_translations"],
  staticFilters: [
    { column: "is_active", op: "eq", value: true },
  ],
  parentFilters: [
    {
      parentField: "__provider_id",
      targetColumn: "service_provider_id",
      required: true,
    },
  ],
  orderBy: {
    column: "display_name_translations",
    direction: "asc",
    mode: "translation",
  },
  pageSize: 20,
  placeholder: "Select service",
  placeholderWhenMissingParents: "Select provider first",
  resetOnParentChange: true,
}
};

export function getAdminDependentRelationConfig(
  schema: string,
  table: string,
  column: string
) {
  return adminDependentRelations[`${schema}.${table}.${column}`] ?? null;
}
