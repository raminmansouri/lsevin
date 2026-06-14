import type { FormField, RuntimeServiceForm } from "../types";

export interface SubmissionDisplayField {
  key: string;
  label: string;
  fieldTypeCode?: string;
  sectionKey?: string | null;
  sectionTitle?: string | null;
  sectionDisplayOrder?: number | null;
  displayOrder?: number | null;
}

export interface SubmissionDisplayValue extends SubmissionDisplayField {
  value: unknown;
}

export function getRuntimeFormFields(form: RuntimeServiceForm): SubmissionDisplayField[] {
  return form.sections
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .flatMap((section) =>
      section.fields
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((field) => ({
          key: field.key,
          label: field.label || field.key,
          fieldTypeCode: String(field.fieldTypeCode),
          sectionKey: section.key,
          sectionTitle: section.title ?? null,
          sectionDisplayOrder: section.displayOrder ?? null,
          displayOrder: field.displayOrder ?? null,
        }))
    );
}

export function buildFieldLabelMap(form: RuntimeServiceForm): Record<string, string> {
  return getRuntimeFormFields(form).reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.label || field.key;
    return acc;
  }, {});
}

export function getLabelForPath(path: string, labelMap: Record<string, string>) {
  const firstPathPart = path.split(/[.[\]]/).find(Boolean) ?? path;
  return labelMap[firstPathPart] ?? path;
}

export function buildDisplayValuesFromPayload(
  payload: Record<string, unknown> | null | undefined,
  fields: SubmissionDisplayField[] = []
): SubmissionDisplayValue[] {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const usedKeys = new Set<string>();

  const knownValues = fields
    .slice()
    .sort((a, b) => {
      const sectionOrder = (a.sectionDisplayOrder ?? 0) - (b.sectionDisplayOrder ?? 0);
      if (sectionOrder !== 0) return sectionOrder;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    })
    .map((field) => {
      usedKeys.add(field.key);
      return {
        ...field,
        label: field.label || field.key,
        value: (safePayload as Record<string, unknown>)[field.key],
      };
    });

  const unknownValues = Object.entries(safePayload)
    .filter(([key]) => !usedKeys.has(key))
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      displayOrder: fields.length + index,
    }));

  return [...knownValues, ...unknownValues];
}

export function createDisplayFieldsFromFormFields(fields: Array<Partial<FormField> & { key: string }>): SubmissionDisplayField[] {
  return fields.map((field, index) => ({
    key: field.key,
    label: field.label || field.key,
    fieldTypeCode: String(field.fieldTypeCode ?? ""),
    displayOrder: field.displayOrder ?? index,
  }));
}
