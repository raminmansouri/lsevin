"use client";

import React, { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RuntimeServiceForm } from "../types";
import { buildZodSchemaFromRuntimeForm } from "../lib/zod-from-form";
import {
  defaultFieldRegistry,
  type FieldRendererRegistry,
} from "../lib/default-field-registry";

interface DynamicServiceFormProps {
  form: RuntimeServiceForm;
  initialValues?: Record<string, unknown>;
  locales?: string[];
  registry?: FieldRendererRegistry;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
}

export function DynamicServiceForm({
  form,
  initialValues,
  locales,
  registry,
  onSubmit,
  submitLabel = "Save and continue",
}: DynamicServiceFormProps) {
  const schema = useMemo(() => buildZodSchemaFromRuntimeForm(form), [form]);
  const methods = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {},
  });

  const activeRegistry = registry ?? defaultFieldRegistry;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
        className="space-y-6"
      >
        {form.sections.map((section) => (
          <section key={section.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            {section.title ? <h3 className="text-lg font-bold text-slate-900">{section.title}</h3> : null}
            {section.description ? <p className="mt-1 text-sm text-slate-500">{section.description}</p> : null}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {section.fields
                .slice()
                .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                .map((field) => {
                  const Renderer = activeRegistry[field.fieldTypeCode];
                  if (!Renderer) {
                    return (
                      <div key={field.id} className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                        No renderer registered for field type <strong>{field.fieldTypeCode}</strong>
                      </div>
                    );
                  }
                  return <Renderer key={field.id} control={methods.control} field={field} locales={locales ?? form.locales} />;
                })}
            </div>
          </section>
        ))}

        <button
          type="submit"
          className="h-14 w-full rounded-2xl bg-[#0f182b] px-5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {submitLabel}
        </button>
      </form>
    </FormProvider>
  );
}
