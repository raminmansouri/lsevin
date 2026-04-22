import * as React from "react";
import { type UseFormReturn } from "react-hook-form";
import type { ListQueryResultRow, ResolvedFieldDefinition, ResolvedTableDefinition } from "@/lib/admin/types";
import { getAdminDependentRelationConfig } from "./dependent-relations";
import { DependentRelationField } from "@/components/admin/forms/extensions/dependent-relation-field";

export type AdminFormFieldExtensionArgs = {
  definition: ResolvedTableDefinition;
  field: ResolvedFieldDefinition;
  form: UseFormReturn<Record<string, any>>;
  locale: string;
  mode: "create" | "edit";
  values: Record<string, any>;
};

export type AdminTableCellExtensionArgs = {
  definition: ResolvedTableDefinition;
  field: ResolvedFieldDefinition;
  row: ListQueryResultRow;
  value: unknown;
};

export function resolveAdminFormFieldExtension(args: AdminFormFieldExtensionArgs): React.ReactNode | null {
  const dependentConfig = getAdminDependentRelationConfig(
    args.definition.schema,
    args.definition.table,
    args.field.columnName
  );

  if (dependentConfig) {
    return (
      <DependentRelationField
        key={args.field.columnName}
        control={args.form.control}
        name={args.field.columnName}
        label={args.field.label}
        locale={args.locale}
        config={dependentConfig}
      />
    );
  }

  return null;
}

export function resolveAdminTableCellExtension(_args: AdminTableCellExtensionArgs): React.ReactNode | null {
  return null;
}
