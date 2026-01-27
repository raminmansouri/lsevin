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

export interface StaffOption {
  staffId: string;
  name: string;
  title?: string;
}

interface StaffSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  options: StaffOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
}

export function StaffSelector({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  multiple = false,
  values = [],
  onValuesChange,
}: StaffSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = value
    ? options.find((option) => option.staffId === value)
    : undefined;

  const selectedOptions = multiple
    ? options.filter((option) => values.includes(option.staffId))
    : [];

  const formatDisplayName = (option: StaffOption) => {
    return option.title ? `${option.name} - ${option.title}` : option.name;
  };

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
                    key={option.staffId}
                    variant="secondary"
                    className="text-xs"
                  >
                    {formatDisplayName(option)}
                    <button
                      className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                      onClick={(e) => handleRemove(option.staffId, e)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {placeholder || "Select staff members..."}
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search staff members..." />
            <CommandList>
              <CommandEmpty>No staff member found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.staffId}
                    value={option.name}
                    onSelect={() => handleSelect(option.staffId)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        values.includes(option.staffId)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.name}</span>
                      {option.title && (
                        <span className="text-muted-foreground text-sm">
                          {option.title}
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
                {selectedOption.title && (
                  <span className="text-muted-foreground text-sm">
                    {selectedOption.title}
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
              {placeholder || "Select staff member..."}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search staff members..." />
          <CommandList>
            <CommandEmpty>No staff member found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.staffId}
                  value={option.name}
                  onSelect={() => handleSelect(option.staffId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.staffId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.name}</span>
                    {option.title && (
                      <span className="text-muted-foreground text-sm">
                        {option.title}
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
