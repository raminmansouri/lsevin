"use client";

import { Control, FieldPath, FieldValues, useController } from "react-hook-form";

import { LazySearchableSelect } from "./lazy-searchable-select";

type RHFLazySearchableSelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  resource: string;
  locale?: string;
  endpoint?: string;
  placeholder?: string;
  helperText?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export function RHFLazySearchableSelectField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  resource,
  locale,
  endpoint,
  placeholder,
  helperText,
  multiple,
  disabled,
  required,
}: RHFLazySearchableSelectFieldProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      <LazySearchableSelect
        value={field.value}
        onValueChange={field.onChange}
        resource={resource}
        locale={locale}
        endpoint={endpoint}
        placeholder={placeholder || `Select ${label.toLowerCase()}`}
        multiple={multiple}
        disabled={disabled}
      />

      {helperText && !fieldState.error ? <p className="text-xs text-gray-500">{helperText}</p> : null}
      {fieldState.error?.message ? <p className="text-xs font-medium text-red-600">{fieldState.error.message}</p> : null}
    </div>
  );
}
