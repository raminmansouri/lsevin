"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { BaseAttributeOption } from "../schemas";

interface AttributeOptionManagerProps {
  options: BaseAttributeOption[];
  onOptionsChange: (options: BaseAttributeOption[]) => void;
  disabled?: boolean;
  showAdditionalPrice?: boolean; // For ServiceDefinition attributes only
  addOptionLabel?: string;
  noOptionsLabel?: string;
}

export function AttributeOptionManager({
  options,
  onOptionsChange,
  disabled = false,
  showAdditionalPrice = false,
  addOptionLabel = "Add Option",
  noOptionsLabel = "Click 'Add Option' to create selection options",
}: AttributeOptionManagerProps) {
  const [localOptions, setLocalOptions] =
    useState<BaseAttributeOption[]>(options);

  // Sync local state with parent when options change
  useState(() => {
    setLocalOptions(options);
  });

  const updateOptions = (newOptions: BaseAttributeOption[]) => {
    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const addOption = () => {
    const newOption: BaseAttributeOption = {
      displayName: "",
      value: "",
      ...(showAdditionalPrice && { additionalPrice: undefined }),
    };
    updateOptions([...localOptions, newOption]);
  };

  const removeOption = (index: number) => {
    updateOptions(localOptions.filter((_, i) => i !== index));
  };

  const updateOption = (
    index: number,
    field: keyof BaseAttributeOption,
    value: string | number | undefined
  ) => {
    updateOptions(
      localOptions.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Options</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          {addOptionLabel}
        </Button>
      </div>

      {localOptions.map((option, index) => (
        <div key={index} className="flex items-end gap-2 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <label className="text-xs">Display Name</label>
            <Input
              value={option.displayName}
              onChange={(e) =>
                updateOption(index, "displayName", e.target.value)
              }
              placeholder="Option display name"
              disabled={disabled}
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs">Value</label>
            <Input
              value={option.value}
              onChange={(e) => updateOption(index, "value", e.target.value)}
              placeholder="option_value"
              disabled={disabled}
            />
          </div>

          {showAdditionalPrice && (
            <div className="w-32 space-y-2">
              <label className="text-xs">Extra Price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  (option as { additionalPrice?: number }).additionalPrice || ""
                }
                onChange={(e) =>
                  updateOption(
                    index,
                    "additionalPrice" as keyof BaseAttributeOption,
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="0.00"
                disabled={disabled}
              />
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeOption(index)}
            disabled={disabled}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {localOptions.length === 0 && (
        <p className="text-muted-foreground rounded-lg border py-4 text-center text-sm">
          {noOptionsLabel}
        </p>
      )}
    </div>
  );
}
