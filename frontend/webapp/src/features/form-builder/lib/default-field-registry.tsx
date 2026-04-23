"use client";

import React from "react";
import { Controller, type Control } from "react-hook-form";
import type { FormField } from "../types";

export interface FieldRendererProps {
  control: Control<any>;
  field: FormField;
  locales?: string[];
  disabled?: boolean;
}

export type FieldRenderer = React.ComponentType<FieldRendererProps>;
export type FieldRendererRegistry = Record<string, FieldRenderer>;

function BaseLabel({ field }: { field: FormField }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-semibold text-slate-900">{field.label}</label>
      {field.helpText ? <p className="mt-1 text-xs text-slate-500">{field.helpText}</p> : null}
    </div>
  );
}

function TextLike({ control, field, type = "text", as = "input" as "input" | "textarea" }: FieldRendererProps & { type?: string; as?: "input" | "textarea"; }) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <div className={`col-span-${field.columnSpan ?? 12}`}>
          <BaseLabel field={field} />
          {as === "textarea" ? (
            <textarea
              {...rhfField}
              rows={4}
              placeholder={field.placeholder ?? ""}
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#155e75]"
            />
          ) : (
            <input
              {...rhfField}
              type={type}
              placeholder={field.placeholder ?? ""}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75]"
            />
          )}
          {fieldState.error ? <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
}

function SelectField({ control, field }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField, fieldState }) => (
        <div>
          <BaseLabel field={field} />
          <select {...rhfField} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75]">
            <option value="">Select</option>
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {fieldState.error ? <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
}

function CheckboxField({ control, field }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={Boolean(field.defaultValue)}
      render={({ field: rhfField }) => (
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <input type="checkbox" checked={Boolean(rhfField.value)} onChange={(e) => rhfField.onChange(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold text-slate-900">{field.label}</div>
            {field.helpText ? <div className="text-xs text-slate-500">{field.helpText}</div> : null}
          </div>
        </label>
      )}
    />
  );
}

function RangeField({ control, field, type }: FieldRendererProps & { type: "date" | "time" }) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? { from: "", to: "" }}
      render={({ field: rhfField, fieldState }) => (
        <div>
          <BaseLabel field={field} />
          <div className="grid grid-cols-2 gap-3">
            <input
              type={type}
              value={rhfField.value?.from ?? ""}
              onChange={(e) => rhfField.onChange({ ...(rhfField.value ?? {}), from: e.target.value })}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75]"
            />
            <input
              type={type}
              value={rhfField.value?.to ?? ""}
              onChange={(e) => rhfField.onChange({ ...(rhfField.value ?? {}), to: e.target.value })}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75]"
            />
          </div>
          {fieldState.error ? <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
}

function PersonCountField({ control, field }: FieldRendererProps) {
  const keys = ["adults", "children", "infants", "rooms"] as const;
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? { adults: 1, children: 0, infants: 0, rooms: 1 }}
      render={({ field: rhfField }) => (
        <div>
          <BaseLabel field={field} />
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            {keys.map((key) => (
              <label key={key} className="text-sm">
                <span className="mb-1 block capitalize text-slate-700">{key}</span>
                <input
                  type="number"
                  min={0}
                  value={rhfField.value?.[key] ?? 0}
                  onChange={(e) => rhfField.onChange({ ...(rhfField.value ?? {}), [key]: Number(e.target.value || 0) })}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    />
  );
}

function MultilingualJsonField({ control, field, locales = ["en-US"] }: FieldRendererProps) {
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? {}}
      render={({ field: rhfField }) => {
        const value = rhfField.value ?? {};
        return (
          <div>
            <BaseLabel field={field} />
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              {locales.map((locale) => (
                <label key={locale} className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">{locale}</span>
                  {field.fieldTypeCode === "multilingual_textarea" ? (
                    <textarea
                      rows={3}
                      value={value[locale] ?? ""}
                      onChange={(e) => rhfField.onChange({ ...value, [locale]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#155e75]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value[locale] ?? ""}
                      onChange={(e) => rhfField.onChange({ ...value, [locale]: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}

function MediaField({ control, field }: FieldRendererProps) {
  const multiline = field.fieldTypeCode === "media_multi";
  return (
    <Controller
      control={control}
      name={field.key}
      defaultValue={field.defaultValue ?? ""}
      render={({ field: rhfField }) => (
        <div>
          <BaseLabel field={field} />
          {multiline ? (
            <textarea
              rows={3}
              {...rhfField}
              placeholder={field.placeholder ?? "Paste media ids or hidden-field value"}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#155e75]"
            />
          ) : (
            <input
              type="text"
              {...rhfField}
              placeholder={field.placeholder ?? "Pick media id"}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"
            />
          )}
        </div>
      )}
    />
  );
}

export const defaultFieldRegistry: FieldRendererRegistry = {
  text: (props) => <TextLike {...props} />,
  textarea: (props) => <TextLike {...props} as="textarea" />,
  richtext: (props) => <TextLike {...props} as="textarea" />,
  number: (props) => <TextLike {...props} type="number" />,
  date: (props) => <TextLike {...props} type="date" />,
  time: (props) => <TextLike {...props} type="time" />,
  select: SelectField,
  radio: SelectField,
  checkbox: CheckboxField,
  date_range: (props) => <RangeField {...props} type="date" />,
  time_range: (props) => <RangeField {...props} type="time" />,
  person_count: PersonCountField,
  multilingual_text: MultilingualJsonField,
  multilingual_textarea: MultilingualJsonField,
  media_single: MediaField,
  media_multi: MediaField,
};
