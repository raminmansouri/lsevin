"use client";

import { useMemo } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  getAdminCascadingFieldChainConfig,
  getAdminDependentRelationConfigByKey,
  type AdminCascadingFieldChainConfig,
} from "@/lib/admin/extensions/dependent-relations";
import { ConfiguredRelationField } from "./configured-relation-field";
import type { AsyncSelectOption } from "./async-searchable-single-select";

type Props = {
  form: UseFormReturn<Record<string, any>>;
  locale: string;
  schema: string;
  table: string;
  column: string;
};

function layoutClass(layout: AdminCascadingFieldChainConfig["layout"]) {
  switch (layout) {
    case "grid-3":
      return "grid gap-4 md:grid-cols-3";
    case "grid-2":
      return "grid gap-4 md:grid-cols-2";
    default:
      return "space-y-4";
  }
}

export function CascadingRelationChainField({ form, locale, schema, table, column }: Props) {
  const chain = getAdminCascadingFieldChainConfig(schema, table, column);
  const steps = useMemo(() => chain?.steps ?? [], [chain]);

  if (!chain) return null;

  return (
    <div className={layoutClass(chain.layout)}>
      {steps.map((step, stepIndex) => {
        const config = getAdminDependentRelationConfigByKey(step.configKey);
        if (!config) return null;

        return (
          <ConfiguredRelationField
            key={step.name}
            control={form.control}
            name={step.name}
            label={step.label}
            locale={locale}
            config={config}
            onSelectedOption={(option: AsyncSelectOption | null) => {
              if (!option?.raw) return;

              for (let upstreamIndex = 0; upstreamIndex < stepIndex; upstreamIndex += 1) {
                const upstreamStep = steps[upstreamIndex];
                const currentValue = form.getValues(upstreamStep.name);
                const matchingParentFilter = config.parentFilters?.find(
                  (parentFilter) => parentFilter.parentField === upstreamStep.name
                );
                const nextParentValue = matchingParentFilter
                  ? option.raw[matchingParentFilter.targetColumn] ?? null
                  : null;

                if (!currentValue && nextParentValue) {
                  form.setValue(upstreamStep.name, nextParentValue, {
                    shouldDirty: false,
                    shouldTouch: false,
                    shouldValidate: false,
                  });
                }
              }
            }}
          />
        );
      })}
    </div>
  );
}
