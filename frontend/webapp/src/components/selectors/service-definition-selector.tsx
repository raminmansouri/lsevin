"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ServiceDefinitionOption {
  id: string;
  name: string;
  description?: string;
  categoryName?: string;
  price?: number;
  currency?: string;
  durationMinutes?: number;
}

interface ServiceDefinitionSelectorProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: ServiceDefinitionOption[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function ServiceDefinitionSelector({
  label,
  placeholder,
  value,
  onValueChange,
  options = [],
  disabled = false,
  required = false,
  className,
}: ServiceDefinitionSelectorProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("shared");

  const selectedOption = options.find((option) => option.id === value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
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
              <div className="flex items-center gap-2 text-left">
                <div>
                  <div className="font-medium">{selectedOption.name}</div>
                  {selectedOption.categoryName && (
                    <div className="text-muted-foreground text-xs">
                      {selectedOption.categoryName}
                      {selectedOption.price && selectedOption.currency && (
                        <span className="ml-2">
                          {formatPrice(selectedOption.price)}{" "}
                          {selectedOption.currency}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t("selectOption")}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("searchPlaceholder")}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{t("noResults")}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.name} ${option.categoryName || ""}`}
                    onSelect={() => {
                      onValueChange?.(option.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{option.name}</div>
                      {option.description && (
                        <div className="text-muted-foreground line-clamp-1 text-xs">
                          {option.description}
                        </div>
                      )}
                      <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
                        {option.categoryName && (
                          <span>{option.categoryName}</span>
                        )}
                        {option.price && option.currency && (
                          <span>
                            {formatPrice(option.price)} {option.currency}
                          </span>
                        )}
                        {option.durationMinutes && (
                          <span>{option.durationMinutes} min</span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
