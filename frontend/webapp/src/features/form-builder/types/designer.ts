import type { FieldTypeCode, RuntimeServiceForm } from "../types";
import type { DesignerFieldTypeDefinition } from "../lib/field-type-definitions";

export type FormDesignerLayoutMode = "standard" | "wizard";
export type FormRuntimeUsageMode = "flexible" | "standalone" | "booking" | "react_hook_form";
export type FormSubmissionBehavior = "save_to_database" | "emit_only";

export interface DesignerFieldInput {
  id?: string;
  key: string;
  fieldTypeCode: FieldTypeCode;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isHidden?: boolean;
  isRepeatable?: boolean;
  displayOrder?: number;
  columnSpan?: number;
  defaultValue?: unknown;
  settings?: Record<string, unknown>;
  validationRules?: Record<string, unknown>;
  options?: Array<{
    id?: string;
    value: string;
    label: string;
    labelTranslations?: Record<string, string>;
    metadata?: Record<string, unknown>;
    displayOrder?: number;
  }>;
}

export interface DesignerSectionInput {
  id?: string;
  key: string;
  title?: string;
  description?: string;
  displayOrder?: number;
  settings?: Record<string, unknown>;
  fields: DesignerFieldInput[];
}

export interface UpsertFormDefinitionInput {
  formId?: string;
  formVersionId?: string | null;
  versionNumber?: number | null;
  key: string;
  name: string;
  description?: string;
  formScope?: "service_booking" | "addon_booking" | "generic";
  locales: string[];
  title: string;
  status?: "draft" | "published" | "archived";
  activateVersion?: boolean;
  settings?: {
    layoutMode?: FormDesignerLayoutMode;
    runtimeUsageMode?: FormRuntimeUsageMode;
    submissionBehavior?: FormSubmissionBehavior;
    defaultSubmissionScope?: "booking" | "admin_preview" | "generic";
    submitEndpoint?: string;
    submitLabel?: string;
    hideSubmitButton?: boolean;
    [key: string]: unknown;
  };
  sections: DesignerSectionInput[];
}

export interface UpsertFormDefinitionResult {
  formId: string;
  formVersionId: string;
  versionNumber: number;
}

export interface FormBuilderDesignerProps {
  initial?: UpsertFormDefinitionInput;
  fieldTypes?: DesignerFieldTypeDefinition[];
  onSave: (value: UpsertFormDefinitionInput) => Promise<void> | void;
}

export type RuntimeFormPreview = RuntimeServiceForm;
