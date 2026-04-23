"use client";

import React, { useMemo, useState } from "react";
import type { FormBuilderDesignerProps, DesignerFieldInput, DesignerSectionInput } from "../types/designer";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "date_range",
  "time",
  "time_range",
  "person_count",
  "media_single",
  "media_multi",
  "multilingual_text",
  "multilingual_textarea",
  "richtext",
];

function newField(fieldTypeCode = "text"): DesignerFieldInput {
  const key = `field_${Math.random().toString(36).slice(2, 8)}`;
  return {
    key,
    label: "New field",
    fieldTypeCode,
    isRequired: false,
    displayOrder: 0,
    columnSpan: 12,
    options: [],
    settings: {},
    validationRules: {},
  };
}

function newSection(): DesignerSectionInput {
  const key = `section_${Math.random().toString(36).slice(2, 8)}`;
  return {
    key,
    title: "New section",
    displayOrder: 0,
    fields: [newField()],
  };
}

export function FormBuilderDesigner({ initial, onSave }: FormBuilderDesignerProps) {
  const [value, setValue] = useState(
    initial ?? {
      key: "booking-form",
      name: "Booking Form",
      title: "Booking Form",
      locales: ["en-US"],
      sections: [newSection()],
      activateVersion: false,
      status: "draft" as const,
    }
  );

  const preview = useMemo(() => JSON.stringify(value, null, 2), [value]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_420px]">
      <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Field palette</h2>
        <div className="mt-4 grid gap-2">
          {FIELD_TYPES.map((fieldType) => (
            <button
              key={fieldType}
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:border-[#155e75] hover:text-[#155e75]"
              onClick={() => {
                setValue((current) => {
                  const sections = [...current.sections];
                  const targetIndex = sections.length ? 0 : -1;
                  if (targetIndex === -1) {
                    return { ...current, sections: [{ ...newSection(), fields: [newField(fieldType)] }] };
                  }
                  sections[targetIndex] = {
                    ...sections[targetIndex],
                    fields: [...sections[targetIndex].fields, { ...newField(fieldType), displayOrder: sections[targetIndex].fields.length }],
                  };
                  return { ...current, sections };
                });
              }}
            >
              {fieldType}
            </button>
          ))}
        </div>
      </aside>

      <main className="space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-800">Form key</span>
              <input value={value.key} onChange={(e) => setValue({ ...value, key: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-800">Form name</span>
              <input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
            </label>
          </div>
        </section>

        {value.sections.map((section, sectionIndex) => (
          <section key={section.key} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <input
                value={section.title ?? ""}
                onChange={(e) => {
                  const sections = [...value.sections];
                  sections[sectionIndex] = { ...section, title: e.target.value };
                  setValue({ ...value, sections });
                }}
                className="h-12 flex-1 rounded-2xl border border-slate-200 px-4 text-lg font-semibold outline-none focus:border-[#155e75]"
              />
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                onClick={() => {
                  const sections = [...value.sections];
                  sections.splice(sectionIndex, 1);
                  setValue({ ...value, sections });
                }}
              >
                Remove section
              </button>
            </div>

            <div className="space-y-4">
              {section.fields.map((field, fieldIndex) => (
                <div key={field.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={field.label}
                      onChange={(e) => {
                        const sections = [...value.sections];
                        sections[sectionIndex].fields[fieldIndex] = { ...field, label: e.target.value };
                        setValue({ ...value, sections });
                      }}
                      className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                      placeholder="Field label"
                    />
                    <input
                      value={field.key}
                      onChange={(e) => {
                        const sections = [...value.sections];
                        sections[sectionIndex].fields[fieldIndex] = { ...field, key: e.target.value };
                        setValue({ ...value, sections });
                      }}
                      className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                      placeholder="field_key"
                    />
                    <select
                      value={field.fieldTypeCode}
                      onChange={(e) => {
                        const sections = [...value.sections];
                        sections[sectionIndex].fields[fieldIndex] = { ...field, fieldTypeCode: e.target.value };
                        setValue({ ...value, sections });
                      }}
                      className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#155e75]"
                    >
                      {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(field.isRequired)} onChange={(e) => {
                      const sections = [...value.sections];
                      sections[sectionIndex].fields[fieldIndex] = { ...field, isRequired: e.target.checked };
                      setValue({ ...value, sections });
                    }} /> required</label>
                    <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => {
                      const sections = [...value.sections];
                      sections[sectionIndex].fields.splice(fieldIndex, 1);
                      setValue({ ...value, sections });
                    }}>Remove field</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex gap-3">
          <button type="button" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium" onClick={() => setValue({ ...value, sections: [...value.sections, { ...newSection(), displayOrder: value.sections.length }] })}>Add section</button>
          <button type="button" className="rounded-2xl bg-[#0f182b] px-5 py-3 text-sm font-semibold text-white" onClick={() => onSave(value)}>Save form definition</button>
        </div>
      </main>

      <aside className="rounded-[28px] border border-slate-200 bg-[#0f182b] p-5 shadow-sm">
        <h2 className="text-lg font-bold text-white">Schema preview</h2>
        <pre className="mt-4 max-h-[75vh] overflow-auto rounded-2xl bg-slate-950/50 p-4 text-xs text-slate-200">{preview}</pre>
      </aside>
    </div>
  );
}
