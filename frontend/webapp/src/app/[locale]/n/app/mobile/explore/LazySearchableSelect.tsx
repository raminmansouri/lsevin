"use client";

import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type LazySelectOption = {
  value: string;
  label: string;
  description?: string | null;
};

export type LazySelectResult = {
  items: LazySelectOption[];
  hasMore: boolean;
};

type LazySearchableSelectProps = {
  label: string;
  value: string | null;
  disabled?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  pageSize?: number;
  onChange: (value: string | null, option: LazySelectOption | null) => void;
  loadOptions: (args: { search: string; page: number; pageSize: number }) => Promise<LazySelectResult>;
  loadByValue?: (value: string) => Promise<LazySelectOption | null>;
};

export default function LazySearchableSelect({
  label,
  value,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptyText = "No results found.",
  pageSize = 20,
  onChange,
  loadOptions,
  loadByValue,
}: LazySearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<LazySelectOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LazySelectOption | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open || disabled) return;

    let cancelled = false;
    const requestId = ++requestRef.current;
    setLoading(true);

    void loadOptions({ search: debouncedSearch, page: 1, pageSize })
      .then((result) => {
        if (cancelled || requestRef.current !== requestId) return;
        setItems(result.items);
        setHasMore(result.hasMore);
        setPage(1);
      })
      .catch(() => {
        if (cancelled || requestRef.current !== requestId) return;
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled && requestRef.current === requestId) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, disabled, debouncedSearch, loadOptions, pageSize]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }

    const loaded = items.find((item) => item.value === value);
    if (loaded) {
      setSelected(loaded);
      return;
    }

    if (!loadByValue) return;

    let cancelled = false;
    void loadByValue(value).then((option) => {
      if (!cancelled) setSelected(option);
    });

    return () => {
      cancelled = true;
    };
  }, [value, items, loadByValue]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedOption = useMemo(
    () => selected ?? items.find((item) => item.value === value) ?? null,
    [items, selected, value],
  );

  async function loadMore() {
    if (!hasMore || loading || disabled) return;

    const nextPage = page + 1;
    setLoading(true);

    try {
      const result = await loadOptions({ search: debouncedSearch, page: nextPage, pageSize });
      setItems((previous) => [...previous, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900">{label}</label>
      <div ref={panelRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-[#083f30] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
        >
          <div className="min-w-0 flex-1">
            {selectedOption ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-gray-900">{selectedOption.label}</div>
                {selectedOption.description ? (
                  <div className="truncate text-xs text-gray-500">{selectedOption.description}</div>
                ) : null}
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-500">{placeholder}</span>
            )}
          </div>

          <div className="ml-3 flex items-center gap-1">
            {value && !disabled ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(null);
                  onChange(null, null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelected(null);
                    onChange(null, null);
                  }
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </span>
            ) : null}
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </button>

        {open ? (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
              </div>
            </div>

            <div className="max-h-72 overflow-auto p-2">
              {items.length === 0 && !loading ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => {
                    const isSelected = item.value === value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          onChange(item.value, item);
                          setOpen(false);
                        }}
                        className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                          isSelected ? "bg-[#083f30] text-white" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{item.label}</div>
                          {item.description ? (
                            <div className={`truncate text-xs ${isSelected ? "text-white/75" : "text-gray-500"}`}>
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
                      onClick={() => void loadMore()}
                      disabled={loading}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {loading ? "Loading..." : "Load more"}
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
