"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, icons, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IconRenderer } from "@/components/ui/icon-renderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Get all available Lucide icon names automatically from the icons object
const getAllLucideIconNames = (): string[] => {
  return Object.keys(icons).sort();
};

interface IconSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function IconSelector({
  value,
  onValueChange,
  placeholder = "Select icon",
  disabled = false,
}: IconSelectorProps) {
  const [open, setOpen] = useState(false);

  // Get all icon names on mount (memoized)
  const availableIcons = useMemo(() => getAllLucideIconNames(), []);

  const handleSelect = (iconName: string) => {
    // Handle "None" option
    if (iconName === "__none__") {
      onValueChange?.(undefined);
      setOpen(false);
      return;
    }

    if (value === iconName) {
      onValueChange?.(undefined);
    } else {
      onValueChange?.(iconName);
    }
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange?.(undefined);
  };

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
          {value ? (
            <span className="flex items-center gap-2">
              <IconRenderer iconName={value} size={16} />
              <span>{value}</span>
              <span
                className="hover:bg-muted-foreground/20 ml-auto cursor-pointer rounded-full p-0.5 transition-colors"
                onClick={handleRemove}
                role="button"
                aria-label="Remove icon"
              >
                <X className="h-3 w-3" />
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search icons..." />
          <CommandList>
            <CommandEmpty>No icon found.</CommandEmpty>
            {/* None Option */}
            <CommandGroup heading="Options">
              <CommandItem value="__none__" onSelect={handleSelect}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                <X className="text-muted-foreground mr-2 h-4 w-4" />
                <span className="text-muted-foreground">None</span>
              </CommandItem>
            </CommandGroup>
            {/* Icon List */}
            <CommandGroup heading="Icons">
              {availableIcons.map((iconName) => (
                <CommandItem
                  key={iconName}
                  value={iconName}
                  onSelect={() => handleSelect(iconName)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === iconName ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <IconRenderer
                    iconName={iconName}
                    size={16}
                    className="mr-2"
                  />
                  {iconName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
