"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ServicePickerOption = {
  id: string;
  name_en: string;
  name_fa: string;
  is_active: boolean;
};

// Arabic and Persian keyboards type different code points for ی/ک, and admins
// paste names with half-spaces, so both sides are folded before matching.
function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏‎]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function serviceLabel(s: { name_en?: string | null; name_fa?: string | null }) {
  const en = (s.name_en ?? "").trim();
  const fa = (s.name_fa ?? "").trim();
  if (en && fa && en !== fa) return { en, fa };
  return { en: en || fa, fa: "" };
}

/**
 * Searchable replacement for the plain <select> of service definitions on the
 * shop product/category edit pages. Shows the English and Persian names side by
 * side and matches a search in either language. Submits through a hidden
 * input, so the surrounding server-action form is unchanged.
 */
export function ServiceDefinitionPicker({
  name,
  services,
  inactiveLabel,
  searchPlaceholder,
  emptyLabel,
}: {
  name: string;
  services: ServicePickerOption[];
  inactiveLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(services[0]?.id ?? "");

  const indexed = useMemo(
    () => services.map((s) => ({ ...s, label: serviceLabel(s), hay: fold(`${s.name_en} ${s.name_fa}`) })),
    [services]
  );
  const filtered = useMemo(() => {
    const q = fold(query);
    if (!q) return indexed;
    const words = q.split(" ");
    return indexed.filter((s) => words.every((w) => s.hay.includes(w)));
  }, [indexed, query]);
  const selected = indexed.find((s) => s.id === value);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex min-h-9 w-full items-center justify-between gap-2 rounded border border-gray-300 px-2 py-1 text-start text-sm"
          >
            {selected ? (
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span dir="auto" className="truncate">{selected.label.en}</span>
                {selected.label.fa ? <span dir="rtl" className="truncate text-gray-500">{selected.label.fa}</span> : null}
                {selected.is_active ? null : <span className="text-xs text-gray-400">({inactiveLabel})</span>}
              </span>
            ) : (
              <span className="text-gray-400">{searchPlaceholder}</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} />
            <CommandList className="max-h-80">
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {filtered.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => {
                      setValue(s.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="items-start"
                  >
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", value === s.id ? "opacity-100" : "opacity-0")} />
                    <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
                      <span dir="auto">{s.label.en}</span>
                      {s.label.fa ? <span dir="rtl" className="text-gray-500">{s.label.fa}</span> : null}
                    </span>
                    {s.is_active ? null : <span className="text-xs text-gray-400">({inactiveLabel})</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
