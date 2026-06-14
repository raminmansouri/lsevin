"use client";

import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LazyOption, LazyOptionsResult } from "@/features/locations/location-select.types";
import { useLocationSelectStore } from "../stores/location-select.store";


type LoadOptionsParams = {
  search: string;
  page: number;
  pageSize: number;
};

function mergeUniqueOptions(existing: LazyOption[], incoming: LazyOption[]) {
  if (existing.length === 0) return incoming;
  if (incoming.length === 0) return existing;

  const seen = new Set(existing.map((item) => item.value));
  const merged = [...existing];

  for (const item of incoming) {
    if (seen.has(item.value)) continue;
    seen.add(item.value);
    merged.push(item);
  }

  return merged;
}

type Props = {
  value: string | null | undefined;
  onChange: (value: string | null, option: LazyOption | null) => void;

  loadOptions: (params: LoadOptionsParams) => Promise<LazyOptionsResult>;
  loadByValue?: (value: string) => Promise<LazyOption | null>;

  cacheKey: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  pageSize?: number;
  clearable?: boolean;
  className?: string;
};

export function AsyncSingleSelect({
  value,
  onChange,
  loadOptions,
  loadByValue,
  cacheKey,
  label,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  pageSize = 20,
  clearable = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<LazyOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef(0);

  const cachedSelectedOption = useLocationSelectStore((state) =>
    value ? state.getItem(`${cacheKey}|item|${value}`) : undefined
  );
  const getCachedQuery = useLocationSelectStore((state) => state.getQuery);
  const setCachedQuery = useLocationSelectStore((state) => state.setQuery);
  const setCachedItems = useLocationSelectStore((state) => state.setItems);

  const selectedOption =
    cachedSelectedOption ??
    items.find((item) => item.value === value) ??
    null;

  const loadPage = useCallback(
    async (nextPage: number, nextSearch: string, append: boolean) => {
      const nextQueryCacheKey = `${cacheKey}|query|${nextSearch}|${nextPage}|${pageSize}`;
      const cached = getCachedQuery(nextQueryCacheKey);

      if (cached) {
        setItems((prev) => (append ? mergeUniqueOptions(prev, cached.items) : cached.items));
        setHasMore(cached.hasMore);
        setPage(nextPage);
        setCachedItems(cacheKey, cached.items);
        return;
      }

      const currentRequest = ++requestRef.current;
      setIsLoading(true);

      try {
        const result = await loadOptions({
          search: nextSearch,
          page: nextPage,
          pageSize,
        });

        if (requestRef.current !== currentRequest) return;

        setItems((prev) => (append ? mergeUniqueOptions(prev, result.items) : result.items));
        setHasMore(result.hasMore);
        setPage(nextPage);

        setCachedQuery(nextQueryCacheKey, result);
        setCachedItems(cacheKey, result.items);
      } finally {
        if (requestRef.current === currentRequest) {
          setIsLoading(false);
        }
      }
    },
    [cacheKey, getCachedQuery, loadOptions, pageSize, setCachedItems, setCachedQuery]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    void loadPage(1, debouncedSearch, false);
  }, [open, debouncedSearch, loadPage]);

  useEffect(() => {
    setSearch("");
    setDebouncedSearch("");
    setItems([]);
    setPage(1);
    setHasMore(false);
  }, [cacheKey]);

  useEffect(() => {
    if (!value || selectedOption || !loadByValue) return;

    let cancelled = false;

    void (async () => {
      const item = await loadByValue(value);
      if (!cancelled && item) {
        useLocationSelectStore.getState().setItem(`${cacheKey}|item|${item.value}`, item);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, selectedOption, loadByValue, cacheKey]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    void loadPage(page + 1, debouncedSearch, true);
  };

  return (
    <div className={className}>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      ) : null}

      <div className="relative" ref={panelRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="min-w-0 flex-1">
            {selectedOption ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedOption.label}
                </div>
                {selectedOption.description ? (
                  <div className="truncate text-xs text-zinc-500">
                    {selectedOption.description}
                  </div>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-zinc-500">{placeholder}</span>
            )}
          </div>

          <div className="ml-2 flex items-center gap-1">
            {clearable && value && !disabled ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null, null);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900"
              >
                <X className="h-4 w-4" />
              </span>
            ) : null}
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </div>
        </button>

        {open ? (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm outline-none"
                />
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : null}
              </div>
            </div>

            <div className="max-h-72 overflow-auto p-2">
              {items.length === 0 && !isLoading ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  {emptyText}
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => {
                    const isSelected = item.value === value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          onChange(item.value, item);
                          setOpen(false);
                        }}
                        className={[
                          "flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition",
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {item.label}
                          </div>
                          {item.description ? (
                            <div className="truncate text-xs opacity-75">
                              {item.description}
                            </div>
                          ) : null}
                        </div>

                        {isSelected ? <Check className="ml-3 h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}

                  {hasMore ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      {isLoading ? "Loading..." : "Load more"}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}