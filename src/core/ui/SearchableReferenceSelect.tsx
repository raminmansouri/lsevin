"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import type { ReferenceOption, ReferenceType } from "@core/reference-data/types";
import { cn } from "@core/lib/cn";
import { translatePortalText } from "@core/i18n/translate";

export function SearchableReferenceSelect({
  name,
  type,
  value = "",
  initialLabel,
  locale,
  parentCode,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  required,
  disabled,
  onValueChange,
  className,
}: {
  name: string;
  type: ReferenceType;
  value?: string;
  initialLabel?: string;
  locale?: string;
  parentCode?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string, option?: ReferenceOption) => void;
  className?: string;
}) {
  const [current, setCurrent] = useState(value);
  const effectiveLocale = locale || (typeof document !== "undefined" ? document.documentElement.lang : "fa-IR");
  const copy = (source: string) => translatePortalText(effectiveLocale, source);
  const [label, setLabel] = useState(initialLabel || value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrent(value); if (!value) setLabel(""); }, [value]);
  useEffect(() => {
    if (type === "city" && !parentCode) { setItems([]); setCurrent(""); setLabel(""); }
  }, [parentCode, type]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open || (type === "city" && !parentCode)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      const params = new URLSearchParams({ type, q: query, locale: effectiveLocale, selected: current });
      if (parentCode) params.set("parentCode", parentCode);
      try {
        const response = await fetch(`/api/reference-data?${params}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(copy("Could not load options."));
        const payload = await response.json() as { items: ReferenceOption[] };
        setItems(payload.items || []);
        const selected = payload.items?.find((item) => item.value.toLowerCase() === current.toLowerCase());
        if (selected && !label) setLabel(selected.label);
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setError(copy("Could not load options."));
      } finally { setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [current, effectiveLocale, label, open, parentCode, query, type]);

  const visible = useMemo(() => items, [items]);
  const choose = (option: ReferenceOption) => {
    setCurrent(option.value); setLabel(option.label); setOpen(false); setQuery(""); onValueChange?.(option.value, option);
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <input type="text" name={name} value={current} required={required} onChange={() => undefined} tabIndex={-1} aria-hidden="true" className="sr-only" data-reference-value />
      <button type="button" disabled={disabled || (type === "city" && !parentCode)} onClick={() => setOpen((item) => !item)} className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-4 disabled:bg-muted disabled:text-muted-foreground">
        <span className="truncate">{label || current || placeholder}</span>
        <span className="flex items-center gap-1">
          {current ? <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setCurrent(""); setLabel(""); onValueChange?.(""); }} onKeyDown={() => undefined} className="rounded p-0.5 hover:bg-muted"><X size={13} /></span> : null}
          <ChevronDown size={15} />
        </span>
      </button>
      {open ? <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-lg border border-border bg-white p-2 shadow-xl">
        <div className="relative"><Search className="absolute right-2.5 top-2.5 text-muted-foreground" size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="w-full rounded-md border border-border py-2 pl-3 pr-8 text-sm outline-none" /></div>
        <div className="mt-2 max-h-64 overflow-y-auto">
          {error ? <div className="p-2 text-sm text-red-700">{error}</div> : null}
          {loading ? <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} /> {copy("Loading")}</div> : null}
          {!loading && !visible.length ? <div className="p-4 text-center text-sm text-muted-foreground">{copy("No options found.")}</div> : null}
          {visible.map((option) => <button key={`${option.value}:${option.label}`} type="button" onClick={() => choose(option)} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-muted"><Check size={15} className={current === option.value ? "mt-0.5 opacity-100" : "mt-0.5 opacity-0"} /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{option.label}</span>{option.description ? <span className="block truncate text-xs text-muted-foreground">{option.description}</span> : null}</span></button>)}
        </div>
      </div> : null}
    </div>
  );
}
