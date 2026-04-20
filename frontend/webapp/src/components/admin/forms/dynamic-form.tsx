"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { buildDynamicZodSchema } from "@/lib/admin/validation";
import { ResolvedTableDefinition } from "@/lib/admin/types";
import { MultilingualField } from "./multilingual-field";
import { JsonEditorField } from "./json-editor";
import { RelationField } from "./relation-field";
import { ManyToManyField } from "./many-to-many-field";

type Props = {
  definition: ResolvedTableDefinition;
  locale: string;
  mode: "create" | "edit";
  initialValues?: Record<string, any>;
  onSubmitAction: (payload: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
  excludeFields?: string[];
  submitLabel?: string;
  onSuccess?: () => void;
};

export function DynamicForm({
  definition,
  locale,
  mode,
  initialValues,
  onSubmitAction,
  excludeFields = [],
  submitLabel,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();
  const hiddenFieldSet = useMemo(() => new Set(excludeFields), [excludeFields]);
  const renderedFields = useMemo(
    () => definition.formFields.filter((field) => !hiddenFieldSet.has(field.columnName)),
    [definition.formFields, hiddenFieldSet]
  );
  const schemaDefinition = useMemo(
    () => ({ ...definition, formFields: renderedFields }),
    [definition, renderedFields]
  );
  const schema = useMemo(() => buildDynamicZodSchema(schemaDefinition), [schemaDefinition]);

  const form = useForm<Record<string, any>>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {},
  });

  const values = form.watch();

  function renderField(field: ResolvedTableDefinition["formFields"][number]) {
    if (field.readOnly && mode === "edit") {
      return (
        <div key={field.columnName} className="space-y-2">
          <label className="text-sm font-medium">{field.label}</label>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            {String(values[field.columnName] ?? "—")}
          </div>
        </div>
      );
    }

    if (field.fieldKind === "multilingual") {
      return (
        <MultilingualField
          key={field.columnName}
          name={field.columnName}
          control={form.control}
          locales={field.locales ?? [locale]}
          label={field.label}
          multiline={field.label.toLowerCase().includes("description")}
        />
      );
    }

    if (field.fieldKind === "relation" && field.relation) {
      return (
        <RelationField
          key={field.columnName}
          schema={definition.schema}
          table={definition.table}
          field={field}
          control={form.control}
          locale={locale}
        />
      );
    }

    if (field.fieldKind === "many-to-many" && field.manyToMany) {
      const url = new URL("/api/admin/relation-options", typeof window !== "undefined" ? window.location.origin : "http://localhost");
      url.searchParams.set("schema", definition.schema);
      url.searchParams.set("table", definition.table);
      url.searchParams.set("column", field.columnName);
      url.searchParams.set("locale", locale);

      return (
        <ManyToManyField
          key={field.columnName}
          fieldName={field.columnName}
          endpoint={url.toString()}
          control={form.control}
          label={field.label}
        />
      );
    }

    if (field.fieldKind === "json") {
      return (
        <JsonEditorField
          key={field.columnName}
          name={field.columnName}
          control={form.control}
          label={field.label}
        />
      );
    }

    if (field.fieldKind === "textarea" || field.fieldKind === "richtext") {
      return (
        <div key={field.columnName} className="space-y-2">
          <label className="text-sm font-medium">{field.label}</label>
          <textarea
            rows={6}
            {...form.register(field.columnName)}
            placeholder={field.placeholder}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
          />
          {form.formState.errors[field.columnName] ? (
            <p className="text-xs text-red-500">
              {String(form.formState.errors[field.columnName]?.message ?? "")}
            </p>
          ) : null}
        </div>
      );
    }

    if (field.fieldKind === "boolean") {
      return (
        <label key={field.columnName} className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <input type="checkbox" {...form.register(field.columnName)} />
          <span className="text-sm">{field.label}</span>
        </label>
      );
    }

    const inputType =
      field.fieldKind === "number"
        ? "number"
        : field.fieldKind === "date"
          ? "date"
          : field.fieldKind === "datetime"
            ? "datetime-local"
            : field.fieldKind === "time"
              ? "time"
              : "text";

    if (field.fieldKind === "enum") {
      return (
        <div key={field.columnName} className="space-y-2">
          <label className="text-sm font-medium">{field.label}</label>
          <select
            {...form.register(field.columnName)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">Select...</option>
            {field.enumValues.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.columnName} className="space-y-2">
        <label className="text-sm font-medium">{field.label}</label>
        
        
        <input
          type={inputType}
          {...form.register(field.columnName)}
          placeholder={field.placeholder}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
        />
        {form.formState.errors[field.columnName] ? (
          <p className="text-xs text-red-500">
            {String(form.formState.errors[field.columnName]?.message ?? "")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((payload) => {
        startTransition(async () => {
          const result = await onSubmitAction(form.getValues());
          if (result.ok) {
            toast.success(result.message ?? `${mode === "create" ? "Created" : "Updated"} successfully.`);
            onSuccess?.();
          } else {
            toast.error(result.message ?? "Operation failed.");
          }
        });
      })}
      className="space-y-6"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {renderedFields.map((field) => renderField(field))}
      </div>

      <div className="flex justify-end">
        <button
          disabled={pending}
          type="submit"
          className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-zinc-950"
        >
          <Save className="h-4 w-4" />
          {pending
            ? "Saving..."
            : submitLabel ?? (mode === "create" ? "Create record" : "Save changes")}
        </button>
      </div>
    </form>
  );
}
