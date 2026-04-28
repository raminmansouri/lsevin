"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
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

import type {
  AdminLookupOption,
  AdminLookupType,
} from "../../db/admin-service-providers.queries";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type LookupResponse = {
  items: AdminLookupOption[];
  hasMore: boolean;
  page: number;
  pageSize: number;
};

type Props = {
  lookupType: AdminLookupType;
  locale: string;
  value?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  initialOptions?: AdminLookupOption[];
  queryParams?: QueryParams;
  valueField?: "id" | "code";
  clearable?: boolean;
  excludeIds?: string[];
  className?: string;
  contentClassName?: string;
  pageSize?: number;
};

function optionValue(option: AdminLookupOption, valueField: "id" | "code") {
  if (valueField === "code" && option.code) return String(option.code);
  return String(option.id);
}

function uniqueByOptionValue(options: AdminLookupOption[], valueField: "id" | "code") {
  const seen = new Set<string>();
  const result: AdminLookupOption[] = [];

  for (const option of options) {
    const value = optionValue(option, valueField);
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(option);
  }

  return result;
}

export function LazyAdminLookupSelect({
  lookupType,
  locale,
  value,
  onValueChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  disabled = false,
  initialOptions = [],
  queryParams = {},
  valueField = "id",
  clearable = true,
  excludeIds = [],
  className,
  contentClassName,
  pageSize = 30,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AdminLookupOption[]>(() =>
    uniqueByOptionValue(initialOptions, valueField)
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify(queryParams);
  const selectedValue = value ? String(value) : "";
  const excluded = useMemo(() => new Set(excludeIds.map(String)), [excludeIds]);

  const visibleItems = useMemo(() => {
    return uniqueByOptionValue(items, valueField).filter((item) => {
      const id = String(item.id);
      const val = optionValue(item, valueField);
      return !excluded.has(id) && !excluded.has(val);
    });
  }, [excluded, items, valueField]);

  const selectedOption = useMemo(() => {
    if (!selectedValue) return undefined;
    return uniqueByOptionValue([...initialOptions, ...items], valueField).find(
      (item) => optionValue(item, valueField) === selectedValue || String(item.id) === selectedValue
    );
  }, [initialOptions, items, selectedValue, valueField]);

  useEffect(() => {
    setItems(uniqueByOptionValue(initialOptions, valueField));
    setPage(1);
    setHasMore(false);
  }, [initialOptions, lookupType, queryKey, valueField]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("type", lookupType);
      params.set("locale", locale || "en-US");
      params.set("q", search);
      params.set("page", "1");
      params.set("pageSize", String(pageSize));

      for (const [key, rawValue] of Object.entries(queryParams)) {
        if (rawValue === null || rawValue === undefined || rawValue === "") continue;
        params.set(key, String(rawValue));
      }

      try {
        const response = await fetch(`/api/admin/service-provider-lookups?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) throw new Error(`Lookup request failed with ${response.status}`);

        const payload = (await response.json()) as LookupResponse;
        const baseOptions = search.trim() ? [] : initialOptions;
        setItems(uniqueByOptionValue([...baseOptions, ...payload.items], valueField));
        setPage(payload.page);
        setHasMore(payload.hasMore);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError("Could not load options.");
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [initialOptions, locale, lookupType, open, pageSize, queryKey, search, valueField]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("type", lookupType);
    params.set("locale", locale || "en-US");
    params.set("q", search);
    params.set("page", String(page + 1));
    params.set("pageSize", String(pageSize));

    for (const [key, rawValue] of Object.entries(queryParams)) {
      if (rawValue === null || rawValue === undefined || rawValue === "") continue;
      params.set(key, String(rawValue));
    }

    try {
      const response = await fetch(`/api/admin/service-provider-lookups?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`Lookup request failed with ${response.status}`);

      const payload = (await response.json()) as LookupResponse;
      setItems((current) => uniqueByOptionValue([...current, ...payload.items], valueField));
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } catch {
      setError("Could not load more options.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    onValueChange?.("");
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
          className={cn("w-full justify-between", className)}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOption?.label || selectedValue || placeholder}
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {clearable && selectedValue ? (
              <span
                role="button"
                tabIndex={0}
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={handleClear}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleClear(event);
                  }
                }}
              >
                <X className="h-3.5 w-3.5 opacity-70" />
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[360px] p-0", contentClassName)} align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            {error ? <div className="px-3 py-2 text-sm text-destructive">{error}</div> : null}
            <CommandEmpty>{isLoading ? "Loading..." : "No options found."}</CommandEmpty>
            <CommandGroup>
              {visibleItems.map((item) => {
                const currentValue = optionValue(item, valueField);
                return (
                  <CommandItem
                    key={`${item.id}-${currentValue}`}
                    value={currentValue}
                    onSelect={() => {
                      onValueChange?.(currentValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === currentValue ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.label}</div>
                      {item.code ? <div className="text-xs text-muted-foreground">{item.code}</div> : null}
                    </div>
                  </CommandItem>
                );
              })}
              {hasMore ? (
                <CommandItem value="__load_more__" onSelect={loadMore} className="cursor-pointer justify-center">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load more
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
