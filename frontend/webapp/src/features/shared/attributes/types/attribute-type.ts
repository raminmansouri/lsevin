// Shared AttributeType enum matching backend LSevin.Modules.Category.SharedKernel.Enumerations.AttributeType
export enum AttributeType {
  Text = 1,
  Number = 2,
  DateTime = 3, // Note: Backend uses DateTime, not Date
  Boolean = 4,
  Select = 5, // Note: Backend uses Select, not Select
  MultiSelect = 6,
  Enum = 7,
  Json = 8,
}

// Display labels for the attribute types
export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  [AttributeType.Text]: "Text",
  [AttributeType.Number]: "Number",
  [AttributeType.DateTime]: "Date/Time",
  [AttributeType.Boolean]: "Boolean",
  [AttributeType.Select]: "Select",
  [AttributeType.MultiSelect]: "Multi-Select",
  [AttributeType.Enum]: "Enumeration",
  [AttributeType.Json]: "JSON",
};

// Common attribute types used in most forms (excluding advanced types like JSON)
export const COMMON_ATTRIBUTE_TYPES = [
  AttributeType.Text,
  AttributeType.Number,
  AttributeType.DateTime,
  AttributeType.Boolean,
  AttributeType.Select,
] as const;

// Get attribute type options for dropdowns
export const getAttributeTypeOptions = (includeAdvanced: boolean = false) => {
  const types = includeAdvanced
    ? (Object.values(AttributeType).filter(
        (v) => typeof v === "number"
      ) as AttributeType[])
    : COMMON_ATTRIBUTE_TYPES;

  return types.map((type) => ({
    value: type,
    label: ATTRIBUTE_TYPE_LABELS[type],
  }));
};

// API string values that come from backend
export type AttributeTypeString =
  | "Text"
  | "Number"
  | "DateTime"
  | "Boolean"
  | "Select" // API uses "Select" but enum uses "Select"
  | "MultiSelect"
  | "Enum"
  | "Json";

// Mapping from API string values to enum values
export const ATTRIBUTE_TYPE_STRING_TO_ENUM: Record<
  AttributeTypeString,
  AttributeType
> = {
  Text: AttributeType.Text,
  Number: AttributeType.Number,
  DateTime: AttributeType.DateTime,
  Boolean: AttributeType.Boolean,
  Select: AttributeType.Select, // Note: API uses "Select", enum is Select
  MultiSelect: AttributeType.MultiSelect,
  Enum: AttributeType.Enum,
  Json: AttributeType.Json,
} as const;

// Convert API string to AttributeType enum
export const attributeTypeFromString = (
  apiString: AttributeTypeString
): AttributeType => {
  return ATTRIBUTE_TYPE_STRING_TO_ENUM[apiString];
};

// Reverse mapping from enum to API string
export const ATTRIBUTE_TYPE_ENUM_TO_STRING: Record<
  AttributeType,
  AttributeTypeString
> = {
  [AttributeType.Text]: "Text",
  [AttributeType.Number]: "Number",
  [AttributeType.DateTime]: "DateTime",
  [AttributeType.Boolean]: "Boolean",
  [AttributeType.Select]: "Select", // Note: enum is Select, API uses Select
  [AttributeType.MultiSelect]: "MultiSelect",
  [AttributeType.Enum]: "Enum",
  [AttributeType.Json]: "Json",
} as const;

// Convert AttributeType enum to API string
export const attributeTypeToString = (
  attributeType: AttributeType
): AttributeTypeString => {
  return ATTRIBUTE_TYPE_ENUM_TO_STRING[attributeType];
};

// Check if API string represents a Select type
export const isSelectTypeString = (apiString: AttributeTypeString): boolean => {
  const enumValue = attributeTypeFromString(apiString);
  return (
    enumValue === AttributeType.Select ||
    enumValue === AttributeType.MultiSelect
  );
};

// Get label from API string
export const getAttributeTypeLabelFromString = (
  apiString: AttributeTypeString
): string => {
  const enumValue = attributeTypeFromString(apiString);
  return ATTRIBUTE_TYPE_LABELS[enumValue];
};

// Check if attribute type supports options
export const attributeTypeSupportsOptions = (
  attributeType: AttributeType
): boolean => {
  return (
    attributeType === AttributeType.Select ||
    attributeType === AttributeType.MultiSelect
  );
};
