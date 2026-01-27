"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AttributeType,
  getAttributeTypeOptions,
} from "../types/attribute-type";

interface AttributeTypeSelectorProps {
  value?: AttributeType;
  onValueChange?: (value: AttributeType) => void;
  placeholder?: string;
  disabled?: boolean;
  includeAdvanced?: boolean;
  className?: string;
}

export function AttributeTypeSelector({
  value,
  onValueChange,
  placeholder = "Select attribute type",
  disabled = false,
  includeAdvanced = false,
  className,
}: AttributeTypeSelectorProps) {
  const attributeTypeOptions = getAttributeTypeOptions(includeAdvanced);

  return (
    <Select
      value={value?.toString()}
      onValueChange={(stringValue) => {
        const numericValue = parseInt(stringValue) as AttributeType;
        onValueChange?.(numericValue);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {attributeTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
