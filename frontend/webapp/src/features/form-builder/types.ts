export type BookingUiMode = "default_slot" | "date_range" | "custom_form";

export type FieldTypeCode =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "lazy_searchable_select"
  | "file_upload"
  | "date"
  | "datetime"
  | "persian_date"
  | "persian_datetime"
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

export type FormUsageScope = "main_booking" | "child_addon_booking";
export type FormSubmissionScope = "booking" | "admin_preview" | "generic";
export type FormSubmissionStatus = "draft" | "submitted" | "archived";

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
  serviceDefinitionId?: string | null;
  serviceId?: string;
  usageScope?: FormUsageScope;
  locales: string[];
  title: string;
  sections: FormSection[];
  settings?: Record<string, unknown>;
}

export interface DynamicFormSubmissionPayload {
  formVersionId: string;
  serviceDefinitionId?: string | null;
  bookingDraftId?: string | null;
  bookingDraftChildId?: string | null;
  bookingId?: string | null;
  bookingChildId?: string | null;
  submittedByUserId?: string | null;
  locale?: string | null;
  submissionScope?: FormSubmissionScope;
  status?: FormSubmissionStatus;
  payload: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown>;
}

export interface DynamicFormSubmissionResult {
  submissionId: string;
  status: string;
}

export interface AdminFormSubmissionListItem {
  id: string;
  formId: string;
  formKey: string;
  formName: string;
  formVersionId: string;
  versionNumber: number;
  versionTitle: string;
  serviceDefinitionId?: string | null;
  bookingDraftId?: string | null;
  bookingDraftChildId?: string | null;
  bookingId?: string | null;
  bookingChildId?: string | null;
  submittedByUserId?: string | null;
  locale?: string | null;
  submissionScope: FormSubmissionScope;
  status: FormSubmissionStatus;
  payload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  displayValues?: Array<{
    key: string;
    label: string;
    value: unknown;
    fieldTypeCode?: string;
    sectionKey?: string | null;
    sectionTitle?: string | null;
    sectionDisplayOrder?: number | null;
    displayOrder?: number | null;
  }>;
  createDate: string;
  lastModifiedDate: string;
  submittedAt?: string | null;
}
