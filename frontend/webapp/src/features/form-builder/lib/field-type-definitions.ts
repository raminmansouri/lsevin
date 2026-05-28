import type { FieldTypeCode } from "../types";
import type { DesignerFieldInput } from "../types/designer";

export interface DesignerFieldTypeDefinition {
  code: FieldTypeCode;
  label: string;
  description?: string;
  category?: "basic" | "choice" | "date-time" | "media" | "advanced" | string;
  supportsOptions?: boolean;
  defaultColumnSpan?: number;
  defaultSettings?: Record<string, unknown>;
  defaultValidationRules?: Record<string, unknown>;
}

export const DEFAULT_DESIGNER_FIELD_TYPES: DesignerFieldTypeDefinition[] = [
  { code: "text", label: "Text", category: "basic", defaultColumnSpan: 6 },
  { code: "textarea", label: "Textarea", category: "basic" },
  { code: "number", label: "Number", category: "basic", defaultColumnSpan: 6 },
  { code: "select", label: "Select", category: "choice", supportsOptions: true, defaultColumnSpan: 6 },
  { code: "radio", label: "Radio group", category: "choice", supportsOptions: true },
  { code: "checkbox", label: "Checkbox", category: "choice", defaultColumnSpan: 6 },
  {
    code: "lazy_searchable_select",
    label: "Lazy searchable selector",
    description: "Async searchable lookup. Configure resource + endpoint in field settings.",
    category: "choice",
    defaultColumnSpan: 6,
    defaultSettings: {
      resource: "service_definitions",
      endpoint: "/api/admin/lazy-search-options",
      multiple: false,
      limit: 20,
    },
  },
  { code: "date", label: "Persian date", category: "date-time", defaultColumnSpan: 6 },
  { code: "datetime", label: "Persian date & time", category: "date-time", defaultColumnSpan: 6 },
  { code: "date_range", label: "Persian date range", category: "date-time" },
  { code: "time", label: "Time", category: "date-time", defaultColumnSpan: 6 },
  { code: "time_range", label: "Time range", category: "date-time" },
  { code: "person_count", label: "Person count", category: "advanced" },

  {
    code: "file_upload",
    label: "File upload",
    description: "Uploads files through your media storage endpoint and stores the returned URL in form submissions.",
    category: "media",
    defaultColumnSpan: 12,
    defaultSettings: {
      endpoint: "/api/admin/media/storage",
      accept: "",
      multiple: false,
      maxFiles: 5,
    },
  },
  { code: "media_single", label: "Media single", category: "media" },
  { code: "media_multi", label: "Media multi", category: "media" },
  { code: "multilingual_text", label: "Multilingual text", category: "advanced" },
  { code: "multilingual_textarea", label: "Multilingual textarea", category: "advanced" },
  { code: "richtext", label: "Rich text", category: "advanced" },
];

export function getFieldTypeDefinition(
  code: FieldTypeCode,
  fieldTypes: DesignerFieldTypeDefinition[] = DEFAULT_DESIGNER_FIELD_TYPES
) {
  return fieldTypes.find((item) => item.code === code);
}

export function supportsFieldOptions(
  code: FieldTypeCode,
  fieldTypes: DesignerFieldTypeDefinition[] = DEFAULT_DESIGNER_FIELD_TYPES
) {
  return Boolean(getFieldTypeDefinition(code, fieldTypes)?.supportsOptions);
}

export function createDesignerFieldInput(
  fieldTypeCode: FieldTypeCode = "text",
  fieldTypes: DesignerFieldTypeDefinition[] = DEFAULT_DESIGNER_FIELD_TYPES
): DesignerFieldInput {
  const definition = getFieldTypeDefinition(fieldTypeCode, fieldTypes);
  const key = `field_${Math.random().toString(36).slice(2, 8)}`;

  return {
    key,
    label: definition?.label ? `New ${definition.label}` : "New field",
    fieldTypeCode,
    isRequired: false,
    isHidden: false,
    isRepeatable: false,
    displayOrder: 0,
    columnSpan: definition?.defaultColumnSpan ?? 12,
    options: definition?.supportsOptions
      ? [
          { value: "option_1", label: "Option 1", displayOrder: 0 },
          { value: "option_2", label: "Option 2", displayOrder: 1 },
        ]
      : [],
    settings: definition?.defaultSettings ? { ...definition.defaultSettings } : {},
    validationRules: definition?.defaultValidationRules ? { ...definition.defaultValidationRules } : {},
  };
}
