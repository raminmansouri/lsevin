import * as React from "react";

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

export type AdminFormFieldAugmentation = {
  before?: React.ReactNode;
  replace?: React.ReactNode;
  after?: React.ReactNode;
};

export type AdminVirtualFieldDefinition = {
  key: string;
  name: string;
  label?: string;
  transient?: boolean;
  configKey: string;
};

export type AdminCascadingChainStep = {
  name: string;
  label: string;
  configKey: string;
  transient?: boolean;
};

export type AdminCascadingFieldChainConfig = {
  key: string;
  steps: AdminCascadingChainStep[];
  layout?: "stack" | "grid-2" | "grid-3";
};

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
  "marketing.offers.__provider_id": {
    key: "marketing.offers.__provider_id",
    schema: "category",
    table: "service_providers",
    valueColumn: "id",
    labelColumn: "name_translations",
    labelMode: "translation",
    descriptionColumn: "country",
    descriptionMode: "text",
    searchColumns: ["name_translations", "country", "city"],
    staticFilters: [{ column: "is_active", op: "true" }],
    parentFilters: [],
    orderBy: {
      column: "name_translations",
      direction: "asc",
      mode: "translation",
    },
    pageSize: 20,
    placeholder: "Select provider",
    placeholderWhenMissingParents: "Select provider",
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
    staticFilters: [{ column: "is_active", op: "true" }],
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
  },
};

export const adminVirtualFields: Record<string, AdminVirtualFieldDefinition[]> = {
  "marketing.offers": [
    {
      key: "marketing.offers.__provider_id",
      name: "__provider_id",
      label: "Provider",
      transient: true,
      configKey: "marketing.offers.__provider_id",
    },
  ],
};

export const adminCascadingFieldChains: Record<string, AdminCascadingFieldChainConfig> = {
  "marketing.offers.provider_service_id": {
    key: "marketing.offers.provider_service_id",
    layout: "grid-2",
    steps: [
      {
        name: "__provider_id",
        label: "Provider",
        configKey: "marketing.offers.__provider_id",
        transient: true,
      },
      {
        name: "provider_service_id",
        label: "Service",
        configKey: "marketing.offers.provider_service_id",
      },
    ],
  },
};

export function getAdminDependentRelationConfig(
  schema: string,
  table: string,
  column: string
) {
  return adminDependentRelations[`${schema}.${table}.${column}`] ?? null;
}

export function getAdminDependentRelationConfigByKey(key: string) {
  return adminDependentRelations[key] ?? null;
}

export function getAdminCascadingFieldChainConfig(
  schema: string,
  table: string,
  column: string
) {
  return adminCascadingFieldChains[`${schema}.${table}.${column}`] ?? null;
}

export function getAdminVirtualFieldDefinitions(schema: string, table: string) {
  return adminVirtualFields[`${schema}.${table}`] ?? [];
}

export function isAdminFieldAugmentation(value: unknown): value is AdminFormFieldAugmentation {
  return !!value && typeof value === "object" && (
    "before" in (value as Record<string, unknown>) ||
    "replace" in (value as Record<string, unknown>) ||
    "after" in (value as Record<string, unknown>)
  );
}
