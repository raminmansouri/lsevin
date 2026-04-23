import * as React from "react";
import { type UseFormReturn } from "react-hook-form";
import type { ListQueryResultRow, ResolvedFieldDefinition, ResolvedTableDefinition } from "@/lib/admin/types";
import {
  getAdminCascadingFieldChainConfig,
  getAdminDependentRelationConfig,
  isAdminFieldAugmentation,
  type AdminFormFieldAugmentation,
} from "./dependent-relations";
import { ConfiguredRelationField } from "@/components/admin/forms/extensions/configured-relation-field";
import { CascadingRelationChainField } from "@/components/admin/forms/extensions/cascading-relation-chain-field";

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

export function resolveAdminFormFieldExtension(
  args: AdminFormFieldExtensionArgs
): React.ReactNode | AdminFormFieldAugmentation | null {
  const chainConfig = getAdminCascadingFieldChainConfig(
    args.definition.schema,
    args.definition.table,
    args.field.columnName
  );

  if (chainConfig) {
    return {
      replace: (
        <CascadingRelationChainField
          form={args.form}
          locale={args.locale}
          schema={args.definition.schema}
          table={args.definition.table}
          column={args.field.columnName}
        />
      ),
    };
  }

  const dependentConfig = getAdminDependentRelationConfig(
    args.definition.schema,
    args.definition.table,
    args.field.columnName
  );

  if (dependentConfig) {
    return {
      replace: (
        <ConfiguredRelationField
          control={args.form.control}
          name={args.field.columnName}
          label={args.field.label}
          locale={args.locale}
          config={dependentConfig}
        />
      ),
    };
  }

  return null;
}

export function normalizeAdminFormFieldExtension(
  value: React.ReactNode | AdminFormFieldAugmentation | null
): AdminFormFieldAugmentation | null {
  if (!value) return null;
  if (isAdminFieldAugmentation(value)) return value;
  return { replace: value };
}

export function resolveAdminTableCellExtension(_args: AdminTableCellExtensionArgs): React.ReactNode | null {
  return null;
}
