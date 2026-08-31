"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  FormBuilderDesignerProps,
  DesignerFieldInput,
  DesignerSectionInput,
  UpsertFormDefinitionInput,
} from "../types/designer";
import type { FieldTypeCode, RuntimeServiceForm, DynamicFormSubmissionResult } from "../types";
import {
  DEFAULT_DESIGNER_FIELD_TYPES,
  createDesignerFieldInput,
  getFieldTypeDefinition,
  supportsFieldOptions,
} from "../lib/field-type-definitions";
import { DynamicServiceForm } from "./DynamicServiceForm";
import { SubmissionValueDetails } from "./SubmissionValueDetails";
import { normalizeRuntimeUsageMode, normalizeSubmissionBehavior, normalizeSubmissionScope } from "../lib/runtime-options";

function createSection(fieldTypeCode: FieldTypeCode = "text", fieldTypes = DEFAULT_DESIGNER_FIELD_TYPES): DesignerSectionInput {
  const key = `section_${Math.random().toString(36).slice(2, 8)}`;
  return {
    key,
    title: "New section",
    displayOrder: 0,
    settings: {},
    fields: [createDesignerFieldInput(fieldTypeCode, fieldTypes)],
  };
}

function createEmptyDesignerValue(): UpsertFormDefinitionInput {
  // Every new form needs its own key. upsertFormDefinition adopts the existing
  // form when the key is already taken, so a shared default meant the second
  // and every later form silently replaced the first one instead of being
  // created alongside it.
  return {
    key: `booking-form-${Math.random().toString(36).slice(2, 8)}`,
    name: "Booking Form",
    title: "Booking Form",
    formScope: "service_booking",
    locales: ["en-US", "fa-IR"],
    settings: {
      layoutMode: "standard",
      runtimeUsageMode: "flexible",
      submissionBehavior: "emit_only",
      defaultSubmissionScope: "generic",
      submitEndpoint: "/api/form-builder/submissions",
      submitLabel: "Submit form",
      hideSubmitButton: false,
    },
    sections: [createSection()],
    activateVersion: false,
    status: "draft",
  };
}

function normalizeInitial(initial?: UpsertFormDefinitionInput): UpsertFormDefinitionInput {
  if (!initial) return createEmptyDesignerValue();

  const sections = (initial.sections?.length ? initial.sections : [createSection()]).map((section, sectionIndex) => ({
    ...section,
    displayOrder: section.displayOrder ?? sectionIndex,
    settings: section.settings ?? {},
    fields: (section.fields ?? []).map((field, fieldIndex) => ({
      ...field,
      displayOrder: field.displayOrder ?? fieldIndex,
      columnSpan: field.columnSpan ?? 12,
      settings: field.settings ?? {},
      validationRules: field.validationRules ?? {},
      options: field.options ?? [],
    })),
  }));

  return {
    ...initial,
    formScope: initial.formScope ?? "service_booking",
    locales: initial.locales?.length ? initial.locales : ["en-US", "fa-IR"],
    title: initial.title || initial.name || "Booking Form",
    status: initial.status ?? "draft",
    activateVersion: Boolean(initial.activateVersion),
    settings: {
      ...(initial.settings ?? {}),
      layoutMode: initial.settings?.layoutMode === "wizard" ? "wizard" : "standard",
      runtimeUsageMode: normalizeRuntimeUsageMode(initial.settings?.runtimeUsageMode),
      submissionBehavior: normalizeSubmissionBehavior(initial.settings?.submissionBehavior),
      defaultSubmissionScope: normalizeSubmissionScope(initial.settings?.defaultSubmissionScope, initial.formScope === "service_booking" ? "booking" : "generic"),
      submitEndpoint: typeof initial.settings?.submitEndpoint === "string" && initial.settings.submitEndpoint.trim() ? initial.settings.submitEndpoint : "/api/form-builder/submissions",
      submitLabel: typeof initial.settings?.submitLabel === "string" && initial.settings.submitLabel.trim() ? initial.settings.submitLabel : "Submit form",
      hideSubmitButton: Boolean(initial.settings?.hideSubmitButton),
    },
    sections,
  };
}

function replaceSection(
  value: UpsertFormDefinitionInput,
  sectionIndex: number,
  nextSection: DesignerSectionInput
): UpsertFormDefinitionInput {
  const sections = [...value.sections];
  sections[sectionIndex] = nextSection;
  return { ...value, sections };
}

function replaceField(
  value: UpsertFormDefinitionInput,
  sectionIndex: number,
  fieldIndex: number,
  nextField: DesignerFieldInput
): UpsertFormDefinitionInput {
  const section = value.sections[sectionIndex];
  const fields = [...section.fields];
  fields[fieldIndex] = nextField;
  return replaceSection(value, sectionIndex, { ...section, fields });
}

function designerToRuntime(value: UpsertFormDefinitionInput): RuntimeServiceForm {
  return {
    formId: value.formId ?? "designer-preview-form",
    formVersionId: value.formVersionId ?? "designer-preview-version",
    serviceDefinitionId: null,
    usageScope: "main_booking",
    locales: value.locales?.length ? value.locales : ["en-US"],
    title: value.title || value.name || "Preview",
    settings: value.settings ?? {},
    sections: value.sections.map((section, sectionIndex) => ({
      id: section.id ?? section.key,
      key: section.key,
      title: section.title,
      description: section.description,
      displayOrder: section.displayOrder ?? sectionIndex,
      settings: section.settings ?? {},
      fields: (section.fields ?? []).map((field, fieldIndex) => ({
        id: field.id ?? field.key,
        key: field.key,
        fieldTypeCode: field.fieldTypeCode,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        defaultValue: field.defaultValue,
        isRequired: field.isRequired,
        isHidden: field.isHidden,
        isRepeatable: field.isRepeatable,
        displayOrder: field.displayOrder ?? fieldIndex,
        columnSpan: field.columnSpan ?? 12,
        settings: field.settings ?? {},
        validationRules: field.validationRules ?? {},
        options: field.options ?? [],
      })),
    })),
  };
}

function setFieldSetting(field: DesignerFieldInput, key: string, settingValue: unknown) {
  return {
    ...field,
    settings: {
      ...(field.settings ?? {}),
      [key]: settingValue,
    },
  };
}

function setFieldValidationRule(field: DesignerFieldInput, key: string, ruleValue: unknown) {
  const nextRules = { ...(field.validationRules ?? {}) };

  if (ruleValue === undefined || ruleValue === null || ruleValue === "") {
    delete nextRules[key];
  } else {
    nextRules[key] = ruleValue;
  }

  return {
    ...field,
    validationRules: nextRules,
  };
}

function validationString(rules: Record<string, unknown> | undefined, key: string, fallback = "") {
  const value = rules?.[key];
  return typeof value === "string" ? value : fallback;
}

function validationNumber(rules: Record<string, unknown> | undefined, key: string) {
  const value = rules?.[key];
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function settingAsString(settings: Record<string, unknown> | undefined, key: string, fallback = "") {
  const value = settings?.[key];
  return typeof value === "string" ? value : fallback;
}

function settingAsNumber(settings: Record<string, unknown> | undefined, key: string, fallback: number) {
  const value = settings?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isPersistableVersionId(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

function nextOptionValue(options: DesignerFieldInput["options"] = []) {
  return `option_${options.length + 1}`;
}

function translateKnownFieldType(t: (key: string) => string, code: unknown, fallback: string) {
  const normalized = String(code);
  try {
    return t(`fieldTypes.${normalized}`);
  } catch {
    return fallback;
  }
}

function translateKnownCategory(t: (key: string) => string, category: string) {
  try {
    return t(`fieldCategories.${category}`);
  } catch {
    return category;
  }
}

function translateKnownFieldDescription(t: (key: string) => string, code: unknown, fallback: string) {
  const normalized = String(code);
  try {
    return t(`fieldTypeDescriptions.${normalized}`);
  } catch {
    return fallback;
  }
}

function FieldEditor({
  field,
  fieldIndex,
  sectionIndex,
  fieldTypes,
  setValue,
}: {
  field: DesignerFieldInput;
  fieldIndex: number;
  sectionIndex: number;
  fieldTypes: typeof DEFAULT_DESIGNER_FIELD_TYPES;
  setValue: React.Dispatch<React.SetStateAction<UpsertFormDefinitionInput>>;
}) {
  const t = useTranslations("FormBuilder.designer");
  const commonT = useTranslations("FormBuilder.common");
  const optionEnabled = supportsFieldOptions(field.fieldTypeCode, fieldTypes);
  const isLazySelect = field.fieldTypeCode === "lazy_searchable_select";
  const isFileUpload = field.fieldTypeCode === "file_upload";

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{t("fieldNumber", { number: fieldIndex + 1 })}</div>
          <div className="text-xs text-slate-500">{field.fieldTypeCode}</div>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
          onClick={(event) => {
            event.stopPropagation();
            setValue((current) => {
              const section = current.sections[sectionIndex];
              const fields = [...section.fields];
              fields.splice(fieldIndex, 1);
              return replaceSection(current, sectionIndex, { ...section, fields });
            });
          }}
        >
          {commonT("remove")}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={field.label}
          onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, label: e.target.value }))}
          className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
          placeholder={t("label")}
        />
        <input
          value={field.key}
          onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, key: e.target.value }))}
          className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
          placeholder={t("fieldKey")}
        />
        <select
          value={field.fieldTypeCode}
          onChange={(e) => {
            const nextType = e.target.value as FieldTypeCode;
            const nextSupportsOptions = supportsFieldOptions(nextType, fieldTypes);
            const template = createDesignerFieldInput(nextType, fieldTypes);
            setValue((current) => replaceField(current, sectionIndex, fieldIndex, {
              ...field,
              fieldTypeCode: nextType,
              options: nextSupportsOptions ? (field.options?.length ? field.options : template.options) : [],
              settings: { ...(field.settings ?? {}), ...(template.settings ?? {}) },
              columnSpan: getFieldTypeDefinition(nextType, fieldTypes)?.defaultColumnSpan ?? field.columnSpan ?? 12,
            }));
          }}
          className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
        >
          {fieldTypes.map((type) => <option key={String(type.code)} value={String(type.code)}>{translateKnownFieldType(t, type.code, type.label)}</option>)}
        </select>
        <input
          value={field.placeholder ?? ""}
          onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, placeholder: e.target.value }))}
          className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
          placeholder={t("placeholder")}
        />
        <input
          value={field.helpText ?? ""}
          onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, helpText: e.target.value }))}
          className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
          placeholder={t("helpText")}
        />
        <input
          type="number"
          min={1}
          max={12}
          value={field.columnSpan ?? 12}
          onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, columnSpan: Math.min(12, Math.max(1, Number(e.target.value || 12))) }))}
          className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
          placeholder={t("columnSpan")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(field.isRequired)} onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, isRequired: e.target.checked }))} /> {commonT("required")}</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(field.isHidden)} onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, isHidden: e.target.checked }))} /> {commonT("hidden")}</label>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3">
          <div className="text-sm font-bold text-slate-900">{t("validationTitle")}</div>
          <p className="text-xs text-slate-500">{t("validationDescription")}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("requiredMessage")}</span>
            <input
              value={validationString(field.validationRules, "requiredMessage", t("requiredDefault"))}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "requiredMessage", e.target.value)))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder={t("requiredDefault")}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("format")}</span>
            <select
              value={validationString(field.validationRules, "format", "")}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "format", e.target.value)))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"
            >
              <option value="">{commonT("none")}</option>
              <option value="email">Email</option>
              <option value="url">URL</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("min")}</span>
            <input
              type="number"
              value={validationNumber(field.validationRules, field.fieldTypeCode === "number" ? "min" : "minLength")}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, field.fieldTypeCode === "number" ? "min" : "minLength", e.target.value === "" ? undefined : Number(e.target.value))))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder={field.fieldTypeCode === "number" ? t("minimumValue") : t("minimumCharacters")}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("minMessage")}</span>
            <input
              value={validationString(field.validationRules, "minMessage", "")}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "minMessage", e.target.value)))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder={t("customMinMessage")}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("max")}</span>
            <input
              type="number"
              value={validationNumber(field.validationRules, field.fieldTypeCode === "number" ? "max" : "maxLength")}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, field.fieldTypeCode === "number" ? "max" : "maxLength", e.target.value === "" ? undefined : Number(e.target.value))))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder={field.fieldTypeCode === "number" ? t("maximumValue") : t("maximumCharacters")}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("maxMessage")}</span>
            <input
              value={validationString(field.validationRules, "maxMessage", "")}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "maxMessage", e.target.value)))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder={t("customMaxMessage")}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("regexPattern")}</span>
            <input
              value={validationString(field.validationRules, "pattern", "")}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "pattern", e.target.value)))}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder="^[A-Z0-9_-]+$"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{t("patternFormatMessage")}</span>
            <input
              value={validationString(field.validationRules, "patternMessage", validationString(field.validationRules, "formatMessage", ""))}
              onChange={(e) => {
                const ruleKey = validationString(field.validationRules, "format", "") ? "formatMessage" : "patternMessage";
                setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, ruleKey, e.target.value)));
              }}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              placeholder={t("invalidFormat")}
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={field.validationRules?.integer === true}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "integer", e.target.checked ? true : undefined)))}
            />
            {t("integerOnly")}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={field.validationRules?.mustBeTrue === true}
              onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldValidationRule(field, "mustBeTrue", e.target.checked ? true : undefined)))}
            />
            {t("mustBeChecked")}
          </label>
        </div>
      </div>


      {isFileUpload ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <div className="text-sm font-bold text-slate-900">{t("fileUploadSettings")}</div>
            <p className="text-xs text-slate-500">{t("fileUploadSettingsDescription")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("uploadEndpoint")}</span>
              <input
                value={settingAsString(field.settings, "endpoint", "/api/admin/media/storage")}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "endpoint", e.target.value)))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                placeholder="/api/admin/media/storage"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("acceptedFileTypes")}</span>
              <input
                value={settingAsString(field.settings, "accept", "")}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "accept", e.target.value)))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                placeholder="image/*,.pdf,.doc,.docx"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("maxFiles")}</span>
              <input
                type="number"
                min={1}
                max={20}
                value={settingAsNumber(field.settings, "maxFiles", field.settings?.multiple === true ? 5 : 1)}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "maxFiles", Math.max(1, Number(e.target.value || 1)))))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={field.settings?.multiple === true}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "multiple", e.target.checked)))}
              />
              {t("allowMultipleFiles")}
            </label>
          </div>
        </div>
      ) : null}

      {isLazySelect ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <div className="text-sm font-bold text-slate-900">{t("lazySettings")}</div>
            <p className="text-xs text-slate-500">{t("lazySettingsDescription", { shape: "{ items: [{ value, label, description, badge, imageUrl }] }" })}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("resource")}</span>
              <input
                value={settingAsString(field.settings, "resource", "service_definitions")}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "resource", e.target.value)))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                placeholder="service_definitions"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("endpoint")}</span>
              <input
                value={settingAsString(field.settings, "endpoint", "/api/admin/lazy-search-options")}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "endpoint", e.target.value)))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                placeholder="/api/admin/lazy-search-options"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("searchPlaceholder")}</span>
              <input
                value={settingAsString(field.settings, "searchPlaceholder", "Search...")}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "searchPlaceholder", e.target.value)))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">{t("limit")}</span>
              <input
                type="number"
                value={settingAsNumber(field.settings, "limit", 20)}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "limit", Number(e.target.value || 20))))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={field.settings?.multiple === true}
                onChange={(e) => setValue((current) => replaceField(current, sectionIndex, fieldIndex, setFieldSetting(field, "multiple", e.target.checked)))}
              />
              {t("allowMultiple")}
            </label>
          </div>
        </div>
      ) : null}

      {optionEnabled ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{t("options")}</div>
              <p className="text-xs text-slate-500">{t("optionsDescription")}</p>
            </div>
            <button
              type="button"
              className="rounded-xl bg-[#083f30] px-3 py-2 text-xs font-semibold text-white"
              onClick={() => {
                const options = field.options ?? [];
                setValue((current) => replaceField(current, sectionIndex, fieldIndex, {
                  ...field,
                  options: [
                    ...options,
                    { value: nextOptionValue(options), label: `Option ${options.length + 1}`, displayOrder: options.length },
                  ],
                }));
              }}
            >
              {t("addOption")}
            </button>
          </div>
          <div className="space-y-2">
            {(field.options ?? []).map((option, optionIndex) => (
              <div key={option.id ?? `${option.value}-${optionIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_90px_44px]">
                <input
                  value={option.value}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[optionIndex] = { ...option, value: e.target.value };
                    setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, options }));
                  }}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
                  placeholder={t("optionValue")}
                />
                <input
                  value={option.label}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[optionIndex] = { ...option, label: e.target.value };
                    setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, options }));
                  }}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
                  placeholder={t("label")}
                />
                <input
                  type="number"
                  value={option.displayOrder ?? optionIndex}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[optionIndex] = { ...option, displayOrder: Number(e.target.value || 0) };
                    setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, options }));
                  }}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#155e75]"
                  placeholder={t("optionOrder")}
                />
                <button
                  type="button"
                  className="h-10 rounded-xl border border-slate-200 text-sm hover:border-red-300 hover:text-red-600"
                  onClick={() => {
                    const options = [...(field.options ?? [])];
                    options.splice(optionIndex, 1);
                    setValue((current) => replaceField(current, sectionIndex, fieldIndex, { ...field, options }));
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FormBuilderDesigner({ initial, fieldTypes = DEFAULT_DESIGNER_FIELD_TYPES, onSave }: FormBuilderDesignerProps) {
  const t = useTranslations("FormBuilder.designer");
  const commonT = useTranslations("FormBuilder.common");
  const [value, setValue] = useState<UpsertFormDefinitionInput>(() => normalizeInitial(initial));
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<Record<string, unknown> | null>(null);
  const [previewPersisted, setPreviewPersisted] = useState<DynamicFormSubmissionResult | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState(false);

  useEffect(() => {
    if (initial) {
      setValue(normalizeInitial(initial));
      setSelectedSectionIndex(0);
      setSaveError(null);
      setPreviewPayload(null);
      setPreviewPersisted(null);
    }
  }, [initial]);

  useEffect(() => {
    if (selectedSectionIndex > value.sections.length - 1) {
      setSelectedSectionIndex(Math.max(value.sections.length - 1, 0));
    }
  }, [selectedSectionIndex, value.sections.length]);

  const fieldTypeByCategory = useMemo(() => {
    return fieldTypes.reduce<Record<string, typeof fieldTypes>>((acc, fieldType) => {
      const category = fieldType.category ?? "basic";
      acc[category] = acc[category] ? [...acc[category], fieldType] : [fieldType];
      return acc;
    }, {});
  }, [fieldTypes]);

  const preview = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const runtimePreview = useMemo(() => designerToRuntime(value), [value]);
  const isWizard = value.settings?.layoutMode === "wizard";
  const canPersistPreview = isPersistableVersionId(value.formVersionId);
  const workbenchGridClass = showJsonPanel
    ? "grid min-w-[1320px] grid-cols-[280px_minmax(0,1fr)_420px] gap-6"
    : "grid min-w-[980px] grid-cols-[280px_minmax(0,1fr)] gap-6";

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(normalizeInitial(value));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("failedToSaveDefinition"));
    } finally {
      setIsSaving(false);
    }
  }

  function addFieldToSelectedSection(fieldTypeCode: FieldTypeCode) {
    setValue((current) => {
      const sections = current.sections.length ? [...current.sections] : [createSection(fieldTypeCode, fieldTypes)];
      const targetIndex = Math.min(selectedSectionIndex, sections.length - 1);
      const target = sections[targetIndex];
      sections[targetIndex] = {
        ...target,
        fields: [
          ...(target.fields ?? []),
          {
            ...createDesignerFieldInput(fieldTypeCode, fieldTypes),
            displayOrder: target.fields?.length ?? 0,
          },
        ],
      };
      return { ...current, sections };
    });
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className={workbenchGridClass}>
        <aside className="sticky top-6 self-start rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{t("fieldPalette")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("fieldPaletteDescription")}</p>

          <label className="mt-4 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("activeSection")}
            <select
              value={selectedSectionIndex}
              onChange={(event) => setSelectedSectionIndex(Number(event.target.value))}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none focus:border-[#155e75]"
            >
              {value.sections.map((section, index) => (
                <option key={section.id ?? section.key} value={index}>
                  {index + 1}. {section.title || section.key}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 space-y-5">
            {(Object.entries(fieldTypeByCategory) as Array<[string, typeof fieldTypes]>).map(([category, items]) => (
              <div key={category}>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{translateKnownCategory(t, category)}</div>
                <div className="grid gap-2">
                  {items.map((fieldType) => (
                    <button
                      key={String(fieldType.code)}
                      type="button"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-[#155e75] hover:text-[#155e75]"
                      onClick={() => addFieldToSelectedSection(fieldType.code)}
                    >
                      <span className="block font-semibold">{translateKnownFieldType(t, fieldType.code, fieldType.label)}</span>
                      {fieldType.description ? <span className="mt-1 block text-xs text-slate-500">{translateKnownFieldDescription(t, fieldType.code, fieldType.description)}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("formSettings")}</h2>
                <p className="text-sm text-slate-500">{t("formSettingsDescription")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-[#155e75] hover:text-[#155e75]"
                  onClick={() => setShowJsonPanel((current) => !current)}
                >
                  {showJsonPanel ? t("hideJson") : t("showJson")}
                </button>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isWizard}
                    onChange={(event) =>
                      setValue((current) => ({
                        ...current,
                        settings: { ...(current.settings ?? {}), layoutMode: event.target.checked ? "wizard" : "standard" },
                      }))
                    }
                  />
                  {t("wizardSteps")}
                </label>
                <button type="button" disabled={isSaving} className="rounded-2xl bg-[#0f182b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={handleSave}>{isSaving ? t("saving") : t("saveForm")}</button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">{t("formKey")}</span>
                <input value={value.key} onChange={(e) => setValue({ ...value, key: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">{t("formName")}</span>
                <input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">{t("versionTitle")}</span>
                <input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">{t("scope")}</span>
                <select value={value.formScope ?? "service_booking"} onChange={(e) => setValue({ ...value, formScope: e.target.value as UpsertFormDefinitionInput["formScope"] })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]">
                  <option value="service_booking">{t("serviceBooking")}</option>
                  <option value="addon_booking">{t("addonBooking")}</option>
                  <option value="generic">{t("generic")}</option>
                </select>
              </label>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">{t("runtimeUsageOptions")}</h3>
                  <p className="mt-1 text-xs text-slate-500">{t("runtimeUsageHelp")}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-800">{t("runtimeUsageMode")}</span>
                    <select
                      value={value.settings?.runtimeUsageMode ?? "flexible"}
                      onChange={(e) => setValue({
                        ...value,
                        settings: {
                          ...(value.settings ?? {}),
                          runtimeUsageMode: e.target.value as NonNullable<UpsertFormDefinitionInput["settings"]>["runtimeUsageMode"],
                          defaultSubmissionScope: e.target.value === "booking" ? "booking" : e.target.value === "standalone" ? "generic" : value.settings?.defaultSubmissionScope ?? "generic",
                          hideSubmitButton: e.target.value === "react_hook_form" ? true : value.settings?.hideSubmitButton ?? false,
                          submissionBehavior: e.target.value === "react_hook_form" ? "emit_only" : value.settings?.submissionBehavior ?? "emit_only",
                        },
                      })}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                    >
                      <option value="flexible">{t("flexible")}</option>
                      <option value="standalone">{t("standalone")}</option>
                      <option value="booking">{t("bookingEmbedded")}</option>
                      <option value="react_hook_form">{t("reactHookFormOnly")}</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-800">{t("submissionBehavior")}</span>
                    <select
                      value={value.settings?.submissionBehavior ?? "emit_only"}
                      onChange={(e) => setValue({
                        ...value,
                        settings: { ...(value.settings ?? {}), submissionBehavior: e.target.value as NonNullable<UpsertFormDefinitionInput["settings"]>["submissionBehavior"] },
                      })}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                    >
                      <option value="emit_only">{t("emitOnly")}</option>
                      <option value="save_to_database">{t("saveToDatabase")}</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-800">{t("defaultSubmissionScope")}</span>
                    <select
                      value={value.settings?.defaultSubmissionScope ?? "generic"}
                      onChange={(e) => setValue({
                        ...value,
                        settings: { ...(value.settings ?? {}), defaultSubmissionScope: e.target.value as NonNullable<UpsertFormDefinitionInput["settings"]>["defaultSubmissionScope"] },
                      })}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                    >
                      <option value="generic">{t("genericStandalone")}</option>
                      <option value="booking">{t("booking")}</option>
                      <option value="admin_preview">{t("adminPreview")}</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-800">{t("submitButtonLabel")}</span>
                    <input
                      value={value.settings?.submitLabel ?? t("submitForm")}
                      onChange={(e) => setValue({ ...value, settings: { ...(value.settings ?? {}), submitLabel: e.target.value } })}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block font-semibold text-slate-800">{t("submitEndpoint")}</span>
                    <input
                      value={value.settings?.submitEndpoint ?? "/api/form-builder/submissions"}
                      onChange={(e) => setValue({ ...value, settings: { ...(value.settings ?? {}), submitEndpoint: e.target.value } })}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                      placeholder="/api/form-builder/submissions"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={Boolean(value.settings?.hideSubmitButton)}
                      onChange={(e) => setValue({ ...value, settings: { ...(value.settings ?? {}), hideSubmitButton: e.target.checked } })}
                    />
                    {t("hideSubmitButtonHelp")}
                  </label>
                </div>
              </div>

              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-semibold text-slate-800">{t("description")}</span>
                <textarea value={value.description ?? ""} onChange={(e) => setValue({ ...value, description: e.target.value })} rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#155e75]" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">{t("locales")}</span>
                <input value={(value.locales ?? []).join(", ")} onChange={(e) => setValue({ ...value, locales: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" placeholder="en-US, fa-IR" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">{t("status")}</span>
                  <select value={value.status ?? "draft"} onChange={(e) => setValue({ ...value, status: e.target.value as UpsertFormDefinitionInput["status"] })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]">
                    <option value="draft">{t("draft")}</option>
                    <option value="published">{t("published")}</option>
                    <option value="archived">{t("archived")}</option>
                  </select>
                </label>
                <label className="mt-7 flex h-12 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={Boolean(value.activateVersion)} onChange={(e) => setValue({ ...value, activateVersion: e.target.checked })} />
                  {t("activateVersion")}
                </label>
              </div>
            </div>
            {saveError ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p> : null}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="min-w-0 space-y-5">
              {isWizard ? (
                <section className="rounded-[28px] border border-[#155e75]/20 bg-[#155e75]/5 p-5">
                  <div className="text-sm font-bold text-[#155e75]">{t("wizardEnabled")}</div>
                  <p className="mt-1 text-sm text-slate-600">{t("wizardEnabledDescription")}</p>
                </section>
              ) : null}

              {value.sections.map((section, sectionIndex) => (
                <section
                  key={section.id ?? section.key}
                  className={`rounded-[28px] border bg-white p-5 shadow-sm ${sectionIndex === selectedSectionIndex ? "border-[#155e75]" : "border-slate-200"}`}
                  onClick={() => setSelectedSectionIndex(sectionIndex)}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{isWizard ? t("step", { number: sectionIndex + 1 }) : t("section", { number: sectionIndex + 1 })}</h3>
                      <p className="text-xs text-slate-500">{t("sectionActiveHint")}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        setValue((current) => {
                          if (current.sections.length <= 1) return current;
                          const sections = [...current.sections];
                          sections.splice(sectionIndex, 1);
                          return { ...current, sections };
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={section.title ?? ""} onChange={(e) => setValue((current) => replaceSection(current, sectionIndex, { ...section, title: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]" placeholder={t("sectionTitle")} />
                    <input value={section.key} onChange={(e) => setValue((current) => replaceSection(current, sectionIndex, { ...section, key: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]" placeholder={t("sectionKey")} />
                    <textarea value={section.description ?? ""} onChange={(e) => setValue((current) => replaceSection(current, sectionIndex, { ...section, description: e.target.value }))} rows={2} className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#155e75] md:col-span-2" placeholder={t("sectionDescription")} />
                  </div>

                  <div className="mt-4 space-y-4">
                    {(section.fields ?? []).map((field, fieldIndex) => (
                      <FieldEditor key={field.id ?? field.key} field={field} fieldIndex={fieldIndex} sectionIndex={sectionIndex} fieldTypes={fieldTypes} setValue={setValue} />
                    ))}
                  </div>
                </section>
              ))}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
                  onClick={() => {
                    const nextSection = { ...createSection("text", fieldTypes), displayOrder: value.sections.length };
                    setValue({ ...value, sections: [...value.sections, nextSection] });
                    setSelectedSectionIndex(value.sections.length);
                  }}
                >
                  {isWizard ? t("addStep") : t("addSection")}
                </button>
                <button type="button" disabled={isSaving} className="rounded-2xl bg-[#0f182b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={handleSave}>{isSaving ? t("saving") : t("saveFormDefinition")}</button>
              </div>
            </section>

            <aside className="min-w-0 self-start rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm xl:sticky xl:top-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">{t("realTimePreview")}</h2>
                <p className="text-sm text-slate-500">{t("realTimePreviewDescription")}</p>
              </div>

              {!canPersistPreview ? (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {t("saveFirstForPreview")}
                </div>
              ) : null}

              <DynamicServiceForm
                form={runtimePreview}
                submitLabel={t("submitPreview")}
                persistSubmission={canPersistPreview}
                hideSubmitButton={false}
                submitContext={{
                  formVersionId: value.formVersionId ?? undefined,
                  submissionScope: "admin_preview",
                  status: "submitted",
                  locale: value.locales?.[0] ?? "fa-IR",
                }}
                onPersisted={setPreviewPersisted}
                onSubmit={async (payload) => setPreviewPayload(payload)}
              />

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t("submittedValues")}</div>
                    <p className="mt-1 text-xs text-slate-500">{t("submittedValuesDescription")}</p>
                  </div>
                  {previewPayload ? (
                    <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600" onClick={() => { setPreviewPayload(null); setPreviewPersisted(null); }}>
                      {commonT("clear")}
                    </button>
                  ) : null}
                </div>
                {previewPersisted ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    {t("savedAsSubmission", { id: previewPersisted.submissionId })}
                  </div>
                ) : null}
                {previewPayload ? (
                  <div className="mt-4 space-y-3">
                    <SubmissionValueDetails payload={previewPayload} form={runtimePreview} className="overflow-hidden rounded-xl border border-slate-200 bg-white" />
                    <details className="rounded-xl bg-slate-950 p-3 text-xs text-slate-200">
                      <summary className="cursor-pointer font-semibold text-slate-100">{t("rawPayload")}</summary>
                      <pre className="mt-3 max-h-[260px] overflow-auto">{JSON.stringify(previewPayload, null, 2)}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    {t("noPreviewSubmission")}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>

        {showJsonPanel ? (
          <aside className="sticky top-6 self-start rounded-[28px] border border-slate-200 bg-[#0f182b] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">{t("json")}</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{t("live")}</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">{t("jsonDescription")}</p>
            <pre className="mt-4 max-h-[52vh] overflow-auto rounded-2xl bg-slate-950/50 p-4 text-xs text-slate-200">{preview}</pre>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-bold text-white">{t("lastSubmittedValues")}</div>
              <p className="mt-1 text-xs text-slate-300">{t("lastSubmittedValuesDescription")}</p>
              {previewPayload ? (
                <pre className="mt-3 max-h-[22vh] overflow-auto rounded-xl bg-slate-950/60 p-3 text-xs text-slate-200">{JSON.stringify(previewPayload, null, 2)}</pre>
              ) : (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">{t("noSubmittedPreviewValues")}</div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
