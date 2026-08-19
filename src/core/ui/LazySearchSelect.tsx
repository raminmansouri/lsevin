"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@core/lib/cn";
import type { SearchOption } from "@core/ui/SearchableSelect";

export function LazySearchSelect({
  name,
  endpoint,
  defaultValue = "",
  initialLabel = "",
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No matching options.",
  loadingText = "Loading…",
  loadErrorText = "Could not load options.",
  emptyOptionLabel,
  required = false,
  disabled = false,
  className,
  limit = 30,
}: {
  name: string;
  endpoint: string;
  defaultValue?: string;
  initialLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  loadErrorText?: string;
  emptyOptionLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  limit?: number;
}) {
  const [current, setCurrent] = useState(defaultValue);
  const [label, setLabel] = useState(initialLabel || defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open && (!current || label !== current || initialLabel)) return;
    if (!open && !current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("q", open ? query : "");
        url.searchParams.set("selected", current);
        url.searchParams.set("limit", String(limit));
        const response = await fetch(url.toString(), { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(`${loadErrorText} (${response.status})`);
        const payload = await response.json() as { items?: SearchOption[] };
        const next = Array.isArray(payload.items) ? payload.items : [];
        setItems(next);
        const selected = next.find((item) => item.value === current);
        if (selected) setLabel(selected.label);
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setError(cause instanceof Error ? cause.message : loadErrorText);
      } finally {
        setLoading(false);
      }
    }, open ? 220 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [current, endpoint, initialLabel, label, limit, loadErrorText, open, query]);

  const visible = useMemo(() => {
    if (!open) return [];
    const base = items.filter((item) => item.value !== "");
    return emptyOptionLabel ? [{ value: "", label: emptyOptionLabel }, ...base] : base;
  }, [emptyOptionLabel, items, open]);

  const choose = (option: SearchOption) => {
    if (option.disabled) return;
    setCurrent(option.value);
    setLabel(option.label);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={root} className={cn("relative", className)} data-lazy-search-select>
      <input type="text" name={name} value={current} required={required} disabled={disabled} onChange={() => undefined} tabIndex={-1} aria-hidden="true" className="sr-only" data-lazy-search-select-value />
      <button type="button" disabled={disabled} aria-expanded={open} aria-haspopup="listbox" aria-required={required || undefined} onClick={() => setOpen((item) => !item)} className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-start text-sm outline-none ring-primary/20 transition focus:ring-4 disabled:bg-muted disabled:text-muted-foreground">
        <span className={cn("truncate", !current ? "text-muted-foreground" : "")}>{current ? label || current : placeholder}</span>
        <span className="flex shrink-0 items-center gap-1">
          {current && !required ? <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setCurrent(""); setLabel(""); }} onKeyDown={() => undefined} className="rounded p-0.5 hover:bg-muted"><X size={13} /></span> : null}
          <ChevronDown size={15} />
        </span>
      </button>
      {open ? <div className="absolute z-50 mt-1 w-full min-w-[300px] rounded-lg border border-border bg-white p-2 shadow-xl">
        <div className="relative"><Search className="pointer-events-none absolute start-2.5 top-2.5 text-muted-foreground" size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="w-full rounded-md border border-border py-2 pe-3 ps-8 text-sm outline-none" /></div>
        <div className="mt-2 max-h-64 overflow-y-auto" role="listbox">
          {error ? <div className="p-2 text-sm text-red-700">{error}</div> : null}
          {loading ? <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} /> {loadingText}</div> : null}
          {!loading && !error && !visible.length ? <div className="p-4 text-center text-sm text-muted-foreground">{emptyText}</div> : null}
          {!loading && visible.map((option) => <button key={`${option.value}:${option.label}`} type="button" role="option" aria-selected={current === option.value} onClick={() => choose(option)} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-muted"><Check size={15} className={current === option.value ? "mt-0.5 opacity-100" : "mt-0.5 opacity-0"}/><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{option.label}</span>{option.description ? <span className="block truncate text-xs text-muted-foreground">{option.description}</span> : null}</span></button>)}
        </div>
      </div> : null}
    </div>
  );
}
