"use client";

import type { ComponentType } from "react";
import { Control } from "react-hook-form";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LazyAdminLookupSelect } from "@/features/service-providers/components/admin/lazy-admin-lookup-select";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";

import type { AdminFieldConfig, AdminRelationOption } from "../types";
import { getFieldKind, normalizeLocalizedValue } from "../lib/values";
import { RHFMultiMediaPickerField, RHFSingleMediaPickerField } from "./media-picker-import";

type LazyLookupSelectProps = {
  lookupType: string;
  locale: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  initialOptions?: AdminRelationOption[];
  excludeIds?: string[];
  disabled?: boolean;
  contentClassName?: string;
};

const AdminLazyLookupSelect = LazyAdminLookupSelect as ComponentType<LazyLookupSelectProps>;

type Props = {
  control: Control<Record<string, unknown>>;
  fieldConfig: AdminFieldConfig;
  disabled?: boolean;
  relationOptions?: AdminRelationOption[];
  locale: string;
};

export function AdminFieldRenderer({ control, fieldConfig, disabled, relationOptions = [], locale }: Props) {
  const kind = getFieldKind(fieldConfig);
  const label = fieldConfig.label || fieldConfig.name.replaceAll("_", " ");

  if (fieldConfig.hidden) return null;

  if (kind === "media-single") {
    return (
      <RHFSingleMediaPickerField
        control={control as never}
        name={fieldConfig.name as never}
        label={label}
        placeholder={fieldConfig.placeholder || "Pick file"}
        mediaType={fieldConfig.mediaType || "all"}
        helperText={fieldConfig.description || "Stores one media id in this column."}
        modalTitle={`Pick ${label}`}
        key={fieldConfig.name}
      />
    );
  }

  if (kind === "media-multi") {
    return (
      <RHFMultiMediaPickerField
        control={control as never}
        name={fieldConfig.name as never}
        label={label}
        placeholder={fieldConfig.placeholder || "Pick files"}
        mediaType={fieldConfig.mediaType || "all"}
        helperText={fieldConfig.description || "Stores media ids as comma-separated text."}
        modalTitle={`Pick ${label}`}
        key={fieldConfig.name}
      />
    );
  }

  if (kind === "localized" || kind === "localized-rich") {
    return (
      <FormField
        control={control}
        name={fieldConfig.name}
        render={({ field, fieldState }) => (
          <FormItem className="space-y-2 md:col-span-2 xl:col-span-3">
            <FormControl>
              <LocalizedInput
                label={label}
                value={normalizeLocalizedValue(field.value) as never}
                onChange={field.onChange}
                error={fieldState.error?.message}
                required={fieldConfig.required}
                richText={kind === "localized-rich"}
                rows={fieldConfig.rows || (kind === "localized-rich" ? 4 : undefined)}
                maxLength={fieldConfig.maxLength || (kind === "localized-rich" ? 2000 : 250)}
              />
            </FormControl>
            {fieldConfig.description && <FormDescription>{fieldConfig.description}</FormDescription>}
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name={fieldConfig.name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="capitalize">{label}</FormLabel>
          <FormControl>
            {kind === "boolean" ? (
              <div className="flex h-10 items-center">
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={disabled || fieldConfig.readonly} />
              </div>
            ) : kind === "textarea" || kind === "json" ? (
              <Textarea
                {...field}
                value={String(field.value ?? "")}
                disabled={disabled || fieldConfig.readonly}
                rows={kind === "json" ? 8 : 4}
                className={kind === "json" ? "font-mono text-xs" : undefined}
                placeholder={fieldConfig.placeholder || (kind === "json" ? "{}" : undefined)}
              />
            ) : kind === "select" ? (
              fieldConfig.relation?.lookupType ? (
                <AdminLazyLookupSelect
                  lookupType={fieldConfig.relation.lookupType}
                  locale={locale}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={field.onChange}
                  placeholder={fieldConfig.placeholder || `Select ${label}`}
                  initialOptions={relationOptions}
                  disabled={disabled || fieldConfig.readonly}
                  contentClassName={fieldConfig.relation.contentClassName || "w-[460px]"}
                />
              ) : (
                <Select disabled={disabled || fieldConfig.readonly} value={String(field.value ?? "")} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldConfig.relation
                      ? relationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))
                      : fieldConfig.options?.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              )
            ) : (
              <Input
                {...field}
                value={String(field.value ?? "")}
                type={kind === "number" ? "number" : kind === "date" ? "date" : kind === "datetime" ? "datetime-local" : kind === "time" ? "time" : "text"}
                disabled={disabled || fieldConfig.readonly}
                placeholder={fieldConfig.placeholder}
              />
            )}
          </FormControl>
          {fieldConfig.description && <FormDescription>{fieldConfig.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
