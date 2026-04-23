export type BookingUiMode = "default_slot" | "date_range" | "custom_form";

export type FieldTypeCode =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "date_range"
  | "time"
  | "time_range"
  | "person_count"
  | "media_single"
  | "media_multi"
  | "multilingual_text"
  | "multilingual_textarea"
  | "richtext"
  | (string & {});

export interface FormOption {
  id?: string;
  value: string;
  label: string;
  labelTranslations?: Record<string, string>;
  metadata?: Record<string, unknown>;
  displayOrder?: number;
}

export interface FormCondition {
  dependsOnFieldKey: string;
  conditionType:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than"
    | "has_value"
    | "not_has_value";
  expectedValue?: unknown;
  action: "show" | "hide" | "require" | "disable";
}

export interface FormField {
  id: string;
  key: string;
  fieldTypeCode: FieldTypeCode;
  label: string;
  placeholder?: string | null;
  helpText?: string | null;
  defaultValue?: unknown;
  isRequired?: boolean;
  isHidden?: boolean;
  isRepeatable?: boolean;
  displayOrder?: number;
  columnSpan?: number;
  settings?: Record<string, unknown>;
  validationRules?: Record<string, unknown>;
  options?: FormOption[];
  conditions?: FormCondition[];
}

export interface FormSection {
  id: string;
  key: string;
  title?: string | null;
  description?: string | null;
  displayOrder?: number;
  settings?: Record<string, unknown>;
  fields: FormField[];
}

export interface RuntimeServiceForm {
  formId: string;
  formVersionId: string;
  serviceDefinitionId: string;
  serviceId?: string;
  usageScope: "main_booking" | "child_addon_booking";
  locales: string[];
  title: string;
  sections: FormSection[];
  settings?: Record<string, unknown>;
}

export interface DynamicFormSubmissionPayload {
  formVersionId: string;
  serviceDefinitionId?: string;
  bookingDraftId?: string;
  bookingDraftChildId?: string;
  bookingId?: string;
  bookingChildId?: string;
  locale?: string;
  status?: "draft" | "submitted" | "archived";
  payload: Record<string, unknown>;
}

export interface DynamicFormSubmissionResult {
  submissionId: string;
  status: string;
}
