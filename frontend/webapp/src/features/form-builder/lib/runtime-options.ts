import type { FormSubmissionScope, RuntimeServiceForm } from "../types";

export type FormRuntimeUsageMode = "flexible" | "standalone" | "booking" | "react_hook_form";
export type FormSubmissionBehavior = "save_to_database" | "emit_only";

export interface ResolvedFormRuntimeOptions {
  runtimeUsageMode: FormRuntimeUsageMode;
  submissionBehavior: FormSubmissionBehavior;
  defaultSubmissionScope: FormSubmissionScope;
  persistSubmission: boolean;
  hideSubmitButton: boolean;
  submitLabel: string;
  submitEndpoint: string;
}

function stringSetting(settings: Record<string, unknown> | undefined, key: string, fallback: string) {
  const value = settings?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeRuntimeUsageMode(value: unknown): FormRuntimeUsageMode {
  if (value === "standalone" || value === "booking" || value === "react_hook_form" || value === "flexible") return value;
  return "flexible";
}

export function normalizeSubmissionBehavior(value: unknown): FormSubmissionBehavior {
  if (value === "save_to_database" || value === "emit_only") return value;
  return "emit_only";
}

export function normalizeSubmissionScope(value: unknown, fallback: FormSubmissionScope = "generic"): FormSubmissionScope {
  if (value === "booking" || value === "admin_preview" || value === "generic") return value;
  return fallback;
}

export function resolveFormRuntimeOptions(
  form: RuntimeServiceForm,
  overrides?: {
    persistSubmission?: boolean;
    hideSubmitButton?: boolean;
    submitLabel?: string;
    submitEndpoint?: string;
    submissionScope?: FormSubmissionScope;
    contextHint?: "booking" | "standalone" | "react_hook_form";
  }
): ResolvedFormRuntimeOptions {
  const settings = form.settings ?? {};
  const runtimeUsageMode = normalizeRuntimeUsageMode(settings.runtimeUsageMode);
  const contextSuggestsBooking = overrides?.contextHint === "booking" || Boolean(form.serviceDefinitionId);
  const fallbackScope: FormSubmissionScope = contextSuggestsBooking || runtimeUsageMode === "booking" ? "booking" : "generic";
  const defaultSubmissionScope = overrides?.submissionScope ?? normalizeSubmissionScope(settings.defaultSubmissionScope, fallbackScope);
  const submissionBehavior = normalizeSubmissionBehavior(settings.submissionBehavior);
  const settingsHideSubmit = typeof settings.hideSubmitButton === "boolean" ? settings.hideSubmitButton : runtimeUsageMode === "react_hook_form";

  return {
    runtimeUsageMode,
    submissionBehavior,
    defaultSubmissionScope,
    persistSubmission:
      overrides?.persistSubmission ??
      (submissionBehavior === "save_to_database" && runtimeUsageMode !== "react_hook_form"),
    hideSubmitButton: overrides?.hideSubmitButton ?? settingsHideSubmit,
    submitLabel: overrides?.submitLabel ?? stringSetting(settings, "submitLabel", runtimeUsageMode === "booking" ? "Save and continue" : "Submit form"),
    submitEndpoint: overrides?.submitEndpoint ?? stringSetting(settings, "submitEndpoint", "/api/form-builder/submissions"),
  };
}
