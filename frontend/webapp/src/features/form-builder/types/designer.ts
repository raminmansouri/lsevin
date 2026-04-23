import type { FieldTypeCode, RuntimeServiceForm } from "../types";

export interface DesignerFieldInput {
  id?: string;
  key: string;
  fieldTypeCode: FieldTypeCode;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isHidden?: boolean;
  displayOrder?: number;
  columnSpan?: number;
  defaultValue?: unknown;
  settings?: Record<string, unknown>;
  validationRules?: Record<string, unknown>;
  options?: Array<{
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
  key: string;
  name: string;
  description?: string;
  formScope?: "service_booking" | "addon_booking" | "generic";
  locales: string[];
  title: string;
  status?: "draft" | "published" | "archived";
  activateVersion?: boolean;
  sections: DesignerSectionInput[];
}

export interface UpsertFormDefinitionResult {
  formId: string;
  formVersionId: string;
  versionNumber: number;
}

export interface FormBuilderDesignerProps {
  initial?: UpsertFormDefinitionInput;
  onSave: (value: UpsertFormDefinitionInput) => Promise<void> | void;
}

export type RuntimeFormPreview = RuntimeServiceForm;
