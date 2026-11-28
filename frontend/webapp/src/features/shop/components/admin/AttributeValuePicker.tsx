"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";

export function AttributeValuePicker({
  name,
  options,
  defaultSelected,
  searchPlaceholder,
  emptyLabel,
}: {
  name: string;
  options: Array<{ id: string; label: string }>;
  defaultSelected: string[];
  searchPlaceholder: string;
  emptyLabel: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const labelOf = useMemo(() => new Map(options.map((o) => [o.id, o.label])), [options]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  return (
    <div ref={boxRef} className="relative">
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((id) => (
          <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#083f30]/10 py-1 ps-2.5 pe-1 text-xs text-[#083f30]">
            <span className="truncate">{labelOf.get(id) ?? id}</span>
            <button type="button" onClick={() => toggle(id)} className="grid size-4 shrink-0 place-items-center rounded-full hover:bg-[#083f30]/20" aria-label="✕">
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#083f30]/40 px-2.5 py-1 text-xs font-semibold text-[#083f30] hover:bg-[#083f30]/5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {searchPlaceholder}
        </button>
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3">
            <Search className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder={searchPlaceholder}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.map((o) => {
              const on = selected.includes(o.id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-gray-50 ${on ? "font-semibold text-[#083f30]" : "text-gray-700"}`}
                  >
                    <span className={`grid size-4 shrink-0 place-items-center rounded border ${on ? "border-[#083f30] bg-[#083f30] text-white" : "border-gray-300"}`}>
                      {on ? <Check className="size-3" aria-hidden="true" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">{o.label}</span>
                  </button>
                </li>
              );
            })}
            {!filtered.length ? <li className="px-3 py-4 text-center text-xs text-gray-400">{emptyLabel}</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}