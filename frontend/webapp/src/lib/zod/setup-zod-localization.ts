import { z } from "zod/v4";
import ar from "zod/v4/locales/ar.js";
import de from "zod/v4/locales/de.js";
import en from "zod/v4/locales/en.js";
import es from "zod/v4/locales/es.js";
import fa from "zod/v4/locales/fa.js";
import fr from "zod/v4/locales/fr.js";
import tr from "zod/v4/locales/tr.js";

import { LocaleTypes } from "@/types/common";

import ku from "./locales/ku";

let globalComponentT: // eslint-disable-next-line @typescript-eslint/no-explicit-any
((key: string, params?: Record<string, any>) => string) | null = null;
let globalFormErrorsT: // eslint-disable-next-line @typescript-eslint/no-explicit-any
((key: string, params?: Record<string, any>) => string) | null = null;

export function setupZodLocalization(
  localeKey: LocaleTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentT?: (key: string, params?: Record<string, any>) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formErrorsT?: (key: string, params?: Record<string, any>) => string
) {
  const localeMap = { en, fa, ar, es, tr, ku, de, fr };
  const localeFn = localeMap[localeKey] ?? en;

  // Set global translation functions if provided
  if (componentT) globalComponentT = componentT;
  if (formErrorsT) globalFormErrorsT = formErrorsT;

  // Configure Zod with built-in locale and custom global error map
  z.config({
    ...localeFn(),
    customError: createGlobalErrorMap(),
  });
}

function createGlobalErrorMap(): z.core.$ZodErrorMap {
  return (issue) => {
    // If no global translators are set, let built-in locale handle it
    if (!globalComponentT || !globalFormErrorsT) {
      return undefined; // Let Zod use built-in locale
    }

    const fieldPath = issue.path;
    if (!fieldPath) return undefined;

    const fieldName = fieldPath[0]?.toString();
    const nestedProp =
      fieldPath.length > 1
        ? fieldPath[fieldPath.length - 1]?.toString()
        : undefined;

    // Get field label
    const fieldLabel = getFieldLabel(fieldName, nestedProp);

    // Handle custom error codes first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customCode = (issue as any).params?.code as string | undefined;
    if (customCode) {
      const result = tryCustomErrorMessage(
        customCode,
        fieldLabel,
        fieldName,
        nestedProp
      );
      if (result) return result;
    }

    // Handle standard Zod error codes with enhanced parameters
    if (issue.code) {
      const result = tryStandardErrorMessage(issue, fieldLabel, fieldName);
      if (result) return result;
    }

    // Try component-specific errors
    const componentResult = tryComponentErrorMessage(
      issue,
      fieldName,
      nestedProp
    );
    if (componentResult) return componentResult;

    // Return undefined to let built-in locale handle it
    return undefined;
  };
}

function getFieldLabel(
  fieldName?: string,
  nestedProp?: string
): string | undefined {
  if (!globalComponentT || !fieldName) return undefined;

  // For localized content fields, try label first (both for top-level and nested errors)
  if (!nestedProp || nestedProp === "translations") {
    try {
      return globalComponentT(`form.${fieldName}.label`);
    } catch {
      // Fall through to other attempts
    }
  }

  // Try nested label for other cases
  if (nestedProp) {
    try {
      return globalComponentT(`form.${fieldName}.${nestedProp}`);
    } catch {
      // Fall through to top-level label
    }
  }

  // Try legacy flat structure as fallback
  try {
    return globalComponentT(`form.${fieldName}`);
  } catch {
    // Return undefined if no label found
  }

  return undefined;
}

function tryCustomErrorMessage(
  customCode: string,
  fieldLabel?: string,
  fieldName?: string,
  nestedProp?: string
): string | undefined {
  if (!globalFormErrorsT || !globalComponentT) return undefined;

  const errorParams = { field: fieldLabel || fieldName || "Field" };

  // Map the custom code using the same mapping as standard errors
  const mappedCode = mapZodErrorCodeToFormError(customCode);

  // Try global custom message with mapped code first
  try {
    const message = globalFormErrorsT(mappedCode, errorParams);
    if (message) return message;
  } catch {
    // Fall through to try original code
  }

  // Try global custom message with original code
  try {
    const message = globalFormErrorsT(customCode, errorParams);
    if (message) return message;
  } catch {
    // Fall through to component-specific custom message
  }

  // Try component-specific custom message
  if (fieldName) {
    // For localized content fields (now at top level), look for the specific error message
    if (!nestedProp) {
      try {
        const message = globalComponentT(`form.${fieldName}.translations`);
        if (message) return message;
      } catch {
        // Fall through
      }
    }

    // For backward compatibility with nested translation errors
    if (nestedProp === "translations") {
      try {
        const message = globalComponentT(`form.${fieldName}.translations`);
        if (message) return message;
      } catch {
        // Fall through
      }
    }

    const fieldPath = nestedProp ? `${fieldName}.${nestedProp}` : fieldName;

    // Try nested format first
    try {
      const message = globalComponentT(`errors.${fieldPath}.${customCode}`);
      if (message) return message;
    } catch {
      // Try flattened format as fallback
      try {
        const message = globalComponentT(`errors.${fieldPath}_${customCode}`);
        if (message) return message;
      } catch {
        // Fall through
      }
    }
  }

  return undefined;
}

function tryStandardErrorMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issue: any,
  fieldLabel?: string,
  fieldName?: string
): string | undefined {
  if (!globalFormErrorsT) return undefined;

  const errorParams = { field: fieldLabel || fieldName || "Field" };

  // Add specific parameters based on error type
  if (issue.code === "too_small" && issue.minimum !== undefined) {
    Object.assign(errorParams, {
      min: issue.minimum,
      length: issue.minimum,
    });
  }

  if (issue.code === "too_big" && issue.maximum !== undefined) {
    Object.assign(errorParams, {
      max: issue.maximum,
      length: issue.maximum,
    });
  }

  try {
    const errorKey = mapZodErrorCodeToFormError(issue.code);
    const message = globalFormErrorsT(errorKey, errorParams);
    if (message) return message;
  } catch {
    // Fall through if global message not found
  }

  return undefined;
}

function tryComponentErrorMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issue: any,
  fieldName?: string,
  nestedProp?: string
): string | undefined {
  if (!globalComponentT || !fieldName) return undefined;

  const fieldPath = nestedProp ? `${fieldName}.${nestedProp}` : fieldName;

  // Try field-specific error with code using both formats
  if (issue.code) {
    try {
      // Try nested format first
      const message = globalComponentT(`errors.${fieldPath}.${issue.code}`);
      if (message) return message;
    } catch {
      // Try flattened format as fallback
      try {
        const message = globalComponentT(`errors.${fieldPath}_${issue.code}`);
        if (message) return message;
      } catch {
        // Fall through
      }
    }
  }

  // Try general field error
  try {
    const message = globalComponentT(`errors.${fieldPath}`);
    if (message) return message;
  } catch {
    // Fall through if no component error found
  }

  return undefined;
}

function mapZodErrorCodeToFormError(zodCode: string): string {
  const mapping: Record<string, string> = {
    too_small: "tooShort",
    too_big: "tooLong",
    invalid_string: "invalid",
    invalid_type: "required",
    invalid_email: "invalidEmail",
    invalid_format: "invalid",
    invalid_value: "invalid",
    invalid_file: "invalidFile",
    invalid_phone: "invalidPhone",
    not_match: "notMatch",
  };
  return mapping[zodCode] || zodCode;
}
