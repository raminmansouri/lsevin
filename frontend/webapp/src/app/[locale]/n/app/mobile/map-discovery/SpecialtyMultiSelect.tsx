"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { normalizeDigits } from "./nearby.geo";

/**
 * Persian/Arabic-aware normalization so type-to-search matches regardless of the
 * Arabic vs Persian yeh/kaf variants, ZWNJ, diacritics and digit script.
 */
function normalize(value: string): string {
  return normalizeDigits(value.toLowerCase())
    .replace(/ي/g, "ی") // Arabic yeh -> Persian yeh
    .replace(/ك/g, "ک") // Arabic kaf -> Persian kaf
    .replace(/[ً-ْ]/g, "") // Arabic diacritics
    .replace(/‌/g, "") // ZWNJ
    .replace(/\s+/g, " ")
    .trim();
}

export type SpecialtyMultiSelectProps = {
  values: string[];
  options: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  selectedCountLabel: (count: number) => string;
};

export function SpecialtyMultiSelect({
  values,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  selectedCountLabel,
}: SpecialtyMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(values), [values]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((option) => normalize(option).includes(q));
  }, [options, query]);

  // Close the dropdown on any outside pointer press.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const toggle = (option: string) => {
    const next = selectedSet.has(option)
      ? values.filter((item) => item !== option)
      : [...values, option];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="relative" ref={panelRef}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <span className={cn("truncate", values.length === 0 && "text-gray-400")}>
            {values.length === 0 ? placeholder : selectedCountLabel(values.length)}
          </span>
          <ChevronsUpDown size={16} className="flex-shrink-0 text-gray-400" />
        </button>

        {open ? (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <Search size={16} className="flex-shrink-0 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((option) => {
                    const isSelected = selectedSet.has(option);
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => toggle(option)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm transition-colors",
                          isSelected ? "bg-emerald-50 text-[#083f30]" : "hover:bg-gray-100",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border",
                            isSelected ? "border-[#083f30] bg-[#083f30] text-white" : "border-gray-300",
                          )}
                        >
                          {isSelected ? <Check size={12} /> : null}
                        </span>
                        <span className="truncate">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => toggle(value)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#083f30] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0a5a44]"
            >
              <span className="truncate">{value}</span>
              <X size={14} className="flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
