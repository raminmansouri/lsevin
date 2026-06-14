"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";

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

import { searchServiceDefinitionLookupOptionsForClient } from "../actions/search-service-definition-lookups";
import type {
  ServiceDefinitionLookupOption,
  ServiceDefinitionLookupType,
} from "../db/service-definition-repository";

type LazyServiceDefinitionLookupSelectProps = {
  lookupType: ServiceDefinitionLookupType;
  locale: string;
  value?: string | null;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  initialOptions?: ServiceDefinitionLookupOption[];
  className?: string;
  contentClassName?: string;
  allowClear?: boolean;
  limit?: number;
};

function normalizeOption(option: ServiceDefinitionLookupOption): ServiceDefinitionLookupOption {
  return {
    value: String(option.value),
    label: option.label || String(option.value),
    description: option.description,
  };
}

function mergeOptions(
  ...groups: Array<ServiceDefinitionLookupOption[] | undefined>
): ServiceDefinitionLookupOption[] {
  const map = new Map<string, ServiceDefinitionLookupOption>();
  for (const group of groups) {
    for (const rawOption of group ?? []) {
      const option = normalizeOption(rawOption);
      if (!option.value) continue;
      if (!map.has(option.value)) map.set(option.value, option);
    }
  }
  return Array.from(map.values());
}

function filterInitialOptions(options: ServiceDefinitionLookupOption[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return options;

  return options.filter((option) => {
    const haystack = [option.value, option.label, option.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });
}

export function LazyServiceDefinitionLookupSelect({
  lookupType,
  locale,
  value,
  onValueChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  disabled = false,
  initialOptions = [],
  className,
  contentClassName,
  allowClear = true,
  limit = 30,
}: LazyServiceDefinitionLookupSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<ServiceDefinitionLookupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestSeq = useRef(0);
  const lastRequestKey = useRef<string | null>(null);

  const normalizedInitialOptions = useMemo(
    () => initialOptions.map(normalizeOption),
    [initialOptions]
  );

  useEffect(() => {
    if (!open) return;

    const normalizedSearch = search.trim();
    const requestKey = `${lookupType}|${locale}|${limit}|${normalizedSearch}`;
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;

    const timer = window.setTimeout(async () => {
      if (lastRequestKey.current === requestKey) return;
      lastRequestKey.current = requestKey;

      try {
        setIsLoading(true);
        setError(null);

        const nextOptions = await searchServiceDefinitionLookupOptionsForClient({
          lookupType,
          search: normalizedSearch,
          locale,
          limit,
        });

        if (requestSeq.current === seq) {
          setRemoteOptions(nextOptions.map(normalizeOption));
        }
      } catch (caught) {
        if (requestSeq.current === seq) {
          lastRequestKey.current = null;
          setError(caught instanceof Error ? caught.message : "Lookup search failed.");
          setRemoteOptions([]);
        }
      } finally {
        if (requestSeq.current === seq) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [lookupType, search, locale, limit, open]);

  const visibleOptions = useMemo(
    () => mergeOptions(remoteOptions, filterInitialOptions(normalizedInitialOptions, search)),
    [remoteOptions, normalizedInitialOptions, search]
  );

  const selectedOption = useMemo(
    () => mergeOptions(remoteOptions, normalizedInitialOptions).find((option) => option.value === value),
    [remoteOptions, normalizedInitialOptions, value]
  );

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onValueChange(undefined);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between gap-2", className)}
        >
          <span className={cn("min-w-0 truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label || (value ? String(value) : placeholder)}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {allowClear && value && !disabled ? (
              <span
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                onClick={handleClear}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") handleClear(event);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", contentClassName)} align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
          <CommandList>
            {isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-6 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : null}
            {!isLoading && error ? (
              <div className="text-destructive px-3 py-6 text-sm">{error}</div>
            ) : null}
            {!isLoading && !error ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
            <CommandGroup>
              {visibleOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => handleSelect(option.value)}
                  className="items-start gap-2"
                >
                  <Check className={cn("mt-0.5 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
