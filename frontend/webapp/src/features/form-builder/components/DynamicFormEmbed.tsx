"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { DynamicFormSubmissionPayload, DynamicFormSubmissionResult, RuntimeServiceForm } from "../types";
import { DynamicServiceForm, type DynamicServiceFormProps } from "./DynamicServiceForm";
import type { FieldRendererRegistry } from "../lib/default-field-registry";
import { resolveFormRuntimeOptions } from "../lib/runtime-options";

type RuntimeFormIdentity = {
  serviceDefinitionId?: string;
  usageScope?: "main_booking" | "child_addon_booking";
  formId?: string;
  formKey?: string;
  formVersionId?: string;
};

export interface DynamicFormEmbedProps extends RuntimeFormIdentity {
  locale?: string;
  initialValues?: Record<string, unknown>;
  registry?: FieldRendererRegistry;
  submitLabel?: string;
  disabled?: boolean;
  hideSubmitButton?: boolean;
  persistSubmission?: boolean;
  submitEndpoint?: string;
  submitContext?: Partial<Omit<DynamicFormSubmissionPayload, "payload" | "formVersionId">>;
  onLoaded?: (form: RuntimeServiceForm) => void;
  onSaved?: (result: DynamicFormSubmissionResult) => void;
  onSubmit?: DynamicServiceFormProps["onSubmit"];
}

export function DynamicFormEmbed({
  serviceDefinitionId,
  usageScope = "main_booking",
  formId,
  formKey,
  formVersionId,
  locale = "fa-IR",
  initialValues,
  registry,
  submitLabel,
  disabled,
  hideSubmitButton,
  persistSubmission,
  submitEndpoint,
  submitContext,
  onLoaded,
  onSaved,
  onSubmit,
}: DynamicFormEmbedProps) {
  const t = useTranslations("FormBuilder.runtime");
  const [form, setForm] = useState<RuntimeServiceForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const identityQuery = useMemo(() => {
    const search = new URLSearchParams();
    if (serviceDefinitionId) search.set("serviceDefinitionId", serviceDefinitionId);
    if (usageScope) search.set("usageScope", usageScope);
    if (formId) search.set("formId", formId);
    if (formKey) search.set("formKey", formKey);
    if (formVersionId) search.set("formVersionId", formVersionId);
    return search.toString();
  }, [formId, formKey, formVersionId, serviceDefinitionId, usageScope]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/form-builder/runtime?${identityQuery}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? t("failedToLoadForm"));
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setForm(data.item);
        onLoaded?.(data.item);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : t("failedToLoadForm"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [identityQuery, onLoaded, t]);

  if (isLoading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">{t("loadingForm")}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  if (!form) return null;

  const runtimeOptions = resolveFormRuntimeOptions(form, {
    persistSubmission,
    hideSubmitButton,
    submitLabel: submitLabel ?? (serviceDefinitionId || form.serviceDefinitionId ? t("saveAndContinue") : t("submitForm")),
    submitEndpoint,
    submissionScope: submitContext?.submissionScope,
    contextHint: serviceDefinitionId || form.serviceDefinitionId ? "booking" : undefined,
  });

  return (
    <DynamicServiceForm
      form={form}
      initialValues={initialValues}
      locales={[locale]}
      registry={registry}
      submitLabel={runtimeOptions.submitLabel}
      disabled={disabled}
      hideSubmitButton={runtimeOptions.hideSubmitButton}
      persistSubmission={runtimeOptions.persistSubmission}
      submitEndpoint={runtimeOptions.submitEndpoint}
      submitContext={{
        formVersionId: form.formVersionId,
        serviceDefinitionId: serviceDefinitionId ?? form.serviceDefinitionId ?? null,
        locale,
        submissionScope: runtimeOptions.defaultSubmissionScope,
        status: "submitted",
        ...(submitContext ?? {}),
      }}
      onPersisted={onSaved}
      onSubmit={onSubmit}
    />
  );
}
