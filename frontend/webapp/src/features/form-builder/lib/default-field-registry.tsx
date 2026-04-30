"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";
import { PersianDateTimePicker } from "@/components/date-time/PersianDateTimePicker";
import { LazySearchableSelect } from "../components/LazySearchableSelect";
import type { FormField } from "../types";

export interface FieldRendererProps {
  control: Control<any>;
  field: FormField;
  locales?: string[];
  disabled?: boolean;
}

export type FieldRenderer = React.ComponentType<FieldRendererProps>;
export type FieldRendererRegistry = Record<string, FieldRenderer>;

function gridSpanStyle(field: FormField): React.CSSProperties {
  const span = Math.min(12, Math.max(1, Number(field.columnSpan ?? 12)));
  return { gridColumn: `span ${span} / span ${span}` };
}

function FieldShell({ field, children }: { field: FormField; children: React.ReactNode }) {
  if (field.isHidden) return null;

  return (
    <div style={gridSpanStyle(field)} className="min-w-0 md:col-span-1">
      {children}
    </div>
  );
}

function BaseLabel({ field }: { field: FormField }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-semibold text-slate-900">
        {field.label}
        {field.isRequired ? <span className="ms-1 text-red-500">*</span> : null}
      </label>
      {field.helpText ? <p className="mt-1 text-xs text-slate-500">{field.helpText}</p> : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

function getFieldErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;

  for (const value of Object.values(error as Record<string, unknown>)) {
    const nested = getFieldErrorMessage(value);
    if (nested) return nested;
  }

  return undefined;
}

function TextLike({ control, field, disabled, type = "text", as = "input" as "input" | "textarea" }: FieldRendererProps & { type?: string; as?: "input" | "textarea" }) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          {as === "textarea" ? (
            <textarea
              {...rhfField}
              disabled={disabled}
              rows={4}
              placeholder={field.placeholder ?? ""}
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155e75] disabled:bg-slate-50"
            />
          ) : (
            <input
              {...rhfField}
              disabled={disabled}
              type={type}
              placeholder={field.placeholder ?? ""}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75] disabled:bg-slate-50"
            />
          )}
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

function SelectField({ control, field, disabled }: FieldRendererProps) {
  const t = useTranslations("FormBuilder.runtime");
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          <select {...rhfField} disabled={disabled} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75] disabled:bg-slate-50">
            <option value="">{field.placeholder ?? t("select")}</option>
            {(field.options ?? []).map((option) => (
              <option key={option.id ?? option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

function RadioField({ control, field, disabled }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
            {(field.options ?? []).map((option) => (
              <label key={option.id ?? option.value} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="radio"
                  disabled={disabled}
                  value={option.value}
                  checked={rhfField.value === option.value}
                  onChange={() => rhfField.onChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

function CheckboxField({ control, field, disabled }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={Boolean(field.defaultValue)}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input disabled={disabled} type="checkbox" checked={Boolean(rhfField.value)} onChange={(e) => rhfField.onChange(e.target.checked)} />
            <div>
              <div className="text-sm font-semibold text-slate-900">{field.label}</div>
              {field.helpText ? <div className="text-xs text-slate-500">{field.helpText}</div> : null}
            </div>
          </label>
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

function PersianDateField({ control, field, disabled, mode = "date" as "date" | "datetime" }: FieldRendererProps & { mode?: "date" | "datetime" }) {
  const t = useTranslations("FormBuilder.datePicker");
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          <PersianDateTimePicker
            value={(rhfField.value as string) ?? ""}
            onChange={rhfField.onChange}
            mode={mode}
            disabled={disabled}
            placeholder={field.placeholder ?? (mode === "datetime" ? t("placeholderDateTime") : t("placeholderDate"))}
          />
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

function DateRangeField({ control, field, disabled }: FieldRendererProps) {
  const t = useTranslations("FormBuilder.runtime");
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? { from: "", to: "" }}
      render={({ field: rhfField, fieldState }) => {
        const value = (rhfField.value ?? {}) as { from?: string; to?: string };
        return (
          <FieldShell field={field}>
            <BaseLabel field={field} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PersianDateTimePicker
                value={value.from ?? ""}
                onChange={(nextValue) => rhfField.onChange({ ...value, from: nextValue })}
                disabled={disabled}
                placeholder={t("fromDate")}
              />
              <PersianDateTimePicker
                value={value.to ?? ""}
                onChange={(nextValue) => rhfField.onChange({ ...value, to: nextValue })}
                disabled={disabled}
                placeholder={t("toDate")}
              />
            </div>
            <FieldError message={getFieldErrorMessage(fieldState.error)} />
          </FieldShell>
        );
      }}
    />
  );
}

function TimeRangeField({ control, field, disabled }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? { from: "", to: "" }}
      render={({ field: rhfField, fieldState }) => {
        const value = (rhfField.value ?? {}) as { from?: string; to?: string };
        return (
          <FieldShell field={field}>
            <BaseLabel field={field} />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                disabled={disabled}
                value={value.from ?? ""}
                onChange={(e) => rhfField.onChange({ ...value, from: e.target.value })}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75] disabled:bg-slate-50"
              />
              <input
                type="time"
                disabled={disabled}
                value={value.to ?? ""}
                onChange={(e) => rhfField.onChange({ ...value, to: e.target.value })}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75] disabled:bg-slate-50"
              />
            </div>
            <FieldError message={getFieldErrorMessage(fieldState.error)} />
          </FieldShell>
        );
      }}
    />
  );
}

function PersonCountField({ control, field, disabled }: FieldRendererProps) {
  const t = useTranslations("FormBuilder.runtime");
  const keys = ["adults", "children", "infants", "rooms"] as const;
  const labels: Record<typeof keys[number], string> = { adults: t("adults"), children: t("children"), infants: t("infants"), rooms: t("rooms") };
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? { adults: 1, children: 0, infants: 0, rooms: 1 }}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            {keys.map((key) => (
              <label key={key} className="text-sm">
                <span className="mb-1 block text-slate-700">{labels[key]}</span>
                <input
                  type="number"
                  disabled={disabled}
                  min={0}
                  value={rhfField.value?.[key] ?? 0}
                  onChange={(e) => rhfField.onChange({ ...(rhfField.value ?? {}), [key]: Number(e.target.value || 0) })}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75] disabled:bg-slate-50"
                />
              </label>
            ))}
          </div>
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

function MultilingualJsonField({ control, field, locales = ["en-US"], disabled }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? {}}
      render={({ field: rhfField, fieldState }) => {
        const value = rhfField.value ?? {};
        return (
          <FieldShell field={field}>
            <BaseLabel field={field} />
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              {locales.map((locale) => (
                <label key={locale} className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">{locale}</span>
                  {field.fieldTypeCode === "multilingual_textarea" ? (
                    <textarea
                      disabled={disabled}
                      rows={3}
                      value={value[locale] ?? ""}
                      onChange={(e) => rhfField.onChange({ ...value, [locale]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#155e75] disabled:bg-slate-50"
                    />
                  ) : (
                    <input
                      disabled={disabled}
                      type="text"
                      value={value[locale] ?? ""}
                      onChange={(e) => rhfField.onChange({ ...value, [locale]: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75] disabled:bg-slate-50"
                    />
                  )}
                </label>
              ))}
            </div>
            <FieldError message={getFieldErrorMessage(fieldState.error)} />
          </FieldShell>
        );
      }}
    />
  );
}


function getStringSetting(field: FormField, key: string, fallback = "") {
  const value = field.settings?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getBooleanSetting(field: FormField, key: string, fallback = false) {
  const value = field.settings?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function getNumberSetting(field: FormField, key: string, fallback: number) {
  const value = field.settings?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}


interface UploadedFileValue {
  fileUrl: string;
  storedName?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

function normalizeUploadResponse(payload: any, file: File): UploadedFileValue {
  const source = payload?.item ?? payload?.result ?? payload;
  return {
    fileUrl: String(source?.fileUrl ?? source?.url ?? source?.data ?? ""),
    storedName: source?.storedName ?? file.name,
    originalName: source?.originalName ?? file.name,
    mimeType: source?.mimeType ?? file.type,
    fileSize: typeof source?.fileSize === "number" ? source.fileSize : file.size,
  };
}

function uploadFileToEndpoint({
  endpoint,
  file,
  onProgress,
}: {
  endpoint: string;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise<UploadedFileValue>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload failed with status ${xhr.status}.`));
        return;
      }

      try {
        const payload = JSON.parse(xhr.responseText);
        const normalized = normalizeUploadResponse(payload, file);
        if (!normalized.fileUrl) {
          reject(new Error("Upload succeeded but no file URL was returned."));
          return;
        }
        resolve(normalized);
      } catch {
        reject(new Error("Invalid upload response."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(formData);
  });
}

function FileUploadField({ control, field, disabled }: FieldRendererProps) {
  const t = useTranslations("FormBuilder.runtime");
  const endpoint = getStringSetting(field, "endpoint", "/api/admin/media/storage");
  const accept = getStringSetting(field, "accept", "");
  const multiple = getBooleanSetting(field, "multiple", false);
  const maxFiles = getNumberSetting(field, "maxFiles", multiple ? 5 : 1);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? (multiple ? [] : null)}
      render={({ field: rhfField, fieldState }) => {
        const values = multiple
          ? (Array.isArray(rhfField.value) ? rhfField.value : [])
          : (rhfField.value ? [rhfField.value] : []);

        async function handleFiles(files: FileList | null) {
          if (!files?.length) return;
          setUploadError(null);

          const incoming = Array.from(files).slice(0, Math.max(1, maxFiles - values.length));
          const uploaded: UploadedFileValue[] = [];

          try {
            for (const file of incoming) {
              setProgress(0);
              const result = await uploadFileToEndpoint({ endpoint, file, onProgress: setProgress });
              uploaded.push(result);
            }

            if (multiple) {
              rhfField.onChange([...values, ...uploaded].slice(0, maxFiles));
            } else {
              rhfField.onChange(uploaded[0] ?? null);
            }
          } catch (error) {
            setUploadError(error instanceof Error ? error.message : t("uploadFailed"));
          } finally {
            setProgress(null);
          }
        }

        function removeAt(index: number) {
          if (multiple) {
            rhfField.onChange(values.filter((_, valueIndex) => valueIndex !== index));
          } else {
            rhfField.onChange(null);
          }
        }

        return (
          <FieldShell field={field}>
            <BaseLabel field={field} />
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <input
                type="file"
                disabled={disabled || progress !== null || (!multiple && values.length >= 1) || (multiple && values.length >= maxFiles)}
                multiple={multiple}
                accept={accept || undefined}
                onChange={(event) => {
                  void handleFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
                className="block w-full text-sm text-slate-700 file:me-4 file:rounded-xl file:border-0 file:bg-[#0f182b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
              />

              <div className="mt-2 text-xs text-slate-500">
                {multiple ? t("fileUploadLimit", { count: maxFiles }) : t("fileUploadSingle")}
              </div>

              {progress !== null ? (
                <div className="mt-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[#155e75] transition-all" style={{ width: `${progress}%` }} />
                </div>
              ) : null}

              {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}

              {values.length ? (
                <div className="mt-4 space-y-2">
                  {values.map((item: any, index: number) => {
                    const fileUrl = typeof item === "string" ? item : item?.fileUrl;
                    const label = item?.originalName ?? item?.storedName ?? fileUrl ?? t("uploadedFile", { number: index + 1 });
                    return (
                      <div key={`${fileUrl ?? index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        {fileUrl ? (
                          <a href={fileUrl} target="_blank" rel="noreferrer" className="min-w-0 break-all font-medium text-[#155e75] hover:underline">
                            {label}
                          </a>
                        ) : (
                          <span className="min-w-0 break-all text-slate-700">{label}</span>
                        )}
                        <button type="button" className="shrink-0 text-xs font-semibold text-red-600" onClick={() => removeAt(index)} disabled={disabled}>
                          {t("removeFile")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <FieldError message={getFieldErrorMessage(fieldState.error)} />
          </FieldShell>
        );
      }}
    />
  );
}

function MediaField({ control, field, disabled }: FieldRendererProps) {
  const t = useTranslations("FormBuilder.runtime");
  const multiline = field.fieldTypeCode === "media_multi";
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          {multiline ? (
            <textarea
              rows={3}
              {...rhfField}
              disabled={disabled}
              placeholder={field.placeholder ?? t("pasteMediaIds")}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#155e75] disabled:bg-slate-50"
            />
          ) : (
            <input
              type="text"
              {...rhfField}
              disabled={disabled}
              placeholder={field.placeholder ?? t("pickMediaId")}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75] disabled:bg-slate-50"
            />
          )}
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}


function LazySearchableSelectField({ control, field, disabled, locales }: FieldRendererProps) {
  const t = useTranslations("FormBuilder.runtime");
  const resource = getStringSetting(field, "resource", "service_definitions");
  const endpoint = getStringSetting(field, "endpoint", "/api/admin/lazy-search-options");
  const multiple = getBooleanSetting(field, "multiple", false);
  const limit = getNumberSetting(field, "limit", 20);

  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? (multiple ? [] : "")}
      render={({ field: rhfField, fieldState }) => (
        <FieldShell field={field}>
          <BaseLabel field={field} />
          <LazySearchableSelect
            value={(rhfField.value as string | string[] | null) ?? (multiple ? [] : null)}
            onValueChange={rhfField.onChange}
            resource={resource}
            endpoint={endpoint}
            locale={locales?.[0] ?? "en-US"}
            placeholder={field.placeholder ?? t("searchAndSelect")}
            searchPlaceholder={getStringSetting(field, "searchPlaceholder", t("searchAndSelect"))}
            emptyText={getStringSetting(field, "emptyText", t("noRecordsFound"))}
            multiple={multiple}
            limit={limit}
            disabled={disabled}
          />
          <FieldError message={getFieldErrorMessage(fieldState.error)} />
        </FieldShell>
      )}
    />
  );
}

export const defaultFieldRegistry: FieldRendererRegistry = {
  text: (props) => <TextLike {...props} />,
  textarea: (props) => <TextLike {...props} as="textarea" />,
  richtext: (props) => <TextLike {...props} as="textarea" />,
  number: (props) => <TextLike {...props} type="number" />,
  date: (props) => <PersianDateField {...props} />,
  persian_date: (props) => <PersianDateField {...props} />,
  datetime: (props) => <PersianDateField {...props} mode="datetime" />,
  persian_datetime: (props) => <PersianDateField {...props} mode="datetime" />,
  time: (props) => <TextLike {...props} type="time" />,
  select: SelectField,
  lazy_searchable_select: LazySearchableSelectField,
  file_upload: FileUploadField,
  radio: RadioField,
  checkbox: CheckboxField,
  date_range: DateRangeField,
  time_range: TimeRangeField,
  person_count: PersonCountField,
  multilingual_text: MultilingualJsonField,
  multilingual_textarea: MultilingualJsonField,
  media_single: MediaField,
  media_multi: MediaField,
};

export function mergeFieldRegistries(...registries: Array<FieldRendererRegistry | undefined>) {
  return registries.reduce<FieldRendererRegistry>((acc, registry) => ({ ...acc, ...(registry ?? {}) }), {});
}
