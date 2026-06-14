"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

export type LazySelectOption = {
  value: string;
  label: string;
  description?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  meta?: Record<string, unknown>;
};

type LazySearchableSelectProps = {
  value?: string | string[] | null;
  onValueChange: (value: string | string[] | null) => void;
  resource: string;
  locale?: string;
  endpoint?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  multiple?: boolean;
  limit?: number;
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function asArray(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export function LazySearchableSelect({
  value,
  onValueChange,
  resource,
  locale = "fa-IR",
  endpoint = "/api/admin/lazy-search-options",
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  multiple = false,
  limit = 20,
  className,
}: LazySearchableSelectProps) {
  const t = useTranslations("FormBuilder.lazySelect");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("searchPlaceholder");
  const resolvedEmptyText = emptyText ?? t("emptyText");
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query);
  const selectedValues = React.useMemo(() => asArray(value), [value]);
  const [options, setOptions] = React.useState<LazySelectOption[]>([]);
  const [selectedOptions, setSelectedOptions] = React.useState<Record<string, LazySelectOption>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedParam = selectedValues.join(",");

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  React.useEffect(() => {
    if (!resource) {
      setOptions([]);
      setError(t("missingResource"));
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      resource,
      q: debouncedQuery,
      locale,
      selected: selectedParam,
      limit: String(limit),
    });

    setError(null);
    setLoading(true);

    fetch(`${endpoint}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(t("requestFailed", { status: response.status }));
        return response.json();
      })
      .then((payload: { items?: LazySelectOption[] }) => {
        const nextOptions = payload.items || [];
        setOptions(nextOptions);
        setSelectedOptions((current) => {
          const next = { ...current };
          for (const option of nextOptions) {
            if (selectedValues.includes(option.value)) next[option.value] = option;
          }
          return next;
        });
      })
      .catch((requestError) => {
        if ((requestError as Error).name !== "AbortError") {
          setOptions([]);
          setError((requestError as Error).message || t("failedToLoad"));
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, endpoint, limit, locale, resource, selectedParam, t]);

  const selectedLabels = selectedValues.map((item) => selectedOptions[item]?.label || item);

  const commitValue = (next: string[]) => {
    if (multiple) {
      onValueChange(next);
      return;
    }

    onValueChange(next[0] || null);
    setOpen(false);
  };

  const toggleOption = (option: LazySelectOption) => {
    setSelectedOptions((current) => ({ ...current, [option.value]: option }));

    if (multiple) {
      const exists = selectedValues.includes(option.value);
      commitValue(exists ? selectedValues.filter((item) => item !== option.value) : [...selectedValues, option.value]);
      return;
    }

    commitValue([option.value]);
  };

  const removeValue = (item: string) => {
    commitValue(selectedValues.filter((valueItem) => valueItem !== item));
  };

  const clearValue = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange(multiple ? [] : null);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#083f30]/20",
          disabled && "cursor-not-allowed bg-slate-50 opacity-70"
        )}
      >
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1">
            {selectedValues.length ? (
              multiple ? (
                <span className="flex flex-wrap gap-1.5">
                  {selectedValues.map((item, index) => (
                    <span key={item} className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#083f30]/10 px-2 py-1 text-xs font-medium text-[#083f30]">
                      <span className="truncate">{selectedLabels[index]}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeValue(item);
                        }}
                        className="rounded-full p-0.5 hover:bg-[#083f30]/15"
                      >
                        <X size={12} />
                      </span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="block truncate text-sm font-medium text-slate-900">{selectedLabels[0]}</span>
              )
            ) : (
              <span className="block truncate text-sm text-slate-500">{resolvedPlaceholder}</span>
            )}
          </span>
          {selectedValues.length > 0 && !disabled ? (
            <span onClick={clearValue} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={16} />
            </span>
          ) : null}
          <ChevronDown size={18} className={cn("text-slate-400 transition", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={17} className="text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={resolvedSearchPlaceholder}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {loading ? <Loader2 size={17} className="animate-spin text-slate-400" /> : null}
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5">
            {error ? <div className="px-3 py-4 text-sm text-red-600">{error}</div> : null}
            {options.length === 0 && !loading && !error ? <div className="px-3 py-6 text-center text-sm text-slate-500">{resolvedEmptyText}</div> : null}

            {options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50",
                    checked && "bg-[#083f30]/5"
                  )}
                >
                  {option.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={option.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  ) : null}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{option.label || option.value}</span>
                    {option.description ? <span className="block truncate text-xs text-slate-500">{option.description}</span> : null}
                  </span>

                  {option.badge ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{option.badge}</span> : null}
                  {checked ? <Check size={18} className="text-[#083f30]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
