"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FormProvider, useForm, type Control, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  DynamicFormSubmissionPayload,
  DynamicFormSubmissionResult,
  FormSection,
  RuntimeServiceForm,
} from "../types";
import { buildZodSchemaFromRuntimeForm } from "../lib/zod-from-form";
import {
  defaultFieldRegistry,
  mergeFieldRegistries,
  type FieldRendererRegistry,
} from "../lib/default-field-registry";
import { resolveFormRuntimeOptions } from "../lib/runtime-options";
import { buildFieldLabelMap, getLabelForPath } from "../lib/submission-display";

export interface DynamicFormSubmitMeta {
  persisted?: DynamicFormSubmissionResult | null;
  form: RuntimeServiceForm;
}

export interface DynamicServiceFormProps {
  form: RuntimeServiceForm;
  initialValues?: Record<string, unknown>;
  locales?: string[];
  registry?: FieldRendererRegistry;
  methods?: UseFormReturn<Record<string, unknown>>;
  onSubmit?: (values: Record<string, unknown>, meta: DynamicFormSubmitMeta) => void | Promise<void>;
  onPersisted?: (result: DynamicFormSubmissionResult) => void;
  submitLabel?: string;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  persistSubmission?: boolean;
  submitEndpoint?: string;
  submitContext?: Partial<Omit<DynamicFormSubmissionPayload, "payload" | "formVersionId">> & {
    formVersionId?: string;
  };
}

function visibleFieldsForSection(section: FormSection) {
  return section.fields.filter((field) => !field.isHidden).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function collectFormErrors(errorBag: unknown, prefix = ""): Array<{ path: string; message: string }> {
  if (!errorBag || typeof errorBag !== "object") return [];

  const maybeMessage = (errorBag as { message?: unknown }).message;
  if (typeof maybeMessage === "string" && maybeMessage.trim()) {
    return [{ path: prefix || "form", message: maybeMessage }];
  }

  return Object.entries(errorBag as Record<string, unknown>).flatMap(([key, value]) => {
    if (key === "ref" || key === "type" || key === "types") return [];
    const path = prefix ? prefix + "." + key : key;
    return collectFormErrors(value, path);
  });
}

export function DynamicFormFields({
  sections,
  registry,
  control,
  locales,
  disabled,
}: {
  sections: FormSection[];
  registry?: FieldRendererRegistry;
  control: Control<Record<string, unknown>>;
  locales?: string[];
  disabled?: boolean;
}) {
  const activeRegistry = useMemo(() => mergeFieldRegistries(defaultFieldRegistry, registry), [registry]);
  const sortedSections = useMemo(
    () => sections.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [sections]
  );

  return (
    <>
      {sortedSections.map((section) => (
        <section key={section.id ?? section.key} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          {section.title ? <h3 className="text-lg font-bold text-slate-900">{section.title}</h3> : null}
          {section.description ? <p className="mt-1 text-sm text-slate-500">{section.description}</p> : null}
          <SectionFields section={section} registry={activeRegistry} control={control} locales={locales} disabled={disabled} />
        </section>
      ))}
    </>
  );
}

function SectionFields({
  section,
  registry,
  control,
  locales,
  disabled,
}: {
  section: FormSection;
  registry: FieldRendererRegistry;
  control: Control<Record<string, unknown>>;
  locales?: string[];
  disabled?: boolean;
}) {
  const t = useTranslations("FormBuilder.runtime");

  return (
    <div className="mt-5 grid grid-cols-12 gap-4">
      {visibleFieldsForSection(section).map((field) => {
        const Renderer = registry[field.fieldTypeCode];
        if (!Renderer) {
          return (
            <div key={field.id ?? field.key} className="col-span-12 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              {t("noRenderer", { type: field.fieldTypeCode })}
            </div>
          );
        }

        return <Renderer key={field.id ?? field.key} control={control} field={field} locales={locales} disabled={disabled} />;
      })}
    </div>
  );
}

async function persistValues({
  endpoint,
  form,
  values,
  submitContext,
  failedMessage,
}: {
  endpoint: string;
  form: RuntimeServiceForm;
  values: Record<string, unknown>;
  submitContext?: DynamicServiceFormProps["submitContext"];
  failedMessage: string;
}): Promise<DynamicFormSubmissionResult> {
  const body: DynamicFormSubmissionPayload = {
    formVersionId: submitContext?.formVersionId ?? form.formVersionId,
    serviceDefinitionId: submitContext?.serviceDefinitionId ?? form.serviceDefinitionId ?? null,
    bookingDraftId: submitContext?.bookingDraftId ?? null,
    bookingDraftChildId: submitContext?.bookingDraftChildId ?? null,
    bookingId: submitContext?.bookingId ?? null,
    bookingChildId: submitContext?.bookingChildId ?? null,
    submittedByUserId: submitContext?.submittedByUserId ?? null,
    locale: submitContext?.locale ?? form.locales?.[0] ?? null,
    submissionScope: submitContext?.submissionScope ?? "generic",
    status: submitContext?.status ?? "submitted",
    payload: values,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? errorBody?.message ?? failedMessage);
  }

  const data = await response.json();
  return data.item ?? data.result ?? data;
}

export function DynamicServiceForm({
  form,
  initialValues,
  locales,
  registry,
  methods,
  onSubmit,
  onPersisted,
  submitLabel,
  disabled,
  hideSubmitButton,
  persistSubmission,
  submitEndpoint,
  submitContext,
}: DynamicServiceFormProps) {
  const t = useTranslations("FormBuilder.runtime");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const validationMessages = useMemo(() => ({
    required: t("validation.required"),
    minChars: (value: number) => t("validation.minChars", { value }),
    maxChars: (value: number) => t("validation.maxChars", { value }),
    minValue: (value: number) => t("validation.minValue", { value }),
    maxValue: (value: number) => t("validation.maxValue", { value }),
    email: t("validation.email"),
    url: t("validation.url"),
    invalidFormat: t("validation.invalidFormat"),
    integer: t("validation.integer"),
    mustBeTrue: t("validation.mustBeTrue"),
  }), [t]);
  const schema = useMemo(() => buildZodSchemaFromRuntimeForm(form, validationMessages), [form, validationMessages]);
  const internalMethods = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {},
  });
  const activeMethods = methods ?? internalMethods;
  const runtimeOptions = useMemo(
    () => resolveFormRuntimeOptions(form, {
      persistSubmission,
      hideSubmitButton,
      submitLabel: submitLabel ?? (submitContext?.bookingId || submitContext?.bookingDraftId || form.serviceDefinitionId ? t("saveAndContinue") : t("submitForm")),
      submitEndpoint,
      submissionScope: submitContext?.submissionScope,
      contextHint: submitContext?.bookingId || submitContext?.bookingDraftId || form.serviceDefinitionId ? "booking" : undefined,
    }),
    [form, hideSubmitButton, persistSubmission, submitContext?.bookingDraftId, submitContext?.bookingId, submitContext?.submissionScope, submitEndpoint, submitLabel, t]
  );

  useEffect(() => {
    if (!methods) {
      internalMethods.reset(initialValues ?? {});
      setActiveStepIndex(0);
      setSubmitError(null);
    }
  }, [initialValues, form.formVersionId, internalMethods, methods]);

  const activeRegistry = useMemo(() => mergeFieldRegistries(defaultFieldRegistry, registry), [registry]);
  const sortedSections = useMemo(
    () => form.sections.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [form.sections]
  );
  const isWizard = form.settings?.layoutMode === "wizard" && sortedSections.length > 1;
  const activeSection = sortedSections[Math.min(activeStepIndex, Math.max(sortedSections.length - 1, 0))];
  const fieldLabelMap = useMemo(() => buildFieldLabelMap(form), [form]);
  const validationErrors = collectFormErrors(activeMethods.formState.errors).map((error) => ({
    ...error,
    label: getLabelForPath(error.path, fieldLabelMap),
  }));

  async function goNext() {
    if (!activeSection) return;
    const fieldKeys = visibleFieldsForSection(activeSection).map((field) => field.key);
    const isValid = fieldKeys.length ? await activeMethods.trigger(fieldKeys) : true;
    if (isValid) setActiveStepIndex((current) => Math.min(current + 1, sortedSections.length - 1));
  }

  async function handleValidSubmit(values: Record<string, unknown>) {
    setSubmitError(null);
    let persisted: DynamicFormSubmissionResult | null = null;

    try {
      if (runtimeOptions.persistSubmission) {
        persisted = await persistValues({
          endpoint: runtimeOptions.submitEndpoint,
          form,
          values,
          submitContext: {
            ...(submitContext ?? {}),
            submissionScope: submitContext?.submissionScope ?? runtimeOptions.defaultSubmissionScope,
          },
          failedMessage: t("failedToSaveSubmission"),
        });
        onPersisted?.(persisted);
      }

      await onSubmit?.(values, { persisted, form });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("failedToSubmitForm"));
    }
  }

  const submitButton = runtimeOptions.hideSubmitButton ? null : (
    <button
      type="submit"
      disabled={disabled || activeMethods.formState.isSubmitting}
      className="h-14 w-full rounded-2xl bg-[#0f182b] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {activeMethods.formState.isSubmitting ? t("saving") : runtimeOptions.submitLabel}
    </button>
  );

  return (
    <FormProvider {...activeMethods}>
      <form
        onSubmit={activeMethods.handleSubmit(handleValidSubmit)}
        className="space-y-6"
      >
        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {activeMethods.formState.submitCount > 0 && validationErrors.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-bold text-red-800">{t("validationErrors")}</div>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-700">
              {validationErrors.map((error) => (
                <li key={error.path + '-' + error.message}>
                  <span className="font-semibold">{error.label}</span>: {error.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {isWizard ? (
          <>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {sortedSections.map((section, index) => {
                  const isActive = index === activeStepIndex;
                  const isDone = index < activeStepIndex;
                  return (
                    <button
                      key={section.id ?? section.key}
                      type="button"
                      onClick={() => setActiveStepIndex(index)}
                      className={[
                        "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                        isActive
                          ? "border-[#155e75] bg-[#155e75] text-white"
                          : isDone
                            ? "border-[#083f30]/20 bg-[#083f30]/10 text-[#083f30]"
                            : "border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      {index + 1}. {section.title || section.key}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeSection ? (
              <section key={activeSection.id ?? activeSection.key} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                {activeSection.title ? <h3 className="text-lg font-bold text-slate-900">{activeSection.title}</h3> : null}
                {activeSection.description ? <p className="mt-1 text-sm text-slate-500">{activeSection.description}</p> : null}
                <SectionFields section={activeSection} registry={activeRegistry} control={activeMethods.control} locales={locales ?? form.locales} disabled={disabled} />
              </section>
            ) : null}

            {!runtimeOptions.hideSubmitButton || sortedSections.length > 1 ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={activeStepIndex === 0 || disabled}
                  className="h-12 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setActiveStepIndex((current) => Math.max(current - 1, 0))}
                >
                  {t("back")}
                </button>

                {activeStepIndex < sortedSections.length - 1 ? (
                  <button type="button" disabled={disabled} className="h-12 flex-1 rounded-2xl bg-[#0f182b] px-5 text-sm font-semibold text-white disabled:opacity-60" onClick={goNext}>
                    {t("continue")}
                  </button>
                ) : (
                  <div className="flex-1">{submitButton}</div>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <DynamicFormFields sections={sortedSections} registry={activeRegistry} control={activeMethods.control} locales={locales ?? form.locales} disabled={disabled} />
            {submitButton}
          </>
        )}
      </form>
    </FormProvider>
  );
}
