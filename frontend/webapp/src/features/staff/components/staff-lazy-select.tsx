"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type StaffLookupResource =
  | "serviceProviders"
  | "serviceDefinitions"
  | "daysOfWeek"
  | "staffAvailabilityStatuses"
  | "staffGalleryMediaTypes"
  | "languages"
  | "specializations";

export type StaffLookupOption = {
  id: string;
  label: string;
  description?: string | null;
  code?: string | null;
  isActive?: boolean | null;
};

type LookupResponse = {
  items: StaffLookupOption[];
  hasMore: boolean;
  page: number;
  pageSize: number;
};

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type BaseSelectProps = {
  resource: StaffLookupResource;
  locale?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  initialOptions?: StaffLookupOption[];
  queryParams?: QueryParams;
  clearable?: boolean;
  className?: string;
  contentClassName?: string;
  pageSize?: number;
};

type StaffLazySelectProps = BaseSelectProps & {
  value?: string | number | null;
  onValueChange?: (value: string) => void;
};

type StaffLazyMultiSelectProps = BaseSelectProps & {
  value?: string[] | null;
  onValueChange?: (value: string[]) => void;
  allowCustomValue?: boolean;
  customValueLabel?: string;
  maxSelectedLabelCount?: number;
};

function normalizeOptionValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function uniqueOptions(options: StaffLookupOption[]) {
  const seen = new Set<string>();
  const result: StaffLookupOption[] = [];

  for (const option of options) {
    const value = normalizeOptionValue(option.id);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push({ ...option, id: value, label: option.label || value });
  }

  return result;
}

function fallbackOption(value: string): StaffLookupOption {
  return { id: value, label: value };
}

function buildLookupUrl({
  resource,
  locale,
  search,
  page,
  pageSize,
  queryParams,
}: {
  resource: StaffLookupResource;
  locale?: string;
  search: string;
  page: number;
  pageSize: number;
  queryParams?: QueryParams;
}) {
  const params = new URLSearchParams();
  params.set("resource", resource);
  params.set("locale", locale || "fa-IR");
  params.set("q", search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  for (const [key, value] of Object.entries(queryParams || {})) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }

  return `/api/staff/lookups?${params.toString()}`;
}

function OptionContent({ option, selected }: { option: StaffLookupOption; selected: boolean }) {
  return (
    <>
      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{option.label}</div>
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {option.description ? <span className="truncate">{option.description}</span> : null}
          {option.code ? <span className="shrink-0 rounded bg-muted px-1.5 py-0.5">{option.code}</span> : null}
          {option.isActive === false ? <span className="shrink-0 text-amber-600">Inactive</span> : null}
        </div>
      </div>
    </>
  );
}

function useLazyLookup({
  resource,
  locale,
  open,
  search,
  initialOptions = [],
  queryParams = {},
  pageSize = 30,
}: {
  resource: StaffLookupResource;
  locale?: string;
  open: boolean;
  search: string;
  initialOptions?: StaffLookupOption[];
  queryParams?: QueryParams;
  pageSize?: number;
}) {
  const [items, setItems] = useState<StaffLookupOption[]>(() => uniqueOptions(initialOptions));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = JSON.stringify(queryParams || {});

  useEffect(() => {
    setItems(uniqueOptions(initialOptions));
    setPage(1);
    setHasMore(false);
  }, [initialOptions, queryKey, resource]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          buildLookupUrl({ resource, locale, search, page: 1, pageSize, queryParams }),
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) throw new Error(`Lookup failed with ${response.status}`);

        const payload = (await response.json()) as LookupResponse;
        const base = search.trim() ? [] : initialOptions;
        setItems(uniqueOptions([...base, ...(payload.items || [])]));
        setPage(payload.page || 1);
        setHasMore(Boolean(payload.hasMore));
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") setError("Could not load options.");
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [initialOptions, locale, open, pageSize, queryKey, resource, search]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch(
        buildLookupUrl({ resource, locale, search, page: nextPage, pageSize, queryParams }),
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error(`Lookup failed with ${response.status}`);

      const payload = (await response.json()) as LookupResponse;
      setItems((current) => uniqueOptions([...current, ...(payload.items || [])]));
      setPage(payload.page || nextPage);
      setHasMore(Boolean(payload.hasMore));
    } catch {
      setError("Could not load more options.");
    } finally {
      setIsLoading(false);
    }
  };

  return { items: uniqueOptions(items), hasMore, isLoading, error, loadMore };
}

export function StaffLazySearchableSelect({
  resource,
  locale,
  value,
  onValueChange,
  placeholder = "Search and select",
  searchPlaceholder = "Search...",
  disabled = false,
  initialOptions = [],
  queryParams,
  clearable = true,
  className,
  contentClassName,
  pageSize = 30,
}: StaffLazySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedValue = normalizeOptionValue(value);
  const { items, hasMore, isLoading, error, loadMore } = useLazyLookup({
    resource,
    locale,
    open,
    search,
    initialOptions,
    queryParams,
    pageSize,
  });

  const allOptions = useMemo(
    () => uniqueOptions([...initialOptions, ...items, ...(selectedValue ? [fallbackOption(selectedValue)] : [])]),
    [initialOptions, items, selectedValue]
  );

  const selectedOption = allOptions.find((option) => option.id === selectedValue);

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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin opacity-60" /> : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[min(420px,calc(100vw-2rem))] p-0", contentClassName)} align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            {error ? <div className="px-3 py-2 text-sm text-destructive">{error}</div> : null}
            <CommandEmpty>{isLoading ? "Loading..." : "No options found."}</CommandEmpty>
            <CommandGroup>
              {items.map((option) => {
                const selected = option.id === selectedValue;
                return (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => {
                      onValueChange?.(option.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <OptionContent option={option} selected={selected} />
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

export function StaffLazySearchableMultiSelect({
  resource,
  locale,
  value,
  onValueChange,
  placeholder = "Search and select",
  searchPlaceholder = "Search...",
  disabled = false,
  initialOptions = [],
  queryParams,
  clearable = true,
  className,
  contentClassName,
  pageSize = 30,
  allowCustomValue = false,
  customValueLabel = "Add custom value",
  maxSelectedLabelCount = 3,
}: StaffLazyMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedValues = useMemo(() => (value || []).map(String).filter(Boolean), [value]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const { items, hasMore, isLoading, error, loadMore } = useLazyLookup({
    resource,
    locale,
    open,
    search,
    initialOptions,
    queryParams,
    pageSize,
  });

  const allOptions = useMemo(
    () => uniqueOptions([...initialOptions, ...items, ...selectedValues.map(fallbackOption)]),
    [initialOptions, items, selectedValues]
  );

  const selectedOptions = selectedValues.map((selected) => allOptions.find((option) => option.id === selected) || fallbackOption(selected));
  const visibleLabels = selectedOptions.slice(0, maxSelectedLabelCount).map((option) => option.label);
  const hiddenLabelCount = Math.max(0, selectedOptions.length - maxSelectedLabelCount);
  const trimmedSearch = search.trim();
  const canAddCustom = allowCustomValue && trimmedSearch && !selectedSet.has(trimmedSearch);

  const toggleValue = (nextValue: string) => {
    if (!nextValue) return;
    if (selectedSet.has(nextValue)) {
      onValueChange?.(selectedValues.filter((item) => item !== nextValue));
      return;
    }
    onValueChange?.([...selectedValues, nextValue]);
  };

  const handleClear = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    onValueChange?.([]);
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
          className={cn("min-h-11 w-full justify-between", className)}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOptions.length ? (
              <span className="truncate">
                {visibleLabels.join(", ")}{hiddenLabelCount ? ` +${hiddenLabelCount}` : ""}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {clearable && selectedOptions.length ? (
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin opacity-60" /> : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[min(460px,calc(100vw-2rem))] p-0", contentClassName)} align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            {error ? <div className="px-3 py-2 text-sm text-destructive">{error}</div> : null}
            <CommandEmpty>{isLoading ? "Loading..." : "No options found."}</CommandEmpty>
            <CommandGroup>
              {canAddCustom ? (
                <CommandItem value={`__custom__${trimmedSearch}`} onSelect={() => toggleValue(trimmedSearch)} className="cursor-pointer">
                  <PlusIcon />
                  <div className="min-w-0 flex-1 truncate">{customValueLabel}: {trimmedSearch}</div>
                </CommandItem>
              ) : null}
              {items.map((option) => {
                const selected = selectedSet.has(option.id);
                return (
                  <CommandItem key={option.id} value={option.id} onSelect={() => toggleValue(option.id)} className="cursor-pointer">
                    <OptionContent option={option} selected={selected} />
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
        {selectedOptions.length ? (
          <div className="flex flex-wrap gap-2 border-t p-3">
            {selectedOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
                onClick={() => toggleValue(option.id)}
              >
                {option.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function PlusIcon() {
  return <span className="mr-2 flex h-4 w-4 items-center justify-center rounded-full border text-xs">+</span>;
}

type RHFStaffLazySelectFieldProps<TFieldValues extends FieldValues = FieldValues> = BaseSelectProps & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
};

export function RHFStaffLazySelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  ...props
}: RHFStaffLazySelectFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <StaffLazySearchableSelect
              {...props}
              value={field.value}
              onValueChange={(nextValue) => field.onChange(nextValue)}
            />
          </FormControl>
          {fieldState.error?.message ? <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p> : null}
        </FormItem>
      )}
    />
  );
}

type RHFStaffLazyMultiSelectFieldProps<TFieldValues extends FieldValues = FieldValues> = StaffLazyMultiSelectProps & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
};

export function RHFStaffLazyMultiSelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description,
  ...props
}: RHFStaffLazyMultiSelectFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <StaffLazySearchableMultiSelect
              {...props}
              value={Array.isArray(field.value) ? field.value : []}
              onValueChange={(nextValue) => field.onChange(nextValue)}
            />
          </FormControl>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          {fieldState.error?.message ? <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p> : null}
        </FormItem>
      )}
    />
  );
}
