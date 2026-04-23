"use client";

import { useEffect, useMemo, useRef } from "react";
import { useController, useWatch, type Control } from "react-hook-form";
import { AsyncSearchableSingleSelect, type AsyncSelectOption } from "./async-searchable-single-select";
import type { AdminDependentRelationConfig } from "@/lib/admin/extensions/dependent-relations";

type Props = {
  control: Control<any>;
  name: string;
  label: string;
  locale: string;
  config: AdminDependentRelationConfig;
  onSelectedOption?: (option: AsyncSelectOption | null) => void;
};

export function ConfiguredRelationField({
  control,
  name,
  label,
  locale,
  config,
  onSelectedOption,
}: Props) {
  const controller = useController({ control, name });
  const parentNames = useMemo(
    () => config.parentFilters?.map((item) => item.parentField) ?? [],
    [config.parentFilters]
  );
  const watchedParents = useWatch({ control, name: parentNames as any });
  const previousSignatureRef = useRef<string>("");

  const parentEntries = useMemo(() => {
    return (config.parentFilters ?? []).map((item, index) => ({
      ...item,
      value: Array.isArray(watchedParents) ? watchedParents[index] : undefined,
    }));
  }, [config.parentFilters, watchedParents]);

  const missingRequiredParent = parentEntries.some(
    (item) => item.required !== false && (item.value === undefined || item.value === null || item.value === "")
  );
  const parentSignature = JSON.stringify(parentEntries.map((item) => [item.parentField, item.value]));

  useEffect(() => {
    if (!config.resetOnParentChange) {
      previousSignatureRef.current = parentSignature;
      return;
    }

    if (!previousSignatureRef.current) {
      previousSignatureRef.current = parentSignature;
      return;
    }

    if (previousSignatureRef.current !== parentSignature) {
      controller.field.onChange(null);
      previousSignatureRef.current = parentSignature;
      onSelectedOption?.(null);
    }
  }, [config.resetOnParentChange, controller.field, parentSignature, onSelectedOption]);

  async function loadOptions({ search, page, pageSize }: { search: string; page: number; pageSize: number }) {
    const url = new URL("/api/admin/relation-cascade-options", window.location.origin);
    url.searchParams.set("key", config.key);
    url.searchParams.set("locale", locale);
    url.searchParams.set("search", search);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set(
      "parents",
      JSON.stringify(parentEntries.map((item) => ({ field: item.parentField, value: item.value })))
    );

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load options");
    return response.json();
  }

  async function loadByValue(value: string): Promise<AsyncSelectOption | null> {
    const url = new URL("/api/admin/relation-cascade-options", window.location.origin);
    url.searchParams.set("key", config.key);
    url.searchParams.set("locale", locale);
    url.searchParams.set("id", value);
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) return null;
    const json = await response.json();
    return json.item ?? null;
  }

  return (
    <div className="space-y-2">
      <AsyncSearchableSingleSelect
        label={label}
        value={controller.field.value ?? null}
        disabled={missingRequiredParent}
        placeholder={
          missingRequiredParent
            ? config.placeholderWhenMissingParents ?? "Select parent first"
            : config.placeholder ?? `Select ${label.toLowerCase()}`
        }
        searchPlaceholder={`Search ${label.toLowerCase()}...`}
        onChange={(value, option) => {
          controller.field.onChange(value);
          onSelectedOption?.(option);
        }}
        loadOptions={loadOptions}
        loadByValue={async (value) => {
          const option = await loadByValue(value);
          if (option) {
            onSelectedOption?.(option);
          }
          return option;
        }}
        pageSize={config.pageSize ?? 20}
      />
      {controller.fieldState.error ? (
        <p className="text-xs text-red-500">{controller.fieldState.error.message}</p>
      ) : null}
    </div>
  );
}
