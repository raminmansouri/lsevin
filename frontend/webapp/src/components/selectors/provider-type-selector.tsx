"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ProviderTypeOption {
  providerTypeId: string;
  name: string;
  description?: string;
}

interface ProviderTypeSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  options: ProviderTypeOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
}

export function ProviderTypeSelector({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  multiple = false,
  values = [],
  onValuesChange,
}: ProviderTypeSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = value
    ? options.find((option) => option.providerTypeId === value)
    : undefined;

  const selectedOptions = multiple
    ? options.filter((option) => values.includes(option.providerTypeId))
    : [];

  const handleSelect = (optionId: string) => {
    if (multiple) {
      if (values.includes(optionId)) {
        onValuesChange?.(values.filter((v) => v !== optionId));
      } else {
        onValuesChange?.([...values, optionId]);
      }
    } else {
      if (value === optionId) {
        onValueChange?.(undefined);
      } else {
        onValueChange?.(optionId);
      }
      setOpen(false);
    }
  };

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onValuesChange?.(values.filter((v) => v !== optionId));
    } else {
      onValueChange?.(undefined);
    }
  };

  if (multiple) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-h-10 w-full justify-between"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.providerTypeId}
                    variant="secondary"
                    className="text-xs"
                  >
                    {option.name}
                    <button
                      className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                      onClick={(e) => handleRemove(option.providerTypeId, e)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {placeholder || "Select provider types..."}
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search provider types..." />
            <CommandList>
              <CommandEmpty>No provider type found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.providerTypeId}
                    value={option.name}
                    onSelect={() => handleSelect(option.providerTypeId)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        values.includes(option.providerTypeId)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.name}</span>
                      {option.description && (
                        <span className="text-muted-foreground text-sm">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <div className="flex flex-col items-start">
                <span>{selectedOption.name}</span>
                {selectedOption.description && (
                  <span className="text-muted-foreground text-sm">
                    {selectedOption.description}
                  </span>
                )}
              </div>
              {value && (
                <button
                  className="hover:bg-muted-foreground/20 ml-auto rounded-full p-0.5"
                  onClick={(e) => handleRemove(value, e)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || "Select provider type..."}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search provider types..." />
          <CommandList>
            <CommandEmpty>No provider type found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.providerTypeId}
                  value={option.name}
                  onSelect={() => handleSelect(option.providerTypeId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.providerTypeId
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.name}</span>
                    {option.description && (
                      <span className="text-muted-foreground text-sm">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
