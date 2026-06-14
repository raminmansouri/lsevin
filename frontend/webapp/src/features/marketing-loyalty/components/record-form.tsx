"use client";

import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RHFMultiMediaPickerField, RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { LazyAdminLookupSelect } from "@/features/service-providers/components/admin/lazy-admin-lookup-select";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { createEmptyLocalizedContent } from "@/features/shared/utils/localization";
import { useRouter } from "@/i18n/navigation";

import { upsertMarketingLoyaltyRecordAction } from "../actions/upsert-record";
import { buildEntityFormSchema } from "../schemas";
import type { AdminEntityConfig, AdminFieldConfig, AdminFormData, SelectOption } from "../types";

type FormValues = Record<string, unknown>;

type Props = {
  config: AdminEntityConfig;
  formData: AdminFormData;
  locale?: string;
};

export function MarketingLoyaltyRecordForm({ config, formData, locale = "en" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(formData.id);

  const fields = useMemo(() => config.fields.filter((field) => {
    if (isEdit && field.hiddenOnUpdate) return false;
    if (!isEdit && field.hiddenOnCreate) return false;
    return true;
  }), [config.fields, isEdit]);

  const formSchema = useMemo(() => buildEntityFormSchema(config.key, isEdit), [config.key, isEdit]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(fields, formData.record),
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await upsertMarketingLoyaltyRecordAction({
        entityKey: config.key,
        id: formData.id,
        values,
      });

      if (result.error) {
        toast.error(result.error.detail);
        return;
      }

      toast.success(isEdit ? "Record updated." : "Record created.");
      router.push(config.routeBase);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">{isEdit ? config.updateTitle : config.createTitle}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={config.routeBase}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              form={form}
              disabled={isPending || Boolean(field.readOnly)}
              options={getFieldOptions(field, formData)}
              locale={locale}
            />
          ))}
          <div className="flex gap-3 border-t pt-5 lg:col-span-2">
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push(config.routeBase)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldControl({
  field,
  form,
  disabled,
  options,
  locale,
}: {
  field: AdminFieldConfig;
  form: ReturnType<typeof useForm<FormValues>>;
  disabled: boolean;
  options: SelectOption[];
  locale: string;
}) {
  const error = form.formState.errors[field.name]?.message as string | undefined;
  const id = `field-${field.name}`;
  const commonClass = error ? "border-destructive focus-visible:ring-destructive" : "";
  const wide = ["textarea", "richtext", "localized-text", "localized-rich-text", "json"].includes(field.kind);
  const usesLazyLookup = field.kind === "select" && field.lookupType;

  return (
    <div className={`space-y-2 ${wide ? "lg:col-span-2" : ""}`}>
      {field.kind !== "boolean" && field.kind !== "media-single" && field.kind !== "media-multi" && field.kind !== "localized-text" && field.kind !== "localized-rich-text" && (
        <label htmlFor={id} className="text-sm font-medium">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </label>
      )}

      {field.kind === "textarea" && (
        <textarea
          id={id}
          {...form.register(field.name)}
          rows={4}
          disabled={disabled}
          placeholder={field.placeholder}
          className={`min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${commonClass}`}
        />
      )}

      {field.kind === "richtext" && (
        <textarea
          id={id}
          {...form.register(field.name)}
          rows={5}
          disabled={disabled}
          placeholder={field.placeholder}
          className={`min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${commonClass}`}
        />
      )}

      {(field.kind === "localized-text" || field.kind === "localized-rich-text") && (
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: controllerField }) => (
            <LocalizedInput
              label={field.label}
              value={(controllerField.value || createEmptyLocalizedContent()) as never}
              onChange={controllerField.onChange}
              error={error}
              required={field.required}
              richText={field.kind === "localized-rich-text"}
              rows={field.kind === "localized-rich-text" ? 4 : undefined}
              maxLength={field.kind === "localized-rich-text" ? 2000 : 250}
            />
          )}
        />
      )}

      {field.kind === "json" && (
        <textarea
          id={id}
          {...form.register(field.name)}
          rows={8}
          disabled={disabled}
          placeholder={field.placeholder || "{}"}
          className={`min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${commonClass}`}
        />
      )}

      {field.kind === "select" && usesLazyLookup && (
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: controllerField }) => (
            <LazyAdminLookupSelect
              lookupType={field.lookupType as never}
              locale={locale}
              value={String(controllerField.value || "")}
              onValueChange={controllerField.onChange}
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              initialOptions={options}
              disabled={disabled}
              contentClassName={field.lookupType === "providerServices" ? "w-[520px]" : "w-[420px]"}
            />
          )}
        />
      )}

      {field.kind === "select" && !usesLazyLookup && (
        <select
          id={id}
          {...form.register(field.name)}
          disabled={disabled}
          className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${commonClass}`}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}

      {field.kind === "boolean" && (
        <Controller
          control={form.control}
          name={field.name}
          render={({ field: controllerField }) => (
            <label className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">{field.label}</span>
                {field.helperText && <span className="text-xs text-muted-foreground">{field.helperText}</span>}
              </span>
              <input
                type="checkbox"
                checked={Boolean(controllerField.value)}
                onChange={(event) => controllerField.onChange(event.target.checked)}
                disabled={disabled}
                className="h-5 w-5 rounded border-input"
              />
            </label>
          )}
        />
      )}

      {field.kind === "media-single" && (
        <RHFSingleMediaPickerField
          control={form.control as never}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder || "Pick media"}
          mediaType={field.mediaType || "image"}
          helperText={field.helperText}
          modalTitle={`Pick ${field.label}`}
        />
      )}

      {field.kind === "media-multi" && (
        <RHFMultiMediaPickerField
          control={form.control as never}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder || "Pick files"}
          mediaType={field.mediaType || "all"}
          helperText={field.helperText}
          modalTitle={`Pick ${field.label}`}
        />
      )}

      {(field.kind === "text" || field.kind === "number" || field.kind === "integer" || field.kind === "datetime" || field.kind === "color" || field.kind === "readonly") && (
        <Input
          id={id}
          {...form.register(field.name)}
          type={field.kind === "datetime" ? "datetime-local" : field.kind === "color" ? "text" : field.kind === "number" || field.kind === "integer" ? "number" : "text"}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={disabled || field.kind === "readonly"}
          placeholder={field.placeholder}
          className={commonClass}
        />
      )}

      {field.helperText && field.kind !== "boolean" && field.kind !== "media-single" && field.kind !== "media-multi" && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
      {field.kind === "select" && !usesLazyLookup && options.length > 0 && (
        <p className="text-xs text-muted-foreground">{options.find((option) => option.value === String(form.watch(field.name) || ""))?.helper}</p>
      )}
      {error && field.kind !== "localized-text" && field.kind !== "localized-rich-text" && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function getFieldOptions(field: AdminFieldConfig, formData: AdminFormData): SelectOption[] {
  if (field.staticOptions) return field.staticOptions;
  if (field.optionsKey) return formData.options[field.optionsKey] || [];
  return [];
}

function buildDefaultValues(fields: AdminFieldConfig[], record?: Record<string, unknown>): FormValues {
  const defaults: FormValues = {};

  for (const field of fields) {
    const existing = record?.[field.name];
    if (existing !== undefined && existing !== null) {
      defaults[field.name] = normalizeDefaultValue(field, existing);
      continue;
    }

    if (field.kind === "boolean") {
      defaults[field.name] = Boolean(field.defaultValue ?? false);
    } else if (field.kind === "json") {
      defaults[field.name] = JSON.stringify(field.defaultValue ?? {}, null, 2);
    } else if (field.kind === "localized-text" || field.kind === "localized-rich-text") {
      defaults[field.name] = field.defaultValue ?? createEmptyLocalizedContent();
    } else if (field.kind === "datetime" && field.defaultValue === "now") {
      defaults[field.name] = toDateTimeLocal(new Date());
    } else if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    } else {
      defaults[field.name] = "";
    }
  }

  return defaults;
}

function normalizeDefaultValue(field: AdminFieldConfig, value: unknown) {
  if (field.kind === "localized-text" || field.kind === "localized-rich-text") {
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === "object" && parsed !== null ? parsed : createEmptyLocalizedContent();
      } catch {
        return createEmptyLocalizedContent();
      }
    }
    return createEmptyLocalizedContent();
  }

  return value;
}

function toDateTimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}
