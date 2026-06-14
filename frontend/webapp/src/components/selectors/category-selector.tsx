"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useTranslations } from "next-intl";

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

export interface CategoryOption {
  categoryId: string;
  name: string;
  parentName?: string;
}

interface CategorySelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  options: CategoryOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  excludeIds?: string[]; // For excluding self and descendants in hierarchical selection
}

export function CategorySelector({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  multiple = false,
  values = [],
  onValuesChange,
  excludeIds = [],
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Category");

  // Filter out excluded categories
  const filteredOptions = options.filter(
    (option) => !excludeIds.includes(option.categoryId)
  );

  const selectedOption = value
    ? filteredOptions.find((option) => option.categoryId === value)
    : undefined;

  const selectedOptions = multiple
    ? filteredOptions.filter((option) => values.includes(option.categoryId))
    : [];

  const formatDisplayName = (option: CategoryOption) => {
    return option.parentName
      ? `${option.parentName} > ${option.name}`
      : option.name;
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
                    key={option.categoryId}
                    variant="secondary"
                    className="text-xs"
                  >
                    {formatDisplayName(option)}
                    <button
                      className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                      onClick={(e) => handleRemove(option.categoryId, e)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {placeholder || t("form.parentIdPlaceholder")}
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.categoryId}
                    value={option.name}
                    onSelect={() => handleSelect(option.categoryId)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        values.includes(option.categoryId)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {formatDisplayName(option)}
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
              {formatDisplayName(selectedOption)}
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
              {placeholder || t("form.parentIdPlaceholder")}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.categoryId}
                  value={option.name}
                  onSelect={() => handleSelect(option.categoryId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.categoryId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {formatDisplayName(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
