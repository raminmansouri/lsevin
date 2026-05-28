"use client";

import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type AsyncSelectOption = {
  value: string;
  label: string;
  description?: string | null;
  raw?: Record<string, string | null>;
};

export type AsyncSelectResult = {
  items: AsyncSelectOption[];
  hasMore: boolean;
};

type Props = {
  label?: string;
  value: string | null | undefined;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  pageSize?: number;
  onChange: (value: string | null, option: AsyncSelectOption | null) => void;
  loadOptions: (args: { search: string; page: number; pageSize: number }) => Promise<AsyncSelectResult>;
  loadByValue?: (value: string) => Promise<AsyncSelectOption | null>;
};

export function AsyncSearchableSingleSelect({
  label,
  value,
  disabled,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  pageSize = 20,
  onChange,
  loadOptions,
  loadByValue,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<AsyncSelectOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AsyncSelectOption | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const currentReq = ++reqRef.current;
    setLoading(true);

    void loadOptions({ search: debouncedSearch, page: 1, pageSize })
      .then((result) => {
        if (cancelled || reqRef.current !== currentReq) return;
        setItems(result.items);
        setHasMore(result.hasMore);
        setPage(1);
      })
      .finally(() => {
        if (!cancelled && reqRef.current === currentReq) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, loadOptions, pageSize]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }

    const existing = items.find((item) => item.value === value);
    if (existing) {
      setSelected(existing);
      return;
    }

    if (!loadByValue) return;

    let cancelled = false;
    void loadByValue(value).then((item) => {
      if (!cancelled && item) setSelected(item);
    });

    return () => {
      cancelled = true;
    };
  }, [value, items, loadByValue]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selectedLabel = selected?.label ?? items.find((item) => item.value === value)?.label ?? null;
  const selectedDescription = selected?.description ?? items.find((item) => item.value === value)?.description ?? null;

  async function loadMore() {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const result = await loadOptions({ search: debouncedSearch, page: nextPage, pageSize });
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <div className="relative" ref={panelRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="min-w-0 flex-1">
            {selectedLabel ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{selectedLabel}</div>
                {selectedDescription ? (
                  <div className="truncate text-xs text-zinc-500">
                    
                    {/* {selectedDescription} */}
                     {selectedDescription &&
                                            hasLexicalContent(selectedDescription) ? (
                                              <LexicalRenderer
                                                content={selectedDescription}
                    
                                              />
                                          ) : (
                                            <>
                                                {selectedDescription}
                                            </>
                                          )}
                    </div>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-zinc-500">{placeholder}</span>
            )}
          </div>
          <div className="ml-2 flex items-center gap-1">
            {value && !disabled ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(null);
                  onChange(null, null);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : null}
              </div>
            </div>

            <div className="max-h-72 overflow-auto p-2">
              {items.length === 0 && !loading ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">{emptyText}</div>
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
                        className={[
                          "flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition",
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.label}</div>
                          {item.description ? (
                            <div className="truncate text-xs opacity-75">
                              
                               {item.description &&
                                            hasLexicalContent(item.description) ? (
                                              <LexicalRenderer
                                                content={item.description}
                    
                                              />
                                          ) : (
                                            <>
                                                {item.description}
                                            </>
                                          )}
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
                      className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
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
